import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        required: true,
        unique: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: null }
}, { timestamps: true })

const Chat = mongoose.model("Chat", chatSchema)
export default Chat
