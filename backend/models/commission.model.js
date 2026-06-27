import mongoose from "mongoose";

// Singleton-ish: one document with key "GLOBAL" holds the platform default.
// Category-specific overrides live on Category.commissionPercent, but we
// also keep a log here so admins can audit changes over time.
const commissionSchema = new mongoose.Schema({
    scope: {
        type: String,
        enum: ["GLOBAL", "CATEGORY"],
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        default: null
    },
    percent: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    setBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    }
}, { timestamps: true })

const Commission = mongoose.model("Commission", commissionSchema)
export default Commission
