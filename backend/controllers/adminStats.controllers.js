import User from "../models/user.model.js"
import WorkerProfile from "../models/workerProfile.model.js"
import Booking from "../models/booking.model.js"
import CommissionDue from "../models/commissionDue.model.js"
import Withdrawal from "../models/withdrawal.model.js"

const sumField = async (Model, match, field) => {
    const result = await Model.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: `$${field}` } } }])
    return result[0]?.total || 0
}

// Builds a continuous list of the last `count` day buckets (oldest first) so
// charts don't show gaps just because a day had zero activity.
const lastNDays = (count) => {
    const days = []
    for (let i = count - 1; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        days.push(d.toISOString().slice(0, 10)) // YYYY-MM-DD
    }
    return days
}

const lastNMonths = (count) => {
    const months = []
    for (let i = count - 1; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        months.push(d.toISOString().slice(0, 7)) // YYYY-MM
    }
    return months
}

export const getDashboardStats = async (req, res) => {
    try {
        const [
            totalCustomers,
            totalWorkers,
            activeWorkers,
            inactiveWorkers,
            workersDeactivatedForUnpaidCommission,
            totalBookings,
            completedBookings,
            pendingWithdrawalsCount,
            pendingDuesCount,
            overdueDuesCount,
            workersWithPendingDues
        ] = await Promise.all([
            User.countDocuments({ role: "customer" }),
            User.countDocuments({ role: "worker" }),
            WorkerProfile.countDocuments({ status: "ACTIVE" }),
            WorkerProfile.countDocuments({ status: "INACTIVE" }),
            WorkerProfile.countDocuments({ status: "INACTIVE", deactivatedReason: "UNPAID_COMMISSION" }),
            Booking.countDocuments(),
            Booking.countDocuments({ status: "COMPLETED" }),
            Withdrawal.countDocuments({ status: "REQUESTED" }),
            CommissionDue.countDocuments({ status: "PENDING" }),
            CommissionDue.countDocuments({ status: "OVERDUE" }),
            CommissionDue.distinct("worker", { status: { $in: ["PENDING", "OVERDUE"] } })
        ])

        const [
            totalBookingValue,
            onlineCommission,
            offlineCommissionTotal,
            collectedCommission,
            pendingCommissionAmount,
            overdueCommissionAmount,
            totalWithdrawals
        ] = await Promise.all([
            sumField(Booking, { status: "COMPLETED" }, "amount"),
            sumField(Booking, { commissionStatus: "COLLECTED" }, "commissionAmount"),
            sumField(Booking, { commissionStatus: { $in: ["DUE", "PAID", "OVERDUE"] } }, "commissionAmount"),
            sumField(Booking, { commissionStatus: { $in: ["COLLECTED", "PAID"] } }, "commissionAmount"),
            sumField(CommissionDue, { status: "PENDING" }, "commissionAmount"),
            sumField(CommissionDue, { status: "OVERDUE" }, "commissionAmount"),
            sumField(Withdrawal, { status: "PAID" }, "amount")
        ])

        const totalPlatformRevenue = onlineCommission + offlineCommissionTotal
        const offlineCommissionCollected = offlineCommissionTotal - pendingCommissionAmount - overdueCommissionAmount

        // ---- Category performance ----
        const categoryPerformance = await Booking.aggregate([
            { $match: { status: "COMPLETED" } },
            { $group: { _id: "$category", bookings: { $sum: 1 }, revenue: { $sum: "$amount" }, commission: { $sum: "$commissionAmount" } } },
            { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
            { $unwind: "$category" },
            { $project: { _id: 0, name: "$category.name", group: "$category.group", bookings: 1, revenue: 1, commission: 1 } },
            { $sort: { revenue: -1 } }
        ])

        // ---- Daily revenue (commission earned per day, last 14 days) ----
        const dayBuckets = lastNDays(14)
        const dailyCutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        const dailyAgg = await Booking.aggregate([
            { $match: { status: "COMPLETED", completedAt: { $gte: dailyCutoff } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } }, revenue: { $sum: "$commissionAmount" } } }
        ])
        const dailyMap = Object.fromEntries(dailyAgg.map(d => [d._id, d.revenue]))
        const dailyRevenue = dayBuckets.map(day => ({ date: day, revenue: dailyMap[day] || 0 }))

        // ---- Monthly revenue (last 6 months) ----
        const monthBuckets = lastNMonths(6)
        const monthlyCutoff = new Date()
        monthlyCutoff.setMonth(monthlyCutoff.getMonth() - 6)
        const monthlyAgg = await Booking.aggregate([
            { $match: { status: "COMPLETED", completedAt: { $gte: monthlyCutoff } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$completedAt" } }, revenue: { $sum: "$commissionAmount" } } }
        ])
        const monthlyMap = Object.fromEntries(monthlyAgg.map(d => [d._id, d.revenue]))
        const monthlyRevenue = monthBuckets.map(month => ({ month, revenue: monthlyMap[month] || 0 }))

        // ---- Booking trends (all bookings created per day, last 14 days) ----
        const trendAgg = await Booking.aggregate([
            { $match: { createdAt: { $gte: dailyCutoff } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }
        ])
        const trendMap = Object.fromEntries(trendAgg.map(d => [d._id, d.count]))
        const bookingTrends = dayBuckets.map(day => ({ date: day, bookings: trendMap[day] || 0 }))

        // ---- Worker growth (new worker signups per month, last 6 months) ----
        const growthAgg = await User.aggregate([
            { $match: { role: "worker", createdAt: { $gte: monthlyCutoff } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } }
        ])
        const growthMap = Object.fromEntries(growthAgg.map(d => [d._id, d.count]))
        const workerGrowth = monthBuckets.map(month => ({ month, newWorkers: growthMap[month] || 0 }))

        return res.status(200).json({
            totals: {
                totalCustomers,
                totalWorkers,
                activeWorkers,
                inactiveWorkers,
                workersDeactivatedForUnpaidCommission,
                totalBookings,
                completedBookings,
                totalBookingValue,
                totalWithdrawals,
                pendingWithdrawalsCount
            },
            commission: {
                totalPlatformRevenue,
                onlineCommission,
                offlineCommission: offlineCommissionTotal,
                offlineCommissionCollected,
                pendingCommission: pendingCommissionAmount,
                collectedCommission,
                overdueCommission: overdueCommissionAmount,
                pendingDuesCount,
                overdueDuesCount,
                workersWithPendingDuesCount: workersWithPendingDues.length
            },
            categoryPerformance,
            charts: { dailyRevenue, monthlyRevenue, bookingTrends, workerGrowth }
        })
    } catch (error) {
        return res.status(500).json({ message: `get dashboard stats error ${error}` })
    }
}
