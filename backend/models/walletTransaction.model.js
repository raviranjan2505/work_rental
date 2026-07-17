import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema({
    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        default: null
    },
    type: {
        type: String,
        enum: [
            "EARNING",              // credit, worker's net earning on an online booking
            "COMMISSION_COLLECTED", // informational, commission auto-deducted at source (online booking)
            "COMMISSION_DUE",       // informational, a Commission Due was created (offline booking, payment confirmed)
            "COMMISSION_PAID",      // debit from wallet balance (or online payment), worker cleared a commission due
            "WITHDRAWAL",           // debit, payout to worker
            "ADJUSTMENT"            // manual admin correction
        ],
        required: true
    },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    description: { type: String, default: "" }
}, { timestamps: true })

walletTransactionSchema.index({ worker: 1, createdAt: -1 })

const WalletTransaction = mongoose.model("WalletTransaction", walletTransactionSchema)
export default WalletTransaction
