import { getSettings } from "../utils/walletEngine.js"
import Settings from "../models/settings.model.js"

export const getPlatformSettings = async (req, res) => {
    try {
        const settings = await getSettings()
        return res.status(200).json(settings)
    } catch (error) {
        return res.status(500).json({ message: `get settings error ${error}` })
    }
}

export const updatePlatformSettings = async (req, res) => {
    try {
        const { gracePeriodDays } = req.body
        const update = {}
        if (gracePeriodDays !== undefined) update.gracePeriodDays = gracePeriodDays

        const settings = await Settings.findOneAndUpdate(
            { key: "GLOBAL" },
            update,
            { new: true, upsert: true }
        )
        return res.status(200).json(settings)
    } catch (error) {
        return res.status(500).json({ message: `update settings error ${error}` })
    }
}
