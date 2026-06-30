import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { serverUrl } from '../../App'

const primaryColor = "#ff4d2d"

const StatCard = ({ label, value, sub }) => (
    <div className='bg-white rounded-xl border border-[#eee] p-4'>
        <p className='text-xs text-gray-400'>{label}</p>
        <p className='text-2xl font-bold text-gray-800 mt-1'>{value}</p>
        {sub && <p className='text-xs text-gray-400 mt-1'>{sub}</p>}
    </div>
)

const ChartCard = ({ title, children }) => (
    <div className='bg-white rounded-xl border border-[#eee] p-4'>
        <p className='font-semibold text-gray-700 mb-3 text-sm'>{title}</p>
        <ResponsiveContainer width="100%" height={220}>
            {children}
        </ResponsiveContainer>
    </div>
)

function AdminDashboardPage() {
    const [data, setData] = useState(null)
    const [err, setErr] = useState("")

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/admin/dashboard`, { withCredentials: true })
                setData(result.data)
            } catch (error) {
                setErr(error?.response?.data?.message || "could not load dashboard")
            }
        }
        fetchStats()
    }, [])

    if (err) return <p className='text-red-500'>{err}</p>
    if (!data) return <p className='text-gray-400'>Loading…</p>

    const { totals, categoryPerformance, charts } = data

    return (
        <div>
            <h1 className='text-xl font-bold text-gray-800 mb-5'>Dashboard</h1>

            <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mb-6'>
                <StatCard label="Customers" value={totals.totalCustomers} />
                <StatCard label="Workers" value={totals.totalWorkers} sub={`${totals.activeWorkers} active`} />
                <StatCard label="Suspended workers" value={totals.suspendedWorkers} sub={`${totals.paymentDueWorkers} payment due`} />
                <StatCard label="Total bookings" value={totals.totalBookings} sub={`${totals.completedBookings} completed`} />
                <StatCard label="Gross booking value" value={`₹${totals.totalBookingValue}`} sub="completed bookings" />
                <StatCard label="Commission revenue" value={`₹${totals.commissionRevenue}`} sub="platform earnings" />
                <StatCard label="Deposits collected" value={`₹${totals.depositsCollected}`} />
                <StatCard label="Withdrawals paid" value={`₹${totals.totalWithdrawals}`} sub={`${totals.pendingWithdrawalsCount} pending requests`} />
            </div>

            <div className='grid md:grid-cols-2 gap-4 mb-6'>
                <ChartCard title="Daily commission revenue (last 14 days)">
                    <LineChart data={charts.dailyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="revenue" stroke={primaryColor} strokeWidth={2} dot={false} />
                    </LineChart>
                </ChartCard>

                <ChartCard title="Monthly commission revenue (last 6 months)">
                    <BarChart data={charts.monthlyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="revenue" fill={primaryColor} radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ChartCard>

                <ChartCard title="Booking trends (last 14 days)">
                    <LineChart data={charts.bookingTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="bookings" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                </ChartCard>

                <ChartCard title="Worker growth (new signups/month)">
                    <BarChart data={charts.workerGrowth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="newWorkers" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ChartCard>
            </div>

            <div className='bg-white rounded-xl border border-[#eee] p-4'>
                <p className='font-semibold text-gray-700 mb-3 text-sm'>Category performance (completed bookings)</p>
                {categoryPerformance.length === 0 && <p className='text-sm text-gray-400'>No completed bookings yet.</p>}
                <table className='w-full text-sm'>
                    <thead>
                        <tr className='text-left text-gray-400 border-b border-[#f0f0f0]'>
                            <th className='py-2'>Category</th>
                            <th className='py-2'>Group</th>
                            <th className='py-2'>Bookings</th>
                            <th className='py-2'>Revenue</th>
                            <th className='py-2'>Commission</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categoryPerformance.map((c, i) => (
                            <tr key={i} className='border-b border-[#f7f7f7]'>
                                <td className='py-2 font-medium text-gray-700'>{c.name}</td>
                                <td className='py-2 text-gray-500'>{c.group}</td>
                                <td className='py-2'>{c.bookings}</td>
                                <td className='py-2'>₹{c.revenue}</td>
                                <td className='py-2' style={{ color: primaryColor }}>₹{c.commission}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default AdminDashboardPage
