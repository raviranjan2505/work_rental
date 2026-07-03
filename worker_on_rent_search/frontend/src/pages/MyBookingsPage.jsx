import React from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import useGetMyBookings from '../hooks/useGetMyBookings'
import BookingStatusBadge from '../components/BookingStatusBadge'

function MyBookingsPage() {
    const { myBookings } = useSelector(state => state.booking)
    const navigate = useNavigate()
    useGetMyBookings()

    return (
        <div className='w-full min-h-[100vh] pt-[100px] pb-10 flex justify-center bg-[#fff9f6]'>
            <div className='w-full max-w-lg px-4'>
                <h1 className='text-xl font-bold text-gray-800 mb-4'>My Bookings</h1>
                {myBookings.length === 0 && (
                    <p className='text-center text-gray-400 mt-10'>You haven't booked any workers yet.</p>
                )}
                <div className='flex flex-col gap-3'>
                    {myBookings.map(b => (
                        <div
                            key={b._id}
                            onClick={() => navigate(`/bookings/${b._id}`)}
                            className='bg-white rounded-xl border border-[#eee] p-4 cursor-pointer hover:shadow-md transition-shadow'
                        >
                            <div className='flex items-center justify-between'>
                                <p className='font-semibold text-gray-800'>{b.category?.name}</p>
                                <BookingStatusBadge status={b.status} />
                            </div>
                            <p className='text-sm text-gray-500 mt-1'>{b.worker?.fullName || "Worker not yet assigned"}</p>
                            {b.bookingType === "task" && b.taskDetails?.itemDetails && (
                                <p className='text-sm text-gray-500 truncate'>{b.taskDetails.itemDetails}</p>
                            )}
                            <div className='flex items-center justify-between mt-2'>
                                <span className='text-xs text-gray-400'>
                                    {b.bookingType === "task" ? new Date(b.createdAt).toLocaleDateString() : new Date(b.schedule?.date).toLocaleDateString()}
                                </span>
                                <span className='font-semibold text-[#ff4d2d]'>₹{b.amount}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default MyBookingsPage
