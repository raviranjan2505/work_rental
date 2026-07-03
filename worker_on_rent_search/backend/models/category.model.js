import mongoose from "mongoose";

// Service groups workers are organized under, e.g. "Home Services" -> Maid, Cook, Driver...
const categorySchema = new mongoose.Schema({
    name: {
        // e.g. "Driver", "Cook", "Electrician"
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    group: {
        // e.g. "Home Services", "Technical Services", "Labour Services",
        // "Delivery Services", "Assistant Services"
        type: String,
        required: true,
        enum: [
            "Home Services",
            "Technical Services",
            "Labour Services",
            "Delivery Services",
            "Assistant Services"
        ]
    },
    icon: {
        // image/icon url shown on category cards
        type: String,
        default: ""
    },
    description: {
        type: String,
        default: ""
    },
    // category-wise commission %, falls back to platform default if null
    commissionPercent: {
        type: Number,
        default: null,
        min: 0,
        max: 100
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true })

categorySchema.index({ group: 1 })

const Category = mongoose.model("Category", categorySchema)
export default Category
