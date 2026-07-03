import Category from "../models/category.model.js"
import Commission from "../models/commission.model.js"

const HARD_FALLBACK_PERCENT = 15

// Category.commissionPercent (if admin set one) wins; otherwise fall back to
// the latest GLOBAL commission record; otherwise a hardcoded default so the
// platform never silently charges 0%.
export const getEffectiveCommissionPercent = async (categoryId) => {
    const category = await Category.findById(categoryId)
    if (category?.commissionPercent !== null && category?.commissionPercent !== undefined) {
        return category.commissionPercent
    }
    const globalCommission = await Commission.findOne({ scope: "GLOBAL" }).sort({ createdAt: -1 })
    if (globalCommission) {
        return globalCommission.percent
    }
    return HARD_FALLBACK_PERCENT
}
