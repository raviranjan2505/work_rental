import React from 'react'

const SORT_OPTIONS = [
    { value: "distance", label: "Nearest" },
    { value: "rating", label: "Top rated" },
    { value: "priceLowToHigh", label: "Price: low to high" },
    { value: "priceHighToLow", label: "Price: high to low" }
]

function SearchFilters({ categories, filters, setFilters }) {
    const update = (key, value) => setFilters(prev => ({ ...prev, [key]: value }))

    return (
        <div className='flex flex-wrap gap-2 items-center'>
            <select
                className='border border-[#ddd] rounded-lg px-3 py-2 text-sm text-gray-700 bg-white'
                value={filters.category || ""}
                onChange={(e) => update("category", e.target.value || undefined)}
            >
                <option value="">All categories</option>
                {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                ))}
            </select>

            <select
                className='border border-[#ddd] rounded-lg px-3 py-2 text-sm text-gray-700 bg-white'
                value={filters.minRating || ""}
                onChange={(e) => update("minRating", e.target.value || undefined)}
            >
                <option value="">Any rating</option>
                <option value="4">4 ★ & up</option>
                <option value="3">3 ★ & up</option>
            </select>

            <select
                className='border border-[#ddd] rounded-lg px-3 py-2 text-sm text-gray-700 bg-white'
                value={filters.radius || 10}
                onChange={(e) => update("radius", e.target.value)}
            >
                <option value="2">Within 2 km</option>
                <option value="5">Within 5 km</option>
                <option value="10">Within 10 km</option>
                <option value="25">Within 25 km</option>
            </select>

            <select
                className='border border-[#ddd] rounded-lg px-3 py-2 text-sm text-gray-700 bg-white'
                value={filters.sort || "distance"}
                onChange={(e) => update("sort", e.target.value)}
            >
                {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    )
}

export default SearchFilters
