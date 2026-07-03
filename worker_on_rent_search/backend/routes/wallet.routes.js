import express from "express"
import isAuth from "../middlewares/isAuth.js"
import authorize from "../middlewares/authorize.js"
import {
    getMyWallet,
    getMyTransactions,
    requestWithdrawal,
    getMyWithdrawals,
    createDuePaymentOrder,
    verifyDuePayment,
    adminListWithdrawals,
    adminProcessWithdrawal
} from "../controllers/wallet.controllers.js"

const walletRouter = express.Router()

walletRouter.get("/me", isAuth, authorize("worker"), getMyWallet)
walletRouter.get("/transactions", isAuth, authorize("worker"), getMyTransactions)
walletRouter.post("/withdraw", isAuth, authorize("worker"), requestWithdrawal)
walletRouter.get("/withdrawals/my", isAuth, authorize("worker"), getMyWithdrawals)
walletRouter.post("/due/create-order", isAuth, authorize("worker"), createDuePaymentOrder)
walletRouter.post("/due/verify", isAuth, authorize("worker"), verifyDuePayment)

walletRouter.get("/admin/withdrawals", isAuth, authorize("admin"), adminListWithdrawals)
walletRouter.patch("/admin/withdrawals/:withdrawalId", isAuth, authorize("admin"), adminProcessWithdrawal)

export default walletRouter
