import React, { useState } from 'react'
import axios from 'axios'
import { FaStar } from "react-icons/fa"
import { ClipLoader } from 'react-spinners'
import { serverUrl } from '../App'

const primaryColor = "#ff4d2d"

function ReviewForm({ bookingId, onSubmitted }) {
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [comment, setComment] = useState("")
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState("")

    const submit = async () => {
        if (!rating) return setErr("please select a star rating")
        setErr("")
        setLoading(true)
        try {
            const result = await axios.post(`${serverUrl}/api/review`, { bookingId, rating, comment }, { withCredentials: true })
            onSubmitted(result.data)
        } catch (error) {
            setErr(error?.response?.data?.message || "could not submit review")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='bg-white rounded-xl border border-[#eee] p-5'>
            <p className='font-semibold text-gray-800 mb-3'>Rate your experience</p>
            <div className='flex gap-1 mb-3'>
                {[1, 2, 3, 4, 5].map(n => (
                    <FaStar
                        key={n}
                        size={26}
                        className='cursor-pointer'
                        color={(hoverRating || rating) >= n ? "#facc15" : "#e5e7eb"}
                        onMouseEnter={() => setHoverRating(n)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(n)}
                    />
                ))}
            </div>
            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share a few words about the job (optional)"
                rows={2}
                className='w-full border rounded-lg px-3 py-2 text-sm mb-3'
                style={{ borderColor: "#ddd" }}
            />
            <button onClick={submit} disabled={loading} className='w-full font-semibold py-2 rounded-lg text-white' style={{ backgroundColor: primaryColor }}>
                {loading ? <ClipLoader size={18} color='white' /> : "Submit review"}
            </button>
            {err && <p className='text-red-500 text-sm mt-2'>*{err}</p>}
        </div>
    )
}

export default ReviewForm
