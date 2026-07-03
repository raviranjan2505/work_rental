import mongoose from "mongoose";

// One-to-one extension of a User with role "worker".
const workerProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },
    profileImage: {
        type: String,
        default: ""
    },
    experienceYears: {
        type: Number,
        default: 0,
        min: 0
    },
    skills: [{
        type: String
    }],
    hourlyRate: {
        type: Number,
        default: 0,
        min: 0
    },
    dailyRate: {
        type: Number,
        default: 0,
        min: 0
    },

    // ---- KYC ----
    kyc: {
        aadhaarNumber: { type: String, default: "" },
        aadhaarDocUrl: { type: String, default: "" },
        panNumber: { type: String, default: "" },
        panDocUrl: { type: String, default: "" },
        selfieUrl: { type: String, default: "" },
        otherDocs: [{ type: String }],
        isVerified: { type: Boolean, default: false },
        verifiedAt: { type: Date, default: null },
        rejectionReason: { type: String, default: "" }
    },

    // ---- Availability / live status ----
    isAvailable: {
        type: Boolean,
        default: false
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
    },

    // ---- Lifecycle status driven by the security-deposit engine (Phase 4) ----
    status: {
        type: String,
        enum: ["PENDING_DEPOSIT", "ACTIVE", "PAYMENT_DUE", "SUSPENDED"],
        default: "PENDING_DEPOSIT"
    },
    // when the worker first accrued pending commission - the grace-period
    // sweep suspends them once (now - paymentDueSince) exceeds the configured
    // grace window. Cleared whenever pendingCommission returns to 0.
    paymentDueSince: {
        type: Date,
        default: null
    },

    // ---- Ratings ----
    rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    },
    completedJobs: {
        type: Number,
        default: 0
    },

    // Convenience flag: shown in search only when ACTIVE + isAvailable + kyc.isVerified
    isSearchable: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

workerProfileSchema.index({ location: '2dsphere' })
workerProfileSchema.index({ category: 1, status: 1, isSearchable: 1 })

// isSearchable is derived, not set directly: a worker only shows up in
// customer search once their deposit is paid (status === ACTIVE, wired in
// Phase 4), their KYC is verified by admin, and they've toggled themselves
// available.
workerProfileSchema.pre('save', function (next) {
    this.isSearchable = this.status === 'ACTIVE' && this.isAvailable && this.kyc?.isVerified === true
    next()
})

const WorkerProfile = mongoose.model("WorkerProfile", workerProfileSchema)
export default WorkerProfile
