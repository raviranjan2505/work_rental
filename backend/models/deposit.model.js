import mongoose from "mongoose";

const depositSchema = new mongoose.Schema({
    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["PENDING", "PAID", "REFUNDED"],
        default: "PENDING"
    },
    paymentMethod: { type: String, enum: ["online", "offline"], default: "online" },
    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    paidAt: { type: Date, default: null }
}, { timestamps: true })

const Deposit = mongoose.model("Deposit", depositSchema)
export default Deposit
