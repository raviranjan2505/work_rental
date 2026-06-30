import mongoose from "mongoose";

// Replaces the old food "Order". Business logic for state transitions,
// OTP issuing/verification, and payment/commission settlement is wired
// up in later phases - this is the data shape they'll operate on.
const bookingSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },

    // hourly / daily / task (task = delivery & errand bookings, Phase 6)
    bookingType: {
        type: String,
        enum: ["hourly", "daily", "task"],
        required: true
    },

    schedule: {
        date: { type: Date, required: function () { return this.bookingType !== "task" } },
        startTime: { type: String }, // "HH:mm"
        durationHours: { type: Number, default: 1 },
        durationDays: { type: Number, default: 1 }
    },

    address: {
        text: String,
        latitude: Number,
        longitude: Number
    },

    // Only populated when bookingType === "task" (grocery/medicine/parcel/shopping
    // errands - Phase 6). `budget` is cash the worker spends on the customer's
    // behalf at the pickup point and is reimbursed in person - it is NOT part of
    // `amount` and is never subject to platform commission. `address` above is
    // kept in sync with deliveryAddress so the existing live-tracking UI works
    // unchanged for tasks too.
    taskDetails: {
        itemDetails: { type: String, default: "" },
        budget: { type: Number, default: 0 },
        pickupAddress: {
            text: String, latitude: Number, longitude: Number
        },
        deliveryAddress: {
            text: String, latitude: Number, longitude: Number
        }
    },

    status: {
        type: String,
        enum: [
            "PENDING",        // created, waiting for worker to accept
            "ACCEPTED",
            "REJECTED",
            "ON_THE_WAY",
            "ARRIVED",
            "WORK_STARTED",
            "COMPLETED",
            "CANCELLED"
        ],
        default: "PENDING"
    },

    // ---- OTP security (Phase 3) ----
    startOtp: { type: String, default: null },
    startOtpExpires: { type: Date, default: null },
    completionOtp: { type: String, default: null },
    completionOtpExpires: { type: Date, default: null },

    // ---- Pricing / payment (Phase 4) ----
    amount: { type: Number, default: 0 },
    couponCode: { type: String, default: "" },
    discountAmount: { type: Number, default: 0 },
    commissionPercent: { type: Number, default: 0 },
    commissionAmount: { type: Number, default: 0 },
    workerEarning: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ["online", "offline"], default: "offline" },
    isPaid: { type: Boolean, default: false },
    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },

    cancelledBy: { type: String, enum: ["customer", "worker", "admin", null], default: null },
    cancellationReason: { type: String, default: "" },

    completedAt: { type: Date, default: null }
}, { timestamps: true })

bookingSchema.index({ customer: 1, status: 1 })
bookingSchema.index({ worker: 1, status: 1 })

const Booking = mongoose.model("Booking", bookingSchema)
export default Booking
