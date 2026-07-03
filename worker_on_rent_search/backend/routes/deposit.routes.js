import express from "express"
import isAuth from "../middlewares/isAuth.js"
import authorize from "../middlewares/authorize.js"
import { getDepositConfig, createDepositOrder, verifyDepositPayment } from "../controllers/deposit.controllers.js"

const depositRouter = express.Router()

depositRouter.get("/config", isAuth, authorize("worker"), getDepositConfig)
depositRouter.post("/create-order", isAuth, authorize("worker"), createDepositOrder)
depositRouter.post("/verify", isAuth, authorize("worker"), verifyDepositPayment)

export default depositRouter
