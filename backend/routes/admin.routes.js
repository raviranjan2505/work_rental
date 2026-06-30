import express from "express"
import isAuth from "../middlewares/isAuth.js"
import authorize from "../middlewares/authorize.js"
import { getDashboardStats } from "../controllers/adminStats.controllers.js"
import {
    listCustomers,
    setUserBlocked,
    listWorkersAdmin,
    getWorkerDetailAdmin,
    listBookingsAdmin,
    listReviewsAdmin,
    deleteReviewAdmin,
    broadcastNotification,
    adjustWorkerWallet
} from "../controllers/admin.controllers.js"

const adminRouter = express.Router()

adminRouter.use(isAuth, authorize("admin"))

adminRouter.get("/dashboard", getDashboardStats)

adminRouter.get("/customers", listCustomers)
adminRouter.patch("/users/:userId/block", setUserBlocked)

adminRouter.get("/workers", listWorkersAdmin)
adminRouter.get("/workers/:workerId", getWorkerDetailAdmin)
adminRouter.post("/workers/:workerId/wallet-adjust", adjustWorkerWallet)

adminRouter.get("/bookings", listBookingsAdmin)

adminRouter.get("/reviews", listReviewsAdmin)
adminRouter.delete("/reviews/:reviewId", deleteReviewAdmin)

adminRouter.post("/notify/broadcast", broadcastNotification)

export default adminRouter
