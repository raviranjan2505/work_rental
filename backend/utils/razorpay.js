import Razorpay from "razorpay"
import crypto from "crypto"

let razorpayClient = null
let razorpayCredentialKey = ""

export const getRazorpayErrorMessage = (error) => {
    if (!error) return "unknown payment gateway error"
    if (typeof error === "string") return error

    const gatewayMessage =
        error?.error?.description ||
        error?.error?.reason ||
        error?.error?.message ||
        error?.description ||
        error?.message

    if (gatewayMessage) return gatewayMessage

    try {
        return JSON.stringify(error)
    } catch {
        return String(error)
    }
}

export const getRazorpayClient = () => {
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keyId || !keySecret) {
        throw new Error("payment gateway keys are not configured")
    }

    const credentialKey = `${keyId}:${keySecret}`
    if (!razorpayClient || razorpayCredentialKey !== credentialKey) {
        razorpayClient = new Razorpay({
            key_id: keyId,
            key_secret: keySecret
        })
        razorpayCredentialKey = credentialKey
    }

    return razorpayClient
}

const getRazorpayReceipt = (receipt) => {
    const rawReceipt = String(receipt || `receipt_${Date.now()}`)
    const cleanReceipt = rawReceipt.replace(/[^a-zA-Z0-9_-]/g, "_")
    if (cleanReceipt.length <= 40) return cleanReceipt

    const hash = crypto.createHash("sha1").update(cleanReceipt).digest("hex").slice(0, 8)
    return `${cleanReceipt.slice(0, 31)}_${hash}`
}

export const createRazorpayOrder = async (amount, receipt) => {
    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        throw new Error("invalid payment amount")
    }

    // amount is in rupees from our side, Razorpay wants paise
    return getRazorpayClient().orders.create({
        amount: Math.round(numericAmount * 100),
        currency: "INR",
        receipt: getRazorpayReceipt(receipt)
    })
}

export const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
    if (!process.env.RAZORPAY_KEY_SECRET) {
        throw new Error("payment gateway keys are not configured")
    }

    const expected = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest("hex")
    return expected === signature
}
