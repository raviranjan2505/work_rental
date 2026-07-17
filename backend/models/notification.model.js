import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: [
            "BOOKING_CREATED",
            "BOOKING_ACCEPTED",
            "BOOKING_REJECTED",
            "WORKER_ARRIVED",
            "WORK_STARTED",
            "WORK_COMPLETED",
            "PAYMENT_RECEIVED",
            "PAYMENT_CONFIRMED",
            "COMMISSION_DUE_CREATED",
            "COMMISSION_DUE_REMINDER",
            "COMMISSION_DUE_OVERDUE",
            "COMMISSION_DUE_PAID",
            "WORKER_DEACTIVATED",
            "WORKER_REACTIVATED",
            "NEW_MESSAGE",
            "NEW_REVIEW",
            "GENERIC"
        ],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} }, // e.g. { bookingId }
    isRead: { type: Boolean, default: false }
}, { timestamps: true })

notificationSchema.index({ user: 1, createdAt: -1 })

const Notification = mongoose.model("Notification", notificationSchema)
export default Notification
