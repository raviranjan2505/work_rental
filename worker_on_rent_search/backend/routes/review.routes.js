import express from "express"
import isAuth from "../middlewares/isAuth.js"
import authorize from "../middlewares/authorize.js"
import { createReview, getWorkerReviews, getMyReviews } from "../controllers/review.controllers.js"

const reviewRouter = express.Router()

reviewRouter.post("/", isAuth, authorize("customer"), createReview)
reviewRouter.get("/my", isAuth, authorize("customer"), getMyReviews)
reviewRouter.get("/worker/:workerId", getWorkerReviews)

export default reviewRouter
