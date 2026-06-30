import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { serverUrl } from '../../App'

function AdminCustomersPage() {
    const [customers, setCustomers] = useState([])
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [err, setErr] = useState("")
    const [busyId, setBusyId] = useState(null)

    const fetchCustomers = async () => {
        try {
            const result = await axios.get(`${serverUrl}/api/admin/customers`, {
                withCredentials: true, params: { search, page, limit: 15 }
            })
            setCustomers(result.data.customers)
            setTotal(result.data.total)
        } catch (error) {
            setErr(error?.response?.data?.message || "could not load customers")
        }
    }

    useEffect(() => { fetchCustomers() }, [search, page])

    const toggleBlock = async (userId, isBlocked) => {
        setBusyId(userId)
        try {
            await axios.patch(`${serverUrl}/api/admin/users/${userId}/block`, { isBlocked }, { withCredentials: true })
            fetchCustomers()
        } catch (error) {
            setErr(error?.response?.data?.message || "block update failed")
        } finally {
            setBusyId(null)
        }
    }

    const totalPages = Math.max(1, Math.ceil(total / 15))

    return (
        <div>
            <h1 className='text-xl font-bold text-gray-800 mb-4'>Customers</h1>

            <input
                placeholder="Search name / email / mobile"
                className='border rounded-lg px-3 py-2 text-sm mb-4 w-full max-w-sm' style={{ borderColor: "#ddd" }}
                value={search} onChange={(e) => { setPage(1); setSearch(e.target.value) }}
            />

            <div className='bg-white rounded-xl border border-[#eee] overflow-hidden'>
                <table className='w-full text-sm'>
                    <thead>
                        <tr className='text-left text-gray-400 border-b border-[#f0f0f0]'>
                            <th className='py-2 px-3'>Name</th>
                            <th className='py-2 px-3'>Email</th>
                            <th className='py-2 px-3'>Mobile</th>
                            <th className='py-2 px-3'>Joined</th>
                            <th className='py-2 px-3'>Status</th>
                            <th className='py-2 px-3'></th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map(c => (
                            <tr key={c._id} className='border-b border-[#f7f7f7]'>
                                <td className='py-2 px-3 font-medium text-gray-700'>{c.fullName}</td>
                                <td className='py-2 px-3 text-gray-500'>{c.email}</td>
                                <td className='py-2 px-3 text-gray-500'>{c.mobile}</td>
                                <td className='py-2 px-3 text-gray-500'>{new Date(c.createdAt).toLocaleDateString()}</td>
                                <td className='py-2 px-3'>{c.isBlocked ? <span className='text-red-500'>Blocked</span> : <span className='text-green-600'>Active</span>}</td>
                                <td className='py-2 px-3'>
                                    <button
                                        disabled={busyId === c._id}
                                        onClick={() => toggleBlock(c._id, !c.isBlocked)}
                                        className='text-xs px-2 py-1 rounded border border-gray-300 text-gray-600'
                                    >
                                        {c.isBlocked ? "Unblock" : "Block"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {customers.length === 0 && <p className='text-center text-gray-400 py-6 text-sm'>No customers found.</p>}
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

export default AdminCustomersPage
