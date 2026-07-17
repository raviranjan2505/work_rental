import express from "express"
import isAuth from "../middlewares/isAuth.js"
import authorize from "../middlewares/authorize.js"
import {
    getMyWallet,
    getMyTransactions,
    requestWithdrawal,
    getMyWithdrawals,
    getMyCommissionDues,
    payCommissionDueFromWallet,
    createCommissionDuePaymentOrder,
    verifyCommissionDuePayment,
    adminListWithdrawals,
    adminProcessWithdrawal
} from "../controllers/wallet.controllers.js"

const walletRouter = express.Router()

walletRouter.get("/me", isAuth, authorize("worker"), getMyWallet)
walletRouter.get("/transactions", isAuth, authorize("worker"), getMyTransactions)
walletRouter.post("/withdraw", isAuth, authorize("worker"), requestWithdrawal)
walletRouter.get("/withdrawals/my", isAuth, authorize("worker"), getMyWithdrawals)

// Commission Due Management
walletRouter.get("/commission-dues", isAuth, authorize("worker"), getMyCommissionDues)
walletRouter.post("/commission-dues/:dueId/pay-wallet", isAuth, authorize("worker"), payCommissionDueFromWallet)
walletRouter.post("/commission-dues/:dueId/create-order", isAuth, authorize("worker"), createCommissionDuePaymentOrder)
walletRouter.post("/commission-dues/:dueId/verify", isAuth, authorize("worker"), verifyCommissionDuePayment)

walletRouter.get("/admin/withdrawals", isAuth, authorize("admin"), adminListWithdrawals)
walletRouter.patch("/admin/withdrawals/:withdrawalId", isAuth, authorize("admin"), adminProcessWithdrawal)

export default walletRouter
