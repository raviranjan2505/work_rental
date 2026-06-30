import mongoose from "mongoose"
import WorkerProfile from "../models/workerProfile.model.js"
import Category from "../models/category.model.js"
import uploadOnCloudinary from "../utils/cloudinary.js"

// Worker creates/updates their own profile (category, rates, skills, KYC docs).
// Until KYC is verified + deposit paid (Phase 4), status stays PENDING_DEPOSIT
// and the profile will not appear in customer search.
export const createOrUpdateMyProfile = async (req, res) => {
    try {
        const workerId = req.userId
        const { categoryId, experienceYears, skills, hourlyRate, dailyRate, aadhaarNumber, panNumber } = req.body

        if (categoryId) {
            const category = await Category.findById(categoryId)
            if (!category || !category.isActive) {
                return res.status(400).json({ message: "invalid category" })
            }
        }

        let profile = await WorkerProfile.findOne({ user: workerId })
        const update = {
            user: workerId,
            ...(categoryId && { category: categoryId }),
            ...(experienceYears !== undefined && { experienceYears }),
            ...(hourlyRate !== undefined && { hourlyRate }),
            ...(dailyRate !== undefined && { dailyRate }),
        }

        if (skills !== undefined) {
            // skills may arrive as a JSON string (multipart form) or an array
            update.skills = typeof skills === "string" ? JSON.parse(skills) : skills
        }

        if (req.files?.profileImage?.[0]) {
            update.profileImage = await uploadOnCloudinary(req.files.profileImage[0].path)
        }

        const kyc = {}
        if (req.files?.aadhaarDoc?.[0]) {
            kyc.aadhaarDocUrl = await uploadOnCloudinary(req.files.aadhaarDoc[0].path)
        }
        if (req.files?.panDoc?.[0]) {
            kyc.panDocUrl = await uploadOnCloudinary(req.files.panDoc[0].path)
        }
        if (req.files?.selfie?.[0]) {
            kyc.selfieUrl = await uploadOnCloudinary(req.files.selfie[0].path)
        }
        if (aadhaarNumber) kyc.aadhaarNumber = aadhaarNumber
        if (panNumber) kyc.panNumber = panNumber

        if (profile) {
            Object.assign(profile, update)
            if (Object.keys(kyc).length) {
                profile.kyc = { ...profile.kyc.toObject(), ...kyc }
            }
            await profile.save()
        } else {
            if (!categoryId) {
                return res.status(400).json({ message: "categoryId is required to create a worker profile" })
            }
            profile = await WorkerProfile.create({ ...update, kyc })
        }

        return res.status(200).json(profile)
    } catch (error) {
        return res.status(500).json({ message: `worker profile error ${error}` })
    }
}

export const getMyProfile = async (req, res) => {
    try {
        const profile = await WorkerProfile.findOne({ user: req.userId }).populate("category")
        if (!profile) {
            return res.status(404).json({ message: "worker profile not found" })
        }
        return res.status(200).json(profile)
    } catch (error) {
        return res.status(500).json({ message: `get worker profile error ${error}` })
    }
}

// Public profile view (used on a worker's detail page)
export const getWorkerById = async (req, res) => {
    try {
        const { workerId } = req.params
        const profile = await WorkerProfile.findOne({ user: workerId })
            .populate("category", "name group icon")
            .populate("user", "fullName mobile")
        if (!profile) {
            return res.status(404).json({ message: "worker not found" })
        }
        return res.status(200).json(profile)
    } catch (error) {
        return res.status(500).json({ message: `get worker error ${error}` })
    }
}

export const updateAvailability = async (req, res) => {
    try {
        const { isAvailable } = req.body
        const profile = await WorkerProfile.findOne({ user: req.userId })
        if (!profile) {
            return res.status(404).json({ message: "worker profile not found" })
        }
        profile.isAvailable = !!isAvailable
        await profile.save()
        return res.status(200).json(profile)
    } catch (error) {
        return res.status(500).json({ message: `update availability error ${error}` })
    }
}

// ---- Admin actions (full admin dashboard lands in Phase 7; these two are
// pulled forward so a worker can actually become searchable before the
// deposit engine in Phase 4 exists) ----

export const adminVerifyKyc = async (req, res) => {
    try {
        const { workerProfileId } = req.params
        const { approve, rejectionReason } = req.body
        const profile = await WorkerProfile.findById(workerProfileId)
        if (!profile) {
            return res.status(404).json({ message: "worker profile not found" })
        }
        profile.kyc.isVerified = !!approve
        profile.kyc.verifiedAt = approve ? new Date() : null
        profile.kyc.rejectionReason = approve ? "" : (rejectionReason || "")
        await profile.save()
        return res.status(200).json(profile)
    } catch (error) {
        return res.status(500).json({ message: `admin verify kyc error ${error}` })
    }
}

export const adminSetWorkerStatus = async (req, res) => {
    try {
        const { workerProfileId } = req.params
        const { status } = req.body
        if (!["PENDING_DEPOSIT", "ACTIVE", "PAYMENT_DUE", "SUSPENDED"].includes(status)) {
            return res.status(400).json({ message: "invalid status" })
        }
        const profile = await WorkerProfile.findById(workerProfileId)
        if (!profile) {
            return res.status(404).json({ message: "worker profile not found" })
        }
        profile.status = status
        await profile.save()
        return res.status(200).json(profile)
    } catch (error) {
        return res.status(500).json({ message: `admin set worker status error ${error}` })
    }
}

export const adminListWorkers = async (req, res) => {
    try {
        const { status } = req.query
        const filter = {}
        if (status) filter.status = status
        const profiles = await WorkerProfile.find(filter)
            .populate("user", "fullName email mobile")
            .populate("category", "name group")
            .sort({ createdAt: -1 })
        return res.status(200).json(profiles)
    } catch (error) {
        return res.status(500).json({ message: `admin list workers error ${error}` })
    }
}

// Public worker search: nearby + isSearchable only. Filters: category, radius (km), rating,
// price range, sort. Only ever returns isSearchable workers - the flag that
// Phase 4 will gate behind ACTIVE status + verified KYC + paid deposit.
export const searchNearbyWorkers = async (req, res) => {
    try {
        const {
            lat, lng,
            radius = 10,          // km
            category,             // category id
            minRating,
            minPrice,
            maxPrice,
            rateType = "hourly",  // "hourly" | "daily"
            sort = "distance",    // "distance" | "rating" | "priceLowToHigh" | "priceHighToLow"
            page = 1,
            limit = 20
        } = req.query

        if (!lat || !lng) {
            return res.status(400).json({ message: "lat and lng are required" })
        }

        const matchStage = {
            isSearchable: true,
            status: "ACTIVE",
            isAvailable: true
        }
        if (category) matchStage.category = new mongoose.Types.ObjectId(category)
        if (minRating) matchStage["rating.average"] = { $gte: Number(minRating) }

        const rateField = rateType === "daily" ? "dailyRate" : "hourlyRate"
        if (minPrice || maxPrice) {
            matchStage[rateField] = {}
            if (minPrice) matchStage[rateField].$gte = Number(minPrice)
            if (maxPrice) matchStage[rateField].$lte = Number(maxPrice)
        }

        const pipeline = [
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [Number(lng), Number(lat)] },
                    distanceField: "distanceInMeters",
                    maxDistance: Number(radius) * 1000,
                    spherical: true,
                    query: matchStage
                }
            },
            {
                $lookup: { from: "users", localField: "user", foreignField: "_id", as: "user" }
            },
            { $unwind: "$user" },
            {
                $lookup: { from: "categories", localField: "category", foreignField: "_id", as: "category" }
            },
            { $unwind: "$category" },
            {
                $project: {
                    user: { _id: "$user._id", fullName: "$user.fullName" },
                    category: { name: "$category.name", group: "$category.group", icon: "$category.icon" },
                    profileImage: 1,
                    experienceYears: 1,
                    skills: 1,
                    hourlyRate: 1,
                    dailyRate: 1,
                    rating: 1,
                    completedJobs: 1,
                    isOnline: 1,
                    distanceInMeters: 1
                }
            }
        ]

        if (sort === "rating") pipeline.push({ $sort: { "rating.average": -1 } })
        else if (sort === "priceLowToHigh") pipeline.push({ $sort: { [rateField]: 1 } })
        else if (sort === "priceHighToLow") pipeline.push({ $sort: { [rateField]: -1 } })
        // "distance" sort is already the natural order from $geoNear

        const skip = (Number(page) - 1) * Number(limit)
        pipeline.push({ $skip: skip }, { $limit: Number(limit) })

        const workers = await WorkerProfile.aggregate(pipeline)
        return res.status(200).json({ workers, page: Number(page), limit: Number(limit) })
    } catch (error) {
        return res.status(500).json({ message: `search nearby workers error ${error}` })
    }
}
