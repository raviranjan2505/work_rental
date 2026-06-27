import Category from "../models/category.model.js"

export const createCategory = async (req, res) => {
    try {
        const { name, group, icon, description, commissionPercent } = req.body
        const exists = await Category.findOne({ name })
        if (exists) {
            return res.status(400).json({ message: "category already exists" })
        }
        const category = await Category.create({
            name, group, icon, description,
            commissionPercent: commissionPercent ?? null
        })
        return res.status(201).json(category)
    } catch (error) {
        return res.status(500).json({ message: `create category error ${error}` })
    }
}

export const updateCategory = async (req, res) => {
    try {
        const { categoryId } = req.params
        const category = await Category.findByIdAndUpdate(categoryId, req.body, { new: true })
        if (!category) {
            return res.status(404).json({ message: "category not found" })
        }
        return res.status(200).json(category)
    } catch (error) {
        return res.status(500).json({ message: `update category error ${error}` })
    }
}

export const deleteCategory = async (req, res) => {
    try {
        const { categoryId } = req.params
        const category = await Category.findByIdAndDelete(categoryId)
        if (!category) {
            return res.status(404).json({ message: "category not found" })
        }
        return res.status(200).json({ message: "category deleted" })
    } catch (error) {
        return res.status(500).json({ message: `delete category error ${error}` })
    }
}

// Public - returns only active categories, grouped for UI rendering
export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true }).sort({ group: 1, name: 1 })
        return res.status(200).json(categories)
    } catch (error) {
        return res.status(500).json({ message: `get categories error ${error}` })
    }
}

// Admin - includes inactive categories too
export const getAllCategoriesAdmin = async (req, res) => {
    try {
        const categories = await Category.find().sort({ group: 1, name: 1 })
        return res.status(200).json(categories)
    } catch (error) {
        return res.status(500).json({ message: `get categories error ${error}` })
    }
}
