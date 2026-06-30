import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { serverUrl } from '../../App'

function AdminReviewsPage() {
    const [reviews, setReviews] = useState([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [err, setErr] = useState("")
    const [busyId, setBusyId] = useState(null)

    const fetchReviews = async () => {
        try {
            const result = await axios.get(`${serverUrl}/api/admin/reviews`, {
                withCredentials: true, params: { page, limit: 15 }
            })
            setReviews(result.data.reviews)
            setTotal(result.data.total)
        } catch (error) {
            setErr(error?.response?.data?.message || "could not load reviews")
        }
    }

    useEffect(() => { fetchReviews() }, [page])

    const remove = async (reviewId) => {
        if (!window.confirm("Delete this review? The worker's rating average will be recalculated.")) return
        setBusyId(reviewId)
        try {
            await axios.delete(`${serverUrl}/api/admin/reviews/${reviewId}`, { withCredentials: true })
            fetchReviews()
        } catch (error) {
            setErr(error?.response?.data?.message || "could not delete review")
        } finally {
            setBusyId(null)
        }
    }

    const totalPages = Math.max(1, Math.ceil(total / 15))

    return (
        <div>
            <h1 className='text-xl font-bold text-gray-800 mb-4'>Reviews</h1>

            <div className='flex flex-col gap-3'>
                {reviews.map(r => (
                    <div key={r._id} className='bg-white rounded-xl border border-[#eee] p-4'>
                        <div className='flex items-center justify-between mb-1'>
                            <p className='font-medium text-gray-700 text-sm'>
                                {r.customer?.fullName} → {r.worker?.fullName}
                            </p>
                            <span className='text-yellow-500 text-sm'>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                        </div>
                        {r.comment && <p className='text-sm text-gray-500 mb-2'>{r.comment}</p>}
                        <div className='flex items-center justify-between'>
                            <span className='text-xs text-gray-400'>{new Date(r.createdAt).toLocaleDateString()}</span>
                            <button
                                disabled={busyId === r._id}
                                onClick={() => remove(r._id)}
                                className='text-xs text-red-500 font-medium'
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
                {reviews.length === 0 && <p className='text-center text-gray-400 py-6 text-sm'>No reviews found.</p>}
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

export default AdminReviewsPage
