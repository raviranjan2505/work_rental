import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { serverUrl } from '../../App'

const primaryColor = "#ff4d2d"
const STATUS_OPTIONS = ["REQUESTED", "APPROVED", "REJECTED", "PAID"]

function AdminWithdrawalsPage() {
    const [withdrawals, setWithdrawals] = useState([])
    const [statusFilter, setStatusFilter] = useState("REQUESTED")
    const [err, setErr] = useState("")
    const [busyId, setBusyId] = useState(null)

    const fetchWithdrawals = async () => {
        try {
            const result = await axios.get(`${serverUrl}/api/wallet/admin/withdrawals`, {
                withCredentials: true, params: { status: statusFilter || undefined }
            })
            setWithdrawals(result.data)
        } catch (error) {
            setErr(error?.response?.data?.message || "could not load withdrawals")
        }
    }

    useEffect(() => { fetchWithdrawals() }, [statusFilter])

    const process = async (withdrawalId, action) => {
        setBusyId(withdrawalId)
        try {
            await axios.patch(`${serverUrl}/api/wallet/admin/withdrawals/${withdrawalId}`, { action }, { withCredentials: true })
            fetchWithdrawals()
        } catch (error) {
            setErr(error?.response?.data?.message || "action failed")
        } finally {
            setBusyId(null)
        }
    }

    return (
        <div>
            <h1 className='text-xl font-bold text-gray-800 mb-4'>Withdrawals</h1>

            <select className='border rounded-lg px-3 py-2 text-sm mb-4' style={{ borderColor: "#ddd" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <div className='bg-white rounded-xl border border-[#eee] overflow-hidden'>
                <table className='w-full text-sm'>
                    <thead>
                        <tr className='text-left text-gray-400 border-b border-[#f0f0f0]'>
                            <th className='py-2 px-3'>Worker</th>
                            <th className='py-2 px-3'>Amount</th>
                            <th className='py-2 px-3'>UPI / Bank</th>
                            <th className='py-2 px-3'>Status</th>
                            <th className='py-2 px-3'>Requested</th>
                            <th className='py-2 px-3'></th>
                        </tr>
                    </thead>
                    <tbody>
                        {withdrawals.map(w => (
                            <tr key={w._id} className='border-b border-[#f7f7f7]'>
                                <td className='py-2 px-3 font-medium text-gray-700'>{w.worker?.fullName}</td>
                                <td className='py-2 px-3'>₹{w.amount}</td>
                                <td className='py-2 px-3 text-gray-500'>{w.payoutDetails?.upiId || w.payoutDetails?.accountNumber || "—"}</td>
                                <td className='py-2 px-3'>{w.status}</td>
                                <td className='py-2 px-3 text-gray-400'>{new Date(w.createdAt).toLocaleDateString()}</td>
                                <td className='py-2 px-3'>
                                    <div className='flex gap-1'>
                                        {w.status === "REQUESTED" && (
                                            <>
                                                <button disabled={busyId === w._id} onClick={() => process(w._id, "approve")} className='text-xs px-2 py-1 rounded text-white' style={{ backgroundColor: primaryColor }}>Approve</button>
                                                <button disabled={busyId === w._id} onClick={() => process(w._id, "reject")} className='text-xs px-2 py-1 rounded border border-gray-300 text-gray-600'>Reject</button>
                                            </>
                                        )}
                                        {w.status === "APPROVED" && (
                                            <button disabled={busyId === w._id} onClick={() => process(w._id, "mark-paid")} className='text-xs px-2 py-1 rounded text-white bg-green-600'>Mark Paid</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {withdrawals.length === 0 && <p className='text-center text-gray-400 py-6 text-sm'>No withdrawal requests found.</p>}
            </div>

            {err && <p className='text-red-500 text-sm mt-3'>*{err}</p>}
        </div>
    )
}

export default AdminWithdrawalsPage
