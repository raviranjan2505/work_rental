import Razorpay from "razorpay"
import crypto from "crypto"

export const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})

export const createRazorpayOrder = async (amount, receipt) => {
    // amount is in rupees from our side, Razorpay wants paise
    return razorpay.orders.create({
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
