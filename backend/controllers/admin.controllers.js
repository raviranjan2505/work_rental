import mongoose from "mongoose"
import User from "../models/user.model.js"
import WorkerProfile from "../models/workerProfile.model.js"
import Wallet from "../models/wallet.model.js"
import WalletTransaction from "../models/walletTransaction.model.js"
import Booking from "../models/booking.model.js"
import CommissionDue from "../models/commissionDue.model.js"
import Review from "../models/review.model.js"
import { pushNotification } from "../utils/notify.js"

const paginate = (query) => {
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 20
    return { page, limit, skip: (page - 1) * limit }
}

// ---- Customers ----

export const listCustomers = async (req, res) => {
    try {
        const { search } = req.query
        const { limit, skip } = paginate(req.query)
        const filter = { role: "customer" }
        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { mobile: { $regex: search, $options: "i" } }
            ]
        }
        const [customers, total] = await Promise.all([
            User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit),
            User.countDocuments(filter)
        ])
        return res.status(200).json({ customers, total })
    } catch (error) {
        return res.status(500).json({ message: `list customers error ${error}` })
    }
}

export const setUserBlocked = async (req, res) => {
    try {
        const { userId } = req.params
        const { isBlocked } = req.body
        const user = await User.findByIdAndUpdate(userId, { isBlocked: !!isBlocked }, { new: true }).select("-password")
        if (!user) return res.status(404).json({ message: "user not found" })
        return res.status(200).json(user)
    } catch (error) {
        return res.status(500).json({ message: `set user blocked error ${error}` })
    }
}

// ---- Workers ----

export const listWorkersAdmin = async (req, res) => {
    try {
        const { search, status, categoryId } = req.query
        const { limit, skip } = paginate(req.query)
        const filter = {}
        if (status) filter.status = status
        if (categoryId) filter.category = categoryId

        const userFilter = search ? {
            $or: [
                { fullName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { mobile: { $regex: search, $options: "i" } }
            ]
        } : undefined

        let workers = await WorkerProfile.find(filter)
            .populate({ path: "user", select: "fullName email mobile isBlocked", match: userFilter })
            .populate("category", "name group")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)

        if (search) workers = workers.filter(w => w.user) // populate match drops non-matches to null

        const total = await WorkerProfile.countDocuments(filter)
        return res.status(200).json({ workers, total })
    } catch (error) {
        return res.status(500).json({ message: `list workers error ${error}` })
    }
}

export const getWorkerDetailAdmin = async (req, res) => {
    try {
        const { workerId } = req.params
        const [profile, wallet, bookingCounts, commissionDues] = await Promise.all([
            WorkerProfile.findOne({ user: workerId }).populate("user", "fullName email mobile isBlocked").populate("category"),
            Wallet.findOne({ worker: workerId }),
            Booking.aggregate([
                { $match: { worker: new mongoose.Types.ObjectId(workerId) } },
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]),
            CommissionDue.find({ worker: workerId }).sort({ createdAt: -1 }).limit(20)
        ])
        if (!profile) return res.status(404).json({ message: "worker not found" })

        const pendingDuesCount = commissionDues.filter(d => d.status === "PENDING").length
        const overdueDuesCount = commissionDues.filter(d => d.status === "OVERDUE").length

        return res.status(200).json({ profile, wallet, bookingCounts, commissionDues, pendingDuesCount, overdueDuesCount })
    } catch (error) {
        return res.status(500).json({ message: `get worker detail error ${error}` })
    }
}

// ---- Bookings ----

export const listBookingsAdmin = async (req, res) => {
    try {
        const { status, bookingType } = req.query
        const { limit, skip } = paginate(req.query)
        const filter = {}
        if (status) filter.status = status
        if (bookingType) filter.bookingType = bookingType

        const [bookings, total] = await Promise.all([
            Booking.find(filter)
                .populate("category", "name group")
                .populate("customer", "fullName mobile")
                .populate("worker", "fullName mobile")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Booking.countDocuments(filter)
        ])
        return res.status(200).json({ bookings, total })
    } catch (error) {
        return res.status(500).json({ message: `list bookings error ${error}` })
    }
}

// ---- Reviews ----

export const listReviewsAdmin = async (req, res) => {
    try {
        const { limit, skip } = paginate(req.query)
        const [reviews, total] = await Promise.all([
            Review.find()
                .populate("customer", "fullName")
                .populate("worker", "fullName")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Review.countDocuments()
        ])
        return res.status(200).json({ reviews, total })
    } catch (error) {
        return res.status(500).json({ message: `list reviews error ${error}` })
    }
}

export const deleteReviewAdmin = async (req, res) => {
    try {
        const { reviewId } = req.params
        const review = await Review.findByIdAndDelete(reviewId)
        if (!review) return res.status(404).json({ message: "review not found" })

        // Re-derive the worker's rating average without the deleted review.
        const remaining = await Review.find({ worker: review.worker })
        const count = remaining.length
        const average = count ? Math.round((remaining.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10 : 0
        await WorkerProfile.findOneAndUpdate({ user: review.worker }, { "rating.count": count, "rating.average": average })

        return res.status(200).json({ message: "review deleted" })
    } catch (error) {
        return res.status(500).json({ message: `delete review error ${error}` })
    }
}

// ---- Broadcast notifications ----

export const broadcastNotification = async (req, res) => {
    try {
        const { audience, title, message } = req.body // audience: "all" | "customer" | "worker"
        if (!title || !message) return res.status(400).json({ message: "title and message are required" })

        const filter = audience === "all" ? {} : { role: audience }
        const users = await User.find(filter).select("_id")
        const io = req.app.get("io")

        await Promise.all(users.map(u => pushNotification(io, u._id, { type: "GENERIC", title, message })))

        return res.status(200).json({ message: `notification sent to ${users.length} user(s)` })
    } catch (error) {
        return res.status(500).json({ message: `broadcast error ${error}` })
    }
}

// ---- Manual wallet adjustment (support/dispute resolution) ----

export const adjustWorkerWallet = async (req, res) => {
    try {
        const { workerId } = req.params
        const { amount, direction, reason } = req.body // direction: "credit" | "debit"
        const amt = Number(amount)
        if (!amt || amt <= 0) return res.status(400).json({ message: "invalid amount" })

        const wallet = await Wallet.findOne({ worker: workerId })
        if (!wallet) return res.status(404).json({ message: "wallet not found" })

        if (direction === "credit") {
            wallet.withdrawableBalance += amt
        } else if (direction === "debit") {
            if (amt > wallet.withdrawableBalance) return res.status(400).json({ message: "amount exceeds withdrawable balance" })
            wallet.withdrawableBalance -= amt
        } else {
            return res.status(400).json({ message: "direction must be credit or debit" })
        }
        await wallet.save()

        await WalletTransaction.create({
            worker: workerId, type: "ADJUSTMENT", amount: amt,
            balanceAfter: wallet.withdrawableBalance,
            description: reason || `Manual ${direction} by admin`
        })

        return res.status(200).json(wallet)
    } catch (error) {
        return res.status(500).json({ message: `adjust wallet error ${error}` })
    }
}
