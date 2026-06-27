import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema({
    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 1
    },
    payoutDetails: {
        upiId: { type: String, default: "" },
        accountHolderName: { type: String, default: "" },
        accountNumber: { type: String, default: "" },
        ifsc: { type: String, default: "" }
    },
    status: {
        type: String,
        enum: ["REQUESTED", "APPROVED", "REJECTED", "PAID"],
        default: "REQUESTED"
    },
    adminNote: { type: String, default: "" },
    processedAt: { type: Date, default: null }
}, { timestamps: true })

const Withdrawal = mongoose.model("Withdrawal", withdrawalSchema)
export default Withdrawal
