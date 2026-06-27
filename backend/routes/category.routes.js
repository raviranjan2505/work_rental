import express from "express"
import isAuth from "../middlewares/isAuth.js"
import authorize from "../middlewares/authorize.js"
import {
    createCategory,
    updateCategory,
    deleteCategory,
    getCategories,
    getAllCategoriesAdmin
} from "../controllers/category.controllers.js"

const categoryRouter = express.Router()

// Public
categoryRouter.get("/", getCategories)

// Admin only
categoryRouter.get("/admin/all", isAuth, authorize("admin"), getAllCategoriesAdmin)
categoryRouter.post("/", isAuth, authorize("admin"), createCategory)
categoryRouter.put("/:categoryId", isAuth, authorize("admin"), updateCategory)
categoryRouter.delete("/:categoryId", isAuth, authorize("admin"), deleteCategory)

export default categoryRouter
