import Booking from "../models/booking.model.js"
import WorkerProfile from "../models/workerProfile.model.js"
import User from "../models/user.model.js"
import Coupon from "../models/coupon.model.js"
import { getEffectiveCommissionPercent } from "../utils/commission.js"
import { sendBookingOtpMail } from "../utils/mail.js"
import { settleOfflineCommission, creditOnlineEarning } from "../utils/walletEngine.js"
import { createRazorpayOrder, verifyRazorpaySignature } from "../utils/razorpay.js"
import { pushNotification } from "../utils/notify.js"

const generateOtp = () => String(Math.floor(1000 + Math.random() * 9000))

// Pushes a live update to whichever party (customer/worker) is currently
// connected, so both apps can refresh booking state without polling.
const notifyParties = async (io, booking) => {
    if (!io) return
    try {
        const [customer, worker] = await Promise.all([
            User.findById(booking.customer).select("socketId"),
            booking.worker ? User.findById(booking.worker).select("socketId") : null
        ])
        if (customer?.socketId) io.to(customer.socketId).emit("bookingStatusUpdate", booking)
        if (worker?.socketId) io.to(worker.socketId).emit("bookingStatusUpdate", booking)
    } catch (error) {
        console.log("notifyParties error", error)
    }
}

const PRICE_FIELD = { hourly: "hourlyRate", daily: "dailyRate" }

export const createBooking = async (req, res) => {
    try {
        const customerId = req.userId
        const { workerId, bookingType, schedule, address, paymentMethod, taskDetails, couponCode } = req.body

        if (!["hourly", "daily", "task"].includes(bookingType)) {
            return res.status(400).json({ message: "bookingType must be hourly, daily, or task" })
        }
        if (bookingType !== "task" && !schedule?.date) {
            return res.status(400).json({ message: "schedule.date is required" })
        }
        if (bookingType === "task") {
            if (!taskDetails?.itemDetails || !taskDetails?.pickupAddress?.text || !taskDetails?.deliveryAddress?.text) {
                return res.status(400).json({ message: "itemDetails, pickupAddress, and deliveryAddress are required for a task booking" })
            }
        }

        const workerProfile = await WorkerProfile.findOne({ user: workerId })
        if (!workerProfile) {
            return res.status(404).json({ message: "worker not found" })
        }
        if (!workerProfile.isSearchable) {
            return res.status(400).json({ message: "this worker is not currently accepting bookings" })
        }

        let amount
        if (bookingType === "task") {
            // Tasks are a flat, short errand - charged at the worker's hourly rate
            // as a service fee. taskDetails.budget is separate cash the customer
            // reimburses the worker for at pickup and never touches the platform.
            amount = workerProfile.hourlyRate || 0
        } else {
            const rate = workerProfile[PRICE_FIELD[bookingType]] || 0
            const units = bookingType === "hourly"
                ? Number(schedule.durationHours || 1)
                : Number(schedule.durationDays || 1)
            amount = rate * units
        }

        // Coupon discounts the service fee only - never the task item budget.
        let discountAmount = 0
        let appliedCouponCode = ""
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim() })
            if (!coupon || !coupon.isActive) {
                return res.status(400).json({ message: "invalid or inactive coupon code" })
            }
            if (coupon.expiresAt && coupon.expiresAt < new Date()) {
                return res.status(400).json({ message: "this coupon has expired" })
            }
            if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
                return res.status(400).json({ message: "this coupon has reached its usage limit" })
            }
            discountAmount = coupon.discountType === "PERCENT"
                ? Math.round((amount * coupon.discountValue) / 100)
                : coupon.discountValue
            discountAmount = Math.min(discountAmount, amount)
            amount = amount - discountAmount
            appliedCouponCode = coupon.code
            coupon.usedCount += 1
            await coupon.save()
        }

        const commissionPercent = await getEffectiveCommissionPercent(workerProfile.category)
        const commissionAmount = Math.round((amount * commissionPercent) / 100)
        const workerEarning = amount - commissionAmount

        const booking = await Booking.create({
            customer: customerId,
            worker: workerId,
            category: workerProfile.category,
            bookingType,
            schedule: bookingType === "task" ? { date: schedule?.date || new Date() } : schedule,
            // Keep `address` in sync with the delivery point for tasks so the
            // existing live-tracking map keeps working without modification.
            address: bookingType === "task" ? taskDetails.deliveryAddress : address,
            taskDetails: bookingType === "task" ? taskDetails : undefined,
            paymentMethod: paymentMethod === "online" ? "online" : "offline",
            amount,
            couponCode: appliedCouponCode,
            discountAmount,
            commissionPercent,
            commissionAmount,
            workerEarning,
            status: "PENDING"
        })

        const io = req.app.get("io")
        await notifyParties(io, booking)
        await pushNotification(io, workerId, {
            type: "BOOKING_CREATED",
            title: bookingType === "task" ? "New task request" : "New booking request",
            message: bookingType === "task"
                ? `You have a new task request: ${taskDetails.itemDetails.slice(0, 60)}`
                : `You have a new ${bookingType} booking request worth ₹${amount}.`,
            data: { bookingId: booking._id }
        })

        return res.status(201).json(booking)
    } catch (error) {
        return res.status(500).json({ message: `create booking error ${error}` })
    }
}

export const getMyBookings = async (req, res) => {
    try {
        const { status } = req.query
        const filter = { customer: req.userId }
        if (status) filter.status = status
        const bookings = await Booking.find(filter)
            .populate("category", "name group")
            .populate("worker", "fullName mobile")
            .sort({ createdAt: -1 })
        return res.status(200).json(bookings)
    } catch (error) {
        return res.status(500).json({ message: `get my bookings error ${error}` })
    }
}

export const getAssignedBookings = async (req, res) => {
    try {
        const { status } = req.query
        const filter = { worker: req.userId }
        if (status) filter.status = status
        const bookings = await Booking.find(filter)
            .populate("category", "name group")
            .populate("customer", "fullName mobile")
            .sort({ createdAt: -1 })
        return res.status(200).json(bookings)
    } catch (error) {
        return res.status(500).json({ message: `get assigned bookings error ${error}` })
    }
}

const findBookingForParticipant = async (bookingId, userId) => {
    const booking = await Booking.findById(bookingId)
        .populate("category", "name group")
        .populate("customer", "fullName mobile email")
        .populate("worker", "fullName mobile email")
    if (!booking) return { error: 404 }
    const isParticipant = booking.customer._id.toString() === userId || booking.worker?._id?.toString() === userId
    if (!isParticipant) return { error: 403 }
    return { booking }
}

export const getBookingById = async (req, res) => {
    try {
        const { error, booking } = await findBookingForParticipant(req.params.bookingId, req.userId)
        if (error === 404) return res.status(404).json({ message: "booking not found" })
        if (error === 403) return res.status(403).json({ message: "not your booking" })
        return res.status(200).json(booking)
    } catch (error) {
        return res.status(500).json({ message: `get booking error ${error}` })
    }
}

export const acceptBooking = async (req, res) => {
    try {
        const booking = await Booking.findOne({ _id: req.params.bookingId, worker: req.userId })
        if (!booking) return res.status(404).json({ message: "booking not found" })
        if (booking.status !== "PENDING") {
            return res.status(400).json({ message: `cannot accept a booking in status ${booking.status}` })
        }
        booking.status = "ACCEPTED"
        await booking.save()
        await notifyParties(req.app.get("io"), booking)
        await pushNotification(req.app.get("io"), booking.customer, {
            type: "BOOKING_ACCEPTED",
            title: "Booking accepted",
            message: "Your worker accepted the booking and will be on their way soon.",
            data: { bookingId: booking._id }
        })
        return res.status(200).json(booking)
    } catch (error) {
        return res.status(500).json({ message: `accept booking error ${error}` })
    }
}

export const rejectBooking = async (req, res) => {
    try {
        const booking = await Booking.findOne({ _id: req.params.bookingId, worker: req.userId })
        if (!booking) return res.status(404).json({ message: "booking not found" })
        if (booking.status !== "PENDING") {
            return res.status(400).json({ message: `cannot reject a booking in status ${booking.status}` })
        }
        booking.status = "REJECTED"
        await booking.save()
        await notifyParties(req.app.get("io"), booking)
        await pushNotification(req.app.get("io"), booking.customer, {
            type: "BOOKING_REJECTED",
            title: "Booking declined",
            message: "Your worker declined this booking. Try another worker nearby.",
            data: { bookingId: booking._id }
        })
        return res.status(200).json(booking)
    } catch (error) {
        return res.status(500).json({ message: `reject booking error ${error}` })
    }
}

export const startJourney = async (req, res) => {
    try {
        const booking = await Booking.findOne({ _id: req.params.bookingId, worker: req.userId })
        if (!booking) return res.status(404).json({ message: "booking not found" })
        if (booking.status !== "ACCEPTED") {
            return res.status(400).json({ message: `cannot start journey from status ${booking.status}` })
        }
        booking.status = "ON_THE_WAY"
        await booking.save()
        await notifyParties(req.app.get("io"), booking)
        return res.status(200).json(booking)
    } catch (error) {
        return res.status(500).json({ message: `start journey error ${error}` })
    }
}

// Worker marks arrival -> an OTP is issued to the CUSTOMER, who hands it to
// the worker in person. The worker then submits it via verifyStartOtp.
export const markArrived = async (req, res) => {
    try {
        const booking = await Booking.findOne({ _id: req.params.bookingId, worker: req.userId })
            .populate("customer", "fullName email")
        if (!booking) return res.status(404).json({ message: "booking not found" })
        if (booking.status !== "ON_THE_WAY") {
            return res.status(400).json({ message: `cannot mark arrived from status ${booking.status}` })
        }
        booking.status = "ARRIVED"
        booking.startOtp = generateOtp()
        booking.startOtpExpires = new Date(Date.now() + 15 * 60 * 1000)
        await booking.save()

        if (booking.customer?.email) {
            sendBookingOtpMail(booking.customer.email, booking.startOtp, "start").catch(e => console.log("otp mail error", e))
        }
        await notifyParties(req.app.get("io"), booking)
        await pushNotification(req.app.get("io"), booking.customer._id, {
            type: "WORKER_ARRIVED",
            title: "Your worker has arrived",
            message: "Share the OTP shown in your booking to let them start the job.",
            data: { bookingId: booking._id }
        })

        return res.status(200).json(booking)
    } catch (error) {
        return res.status(500).json({ message: `mark arrived error ${error}` })
    }
}

// Worker enters the OTP the customer gave them -> work officially starts.
// A second OTP is issued immediately for completion, sent to the customer.
export const verifyStartOtp = async (req, res) => {
    try {
        const { otp } = req.body
        const booking = await Booking.findOne({ _id: req.params.bookingId, worker: req.userId })
            .populate("customer", "fullName email")
        if (!booking) return res.status(404).json({ message: "booking not found" })
        if (booking.status !== "ARRIVED") {
            return res.status(400).json({ message: `cannot start work from status ${booking.status}` })
        }
        if (!booking.startOtp || booking.startOtp !== otp) {
            return res.status(400).json({ message: "incorrect OTP" })
        }
        if (booking.startOtpExpires < new Date()) {
            return res.status(400).json({ message: "OTP expired, ask the customer to refresh and resend" })
        }

        booking.status = "WORK_STARTED"
        booking.startOtp = null
        booking.startOtpExpires = null
        booking.completionOtp = generateOtp()
        booking.completionOtpExpires = new Date(Date.now() + 6 * 60 * 60 * 1000) // long jobs get a generous window
        await booking.save()

        if (booking.customer?.email) {
            sendBookingOtpMail(booking.customer.email, booking.completionOtp, "completion").catch(e => console.log("otp mail error", e))
        }
        await notifyParties(req.app.get("io"), booking)
        await pushNotification(req.app.get("io"), booking.customer._id, {
            type: "WORK_STARTED",
            title: "Work has started",
            message: "Your worker has started the job.",
            data: { bookingId: booking._id }
        })

        return res.status(200).json(booking)
    } catch (error) {
        return res.status(500).json({ message: `verify start otp error ${error}` })
    }
}

// Worker enters the completion OTP -> booking is COMPLETED.
// Wallet/commission settlement against this booking's stored amount/commission
// happens in Phase 4 - this just closes out the job lifecycle.
export const verifyCompletionOtp = async (req, res) => {
    try {
        const { otp } = req.body
        const booking = await Booking.findOne({ _id: req.params.bookingId, worker: req.userId })
        if (!booking) return res.status(404).json({ message: "booking not found" })
        if (booking.status !== "WORK_STARTED") {
            return res.status(400).json({ message: `cannot complete from status ${booking.status}` })
        }
        if (!booking.completionOtp || booking.completionOtp !== otp) {
            return res.status(400).json({ message: "incorrect OTP" })
        }
        if (booking.completionOtpExpires < new Date()) {
            return res.status(400).json({ message: "OTP expired" })
        }

        booking.status = "COMPLETED"
        booking.completionOtp = null
        booking.completionOtpExpires = null
        booking.completedAt = new Date()
        await booking.save()

        await WorkerProfile.findOneAndUpdate({ user: booking.worker }, { $inc: { completedJobs: 1 } })

        const io = req.app.get("io")
        const isCashBooking = ["offline", "cash", "Cash"].includes(booking.paymentMethod)

        // Offline/cash jobs: the customer already paid the worker in person, so
        // commission is owed to the platform right now - pull it from the worker's deposit
        // (or queue it as pendingCommission if the deposit can't cover it).
        // Online jobs settle via createBookingPaymentOrder/verifyBookingPayment instead.
        if (isCashBooking) {
            await settleOfflineCommission(booking.worker, booking._id, booking.commissionAmount, booking.amount, io)
        }

        await notifyParties(io, booking)
        await pushNotification(io, booking.customer, {
            type: "WORK_COMPLETED",
            title: "Job completed",
            message: booking.paymentMethod === "online" ? "Your job is done — pay online to settle the booking." : "Your job is done. Don't forget to leave a review!",
            data: { bookingId: booking._id }
        })
        await pushNotification(io, booking.worker, {
            type: "WORK_COMPLETED",
            title: "Job marked completed",
            message: "Nice work! The booking has been marked completed.",
            data: { bookingId: booking._id }
        })

        return res.status(200).json(booking)
    } catch (error) {
        return res.status(500).json({ message: `verify completion otp error ${error}` })
    }
}

export const cancelBooking = async (req, res) => {
    try {
        const { reason } = req.body
        const booking = await Booking.findById(req.params.bookingId)
        if (!booking) return res.status(404).json({ message: "booking not found" })

        const isCustomer = booking.customer.toString() === req.userId
        const isWorker = booking.worker?.toString() === req.userId
        if (!isCustomer && !isWorker) return res.status(403).json({ message: "not your booking" })

        if (["WORK_STARTED", "COMPLETED", "CANCELLED", "REJECTED"].includes(booking.status)) {
            return res.status(400).json({ message: `cannot cancel a booking once work has started` })
        }

        booking.status = "CANCELLED"
        booking.cancelledBy = isCustomer ? "customer" : "worker"
        booking.cancellationReason = reason || ""
        await booking.save()
        await notifyParties(req.app.get("io"), booking)

        return res.status(200).json(booking)
    } catch (error) {
        return res.status(500).json({ message: `cancel booking error ${error}` })
    }
}

// ---- Online payment capture (offline bookings settle automatically on
// completion via settleOfflineCommission - see verifyCompletionOtp above) ----

export const createBookingPaymentOrder = async (req, res) => {
    try {
        const booking = await Booking.findOne({ _id: req.params.bookingId, customer: req.userId })
        if (!booking) return res.status(404).json({ message: "booking not found" })
        if (booking.paymentMethod !== "online") {
            return res.status(400).json({ message: "this booking is not set up for online payment" })
        }
        if (booking.status !== "COMPLETED") {
            return res.status(400).json({ message: "payment opens up once the job is marked completed" })
        }
        if (booking.isPaid) {
            return res.status(400).json({ message: "already paid" })
        }

        const order = await createRazorpayOrder(booking.amount, `booking_${booking._id}`)
        booking.razorpayOrderId = order.id
        await booking.save()

        return res.status(201).json({ order })
    } catch (error) {
        return res.status(500).json({ message: `create booking payment order error ${error}` })
    }
}

export const verifyBookingPayment = async (req, res) => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body
        const booking = await Booking.findOne({ _id: req.params.bookingId, customer: req.userId })
        if (!booking) return res.status(404).json({ message: "booking not found" })
        if (booking.isPaid) return res.status(200).json(booking)

        const isValid = verifyRazorpaySignature({ orderId: razorpayOrderId, paymentId: razorpayPaymentId, signature: razorpaySignature })
        if (!isValid) return res.status(400).json({ message: "payment verification failed" })

        booking.isPaid = true
        booking.razorpayPaymentId = razorpayPaymentId
        await booking.save()

        await creditOnlineEarning(booking.worker, booking._id, booking.amount, booking.workerEarning)
        await notifyParties(req.app.get("io"), booking)
        await pushNotification(req.app.get("io"), booking.worker, {
            type: "PAYMENT_RECEIVED",
            title: "Payment received",
            message: `₹${booking.workerEarning} has been credited to your wallet for a completed booking.`,
            data: { bookingId: booking._id }
        })

        return res.status(200).json(booking)
    } catch (error) {
        return res.status(500).json({ message: `verify booking payment error ${error}` })
    }
}
