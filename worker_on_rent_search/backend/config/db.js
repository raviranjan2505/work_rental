import mongoose from "mongoose"
import { seedDefaultCategories } from "../seed/seedCategories.js"
import { seedAdmin } from "../seed/seedAdmin.js"

const connectDb=async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL)
        console.log("db connected")
        await seedDefaultCategories()
        await seedAdmin()
    } catch (error) {
        console.log("db error")
    }
}

export default connectDb