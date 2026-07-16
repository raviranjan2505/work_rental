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
            "EARNING",            // credit from a completed booking
            "COMMISSION_DEDUCT",  // legacy debit, commission taken out of deposit
            "COMMISSION_DEDUCTION", // debit, commission taken out of deposit for cash bookings
            "COMMISSION_PAID",    // credit-ish ledger entry: worker cleared their pending commission due
            "DEPOSIT_PAID",       // credit, worker topped up deposit
            "WITHDRAWAL",         // debit, payout to worker
            "ADJUSTMENT"          // manual admin correction
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
