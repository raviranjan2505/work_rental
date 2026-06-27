import express from "express"
import isAuth from "../middlewares/isAuth.js"
import authorize from "../middlewares/authorize.js"
import { getCommissionConfig, setGlobalCommission } from "../controllers/commission.controllers.js"

const commissionRouter = express.Router()

commissionRouter.get("/", isAuth, authorize("admin"), getCommissionConfig)
commissionRouter.post("/global", isAuth, authorize("admin"), setGlobalCommission)

export default commissionRouter
