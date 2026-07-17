import mongoose from "mongoose";

// Created the moment a worker confirms "Receive Offline Payment" on a cash
// booking. Tracks the platform commission the worker owes for that single
// booking and the 7-day (configurable via Settings.gracePeriodDays) window
// they have to clear it before their account is auto-deactivated.
const commissionDueSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        required: true,
        unique: true // one due record per booking - never duplicated
    },
    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    bookingAmount: { type: Number, required: true },
    commissionPercent: { type: Number, default: 0 },
    commissionAmount: { type: Number, required: true }, // == dueAmount
    dueDate: { type: Date, required: true },
    status: {
        type: String,
        enum: ["PENDING", "PAID", "OVERDUE"],
        default: "PENDING"
    },
    paymentReceivedAt: { type: Date, required: true },
    paidAt: { type: Date, default: null },
    paidVia: { type: String, enum: ["wallet", "online", null], default: null },
    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },

    // Reminder de-dupe flags so the sweep only ever fires each reminder once.
    reminder3DaySentAt: { type: Date, default: null },
    reminder1DaySentAt: { type: Date, default: null },
    overdueNotifiedAt: { type: Date, default: null }
}, { timestamps: true })

commissionDueSchema.index({ worker: 1, status: 1 })
commissionDueSchema.index({ status: 1, dueDate: 1 })

const CommissionDue = mongoose.model("CommissionDue", commissionDueSchema)
export default CommissionDue
