import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { serverUrl } from '../../App'

const primaryColor = "#ff4d2d"

const STATUS_OPTIONS = ["PENDING_DEPOSIT", "ACTIVE", "PAYMENT_DUE", "SUSPENDED"]

function AdminWorkersPage() {
    const [workers, setWorkers] = useState([])
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("")
    const [page, setPage] = useState(1)
    const [err, setErr] = useState("")

    const [detail, setDetail] = useState(null) // { profile, wallet, bookingCounts }
    const [adjustAmount, setAdjustAmount] = useState("")
    const [adjustReason, setAdjustReason] = useState("")
    const [busy, setBusy] = useState(false)

    const fetchWorkers = async () => {
        try {
            const result = await axios.get(`${serverUrl}/api/admin/workers`, {
                withCredentials: true,
                params: { search, status: statusFilter, page, limit: 15 }
            })
            setWorkers(result.data.workers)
            setTotal(result.data.total)
        } catch (error) {
            setErr(error?.response?.data?.message || "could not load workers")
        }
    }

    useEffect(() => { fetchWorkers() }, [search, statusFilter, page])

    const openDetail = async (workerUserId) => {
        try {
            const result = await axios.get(`${serverUrl}/api/admin/workers/${workerUserId}`, { withCredentials: true })
            setDetail(result.data)
        } catch (error) {
            setErr(error?.response?.data?.message || "could not load worker detail")
        }
    }

    const verifyKyc = async (profileId, approve) => {
        setBusy(true)
        try {
            await axios.patch(`${serverUrl}/api/worker/admin/${profileId}/kyc`, { approve }, { withCredentials: true })
            await openDetail(detail.profile.user._id)
            fetchWorkers()
        } catch (error) {
            setErr(error?.response?.data?.message || "kyc update failed")
        } finally {
            setBusy(false)
        }
    }

    const setStatus = async (profileId, status) => {
        setBusy(true)
        try {
            await axios.patch(`${serverUrl}/api/worker/admin/${profileId}/status`, { status }, { withCredentials: true })
            await openDetail(detail.profile.user._id)
            fetchWorkers()
        } catch (error) {
            setErr(error?.response?.data?.message || "status update failed")
        } finally {
            setBusy(false)
        }
    }

    const toggleBlock = async (userId, isBlocked) => {
        setBusy(true)
        try {
            await axios.patch(`${serverUrl}/api/admin/users/${userId}/block`, { isBlocked }, { withCredentials: true })
            await openDetail(userId)
            fetchWorkers()
        } catch (error) {
            setErr(error?.response?.data?.message || "block update failed")
        } finally {
            setBusy(false)
        }
    }

    const submitAdjustment = async (direction) => {
        if (!adjustAmount) return
        setBusy(true)
        try {
            await axios.post(`${serverUrl}/api/admin/workers/${detail.profile.user._id}/wallet-adjust`, {
                amount: adjustAmount, direction, reason: adjustReason
            }, { withCredentials: true })
            setAdjustAmount(""); setAdjustReason("")
            await openDetail(detail.profile.user._id)
        } catch (error) {
            setErr(error?.response?.data?.message || "adjustment failed")
        } finally {
            setBusy(false)
        }
    }

    const totalPages = Math.max(1, Math.ceil(total / 15))

    return (
        <div>
            <h1 className='text-xl font-bold text-gray-800 mb-4'>Workers</h1>

            <div className='flex gap-2 mb-4'>
                <input
                    placeholder="Search name / email / mobile"
                    className='border rounded-lg px-3 py-2 text-sm flex-1' style={{ borderColor: "#ddd" }}
                    value={search} onChange={(e) => { setPage(1); setSearch(e.target.value) }}
                />
                <select className='border rounded-lg px-3 py-2 text-sm' style={{ borderColor: "#ddd" }} value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value) }}>
                    <option value="">All statuses</option>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            <div className='bg-white rounded-xl border border-[#eee] overflow-hidden'>
                <table className='w-full text-sm'>
                    <thead>
                        <tr className='text-left text-gray-400 border-b border-[#f0f0f0]'>
                            <th className='py-2 px-3'>Name</th>
                            <th className='py-2 px-3'>Category</th>
                            <th className='py-2 px-3'>Status</th>
                            <th className='py-2 px-3'>Rating</th>
                            <th className='py-2 px-3'>Jobs</th>
                        </tr>
                    </thead>
                    <tbody>
                        {workers.map(w => (
                            <tr key={w._id} onClick={() => openDetail(w.user?._id)} className='border-b border-[#f7f7f7] cursor-pointer hover:bg-gray-50'>
                                <td className='py-2 px-3 font-medium text-gray-700'>{w.user?.fullName}</td>
                                <td className='py-2 px-3 text-gray-500'>{w.category?.name}</td>
                                <td className='py-2 px-3'>{w.status}</td>
                                <td className='py-2 px-3'>{w.rating?.average?.toFixed(1) || "—"}</td>
                                <td className='py-2 px-3'>{w.completedJobs || 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {workers.length === 0 && <p className='text-center text-gray-400 py-6 text-sm'>No workers found.</p>}
            </div>

            <div className='flex justify-center gap-2 mt-4 text-sm'>
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className='px-3 py-1 border rounded disabled:opacity-40'>Prev</button>
                <span className='text-gray-500'>Page {page} of {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className='px-3 py-1 border rounded disabled:opacity-40'>Next</button>
            </div>

            {err && <p className='text-red-500 text-sm mt-3'>*{err}</p>}

            {detail && (
                <div className='fixed inset-0 bg-black/30 flex justify-end z-50' onClick={() => setDetail(null)}>
                    <div className='bg-white w-[420px] h-full overflow-y-auto p-6' onClick={(e) => e.stopPropagation()}>
                        <div className='flex justify-between items-center mb-4'>
                            <h2 className='text-lg font-bold text-gray-800'>{detail.profile.user?.fullName}</h2>
                            <button onClick={() => setDetail(null)} className='text-gray-400'>✕</button>
                        </div>
                        <p className='text-sm text-gray-500'>{detail.profile.user?.email} · {detail.profile.user?.mobile}</p>
                        <p className='text-sm text-gray-500 mb-3'>{detail.profile.category?.name} · {detail.profile.category?.group}</p>

                        <div className='bg-[#fff5f0] rounded-lg p-3 mb-4'>
                            <p className='text-xs text-gray-500 mb-1'>Current status: <strong>{detail.profile.status}</strong></p>
                            <div className='flex flex-wrap gap-1 mt-2'>
                                {STATUS_OPTIONS.map(s => (
                                    <button key={s} disabled={busy} onClick={() => setStatus(detail.profile._id, s)}
                                        className='text-xs px-2 py-1 rounded border'
                                        style={s === detail.profile.status ? { backgroundColor: primaryColor, color: "white", borderColor: primaryColor } : { borderColor: "#ddd", color: "#555" }}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className='mb-4'>
                            <p className='text-sm font-semibold text-gray-700 mb-1'>KYC</p>
                            <p className='text-xs text-gray-500 mb-2'>
                                {detail.profile.kyc?.isVerified ? "Verified ✓" : "Not verified"}
                                {detail.profile.kyc?.rejectionReason && ` — ${detail.profile.kyc.rejectionReason}`}
                            </p>
                            <div className='flex gap-2'>
                                <button disabled={busy} onClick={() => verifyKyc(detail.profile._id, true)} className='text-xs px-3 py-1.5 rounded text-white' style={{ backgroundColor: "#16a34a" }}>Approve</button>
                                <button disabled={busy} onClick={() => verifyKyc(detail.profile._id, false)} className='text-xs px-3 py-1.5 rounded text-white bg-red-600'>Reject</button>
                            </div>
                        </div>

                        {detail.wallet && (
                            <div className='mb-4 grid grid-cols-2 gap-2 text-sm'>
                                <div className='bg-gray-50 rounded p-2'><p className='text-xs text-gray-400'>Deposit</p>₹{detail.wallet.securityDepositBalance}</div>
                                <div className='bg-gray-50 rounded p-2'><p className='text-xs text-gray-400'>Pending commission</p>₹{detail.wallet.pendingCommission}</div>
                                <div className='bg-gray-50 rounded p-2'><p className='text-xs text-gray-400'>Withdrawable</p>₹{detail.wallet.withdrawableBalance}</div>
                                <div className='bg-gray-50 rounded p-2'><p className='text-xs text-gray-400'>Total earnings</p>₹{detail.wallet.totalEarnings}</div>
                            </div>
                        )}

                        <div className='mb-4'>
                            <p className='text-sm font-semibold text-gray-700 mb-2'>Manual wallet adjustment</p>
                            <div className='flex gap-2 mb-2'>
                                <input placeholder="Amount" type="number" className='border rounded px-2 py-1 text-sm flex-1' style={{ borderColor: "#ddd" }} value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} />
                            </div>
                            <input placeholder="Reason" className='border rounded px-2 py-1 text-sm w-full mb-2' style={{ borderColor: "#ddd" }} value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} />
                            <div className='flex gap-2'>
                                <button disabled={busy} onClick={() => submitAdjustment("credit")} className='flex-1 text-xs py-1.5 rounded text-white' style={{ backgroundColor: "#16a34a" }}>Credit</button>
                                <button disabled={busy} onClick={() => submitAdjustment("debit")} className='flex-1 text-xs py-1.5 rounded text-white bg-red-600'>Debit</button>
                            </div>
                        </div>

                        {detail.bookingCounts?.length > 0 && (
                            <div className='mb-4'>
                                <p className='text-sm font-semibold text-gray-700 mb-1'>Bookings by status</p>
                                {detail.bookingCounts.map(b => (
                                    <p key={b._id} className='text-xs text-gray-500'>{b._id}: {b.count}</p>
                                ))}
                            </div>
                        )}

                        <button
                            disabled={busy}
                            onClick={() => toggleBlock(detail.profile.user._id, !detail.profile.user.isBlocked)}
                            className='w-full text-sm py-2 rounded border border-gray-300 text-gray-600'
                        >
                            {detail.profile.user?.isBlocked ? "Unblock account" : "Block account"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminWorkersPage
