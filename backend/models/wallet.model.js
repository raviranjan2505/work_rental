import mongoose from "mongoose";

// One wallet per worker. Admin/platform totals are aggregated on demand
// from WalletTransaction + CommissionDue + Withdrawal records, so we don't
// need a separate admin wallet document.
const walletSchema = new mongoose.Schema({
    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    totalEarnings: { type: Number, default: 0 },     // online + offline, lifetime
    onlineEarnings: { type: Number, default: 0 },    // lifetime, from online bookings
    offlineEarnings: { type: Number, default: 0 },   // lifetime, cash collected directly by the worker
    availableBalance: { type: Number, default: 0 },
    totalCommission: { type: Number, default: 0 },   // lifetime platform commission owed (collected + due + paid)
    paidCommission: { type: Number, default: 0 },    // lifetime commission actually settled (online-collected + due-cleared)
    pendingCommission: { type: Number, default: 0 }, // currently outstanding (unpaid) commission due total
    withdrawableBalance: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 }
}, { timestamps: true })

const Wallet = mongoose.model("Wallet", walletSchema)
export default Wallet
