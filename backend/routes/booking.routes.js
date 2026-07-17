import express from "express"
import isAuth from "../middlewares/isAuth.js"
import authorize from "../middlewares/authorize.js"
import {
    createBooking,
    getMyBookings,
    getAssignedBookings,
    getBookingById,
    acceptBooking,
    rejectBooking,
    startJourney,
    markArrived,
    verifyStartOtp,
    verifyCompletionOtp,
    receiveOfflinePayment,
    cancelBooking,
    createBookingPaymentOrder,
    verifyBookingPayment
} from "../controllers/booking.controllers.js"

const bookingRouter = express.Router()

bookingRouter.post("/", isAuth, authorize("customer"), createBooking)
bookingRouter.get("/my", isAuth, authorize("customer"), getMyBookings)
bookingRouter.get("/assigned", isAuth, authorize("worker"), getAssignedBookings)
bookingRouter.get("/:bookingId", isAuth, getBookingById)

bookingRouter.patch("/:bookingId/accept", isAuth, authorize("worker"), acceptBooking)
bookingRouter.patch("/:bookingId/reject", isAuth, authorize("worker"), rejectBooking)
bookingRouter.patch("/:bookingId/start-journey", isAuth, authorize("worker"), startJourney)
bookingRouter.patch("/:bookingId/arrived", isAuth, authorize("worker"), markArrived)
bookingRouter.post("/:bookingId/verify-start-otp", isAuth, authorize("worker"), verifyStartOtp)
bookingRouter.post("/:bookingId/verify-completion-otp", isAuth, authorize("worker"), verifyCompletionOtp)
bookingRouter.post("/:bookingId/receive-offline-payment", isAuth, authorize("worker"), receiveOfflinePayment)
bookingRouter.patch("/:bookingId/cancel", isAuth, cancelBooking)
bookingRouter.post("/:bookingId/payment/create-order", isAuth, authorize("customer"), createBookingPaymentOrder)
bookingRouter.post("/:bookingId/payment/verify", isAuth, authorize("customer"), verifyBookingPayment)

export default bookingRouter
