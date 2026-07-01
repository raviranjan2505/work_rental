import express from "express"
import dotenv from "dotenv"
dotenv.config()
import connectDb from "./config/db.js"
import cookieParser from "cookie-parser"
import authRouter from "./routes/auth.routes.js"
import cors from "cors"
import userRouter from "./routes/user.routes.js"

import categoryRouter from "./routes/category.routes.js"
import workerRouter from "./routes/worker.routes.js"
import bookingRouter from "./routes/booking.routes.js"
import depositRouter from "./routes/deposit.routes.js"
import walletRouter from "./routes/wallet.routes.js"
import settingsRouter from "./routes/settings.routes.js"
import commissionRouter from "./routes/commission.routes.js"
import chatRouter from "./routes/chat.routes.js"
import reviewRouter from "./routes/review.routes.js"
import notificationRouter from "./routes/notification.routes.js"
import adminRouter from "./routes/admin.routes.js"
import couponRouter from "./routes/coupon.routes.js"
import { runGracePeriodSweep } from "./utils/walletEngine.js"
import http from "http"
import { Server } from "socket.io"
import { socketHandler } from "./socket.js"

const app=express()
const server=http.createServer(app)

const io=new Server(server,{
   cors:{
    origin:"http://localhost:5173",
    credentials:true,
    methods:['POST','GET']
}
})

app.set("io",io)



const port=process.env.PORT || 5000
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}))
app.use(express.json())
app.use(cookieParser())
app.use("/api/auth",authRouter)
app.use("/api/user",userRouter)
app.use("/api/category",categoryRouter)
app.use("/api/worker",workerRouter)
app.use("/api/booking",bookingRouter)
app.use("/api/deposit",depositRouter)
app.use("/api/wallet",walletRouter)
app.use("/api/settings",settingsRouter)
app.use("/api/commission",commissionRouter)
app.use("/api/chat",chatRouter)
app.use("/api/review",reviewRouter)
app.use("/api/notification",notificationRouter)
app.use("/api/admin",adminRouter)
app.use("/api/coupon",couponRouter)

socketHandler(io)
server.listen(port,()=>{
    connectDb()
    console.log(`server started at ${port}`)
    // No real cron infra here - an hourly interval is enough to keep the
    // PAYMENT_DUE -> SUSPENDED grace-period transition moving in the background.
    runGracePeriodSweep(io)
    setInterval(() => runGracePeriodSweep(io), 60 * 60 * 1000)
})

