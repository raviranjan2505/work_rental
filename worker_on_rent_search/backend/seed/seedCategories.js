import Category from "../models/category.model.js"

const DEFAULT_CATEGORIES = [
    { name: "Driver", group: "Home Services" },
    { name: "Cook", group: "Home Services" },
    { name: "Maid", group: "Home Services" },
    { name: "Sweeper", group: "Home Services" },
    { name: "Electrician", group: "Technical Services" },
    { name: "Plumber", group: "Technical Services" },
    { name: "Carpenter", group: "Technical Services" },
    { name: "AC Technician", group: "Technical Services" },
    { name: "Labour", group: "Labour Services" },
    { name: "Mason", group: "Labour Services" },
    { name: "Painter", group: "Labour Services" },
    { name: "Welder", group: "Labour Services" },
    { name: "Gardener", group: "Labour Services" },
    { name: "Security Guard", group: "Labour Services" },
    { name: "Grocery Pickup", group: "Delivery Services" },
    { name: "Medicine Delivery", group: "Delivery Services" },
    { name: "Parcel Delivery", group: "Delivery Services" },
    { name: "Shopping Assistance", group: "Delivery Services" },
    { name: "Personal Assistant", group: "Assistant Services" },
    { name: "Office Boy", group: "Assistant Services" },
    { name: "Bank Work Assistant", group: "Assistant Services" }
]

export const seedDefaultCategories = async () => {
    try {
        const existingNames = new Set((await Category.find().select("name")).map(c => c.name))
        const missing = DEFAULT_CATEGORIES.filter(c => !existingNames.has(c.name))
        if (missing.length === 0) return
        await Category.insertMany(missing)
        console.log(`seeded ${missing.length} category(ies): ${missing.map(c => c.name).join(", ")}`)
    } catch (error) {
        console.log("category seed error", error)
    }
}
