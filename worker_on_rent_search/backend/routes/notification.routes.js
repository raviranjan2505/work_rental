import express from "express"
import isAuth from "../middlewares/isAuth.js"
import { getMyNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead } from "../controllers/notification.controllers.js"

const notificationRouter = express.Router()

notificationRouter.get("/my", isAuth, getMyNotifications)
notificationRouter.get("/unread-count", isAuth, getUnreadCount)
notificationRouter.patch("/:notificationId/read", isAuth, markNotificationRead)
notificationRouter.patch("/read-all", isAuth, markAllNotificationsRead)

export default notificationRouter
