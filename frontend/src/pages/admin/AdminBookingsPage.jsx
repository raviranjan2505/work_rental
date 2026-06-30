import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { serverUrl } from '../../App'

const STATUS_OPTIONS = ["PENDING", "ACCEPTED", "REJECTED", "ON_THE_WAY", "ARRIVED", "WORK_STARTED", "COMPLETED", "CANCELLED"]
const TYPE_OPTIONS = ["hourly", "daily", "task"]

function AdminBookingsPage() {
    const [bookings, setBookings] = useState([])
    const [total, setTotal] = useState(0)
    const [status, setStatus] = useState("")
    const [bookingType, setBookingType] = useState("")
    const [page, setPage] = useState(1)
    const [err, setErr] = useState("")

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/admin/bookings`, {
                    withCredentials: true, params: { status, bookingType, page, limit: 15 }
                })
                setBookings(result.data.bookings)
                setTotal(result.data.total)
            } catch (error) {
                setErr(error?.response?.data?.message || "could not load bookings")
            }
        }
        fetchBookings()
    }, [status, bookingType, page])

    const totalPages = Math.max(1, Math.ceil(total / 15))

    return (
        <div>
            <h1 className='text-xl font-bold text-gray-800 mb-4'>Bookings</h1>

            <div className='flex gap-2 mb-4'>
                <select className='border rounded-lg px-3 py-2 text-sm' style={{ borderColor: "#ddd" }} value={status} onChange={(e) => { setPage(1); setStatus(e.target.value) }}>
                    <option value="">All statuses</option>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className='border rounded-lg px-3 py-2 text-sm' style={{ borderColor: "#ddd" }} value={bookingType} onChange={(e) => { setPage(1); setBookingType(e.target.value) }}>
                    <option value="">All types</option>
                    {TYPE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            <div className='bg-white rounded-xl border border-[#eee] overflow-hidden'>
                <table className='w-full text-sm'>
                    <thead>
                        <tr className='text-left text-gray-400 border-b border-[#f0f0f0]'>
                            <th className='py-2 px-3'>Category</th>
                            <th className='py-2 px-3'>Type</th>
                            <th className='py-2 px-3'>Customer</th>
                            <th className='py-2 px-3'>Worker</th>
                            <th className='py-2 px-3'>Status</th>
                            <th className='py-2 px-3'>Amount</th>
                            <th className='py-2 px-3'>Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map(b => (
                            <tr key={b._id} className='border-b border-[#f7f7f7]'>
                                <td className='py-2 px-3 font-medium text-gray-700'>{b.category?.name}</td>
                                <td className='py-2 px-3 text-gray-500'>{b.bookingType}</td>
                                <td className='py-2 px-3 text-gray-500'>{b.customer?.fullName}</td>
                                <td className='py-2 px-3 text-gray-500'>{b.worker?.fullName || "—"}</td>
                                <td className='py-2 px-3'>{b.status}</td>
                                <td className='py-2 px-3'>₹{b.amount}</td>
                                <td className='py-2 px-3 text-gray-400'>{new Date(b.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {bookings.length === 0 && <p className='text-center text-gray-400 py-6 text-sm'>No bookings found.</p>}
            </div>

            <div className='flex justify-center gap-2 mt-4 text-sm'>
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className='px-3 py-1 border rounded disabled:opacity-40'>Prev</button>
                <span className='text-gray-500'>Page {page} of {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className='px-3 py-1 border rounded disabled:opacity-40'>Next</button>
            </div>

            {err && <p className='text-red-500 text-sm mt-3'>*{err}</p>}
        </div>
    )
}

export default AdminBookingsPage
