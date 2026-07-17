import Settings from "../models/settings.model.js"
import Wallet from "../models/wallet.model.js"
import WorkerProfile from "../models/workerProfile.model.js"
import WalletTransaction from "../models/walletTransaction.model.js"
import Booking from "../models/booking.model.js"
import CommissionDue from "../models/commissionDue.model.js"
import { pushNotification } from "./notify.js"

const createDefaultWallet = (workerUserId) => ({
    worker: workerUserId,
    totalEarnings: 0,
    onlineEarnings: 0,
    offlineEarnings: 0,
    availableBalance: 0,
    totalCommission: 0,
    paidCommission: 0,
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

const logTransaction = (worker, booking, type, amount, balanceAfter, description) =>
    WalletTransaction.create({ worker, booking, type, amount, balanceAfter, description })

const isCashPaymentMethod = (paymentMethod) => ["offline", "cash", "Cash"].includes(paymentMethod)

// ---- Online payment flow ----
// Commission is auto-deducted at the gateway - the worker only ever sees
// (and is credited) the remainder. Commission is marked Collected immediately,
// no Commission Due is ever created for an online booking.
export const creditOnlineEarning = async (workerUserId, bookingId, bookingAmount, workerEarning, commissionAmount) => {
    await ensureWallet(workerUserId)
    const wallet = await Wallet.findOneAndUpdate(
        { worker: workerUserId },
        {
            $inc: {
                totalEarnings: bookingAmount,
                onlineEarnings: bookingAmount,
                availableBalance: workerEarning,
                withdrawableBalance: workerEarning,
                totalCommission: commissionAmount,
                paidCommission: commissionAmount
            }
        },
        { new: true }
    )
    await logTransaction(workerUserId, bookingId, "EARNING", workerEarning, wallet.withdrawableBalance, "Online booking earning credited")
    await logTransaction(workerUserId, bookingId, "COMMISSION_COLLECTED", commissionAmount, wallet.withdrawableBalance, "Platform commission auto-deducted (online payment)")

    await Booking.findByIdAndUpdate(bookingId, {
        commissionStatus: "COLLECTED",
        commissionSettled: true,
        commissionSettledAt: new Date()
    })

    return wallet
}

// ---- Offline / cash payment flow ----
// Called once the worker taps "Receive Offline Payment" -> YES. The customer
// already paid the worker directly in cash, so the platform commission is
// now owed and a Commission Due record starts its countdown.
export const createCommissionDue = async (workerUserId, bookingId, io = null) => {
    const booking = await Booking.findById(bookingId)
    if (!booking) return null
    if (!isCashPaymentMethod(booking.paymentMethod)) return null

    // Prevent duplicate Commission Due records for the same booking.
    const existing = await CommissionDue.findOne({ booking: bookingId })
    if (existing) return existing

    const settings = await getSettings()
    const dueDate = new Date(Date.now() + settings.gracePeriodDays * 24 * 60 * 60 * 1000)

    const commissionDue = await CommissionDue.create({
        booking: bookingId,
        worker: workerUserId,
        customer: booking.customer,
        bookingAmount: booking.amount,
        commissionPercent: booking.commissionPercent,
        commissionAmount: booking.commissionAmount,
        dueDate,
        paymentReceivedAt: booking.paidAt || new Date()
    })

    await ensureWallet(workerUserId)
    const wallet = await Wallet.findOneAndUpdate(
        { worker: workerUserId },
        {
            $inc: {
                totalEarnings: booking.amount,
                offlineEarnings: booking.amount,
                totalCommission: booking.commissionAmount,
                pendingCommission: booking.commissionAmount
            }
        },
        { new: true }
    )
    await logTransaction(workerUserId, bookingId, "COMMISSION_DUE", booking.commissionAmount, wallet.pendingCommission, "Commission due created (cash booking)")

    booking.commissionStatus = "DUE"
    await booking.save()

    await pushNotification(io, workerUserId, {
        type: "COMMISSION_DUE_CREATED",
        title: "Commission due created",
        message: `A commission of ₹${booking.commissionAmount} is due within ${settings.gracePeriodDays} days for a completed cash booking.`,
        data: { bookingId, commissionDueId: commissionDue._id, dueDate }
    })

    return commissionDue
}

// Re-derives a worker's ACTIVE/INACTIVE status purely from whether they have
// any OVERDUE commission due. Reactivates automatically once all dues clear.
export const recomputeWorkerStatus = async (workerUserId, io = null) => {
    const profile = await WorkerProfile.findOne({ user: workerUserId })
    if (!profile) return profile

    const overdueCount = await CommissionDue.countDocuments({ worker: workerUserId, status: "OVERDUE" })
    const previousStatus = profile.status

    if (overdueCount > 0) {
        profile.status = "INACTIVE"
        if (!profile.deactivatedReason) {
            profile.deactivatedReason = "UNPAID_COMMISSION"
            profile.deactivatedAt = new Date()
        }
    } else if (profile.status === "INACTIVE" && profile.deactivatedReason === "UNPAID_COMMISSION") {
        profile.status = "ACTIVE"
        profile.deactivatedReason = ""
        profile.deactivatedAt = null
    }

    await profile.save()

    if (previousStatus !== "INACTIVE" && profile.status === "INACTIVE") {
        await pushNotification(io, workerUserId, {
            type: "WORKER_DEACTIVATED",
            title: "Your account has been deactivated",
            message: "Unpaid commission due has passed its deadline. Clear all pending dues from your wallet to get reactivated.",
        })
    } else if (previousStatus === "INACTIVE" && profile.status === "ACTIVE") {
        await pushNotification(io, workerUserId, {
            type: "WORKER_REACTIVATED",
            title: "You're active again",
            message: "All pending commission dues are cleared and your profile is visible to customers again.",
        })
    }

    return profile
}

// Worker clears one Commission Due, either from wallet balance or via a
// verified online (Razorpay) payment. Prevents duplicate settlement.
export const settleCommissionDue = async (workerUserId, commissionDueId, paidVia, io = null) => {
    const due = await CommissionDue.findOne({ _id: commissionDueId, worker: workerUserId })
    if (!due) throw new Error("commission due not found")
    if (due.status === "PAID") return due // already settled - avoid double-processing

    if (paidVia === "wallet") {
        const wallet = await ensureWallet(workerUserId)
        if (wallet.withdrawableBalance < due.commissionAmount) {
            throw new Error("insufficient wallet balance to pay this due")
        }
        wallet.withdrawableBalance -= due.commissionAmount
        wallet.availableBalance = Math.max(0, wallet.availableBalance - due.commissionAmount)
        wallet.pendingCommission = Math.max(0, wallet.pendingCommission - due.commissionAmount)
        wallet.paidCommission += due.commissionAmount
        await wallet.save()
        await logTransaction(workerUserId, due.booking, "COMMISSION_PAID", due.commissionAmount, wallet.withdrawableBalance, "Commission due paid from wallet balance")
    } else {
        // online: the money already moved through Razorpay - just reconcile the ledger
        const wallet = await ensureWallet(workerUserId)
        wallet.pendingCommission = Math.max(0, wallet.pendingCommission - due.commissionAmount)
        wallet.paidCommission += due.commissionAmount
        await wallet.save()
        await logTransaction(workerUserId, due.booking, "COMMISSION_PAID", due.commissionAmount, wallet.withdrawableBalance, "Commission due paid via online payment")
    }

    due.status = "PAID"
    due.paidAt = new Date()
    due.paidVia = paidVia
    await due.save()

    await Booking.findByIdAndUpdate(due.booking, {
        commissionStatus: "PAID",
        commissionSettled: true,
        commissionSettledAt: new Date()
    })

    await pushNotification(io, workerUserId, {
        type: "COMMISSION_DUE_PAID",
        title: "Commission due paid",
        message: `You cleared ₹${due.commissionAmount} of pending commission.`,
        data: { commissionDueId: due._id }
    })

    return recomputeWorkerStatus(workerUserId, io).then(() => due)
}

// Run periodically (see index.js). Handles the 7-day commission-due
// countdown: fires 3-day/1-day reminders, and flips PENDING -> OVERDUE
// (deactivating the worker) once the due date has passed.
export const runCommissionDueSweep = async (io = null) => {
    const now = new Date()
    const pendingDues = await CommissionDue.find({ status: "PENDING" })

    let overdueCount = 0
    let reminderCount = 0

    for (const due of pendingDues) {
        const msRemaining = due.dueDate.getTime() - now.getTime()
        const daysRemaining = msRemaining / (24 * 60 * 60 * 1000)

        if (msRemaining <= 0) {
            due.status = "OVERDUE"
            due.overdueNotifiedAt = now
            await due.save()
            await Booking.findByIdAndUpdate(due.booking, { commissionStatus: "OVERDUE" })
            await pushNotification(io, due.worker, {
                type: "COMMISSION_DUE_OVERDUE",
                title: "Commission due expired",
                message: `Your ₹${due.commissionAmount} commission due has passed its deadline.`,
                data: { commissionDueId: due._id }
            })
            await recomputeWorkerStatus(due.worker, io)
            overdueCount++
            continue
        }

        if (daysRemaining <= 1 && !due.reminder1DaySentAt) {
            due.reminder1DaySentAt = now
            await due.save()
            await pushNotification(io, due.worker, {
                type: "COMMISSION_DUE_REMINDER",
                title: "Commission due tomorrow",
                message: `1 day remains to clear your ₹${due.commissionAmount} commission due.`,
                data: { commissionDueId: due._id }
            })
            reminderCount++
        } else if (daysRemaining <= 3 && !due.reminder3DaySentAt) {
            due.reminder3DaySentAt = now
            await due.save()
            await pushNotification(io, due.worker, {
                type: "COMMISSION_DUE_REMINDER",
                title: "Commission due soon",
                message: `3 days remain to clear your ₹${due.commissionAmount} commission due.`,
                data: { commissionDueId: due._id }
            })
            reminderCount++
        }
    }

    if (overdueCount || reminderCount) {
        console.log(`commission due sweep: ${overdueCount} overdue, ${reminderCount} reminder(s) sent`)
    }
    return { overdueCount, reminderCount }
}
