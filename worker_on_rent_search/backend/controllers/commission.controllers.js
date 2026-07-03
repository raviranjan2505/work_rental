import Commission from "../models/commission.model.js"
import Category from "../models/category.model.js"

export const getCommissionConfig = async (req, res) => {
    try {
        const globalCommission = await Commission.findOne({ scope: "GLOBAL" }).sort({ createdAt: -1 })
        const categories = await Category.find().select("name group commissionPercent").sort({ group: 1, name: 1 })
        return res.status(200).json({
            globalPercent: globalCommission?.percent ?? 15,
            categories
        })
    } catch (error) {
        return res.status(500).json({ message: `get commission config error ${error}` })
    }
}

export const setGlobalCommission = async (req, res) => {
    try {
        const { percent } = req.body
        if (percent === undefined || percent < 0 || percent > 100) {
            return res.status(400).json({ message: "percent must be between 0 and 100" })
        }
        const commission = await Commission.create({ scope: "GLOBAL", percent, setBy: req.userId })
        return res.status(201).json(commission)
    } catch (error) {
        return res.status(500).json({ message: `set global commission error ${error}` })
    }
}
