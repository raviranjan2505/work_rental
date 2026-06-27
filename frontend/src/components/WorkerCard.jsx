import React from 'react'
import { FaStar } from "react-icons/fa"
import { useNavigate } from 'react-router-dom'

function formatDistance(meters) {
    if (meters == null) return ""
    if (meters < 1000) return `${Math.round(meters)} m away`
    return `${(meters / 1000).toFixed(1)} km away`
}

function WorkerCard({ worker }) {
    const navigate = useNavigate()
    return (
        <div
            onClick={() => navigate(`/worker/${worker._id}`)}
            className='bg-white rounded-xl border border-[#eee] shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4 flex gap-4'
        >
            <div className='relative w-[64px] h-[64px] shrink-0'>
                <img
                    src={worker.profileImage || "/vite.svg"}
                    alt={worker.user?.fullName}
                    className='w-full h-full object-cover rounded-full border-2 border-[#ff4d2d]'
                />
                {worker.isOnline && (
                    <span className='absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white' title="Online" />
                )}
            </div>

            <div className='flex-1 min-w-0'>
                <div className='flex items-start justify-between gap-2'>
                    <div>
                        <p className='font-semibold text-gray-800 truncate'>{worker.user?.fullName}</p>
                        <p className='text-sm text-gray-500'>{worker.category?.name}</p>
                    </div>
                    <span className='text-xs whitespace-nowrap text-gray-500'>{formatDistance(worker.distanceInMeters)}</span>
                </div>

                <div className='flex items-center gap-1 mt-1 text-sm text-gray-700'>
                    <FaStar className='text-yellow-500' />
                    <span>{worker.rating?.average?.toFixed(1) || "New"}</span>
                    {worker.rating?.count > 0 && <span className='text-gray-400'>({worker.rating.count})</span>}
                    <span className='text-gray-400'>&middot;</span>
                    <span>{worker.completedJobs || 0} jobs</span>
                </div>

                <div className='flex items-center justify-between mt-2'>
                    <span className='text-sm text-gray-600'>{worker.experienceYears || 0} yrs experience</span>
                    <span className='font-semibold text-[#ff4d2d]'>
                        ₹{worker.hourlyRate}<span className='text-xs text-gray-500 font-normal'>/hr</span>
                    </span>
                </div>
            </div>
        </div>
    )
}

export default WorkerCard
