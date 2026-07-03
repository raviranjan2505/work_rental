import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    text: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    seenAt: { type: Date, default: null }
}, { timestamps: true })

messageSchema.index({ chat: 1, createdAt: 1 })

const Message = mongoose.model("Message", messageSchema)
export default Message
