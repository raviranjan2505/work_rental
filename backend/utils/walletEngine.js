import Settings from "../models/settings.model.js"
import Wallet from "../models/wallet.model.js"
import WorkerProfile from "../models/workerProfile.model.js"
import WalletTransaction from "../models/walletTransaction.model.js"
import Booking from "../models/booking.model.js"
import { pushNotification } from "./notify.js"

const createDefaultWallet = (workerUserId) => ({
    worker: workerUserId,
    totalEarnings: 0,
    availableBalance: 0,
    securityDepositBalance: 0,
    pendingCommission: 0,
    withdrawableBalance: 0,
    totalWithdrawn: 0
})

const ensureWallet = async (workerUserId) => {
    let wallet = await Wallet.findOne({ worker: workerUserId })
    if (!wallet) {
        wallet = await Wallet.create(createDefaultWallet(workerUserId))
    }
    return wallet
}

export const getSettings = async () => {
    let settings = await Settings.findOne({ key: "GLOBAL" })
    if (!settings) {
        settings = await Settings.create({ key: "GLOBAL" })
    }
    return settings
}

// Re-derives a worker's lifecycle status purely from their financial state:
//   pendingCommission > 0           -> PAYMENT_DUE (or stays SUSPENDED if the
//                                       grace-period sweep already escalated it)
//   pendingCommission == 0 and
//     deposit >= required           -> ACTIVE
//   otherwise                       -> PENDING_DEPOSIT
// KYC/availability are handled separately by WorkerProfile's isSearchable hook.
export const recomputeWorkerStatus = async (workerUserId, io = null, session = null) => {
    const [wallet, profile, settings] = await Promise.all([
        Wallet.findOne({ worker: workerUserId }).session(session),
        WorkerProfile.findOne({ user: workerUserId }).session(session),
        getSettings()
    ])
    if (!wallet || !profile) return profile

    const previousStatus = profile.status

    if (wallet.pendingCommission > 0) {
        if (profile.status !== "SUSPENDED") {
            profile.status = "PAYMENT_DUE"
            if (!profile.paymentDueSince) profile.paymentDueSince = new Date()
        }
    } else {
        profile.paymentDueSince = null
        profile.status = wallet.securityDepositBalance >= settings.securityDepositAmount
            ? "ACTIVE"
            : "PENDING_DEPOSIT"
    }

    await profile.save({ session })

    if (previousStatus !== "PAYMENT_DUE" && profile.status === "PAYMENT_DUE") {
        await pushNotification(io, workerUserId, {
            type: "COMMISSION_DUE",
            title: "Commission payment due",
            message: `You have ₹${wallet.pendingCommission} commission due. Clear it within ${settings.gracePeriodDays} days to avoid your profile being suspended.`,
            data: { pendingCommission: wallet.pendingCommission }
        })
    } else if (["PAYMENT_DUE", "SUSPENDED"].includes(previousStatus) && profile.status === "ACTIVE") {
        await pushNotification(io, workerUserId, {
            type: "GENERIC",
            title: "You're active again",
            message: "Your pending commission is cleared and your profile is visible to customers again."
        })
    }

    return profile
}

const logTransaction = (worker, booking, type, amount, balanceAfter, description) =>
    WalletTransaction.create({ worker, booking, type, amount, balanceAfter, description })

const isCashPaymentMethod = (paymentMethod) => ["offline", "cash", "Cash"].includes(paymentMethod)

// Worker paid their security deposit (in full, via Razorpay).
export const applyDepositPayment = async (workerUserId, amount, io = null) => {
    await ensureWallet(workerUserId)
    const wallet = await Wallet.findOneAndUpdate(
        { worker: workerUserId },
        { $inc: { securityDepositBalance: amount } },
        { new: true }
    )
    await logTransaction(workerUserId, null, "DEPOSIT_PAID", amount, wallet.securityDepositBalance, "Security deposit paid")
    return recomputeWorkerStatus(workerUserId, io)
}

// Offline booking completed: platform never touched the cash, so commission
// owed gets pulled out of the worker's security deposit. If the deposit can't
// cover it, the shortfall becomes pendingCommission (-> PAYMENT_DUE).
export const settleOfflineCommission = async (workerUserId, bookingId, commissionAmount, bookingAmount, io = null, session = null) => {
    try {
        const booking = await Booking.findById(bookingId)
        if (!booking) return null

        if (booking.commissionSettled || !isCashPaymentMethod(booking.paymentMethod)) return null

        let wallet = await ensureWallet(workerUserId)

        wallet.totalEarnings += bookingAmount // informational - worker already holds this cash

        const depositBalanceBefore = Number(wallet.securityDepositBalance || 0)
        const deductFromDeposit = Math.min(depositBalanceBefore, Number(commissionAmount || 0))
        const shortfall = Math.max(0, Number(commissionAmount || 0) - deductFromDeposit)

        wallet.securityDepositBalance = Math.max(0, depositBalanceBefore - deductFromDeposit)
        if (shortfall > 0) {
            wallet.pendingCommission = Number(wallet.pendingCommission || 0) + shortfall
        }
        await wallet.save()

        if (deductFromDeposit > 0) {
            await WalletTransaction.create({
                worker: workerUserId,
                booking: bookingId,
                type: "COMMISSION_DEDUCTION",
                amount: deductFromDeposit,
                balanceAfter: wallet.securityDepositBalance,
                description: "Commission deducted from deposit (cash booking)"
            })
        }

        booking.commissionSettled = true
        booking.commissionSettledAt = new Date()
        await booking.save()

        await recomputeWorkerStatus(workerUserId, io, null)
        return wallet
    } catch (error) {
        throw error
    }
}

// Online booking, paid through the gateway: commission auto-deducted at the
// source, worker is credited the remainder as withdrawable cash.
export const creditOnlineEarning = async (workerUserId, bookingId, bookingAmount, workerEarning) => {
    await ensureWallet(workerUserId)
    const wallet = await Wallet.findOneAndUpdate(
        { worker: workerUserId },
        {
            $inc: {
                totalEarnings: bookingAmount,
                availableBalance: workerEarning,
                withdrawableBalance: workerEarning
            }
        },
        { new: true }
    )
    await logTransaction(workerUserId, bookingId, "EARNING", workerEarning, wallet.withdrawableBalance, "Online booking earning credited")
    return wallet
}

// Worker pays off pendingCommission to lift PAYMENT_DUE/SUSPENDED.
export const applyDuePaymentClearance = async (workerUserId, amount, io = null) => {
    const wallet = await ensureWallet(workerUserId)
    if (!wallet) return
    wallet.pendingCommission = Math.max(0, wallet.pendingCommission - amount)
    await wallet.save()
    await logTransaction(workerUserId, null, "COMMISSION_PAID", amount, wallet.pendingCommission, "Pending commission cleared")
    return recomputeWorkerStatus(workerUserId, io)
}

// Run periodically (see index.js). Any worker who has been PAYMENT_DUE for
// longer than the grace period gets suspended and pulled out of search.
export const runGracePeriodSweep = async (io = null) => {
    const settings = await getSettings()
    const cutoff = new Date(Date.now() - settings.gracePeriodDays * 24 * 60 * 60 * 1000)
    const overdue = await WorkerProfile.find({
        status: "PAYMENT_DUE",
        paymentDueSince: { $lte: cutoff }
    })
    for (const profile of overdue) {
        profile.status = "SUSPENDED"
        await profile.save()
        await pushNotification(io, profile.user, {
            type: "WORKER_SUSPENDED",
            title: "Your profile has been suspended",
            message: "Your grace period to clear pending commission has ended. Pay the due amount from your wallet to get reactivated.",
        })
    }
    if (overdue.length) {
        console.log(`grace period sweep: suspended ${overdue.length} worker(s)`)
    }
    return overdue.length
}
