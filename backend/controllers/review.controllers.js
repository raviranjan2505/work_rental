import Review from "../models/review.model.js"
import Booking from "../models/booking.model.js"
import WorkerProfile from "../models/workerProfile.model.js"
import { pushNotification } from "../utils/notify.js"

export const createReview = async (req, res) => {
    try {
        const { bookingId, rating, comment } = req.body
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "rating must be between 1 and 5" })
        }

        const booking = await Booking.findById(bookingId)
        if (!booking) return res.status(404).json({ message: "booking not found" })
        if (booking.customer.toString() !== req.userId) {
            return res.status(403).json({ message: "not your booking" })
        }
        if (booking.status !== "COMPLETED") {
            return res.status(400).json({ message: "you can only review a completed booking" })
        }

        const existing = await Review.findOne({ booking: bookingId })
        if (existing) {
            return res.status(400).json({ message: "this booking has already been reviewed" })
        }

        const review = await Review.create({
            booking: bookingId,
            customer: req.userId,
            worker: booking.worker,
            rating,
            comment: comment || ""
        })

        const profile = await WorkerProfile.findOne({ user: booking.worker })
        if (profile) {
            const newCount = profile.rating.count + 1
            const newAverage = ((profile.rating.average * profile.rating.count) + rating) / newCount
            profile.rating.count = newCount
            profile.rating.average = Math.round(newAverage * 10) / 10
            await profile.save()
        }

        await pushNotification(req.app.get("io"), booking.worker, {
            type: "NEW_REVIEW",
            title: "New review received",
            message: `You received a ${rating}-star review.`,
            data: { bookingId }
        })

        return res.status(201).json(review)
    } catch (error) {
        return res.status(500).json({ message: `create review error ${error}` })
    }
}

export const getWorkerReviews = async (req, res) => {
    try {
        const { workerId } = req.params
        const { page = 1, limit = 10 } = req.query
        const reviews = await Review.find({ worker: workerId })
            .populate("customer", "fullName")
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
        return res.status(200).json(reviews)
    } catch (error) {
        return res.status(500).json({ message: `get worker reviews error ${error}` })
    }
}

export const getMyReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ customer: req.userId })
            .populate("worker", "fullName")
            .sort({ createdAt: -1 })
        return res.status(200).json(reviews)
    } catch (error) {
        return res.status(500).json({ message: `get my reviews error ${error}` })
    }
}
