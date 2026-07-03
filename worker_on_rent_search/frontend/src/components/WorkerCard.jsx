import React from 'react'
import { FaStar, FaCheckCircle } from 'react-icons/fa'
import { MdVerified } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

function formatDistance(meters) {
    if (meters == null) return ''
    if (meters < 1000) return `${Math.round(meters)} m away`
    return `${(meters / 1000).toFixed(1)} km away`
}

function WorkerCard({ worker }) {
    const navigate = useNavigate()
    const { userData } = useSelector(state => state.user)

    const handleBook = (e) => {
        e.stopPropagation()
        if (!userData) {
            navigate('/signin')
        } else {
            navigate(`/book/${worker.user?._id}`)
        }
    }

    return (
        <div
            onClick={() => navigate(`/worker/${worker.user?._id}`)}
            className='bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer p-4'
        >
            {/* Mobile layout */}
            <div className='flex gap-3 md:hidden'>
                <div className='relative w-[56px] h-[56px] shrink-0'>
                    <img
                        src={worker.profileImage || '/vite.svg'}
                        alt={worker.user?.fullName}
                        className='w-full h-full object-cover rounded-full border-2 border-[#ff4d2d]'
                    />
                    {worker.isOnline && (
                        <span className='absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white' />
                    )}
                </div>
                <div className='flex-1 min-w-0'>
                    <div className='flex items-start justify-between'>
                        <div>
                            <div className='flex items-center gap-1'>
                                <p className='font-semibold text-gray-800 text-sm'>{worker.user?.fullName}</p>
                                {worker.kyc?.isVerified && <MdVerified size={14} className='text-[#ff4d2d]' />}
                            </div>
                            <p className='text-xs text-gray-500'>{worker.category?.name}</p>
                        </div>
                        <button className='p-1 text-gray-300 hover:text-red-400'>
                            <svg xmlns="http://www.w3.org/2000/svg" className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' /></svg>
                        </button>
                    </div>
                    <div className='flex items-center gap-1 mt-0.5 text-xs text-gray-600'>
                        <FaStar className='text-yellow-400' size={10} />
                        <span className='font-medium'>{worker.rating?.average?.toFixed(1) || 'New'}</span>
                        {worker.rating?.count > 0 && <span className='text-gray-400'>({worker.rating.count})</span>}
                        <span className='text-gray-300'>·</span>
                        <span>{worker.completedJobs || 0} jobs</span>
                    </div>
                    <p className='text-xs text-gray-500 mt-0.5'>{worker.experienceYears || 0} yrs experience</p>
                    <div className='flex items-center justify-between mt-2'>
                        <div className='flex gap-2'>
                            {worker.kyc?.isVerified && (
                                <span className='flex items-center gap-0.5 text-[10px] text-green-600 font-medium'>
                                    <FaCheckCircle size={9} />Background Verified
                                </span>
                            )}
                        </div>
                        <div className='flex items-center gap-2'>
                            <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/worker/${worker.user?._id}`) }}
                                className='px-3 py-1 text-xs rounded-full border border-gray-200 text-gray-600 font-medium hover:border-[#ff4d2d] hover:text-[#ff4d2d] transition-colors'
                            >
                                View Profile
                            </button>
                            <button
                                onClick={handleBook}
                                className='px-3 py-1 text-xs rounded-full bg-[#ff4d2d] text-white font-medium hover:bg-[#e64323] transition-colors'
                            >
                                Book Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop layout */}
            <div className='hidden md:flex gap-4 items-start'>
                <div className='relative w-[72px] h-[72px] shrink-0'>
                    <img
                        src={worker.profileImage || '/vite.svg'}
                        alt={worker.user?.fullName}
                        className='w-full h-full object-cover rounded-full border-2 border-[#ff4d2d]'
                    />
                    {worker.isOnline && (
                        <span className='absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white' />
                    )}
                </div>
                <div className='flex-1 min-w-0'>
                    <div className='flex items-start justify-between gap-4'>
                        <div>
                            <div className='flex items-center gap-1.5'>
                                <p className='font-bold text-gray-800'>{worker.user?.fullName}</p>
                                {worker.kyc?.isVerified && <MdVerified size={16} className='text-[#ff4d2d]' />}
                            </div>
                            <p className='text-sm text-gray-500 mt-0.5'>{worker.category?.name}</p>
                            <div className='flex items-center gap-2 mt-1 text-sm'>
                                <div className='flex items-center gap-1'>
                                    <FaStar className='text-yellow-400' size={12} />
                                    <span className='font-medium text-gray-700'>{worker.rating?.average?.toFixed(1) || 'New'}</span>
                                    {worker.rating?.count > 0 && <span className='text-gray-400'>({worker.rating.count})</span>}
                                </div>
                                <span className='text-gray-300'>·</span>
                                <span className='text-gray-600'>{worker.completedJobs || 0} jobs</span>
                            </div>
                            <p className='text-sm text-gray-500 mt-0.5'>{worker.experienceYears || 0} yrs experience</p>
                            <div className='flex gap-3 mt-2'>
                                {worker.kyc?.isVerified && (
                                    <span className='flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full'>
                                        <FaCheckCircle size={10} />Background Verified
                                    </span>
                                )}
                                <span className='flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full'>
                                    <FaCheckCircle size={10} />ID Verified
                                </span>
                            </div>
                        </div>
                        <div className='flex flex-col items-end gap-3 shrink-0'>
                            <div className='text-right'>
                                <span className='text-xs text-gray-400'>{formatDistance(worker.distanceInMeters)}</span>
                                <p className='font-bold text-[#ff4d2d] text-lg'>₹{worker.hourlyRate}<span className='text-xs text-gray-500 font-normal'>/hr</span></p>
                            </div>
                            <div className='flex gap-2'>
                                <button
                                    onClick={(e) => { e.stopPropagation(); navigate(`/worker/${worker.user?._id}`) }}
                                    className='px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 font-medium hover:border-[#ff4d2d] hover:text-[#ff4d2d] transition-colors'
                                >
                                    View Profile
                                </button>
                                <button
                                    onClick={handleBook}
                                    className='px-4 py-2 text-sm rounded-lg bg-[#ff4d2d] text-white font-semibold hover:bg-[#e64323] transition-colors'
                                >
                                    Book Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default WorkerCard
