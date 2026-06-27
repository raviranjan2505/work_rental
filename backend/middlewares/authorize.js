import User from "../models/user.model.js"

// Use after isAuth. Usage: authorize("admin") or authorize("customer","worker")
const authorize = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            const user = await User.findById(req.userId).select("role")
            if (!user) {
                return res.status(401).json({ message: "user not found" })
            }
            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({ message: "you are not allowed to perform this action" })
            }
            req.userRole = user.role
            next()
        } catch (error) {
            return res.status(500).json({ message: `authorize error ${error}` })
        }
    }
}

export default authorize
