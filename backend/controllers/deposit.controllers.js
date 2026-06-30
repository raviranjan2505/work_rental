import Deposit from "../models/deposit.model.js"
import Wallet from "../models/wallet.model.js"
import { getSettings, applyDepositPayment } from "../utils/walletEngine.js"
import { createRazorpayOrder, verifyRazorpaySignature } from "../utils/razorpay.js"

export const getDepositConfig = async (req, res) => {
    try {
        const settings = await getSettings()
        const wallet = await Wallet.findOne({ worker: req.userId })
        return res.status(200).json({
            requiredAmount: settings.securityDepositAmount,
            currentBalance: wallet?.securityDepositBalance || 0
        })
    } catch (error) {
        return res.status(500).json({ message: `get deposit config error ${error}` })
    }
}

export const createDepositOrder = async (req, res) => {
    try {
        const settings = await getSettings()
        const wallet = await Wallet.findOne({ worker: req.userId })
        const remaining = Math.max(0, settings.securityDepositAmount - (wallet?.securityDepositBalance || 0))
        if (remaining <= 0) {
            return res.status(400).json({ message: "deposit already fully paid" })
        }

        const order = await createRazorpayOrder(remaining, `deposit_${req.userId}_${Date.now()}`)
        const deposit = await Deposit.create({
            worker: req.userId,
            amount: remaining,
            paymentMethod: "online",
            razorpayOrderId: order.id,
            status: "PENDING"
        })

        return res.status(201).json({ order, depositId: deposit._id })
    } catch (error) {
        return res.status(500).json({ message: `create deposit order error ${error}` })
    }
}

export const verifyDepositPayment = async (req, res) => {
    try {
        const { depositId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body

        const isValid = verifyRazorpaySignature({
            orderId: razorpayOrderId,
            paymentId: razorpayPaymentId,
            signature: razorpaySignature
        })
        if (!isValid) {
            return res.status(400).json({ message: "payment verification failed" })
        }

        const deposit = await Deposit.findOne({ _id: depositId, worker: req.userId })
        if (!deposit) return res.status(404).json({ message: "deposit record not found" })
        if (deposit.status === "PAID") {
            return res.status(200).json({ message: "already verified" })
        }

        deposit.status = "PAID"
        deposit.razorpayPaymentId = razorpayPaymentId
        deposit.paidAt = new Date()
        await deposit.save()

        const profile = await applyDepositPayment(req.userId, deposit.amount, req.app.get("io"))

        return res.status(200).json({ deposit, workerProfile: profile })
    } catch (error) {
        return res.status(500).json({ message: `verify deposit payment error ${error}` })
    }
}
