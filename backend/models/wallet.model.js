import mongoose from "mongoose";

// One wallet per worker. Admin/platform totals are aggregated on demand
// from WalletTransaction + Deposit + Commission records (Phase 4), so we
// don't need a separate admin wallet document.
const walletSchema = new mongoose.Schema({
    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    totalEarnings: { type: Number, default: 0 },
    availableBalance: { type: Number, default: 0 },
    securityDepositBalance: { type: Number, default: 0 },
    pendingCommission: { type: Number, default: 0 },
    withdrawableBalance: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 }
}, { timestamps: true })

const Wallet = mongoose.model("Wallet", walletSchema)
export default Wallet
