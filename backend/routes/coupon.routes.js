import express from "express"
import isAuth from "../middlewares/isAuth.js"
import authorize from "../middlewares/authorize.js"
import { createCoupon, listCouponsAdmin, setCouponActive, validateCoupon } from "../controllers/coupon.controllers.js"

const couponRouter = express.Router()

couponRouter.get("/validate/:code", isAuth, authorize("customer"), validateCoupon)

couponRouter.post("/", isAuth, authorize("admin"), createCoupon)
couponRouter.get("/admin/all", isAuth, authorize("admin"), listCouponsAdmin)
couponRouter.patch("/admin/:couponId/active", isAuth, authorize("admin"), setCouponActive)

export default couponRouter
