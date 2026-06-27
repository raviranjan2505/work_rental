import Notification from "../models/notification.model.js"

export const getMyNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query
        const notifications = await Notification.find({ user: req.userId })
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
        return res.status(200).json(notifications)
    } catch (error) {
        return res.status(500).json({ message: `get notifications error ${error}` })
    }
}

export const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({ user: req.userId, isRead: false })
        return res.status(200).json({ count })
    } catch (error) {
        return res.status(500).json({ message: `get unread count error ${error}` })
    }
}

export const markNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.notificationId, user: req.userId },
            { isRead: true },
            { new: true }
        )
        if (!notification) return res.status(404).json({ message: "notification not found" })
        return res.status(200).json(notification)
    } catch (error) {
        return res.status(500).json({ message: `mark notification read error ${error}` })
    }
}

export const markAllNotificationsRead = async (req, res) => {
    try {
        await Notification.updateMany({ user: req.userId, isRead: false }, { isRead: true })
        return res.status(200).json({ message: "all marked read" })
    } catch (error) {
        return res.status(500).json({ message: `mark all read error ${error}` })
    }
}
