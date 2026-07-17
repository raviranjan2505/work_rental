import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
    key: {
        type: String,
        default: "GLOBAL",
        unique: true
    },
    // Days a worker has to clear an offline-booking commission due before
    // their account is automatically deactivated. Default matches the
    // 7-day commission due countdown.
    gracePeriodDays: {
        type: Number,
        default: 7
    }
}, { timestamps: true })

const Settings = mongoose.model("Settings", settingsSchema)
export default Settings
