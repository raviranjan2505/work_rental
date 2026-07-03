import bcrypt from "bcryptjs"
import User from "../models/user.model.js"

export const seedAdmin = async () => {
    try {
        const email = process.env.ADMIN_EMAIL
        const password = process.env.ADMIN_PASSWORD
        if (!email || !password) {
            console.log("ADMIN_EMAIL / ADMIN_PASSWORD not set - skipping admin seed")
            return
        }
        const existing = await User.findOne({ email })
        if (existing) return

        const hashedPassword = await bcrypt.hash(password, 10)
        await User.create({
            fullName: "Platform Admin",
            email,
            password: hashedPassword,
            mobile: process.env.ADMIN_MOBILE || "9999999999",
            role: "admin"
        })
        console.log(`seeded admin account: ${email}`)
    } catch (error) {
        console.log("admin seed error", error)
    }
}
