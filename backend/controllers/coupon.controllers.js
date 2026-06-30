import Coupon from "../models/coupon.model.js"

export const createCoupon = async (req, res) => {
    try {
        const { code, discountType, discountValue, maxUses, expiresAt } = req.body
        if (!code || !discountValue) {
            return res.status(400).json({ message: "code and discountValue are required" })
        }
        const existing = await Coupon.findOne({ code: code.toUpperCase().trim() })
        if (existing) return res.status(400).json({ message: "a coupon with this code already exists" })

        const coupon = await Coupon.create({
            code: code.toUpperCase().trim(),
            discountType: discountType === "FLAT" ? "FLAT" : "PERCENT",
            discountValue,
            maxUses: maxUses || null,
            expiresAt: expiresAt || null
        })
        return res.status(201).json(coupon)
    } catch (error) {
        return res.status(500).json({ message: `create coupon error ${error}` })
    }
}

export const listCouponsAdmin = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 })
        return res.status(200).json(coupons)
    } catch (error) {
        return res.status(500).json({ message: `list coupons error ${error}` })
    }
}

export const setCouponActive = async (req, res) => {
    try {
        const { couponId } = req.params
        const { isActive } = req.body
        const coupon = await Coupon.findByIdAndUpdate(couponId, { isActive: !!isActive }, { new: true })
        if (!coupon) return res.status(404).json({ message: "coupon not found" })
        return res.status(200).json(coupon)
    } catch (error) {
        return res.status(500).json({ message: `update coupon error ${error}` })
    }
}

// Customer-facing: lets the booking form show the discount before submitting.
export const validateCoupon = async (req, res) => {
    try {
        const { code } = req.params
        const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() })
        if (!coupon || !coupon.isActive) {
            return res.status(404).json({ message: "invalid or inactive coupon" })
        }
        if (coupon.expiresAt && coupon.expiresAt < new Date()) {
            return res.status(400).json({ message: "this coupon has expired" })
        }
        if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
            return res.status(400).json({ message: "this coupon has reached its usage limit" })
        }
        return res.status(200).json({ code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue })
    } catch (error) {
        return res.status(500).json({ message: `validate coupon error ${error}` })
    }
}
