import express from "express"
import isAuth from "../middlewares/isAuth.js"
import authorize from "../middlewares/authorize.js"
import { getPlatformSettings, updatePlatformSettings } from "../controllers/settings.controllers.js"

const settingsRouter = express.Router()

settingsRouter.get("/", isAuth, authorize("admin"), getPlatformSettings)
settingsRouter.put("/", isAuth, authorize("admin"), updatePlatformSettings)

export default settingsRouter
