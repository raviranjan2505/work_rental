import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { FaCalendarCheck, FaArrowRight, FaFilter } from 'react-icons/fa'
import WorkerLayout from '../../worker/WorkerLayout'
import useGetAssignedBookings from '../../hooks/useGetAssignedBookings'

const TABS = ['ALL', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

const STATUS_BADGE = {
    PENDING:     'bg-yellow-50 text-yellow-700 border-yellow-200',
    CONFIRMED:   'bg-blue-50 text-blue-700 border-blue-200',
    IN_PROGRESS: 'bg-purple-50 text-purple-700 border-purple-200',
    COMPLETED:   'bg-green-50 text-green-700 border-green-200',
    CANCELLED:   'bg-red-50 text-red-600 border-red-200',
}

function StatusBadge({ status }) {
    return (
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_BADGE[status] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
            {status?.replace('_', ' ')}
        </span>
    )
}

export default function WorkerBookingsPage() {
    const { assignedBookings } = useSelector(s => s.booking)
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('ALL')
    const [search, setSearch] = useState('')

    useGetAssignedBookings()

    const filtered = (assignedBookings || []).filter(b => {
        const tabOk = activeTab === 'ALL' || b.status === activeTab
        const searchOk = !search || b.customer?.fullName?.toLowerCase().includes(search.toLowerCase())
        return tabOk && searchOk
    })

    const countFor = (tab) => tab === 'ALL'
        ? assignedBookings?.length || 0
        : assignedBookings?.filter(b => b.status === tab).length || 0

    return (
        <WorkerLayout>
            {/* header */}
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6'>
                <div>
                    <h1 className='text-2xl font-extrabold text-gray-800'>Booking Requests</h1>
                    <p className='text-sm text-gray-400 mt-0.5'>{assignedBookings?.length || 0} total requests</p>
                </div>
                <input type='text' value={search} onChange={e => setSearch(e.target.value)}
                    placeholder='Search by customer name…'
                    className='border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:border-[#ff4d2d] w-full md:w-64' />
            </div>

            {/* status tabs */}
            <div className='flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide -mx-1 px-1'>
                {TABS.map(tab => {
                    const count = countFor(tab)
                    const active = activeTab === tab
                    return (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all
                                ${active ? 'bg-[#ff4d2d] text-white border-[#ff4d2d] shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-[#ff4d2d] hover:text-[#ff4d2d]'}`}>
                            {tab.replace('_', ' ')}
                            {count > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold
                                    ${active ? 'bg-white text-[#ff4d2d]' : 'bg-[#ff4d2d]/10 text-[#ff4d2d]'}`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* empty */}
            {filtered.length === 0 && (
                <div className='bg-white rounded-xl border border-[#eee] py-16 text-center'>
                    <FaCalendarCheck size={36} className='text-gray-200 mx-auto mb-3' />
                    <p className='font-semibold text-gray-600'>No {activeTab !== 'ALL' ? activeTab.replace('_', ' ').toLowerCase() : ''} bookings</p>
                    <p className='text-sm text-gray-400 mt-1'>
                        {activeTab === 'ALL' ? 'Mark yourself available to start receiving requests.' : 'No bookings in this status yet.'}
                    </p>
                </div>
            )}

            {/* desktop table */}
            {filtered.length > 0 && (
                <>
                    <div className='hidden md:block bg-white rounded-xl border border-[#eee] overflow-hidden'>
                        <table className='w-full text-sm'>
                            <thead>
                                <tr className='bg-[#f7f7f8] text-xs text-gray-400 font-semibold border-b border-[#eee]'>
                                    <th className='text-left px-5 py-3'>Customer</th>
                                    <th className='text-left px-5 py-3'>Category</th>
                                    <th className='text-left px-5 py-3'>Type</th>
                                    <th className='text-left px-5 py-3'>Date / Schedule</th>
                                    <th className='text-left px-5 py-3'>Amount</th>
                                    <th className='text-left px-5 py-3'>Status</th>
                                    <th className='px-5 py-3' />
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(b => (
                                    <tr key={b._id}
                                        onClick={() => navigate(`/bookings/${b._id}`)}
                                        className='border-b border-[#f7f7f7] hover:bg-[#fff9f6] cursor-pointer transition-colors'>
                                        <td className='px-5 py-3.5'>
                                            <p className='font-semibold text-gray-800'>{b.customer?.fullName}</p>
                                            <p className='text-[11px] text-gray-400'>{b.customer?.mobile}</p>
                                        </td>
                                        <td className='px-5 py-3.5 text-gray-600'>{b.category?.name}</td>
                                        <td className='px-5 py-3.5 capitalize text-gray-500'>{b.bookingType}</td>
                                        <td className='px-5 py-3.5 text-gray-500 text-xs'>
                                            {b.bookingType === 'task'
                                                ? new Date(b.createdAt).toLocaleDateString()
                                                : b.schedule?.date ? new Date(b.schedule.date).toLocaleDateString() : '—'
                                            }
                                        </td>
                                        <td className='px-5 py-3.5 font-bold text-[#ff4d2d]'>₹{b.amount}</td>
                                        <td className='px-5 py-3.5'><StatusBadge status={b.status} /></td>
                                        <td className='px-5 py-3.5'>
                                            <FaArrowRight size={11} className='text-gray-300' />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* mobile cards */}
                    <div className='flex flex-col gap-3 md:hidden'>
                        {filtered.map(b => (
                            <div key={b._id} onClick={() => navigate(`/bookings/${b._id}`)}
                                className='bg-white rounded-xl border border-[#eee] p-4 cursor-pointer hover:shadow-md transition-shadow'>
                                <div className='flex items-start justify-between'>
                                    <div>
                                        <p className='font-bold text-gray-800'>{b.customer?.fullName}</p>
                                        <p className='text-xs text-gray-500 mt-0.5'>{b.category?.name} · {b.bookingType}</p>
                                    </div>
                                    <StatusBadge status={b.status} />
                                </div>
                                {b.taskDetails?.itemDetails && (
                                    <p className='text-xs text-gray-500 mt-2 truncate'>{b.taskDetails.itemDetails}</p>
                                )}
                                <div className='flex items-center justify-between mt-3 pt-3 border-t border-[#f5f5f5]'>
                                    <span className='text-xs text-gray-400'>
                                        {b.bookingType === 'task'
                                            ? new Date(b.createdAt).toLocaleDateString()
                                            : b.schedule?.date ? new Date(b.schedule.date).toLocaleDateString() : '—'
                                        }
                                    </span>
                                    <span className='font-extrabold text-[#ff4d2d]'>₹{b.amount}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </WorkerLayout>
    )
}
