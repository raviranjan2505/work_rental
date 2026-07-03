import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
    key: {
        type: String,
        default: "GLOBAL",
        unique: true
    },
    securityDepositAmount: {
        type: Number,
        default: 500
    },
    gracePeriodDays: {
        type: Number,
        default: 7
    }
}, { timestamps: true })

const Settings = mongoose.model("Settings", settingsSchema)
export default Settings
