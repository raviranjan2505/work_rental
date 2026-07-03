import express from "express"
import isAuth from "../middlewares/isAuth.js"
import { upload } from "../middlewares/multer.js"
import { startOrGetChat, getMyChats, getChatMessages, sendMessage, markChatRead } from "../controllers/chat.controllers.js"

const chatRouter = express.Router()

chatRouter.post("/start", isAuth, startOrGetChat)
chatRouter.get("/my", isAuth, getMyChats)
chatRouter.get("/:chatId/messages", isAuth, getChatMessages)
chatRouter.post("/:chatId/message", isAuth, upload.single("image"), sendMessage)
chatRouter.patch("/:chatId/read", isAuth, markChatRead)

export default chatRouter
