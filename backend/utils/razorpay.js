import Razorpay from "razorpay"
import crypto from "crypto"

let razorpayClient = null

const normalizeEnvValue = (value) => {
    if (typeof value !== "string") return value
    return value.trim().replace(/^["']|["']$/g, "")
}

export const getRazorpayClient = () => {
    const keyId = normalizeEnvValue(process.env.RAZORPAY_KEY_ID)
    const keySecret = normalizeEnvValue(process.env.RAZORPAY_KEY_SECRET)

    if (!keyId || !keySecret) {
        throw new Error("Razorpay credentials are missing. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env and restart the server.")
    }

    if (!razorpayClient) {
        razorpayClient = new Razorpay({
            key_id: keyId,
            key_secret: keySecret
        })
    }

    return razorpayClient
}

export const getRazorpayErrorMessage = (error) => {
    return (
        error?.error?.description ||
        error?.error?.reason ||
        error?.message ||
        (typeof error === "string" ? error : "") ||
        JSON.stringify(error)
    )
}

export const createRazorpayOrder = async (amount, receipt) => {
    // amount is in rupees from our side, Razorpay wants paise
    return getRazorpayClient().orders.create({
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt
    })
}

export const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
    const expected = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest("hex")
    return expected === signature
}
