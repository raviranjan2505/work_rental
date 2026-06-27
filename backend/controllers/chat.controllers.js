import Chat from "../models/chat.model.js"
import Message from "../models/message.model.js"
import Booking from "../models/booking.model.js"
import User from "../models/user.model.js"
import uploadOnCloudinary from "../utils/cloudinary.js"
import { pushNotification } from "../utils/notify.js"

const notifyChatParties = async (io, chat, message, senderId) => {
    if (!io) return
    try {
        const recipientId = chat.customer.toString() === senderId ? chat.worker : chat.customer
        const recipient = await User.findById(recipientId).select("socketId")
        if (recipient?.socketId) {
            io.to(recipient.socketId).emit("chatMessage", { chatId: chat._id, message })
        }
        await pushNotification(io, recipientId, {
            type: "NEW_MESSAGE",
            title: "New message",
            message: message.text ? message.text.slice(0, 80) : "Sent a photo",
            data: { chatId: chat._id, bookingId: chat.booking }
        })
    } catch (error) {
        console.log("notifyChatParties error", error)
    }
}

// Gets (or lazily creates) the single chat thread tied to a booking.
export const startOrGetChat = async (req, res) => {
    try {
        const { bookingId } = req.body
        const booking = await Booking.findById(bookingId)
        if (!booking) return res.status(404).json({ message: "booking not found" })

        const isParticipant = booking.customer.toString() === req.userId || booking.worker?.toString() === req.userId
        if (!isParticipant) return res.status(403).json({ message: "not your booking" })
        if (!booking.worker) return res.status(400).json({ message: "this booking has no assigned worker yet" })

        let chat = await Chat.findOne({ booking: bookingId })
        if (!chat) {
            chat = await Chat.create({ booking: bookingId, customer: booking.customer, worker: booking.worker })
        }
        return res.status(200).json(chat)
    } catch (error) {
        return res.status(500).json({ message: `start chat error ${error}` })
    }
}

export const getMyChats = async (req, res) => {
    try {
        const chats = await Chat.find({ $or: [{ customer: req.userId }, { worker: req.userId }] })
            .populate("customer", "fullName")
            .populate("worker", "fullName")
            .populate("booking", "category status")
            .sort({ lastMessageAt: -1, updatedAt: -1 })
        return res.status(200).json(chats)
    } catch (error) {
        return res.status(500).json({ message: `get chats error ${error}` })
    }
}

const assertParticipant = async (chatId, userId) => {
    const chat = await Chat.findById(chatId)
    if (!chat) return { error: 404 }
    const isParticipant = chat.customer.toString() === userId || chat.worker.toString() === userId
    if (!isParticipant) return { error: 403 }
    return { chat }
}

export const getChatMessages = async (req, res) => {
    try {
        const { chatId } = req.params
        const { error, chat } = await assertParticipant(chatId, req.userId)
        if (error === 404) return res.status(404).json({ message: "chat not found" })
        if (error === 403) return res.status(403).json({ message: "not your chat" })

        const messages = await Message.find({ chat: chatId }).sort({ createdAt: 1 })
        return res.status(200).json({ chat, messages })
    } catch (error) {
        return res.status(500).json({ message: `get messages error ${error}` })
    }
}

export const sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params
        const { text } = req.body
        const { error, chat } = await assertParticipant(chatId, req.userId)
        if (error === 404) return res.status(404).json({ message: "chat not found" })
        if (error === 403) return res.status(403).json({ message: "not your chat" })

        if (!text && !req.file) {
            return res.status(400).json({ message: "message text or image is required" })
        }

        let imageUrl = ""
        if (req.file) {
            imageUrl = await uploadOnCloudinary(req.file.path)
        }

        const message = await Message.create({
            chat: chatId,
            sender: req.userId,
            text: text || "",
            imageUrl
        })

        chat.lastMessage = text || "📷 Photo"
        chat.lastMessageAt = new Date()
        await chat.save()

        await notifyChatParties(req.app.get("io"), chat, message, req.userId)

        return res.status(201).json(message)
    } catch (error) {
        return res.status(500).json({ message: `send message error ${error}` })
    }
}

export const markChatRead = async (req, res) => {
    try {
        const { chatId } = req.params
        const { error, chat } = await assertParticipant(chatId, req.userId)
        if (error === 404) return res.status(404).json({ message: "chat not found" })
        if (error === 403) return res.status(403).json({ message: "not your chat" })

        await Message.updateMany(
            { chat: chatId, sender: { $ne: req.userId }, seenAt: null },
            { seenAt: new Date() }
        )
        return res.status(200).json({ message: "marked read" })
    } catch (error) {
        return res.status(500).json({ message: `mark read error ${error}` })
    }
}
