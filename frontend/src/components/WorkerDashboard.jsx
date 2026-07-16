import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
    FaCalendarCheck, FaStar, FaWallet, FaExclamationTriangle,
    FaCheckCircle, FaHourglassHalf, FaArrowRight, FaBriefcase, FaShieldAlt
} from 'react-icons/fa'
import { MdVerified, MdToggleOn, MdToggleOff } from 'react-icons/md'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import WorkerLayout from '../worker/WorkerLayout'
import { serverUrl } from '../App'
import { setMyWorkerProfile } from '../redux/workerSlice'
import useGetMyWorkerProfile from '../hooks/useGetMyWorkerProfile'
import useGetWallet from '../hooks/useGetWallet'
import useGetAssignedBookings from '../hooks/useGetAssignedBookings'

const BRAND = '#ff4d2d'

const STATUS_INFO = {
    ACTIVE:          { label: 'Active',           color: 'text-green-700 bg-green-50 border-green-200',  icon: '🟢', note: "You're live and receiving bookings." },
    PENDING_DEPOSIT: { label: 'Pending Deposit',  color: 'text-orange-700 bg-orange-50 border-orange-200', icon: '⏳', note: 'Pay your security deposit to start getting booked.' },
    PAYMENT_DUE:     { label: 'Payment Due',      color: 'text-red-700 bg-red-50 border-red-200',       icon: '⚠️', note: 'Commission is overdue. Clear it to stay visible.' },
    SUSPENDED:       { label: 'Suspended',        color: 'text-red-800 bg-red-100 border-red-300',      icon: '🚫', note: 'Profile hidden. Clear pending commission to reactivate.' },
}

function StatCard({ icon: Icon, label, value, sub, color = 'text-[#ff4d2d]', bg = 'bg-[#fff0eb]' }) {
    return (
        <div className='bg-white rounded-xl border border-[#eee] p-4 flex items-start gap-4'>
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon size={18} className={color} />
            </div>
            <div>
                <p className='text-xs text-gray-400 font-medium'>{label}</p>
                <p className='text-2xl font-extrabold text-gray-800 leading-tight'>{value ?? '—'}</p>
                {sub && <p className='text-xs text-gray-400 mt-0.5'>{sub}</p>}
            </div>
        </div>
    )
}

function BookingStatusBadge({ status }) {
    const MAP = {
        PENDING:     'bg-yellow-50 text-yellow-700 border-yellow-200',
        CONFIRMED:   'bg-blue-50 text-blue-700 border-blue-200',
        IN_PROGRESS: 'bg-purple-50 text-purple-700 border-purple-200',
        COMPLETED:   'bg-green-50 text-green-700 border-green-200',
        CANCELLED:   'bg-red-50 text-red-600 border-red-200',
    }
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${MAP[status] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
            {status}
        </span>
    )
}

export default function WorkerDashboard() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { myWorkerProfile } = useSelector(s => s.worker)
    const { wallet } = useSelector(s => s.wallet)
    const { assignedBookings } = useSelector(s => s.booking)

    useGetMyWorkerProfile()
    useGetWallet()
    useGetAssignedBookings()

    const toggleAvailability = async () => {
        if (!myWorkerProfile) return
        try {
            const res = await axios.patch(
                `${serverUrl}/api/worker/availability`,
                { isAvailable: !myWorkerProfile.isAvailable },
                { withCredentials: true }
            )
            dispatch(setMyWorkerProfile(res.data))
        } catch (e) { console.error(e) }
    }

    if (!myWorkerProfile) {
        return (
            <WorkerLayout>
                <div className='flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center'>
                    <div className='w-20 h-20 rounded-2xl bg-[#fff0eb] flex items-center justify-center'>
                        <FaBriefcase size={32} className='text-[#ff4d2d]' />
                    </div>
                    <h2 className='text-xl font-bold text-gray-800'>Complete your profile</h2>
                    <p className='text-gray-500 text-sm max-w-sm'>Add your category, rates, and KYC documents so customers can find and book you.</p>
                    <button onClick={() => navigate('/worker-onboarding')}
                        className='bg-[#ff4d2d] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#e64323] transition-colors shadow-lg shadow-[#ff4d2d]/20'>
                        Set Up Profile →
                    </button>
                </div>
            </WorkerLayout>
        )
    }

    const statusInfo  = STATUS_INFO[myWorkerProfile.status] || STATUS_INFO.PENDING_DEPOSIT
    const recent      = [...(assignedBookings || [])].slice(0, 5)
    const completed   = assignedBookings?.filter(b => b.status === 'COMPLETED').length || 0
    const pending     = assignedBookings?.filter(b => b.status === 'PENDING').length || 0

    const securityDeposit = Number(wallet?.securityDepositBalance || 0)
    const totalCommissionDeducted = Number(wallet?.totalCommissionDeducted || 0)
    const remainingDepositBalance = wallet?.remainingDepositBalance !== undefined
        ? Number(wallet.remainingDepositBalance)
        : securityDeposit - totalCommissionDeducted
    const minimumRequiredDeposit = Number(wallet?.minimumRequiredDeposit || 0)
    const pendingCommission = Number(wallet?.pendingCommission || 0)

    const depositWarning = remainingDepositBalance <= 0
        ? {
            type: 'red',
            message: 'Your account is temporarily inactive because your security deposit has been exhausted.'
        }
        : remainingDepositBalance < minimumRequiredDeposit
            ? {
                type: 'yellow',
                message: 'Your security deposit is running low. Please recharge to continue receiving bookings.'
            }
            : null

    const formatCurrency = value => `₹${Number(value || 0).toLocaleString('en-IN')}`

    // simple weekly earnings chart from transactions (last 5 bookings amounts)
    const chartData = recent.map((b, i) => ({
        name: `Job ${i + 1}`,
        amount: b.amount || 0
    })).reverse()

    return (
        <WorkerLayout>
            {/* page header */}
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6'>
                <div>
                    <h1 className='text-2xl font-extrabold text-gray-800'>Dashboard</h1>
                    <p className='text-sm text-gray-400 mt-0.5'>Welcome back — here's your overview</p>
                </div>
                <div className='flex items-center gap-3'>
                    <button onClick={toggleAvailability}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all
                            ${myWorkerProfile.isAvailable ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                        {myWorkerProfile.isAvailable
                            ? <><MdToggleOn size={20} className='text-green-600' /> Available</>
                            : <><MdToggleOff size={20} className='text-gray-400' /> Unavailable</>
                        }
                    </button>
                    <button onClick={() => navigate('/worker-onboarding')}
                        className='px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:border-[#ff4d2d] hover:text-[#ff4d2d] transition-all'>
                        Edit Profile
                    </button>
                </div>
            </div>

            {/* status alert */}
            {myWorkerProfile.status !== 'ACTIVE' && (
                <div className={`flex items-start gap-3 p-4 rounded-xl border mb-6 ${statusInfo.color}`}>
                    <span className='text-xl shrink-0'>{statusInfo.icon}</span>
                    <div className='flex-1'>
                        <p className='font-bold text-sm'>{statusInfo.label}</p>
                        <p className='text-xs mt-0.5 opacity-80'>{statusInfo.note}</p>
                    </div>
                    {myWorkerProfile.status === 'PENDING_DEPOSIT' && (
                        <button onClick={() => navigate('/deposit')}
                            className='shrink-0 bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-orange-700'>
                            Pay Now
                        </button>
                    )}
                    {['PAYMENT_DUE', 'SUSPENDED'].includes(myWorkerProfile.status) && (
                        <button onClick={() => navigate('/wallet')}
                            className='shrink-0 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-700'>
                            Clear Due
                        </button>
                    )}
                </div>
            )}

            {/* stat cards */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mb-6'>
                <StatCard icon={FaCheckCircle} label='Completed Jobs'
                    value={myWorkerProfile.completedJobs || 0}
                    color='text-green-600' bg='bg-green-50' />
                <StatCard icon={FaStar} label='Average Rating'
                    value={myWorkerProfile.rating?.average ? `${myWorkerProfile.rating.average.toFixed(1)} ★` : 'No ratings'}
                    sub={myWorkerProfile.rating?.count ? `${myWorkerProfile.rating.count} reviews` : ''}
                    color='text-yellow-500' bg='bg-yellow-50' />
                <StatCard icon={FaWallet} label='Withdrawable'
                    value={wallet ? `₹${wallet.withdrawableBalance}` : '—'}
                    sub={wallet ? `₹${wallet.totalEarnings} total earned` : ''}
                    color='text-blue-600' bg='bg-blue-50' />
                <StatCard icon={FaHourglassHalf} label='Pending Requests'
                    value={pending}
                    sub={`${completed} completed`}
                    color='text-purple-600' bg='bg-purple-50' />
            </div>

            <div className='bg-white rounded-xl border border-[#eee] p-5 mb-6'>
                <div className='flex items-start justify-between gap-3 mb-4'>
                    <div>
                        <p className='font-bold text-gray-800 flex items-center gap-2'>
                            <FaShieldAlt size={14} className='text-[#ff4d2d]' />
                            Deposit & Commission Summary
                        </p>
                        <p className='text-sm text-gray-400 mt-0.5'>Stay on top of your deposit balance and commission deductions</p>
                    </div>
                </div>

                <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
                    <StatCard icon={FaShieldAlt} label='Security Deposit' value={formatCurrency(securityDeposit)} color='text-purple-600' bg='bg-purple-50' />
                    <StatCard icon={FaWallet} label='Total Commission Deducted' value={formatCurrency(totalCommissionDeducted)} color='text-red-500' bg='bg-red-50' />
                    <StatCard icon={FaCheckCircle} label='Remaining Deposit Balance' value={formatCurrency(remainingDepositBalance)} color='text-green-600' bg='bg-green-50' />
                    <StatCard icon={FaHourglassHalf} label='Pending Commission' value={formatCurrency(pendingCommission)} color='text-orange-600' bg='bg-orange-50' />
                </div>

                {depositWarning && (
                    <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${depositWarning.type === 'red' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                        <p className='font-semibold'>{depositWarning.message}</p>
                    </div>
                )}
            </div>

            {/* pending commission warning */}
            {pendingCommission > 0 && (
                <div className='bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-3 mb-6'>
                    <div className='flex items-center gap-3'>
                        <FaExclamationTriangle className='text-red-500 shrink-0' />
                        <div>
                            <p className='font-bold text-red-700 text-sm'>Commission Due: {formatCurrency(pendingCommission)}</p>
                            <p className='text-xs text-red-600 opacity-80'>Clear this to remain visible to customers</p>
                        </div>
                    </div>
                    <button onClick={() => navigate('/wallet')}
                        className='shrink-0 bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-red-700 transition-colors'>
                        Pay Now
                    </button>
                </div>
            )}

            <div className='grid md:grid-cols-3 gap-4'>
                {/* profile card */}
                <div className='bg-white rounded-xl border border-[#eee] p-5 flex flex-col gap-3'>
                    <div className='flex items-center gap-3 pb-3 border-b border-[#f5f5f5]'>
                        <div className='w-12 h-12 rounded-xl bg-[#fff0eb] flex items-center justify-center font-bold text-[#ff4d2d] text-lg'>
                            {myWorkerProfile.user?.fullName?.slice(0, 1) || 'W'}
                        </div>
                        <div>
                            <div className='flex items-center gap-1'>
                                <p className='font-bold text-gray-800'>{myWorkerProfile.user?.fullName}</p>
                                {myWorkerProfile.kyc?.isVerified && <MdVerified size={15} className='text-[#ff4d2d]' />}
                            </div>
                            <p className='text-xs text-gray-500'>{myWorkerProfile.category?.name}</p>
                        </div>
                    </div>
                    {[
                        { label: 'Hourly Rate',  value: `₹${myWorkerProfile.hourlyRate || '—'}/hr` },
                        { label: 'Daily Rate',   value: `₹${myWorkerProfile.dailyRate || '—'}/day` },
                        { label: 'Experience',   value: `${myWorkerProfile.experienceYears || 0} yrs` },
                        { label: 'KYC Status',   value: myWorkerProfile.kyc?.isVerified ? '✅ Verified' : '⏳ Pending' },
                    ].map((r, i) => (
                        <div key={i} className='flex items-center justify-between text-sm'>
                            <span className='text-gray-500'>{r.label}</span>
                            <span className='font-semibold text-gray-800'>{r.value}</span>
                        </div>
                    ))}
                    <button onClick={() => navigate('/worker-onboarding')}
                        className='mt-2 w-full flex items-center justify-center gap-2 py-2 border border-[#ff4d2d] text-[#ff4d2d] rounded-lg text-sm font-semibold hover:bg-[#fff0eb] transition-colors'>
                        Edit Profile <FaArrowRight size={11} />
                    </button>
                </div>

                {/* recent bookings */}
                <div className='md:col-span-2 bg-white rounded-xl border border-[#eee] p-5'>
                    <div className='flex items-center justify-between mb-4'>
                        <p className='font-bold text-gray-800'>Recent Booking Requests</p>
                        <button onClick={() => navigate('/worker-bookings')}
                            className='text-xs text-[#ff4d2d] font-semibold hover:underline flex items-center gap-1'>
                            View all <FaArrowRight size={9} />
                        </button>
                    </div>
                    {recent.length === 0 ? (
                        <div className='text-center py-10'>
                            <FaCalendarCheck size={28} className='text-gray-200 mx-auto mb-2' />
                            <p className='text-sm text-gray-400'>No bookings yet</p>
                            <p className='text-xs text-gray-300 mt-1'>Make yourself available to start receiving requests</p>
                        </div>
                    ) : (
                        <table className='w-full text-sm'>
                            <thead>
                                <tr className='text-left border-b border-[#f0f0f0] text-gray-400 text-xs'>
                                    <th className='pb-2 font-semibold'>Customer</th>
                                    <th className='pb-2 font-semibold hidden md:table-cell'>Type</th>
                                    <th className='pb-2 font-semibold'>Amount</th>
                                    <th className='pb-2 font-semibold'>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recent.map(b => (
                                    <tr key={b._id}
                                        onClick={() => navigate(`/bookings/${b._id}`)}
                                        className='border-b border-[#f7f7f7] hover:bg-[#fff9f6] cursor-pointer transition-colors'>
                                        <td className='py-2.5'>
                                            <p className='font-medium text-gray-800'>{b.customer?.fullName}</p>
                                            <p className='text-[10px] text-gray-400'>{new Date(b.createdAt).toLocaleDateString()}</p>
                                        </td>
                                        <td className='py-2.5 text-gray-500 hidden md:table-cell capitalize'>
                                            {b.bookingType}
                                        </td>
                                        <td className='py-2.5 font-semibold text-[#ff4d2d]'>₹{b.amount}</td>
                                        <td className='py-2.5'><BookingStatusBadge status={b.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* earnings chart */}
            {chartData.length > 1 && (
                <div className='bg-white rounded-xl border border-[#eee] p-5 mt-4'>
                    <p className='font-bold text-gray-800 mb-4 text-sm'>Recent Earnings (₹)</p>
                    <ResponsiveContainer width='100%' height={180}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
                            <XAxis dataKey='name' tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Bar dataKey='amount' fill={BRAND} radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </WorkerLayout>
    )
}
