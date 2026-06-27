import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { categories } from '../category'
import CategoryCard from './CategoryCard'
import WorkerCard from './WorkerCard'
import WorkerCardSkeleton from './WorkerCardSkeleton'
import SearchFilters from './SearchFilters'
import useGetCategories from '../hooks/useGetCategories'
import useGetNearbyWorkers from '../hooks/useGetNearbyWorkers'

function CustomerDashboard() {
    const { currentCity } = useSelector(state => state.user)
    const { categories: dbCategories, nearbyWorkers, searchLoading } = useSelector(state => state.worker)
    const [filters, setFilters] = useState({ radius: 10, sort: "distance" })

    useGetCategories()
    useGetNearbyWorkers(filters)

    const handleCategoryClick = (categoryName) => {
        const match = dbCategories.find(c => c.name === categoryName)
        setFilters(prev => ({ ...prev, category: match?._id }))
    }

    return (
        <div className='w-full max-w-4xl px-4 md:px-0'>
            <div className='flex items-center gap-2 text-gray-500 text-sm mb-4'>
                <span>Showing workers near</span>
                <span className='font-medium text-gray-700'>{currentCity || "your location"}</span>
            </div>

            {/* category browse strip */}
            <div className='flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0'>
                {categories.map((c, i) => (
                    <CategoryCard
                        key={i}
                        name={c.category}
                        image={c.image}
                        onClick={() => handleCategoryClick(c.category)}
                    />
                ))}
            </div>

            <div className='mt-6 mb-4'>
                <SearchFilters categories={dbCategories} filters={filters} setFilters={setFilters} />
            </div>

            <div className='flex flex-col gap-3'>
                {searchLoading && [...Array(4)].map((_, i) => <WorkerCardSkeleton key={i} />)}

                {!searchLoading && nearbyWorkers.length === 0 && (
                    <div className='text-center text-gray-500 py-12'>
                        No workers found nearby for these filters yet. Try widening the radius or removing a filter.
                    </div>
                )}

                {!searchLoading && nearbyWorkers.map(w => (
                    <WorkerCard key={w._id} worker={w} />
                ))}
            </div>
        </div>
    )
}

export default CustomerDashboard
