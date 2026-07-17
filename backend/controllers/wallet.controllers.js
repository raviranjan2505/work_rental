import Wallet from "../models/wallet.model.js"
import WalletTransaction from "../models/walletTransaction.model.js"
import Withdrawal from "../models/withdrawal.model.js"
import CommissionDue from "../models/commissionDue.model.js"
import { createRazorpayOrder, verifyRazorpaySignature } from "../utils/razorpay.js"
import { settleCommissionDue, getSettings } from "../utils/walletEngine.js"

export const getMyWallet = async (req, res) => {
    try {
        let wallet = await Wallet.findOne({ worker: req.userId })
        if (!wallet) {
            wallet = await Wallet.create({ worker: req.userId })
        }
        const settings = await getSettings()

        return res.status(200).json({
            ...wallet.toObject(),
            gracePeriodDays: settings.gracePeriodDays
        })
    } catch (error) {
        return res.status(500).json({ message: `get wallet error ${error}` })
    }
}

export const getMyTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query
        const transactions = await WalletTransaction.find({ worker: req.userId })
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
        return res.status(200).json(transactions)
    } catch (error) {
        return res.status(500).json({ message: `get transactions error ${error}` })
    }
}

export const requestWithdrawal = async (req, res) => {
    try {
        const { amount, upiId, accountHolderName, accountNumber, ifsc } = req.body
        const wallet = await Wallet.findOne({ worker: req.userId })
        if (!wallet) return res.status(404).json({ message: "wallet not found" })

        const amt = Number(amount)
        if (!amt || amt <= 0) return res.status(400).json({ message: "invalid amount" })
        if (amt > wallet.withdrawableBalance) {
            return res.status(400).json({ message: "amount exceeds withdrawable balance" })
        }

        // Hold the funds immediately so the same balance can't be requested twice.
        wallet.withdrawableBalance -= amt
        await wallet.save()
        await WalletTransaction.create({
            worker: req.userId, type: "WITHDRAWAL", amount: amt,
            balanceAfter: wallet.withdrawableBalance, description: "Withdrawal requested"
        })

        const withdrawal = await Withdrawal.create({
            worker: req.userId,
            amount: amt,
            payoutDetails: { upiId, accountHolderName, accountNumber, ifsc }
        })

        return res.status(201).json(withdrawal)
    } catch (error) {
        return res.status(500).json({ message: `request withdrawal error ${error}` })
    }
}

export const getMyWithdrawals = async (req, res) => {
    try {
        const withdrawals = await Withdrawal.find({ worker: req.userId }).sort({ createdAt: -1 })
        return res.status(200).json(withdrawals)
    } catch (error) {
        return res.status(500).json({ message: `get withdrawals error ${error}` })
    }
}

// ---- Commission Due Management (worker side) ----

export const getMyCommissionDues = async (req, res) => {
    try {
        const { status } = req.query
        const filter = { worker: req.userId }
        if (status) filter.status = status
        const dues = await CommissionDue.find(filter)
            .populate("booking", "category bookingType amount")
            .populate("customer", "fullName mobile")
            .sort({ createdAt: -1 })
        return res.status(200).json(dues)
    } catch (error) {
        return res.status(500).json({ message: `get commission dues error ${error}` })
    }
}

// Pay a specific Commission Due straight out of the worker's wallet balance.
export const payCommissionDueFromWallet = async (req, res) => {
    try {
        const { dueId } = req.params
        const due = await settleCommissionDue(req.userId, dueId, "wallet", req.app.get("io"))
        return res.status(200).json(due)
    } catch (error) {
        return res.status(400).json({ message: error?.message || `pay commission due error ${error}` })
    }
}

// Pay a specific Commission Due via the online payment gateway.
export const createCommissionDuePaymentOrder = async (req, res) => {
    try {
        const { dueId } = req.params
        const due = await CommissionDue.findOne({ _id: dueId, worker: req.userId })
        if (!due) return res.status(404).json({ message: "commission due not found" })
        if (due.status === "PAID") return res.status(400).json({ message: "this due is already paid" })

        const order = await createRazorpayOrder(due.commissionAmount, `commission_due_${dueId}_${Date.now()}`)
        due.razorpayOrderId = order.id
        await due.save()

        return res.status(201).json({ order, amount: due.commissionAmount })
    } catch (error) {
        const reason = error?.error?.description || error?.message || JSON.stringify(error)
        console.error("create commission due payment order error:", error)
        return res.status(500).json({ message: `create commission due payment order error: ${reason}` })
    }
}

export const verifyCommissionDuePayment = async (req, res) => {
    try {
        const { dueId } = req.params
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body
        const isValid = verifyRazorpaySignature({ orderId: razorpayOrderId, paymentId: razorpayPaymentId, signature: razorpaySignature })
        if (!isValid) return res.status(400).json({ message: "payment verification failed" })

        const due = await CommissionDue.findOne({ _id: dueId, worker: req.userId })
        if (!due) return res.status(404).json({ message: "commission due not found" })
        due.razorpayPaymentId = razorpayPaymentId
        await due.save()

        const settled = await settleCommissionDue(req.userId, dueId, "online", req.app.get("io"))
        return res.status(200).json(settled)
    } catch (error) {
        return res.status(400).json({ message: error?.message || `verify commission due payment error ${error}` })
    }
}

// ---- Admin (pulled forward from Phase 7 so withdrawals are actually actionable) ----

export const adminListWithdrawals = async (req, res) => {
    try {
        const { status } = req.query
        const filter = status ? { status } : {}
        const withdrawals = await Withdrawal.find(filter)
            .populate("worker", "fullName email mobile")
            .sort({ createdAt: -1 })
        return res.status(200).json(withdrawals)
    } catch (error) {
        return res.status(500).json({ message: `admin list withdrawals error ${error}` })
    }
}

export const adminProcessWithdrawal = async (req, res) => {
    try {
        const { withdrawalId } = req.params
        const { action, adminNote } = req.body // "approve" | "reject" | "mark-paid"
        const withdrawal = await Withdrawal.findById(withdrawalId)
        if (!withdrawal) return res.status(404).json({ message: "withdrawal not found" })

        if (action === "approve") {
            withdrawal.status = "APPROVED"
        } else if (action === "mark-paid") {
            withdrawal.status = "PAID"
            withdrawal.processedAt = new Date()
            const wallet = await Wallet.findOne({ worker: withdrawal.worker })
            if (wallet) {
                wallet.totalWithdrawn += withdrawal.amount
                await wallet.save()
            }
        } else if (action === "reject") {
            withdrawal.status = "REJECTED"
            withdrawal.processedAt = new Date()
            // refund the held amount back to withdrawable balance
            const wallet = await Wallet.findOne({ worker: withdrawal.worker })
            if (wallet) {
                wallet.withdrawableBalance += withdrawal.amount
                await wallet.save()
                await WalletTransaction.create({
                    worker: withdrawal.worker, type: "ADJUSTMENT", amount: withdrawal.amount,
                    balanceAfter: wallet.withdrawableBalance, description: "Withdrawal rejected - funds returned"
                })
            }
        } else {
            return res.status(400).json({ message: "invalid action" })
        }
        withdrawal.adminNote = adminNote || withdrawal.adminNote
        await withdrawal.save()
        return res.status(200).json(withdrawal)
    } catch (error) {
        return res.status(500).json({ message: `admin process withdrawal error ${error}` })
    }
}
