import Settings from "../models/settings.model.js"
import Wallet from "../models/wallet.model.js"
import WorkerProfile from "../models/workerProfile.model.js"
import WalletTransaction from "../models/walletTransaction.model.js"
import { pushNotification } from "./notify.js"

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
export const recomputeWorkerStatus = async (workerUserId, io = null) => {
    const [wallet, profile, settings] = await Promise.all([
        Wallet.findOne({ worker: workerUserId }),
        WorkerProfile.findOne({ user: workerUserId }),
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

    await profile.save()

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

// Worker paid their security deposit (in full, via Razorpay).
export const applyDepositPayment = async (workerUserId, amount, io = null) => {
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
export const settleOfflineCommission = async (workerUserId, bookingId, commissionAmount, bookingAmount, io = null) => {
    const wallet = await Wallet.findOne({ worker: workerUserId })
    if (!wallet) return

    wallet.totalEarnings += bookingAmount // informational - worker already holds this cash

    const deductFromDeposit = Math.min(wallet.securityDepositBalance, commissionAmount)
    const shortfall = commissionAmount - deductFromDeposit

    wallet.securityDepositBalance -= deductFromDeposit
    if (shortfall > 0) {
        wallet.pendingCommission += shortfall
    }
    await wallet.save()

    if (deductFromDeposit > 0) {
        await logTransaction(workerUserId, bookingId, "COMMISSION_DEDUCT", deductFromDeposit, wallet.securityDepositBalance, "Commission deducted from deposit (offline booking)")
    }

    await recomputeWorkerStatus(workerUserId, io)
    return wallet
}

// Online booking, paid through the gateway: commission auto-deducted at the
// source, worker is credited the remainder as withdrawable cash.
export const creditOnlineEarning = async (workerUserId, bookingId, bookingAmount, workerEarning) => {
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
    const wallet = await Wallet.findOne({ worker: workerUserId })
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
