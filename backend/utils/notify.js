import Notification from "../models/notification.model.js"
import User from "../models/user.model.js"
import { sendNotificationMail } from "./mail.js"

// Events where an email is worth sending in addition to the in-app entry.
// Everything else (e.g. NEW_MESSAGE) stays in-app only to avoid inbox spam.
const EMAIL_WORTHY = new Set([
    "BOOKING_ACCEPTED",
    "BOOKING_REJECTED",
    "WORK_COMPLETED",
    "PAYMENT_RECEIVED",
    "COMMISSION_DUE",
    "SUSPENSION_WARNING",
    "WORKER_SUSPENDED"
])

// io can be null (e.g. called from a setInterval sweep with no request context)
export const pushNotification = async (io, userId, { type, title, message, data = {} }) => {
    try {
        const notification = await Notification.create({ user: userId, type, title, message, data })

        const user = await User.findById(userId).select("socketId email")
        if (io && user?.socketId) {
            io.to(user.socketId).emit("notification", notification)
        }
        if (EMAIL_WORTHY.has(type) && user?.email) {
            sendNotificationMail(user.email, title, message).catch(e => console.log("notification mail error", e))
        }
        return notification
    } catch (error) {
        console.log("pushNotification error", error)
    }
}
