import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
    },
    mobile: {
        type: String,
        required: true,
    },
    // customer  -> books workers / raises tasks
    // worker    -> gets hired (driver, cook, electrician, etc.)
    // admin     -> platform management
    role: {
        type: String,
        enum: ["customer", "worker", "admin"],
        required: true
    },
    resetOtp: {
        type: String
    },
    isOtpVerified: {
        type: Boolean,
        default: false
    },
    otpExpires: {
        type: Date
    },
    socketId: {
        type: String,
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    // Admin moderation - blocked users can't sign in (Phase 7)
    isBlocked: {
        type: Boolean,
        default: false
    },
    // Current live location. For workers, WorkerProfile keeps its own
    // location/2dsphere index which is what nearby-search & tracking use.
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
    }

}, { timestamps: true })

userSchema.index({ location: '2dsphere' })

const User = mongoose.model("User", userSchema)
export default User
