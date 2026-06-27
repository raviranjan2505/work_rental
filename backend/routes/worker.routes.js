import express from "express"
import isAuth from "../middlewares/isAuth.js"
import authorize from "../middlewares/authorize.js"
import { upload } from "../middlewares/multer.js"
import {
    createOrUpdateMyProfile,
    getMyProfile,
    getWorkerById,
    updateAvailability,
    searchNearbyWorkers,
    adminVerifyKyc,
    adminSetWorkerStatus,
    adminListWorkers
} from "../controllers/worker.controllers.js"

const workerRouter = express.Router()

workerRouter.post(
    "/profile",
    isAuth,
    authorize("worker"),
    upload.fields([
        { name: "profileImage", maxCount: 1 },
        { name: "aadhaarDoc", maxCount: 1 },
        { name: "panDoc", maxCount: 1 },
        { name: "selfie", maxCount: 1 }
    ]),
    createOrUpdateMyProfile
)
workerRouter.get("/profile/me", isAuth, authorize("worker"), getMyProfile)
workerRouter.patch("/availability", isAuth, authorize("worker"), updateAvailability)
// IMPORTANT: keep these above "/:workerId" or they get swallowed as an id param
workerRouter.get("/search/nearby", isAuth, authorize("customer"), searchNearbyWorkers)
workerRouter.get("/admin/all", isAuth, authorize("admin"), adminListWorkers)
workerRouter.patch("/admin/:workerProfileId/kyc", isAuth, authorize("admin"), adminVerifyKyc)
workerRouter.patch("/admin/:workerProfileId/status", isAuth, authorize("admin"), adminSetWorkerStatus)
workerRouter.get("/:workerId", getWorkerById)

export default workerRouter
