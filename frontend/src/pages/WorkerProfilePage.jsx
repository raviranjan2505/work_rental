import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import { FaStar } from "react-icons/fa"
import { serverUrl } from '../App'

function WorkerProfilePage() {
    const { workerId } = useParams()
    const navigate = useNavigate()
    const [profile, setProfile] = useState(null)
    const [reviews, setReviews] = useState([])
    const [err, setErr] = useState("")

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/worker/${workerId}`, { withCredentials: true })
                setProfile(result.data)
            } catch (error) {
                setErr(error?.response?.data?.message || "could not load worker")
            }
        }
        const fetchReviews = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/review/worker/${workerId}`, { withCredentials: true })
                setReviews(result.data)
            } catch (error) {
                console.log(error)
            }
        }
        fetchProfile()
        fetchReviews()
    }, [workerId])

    if (err) {
        return <div className='pt-[120px] text-center text-gray-500'>{err}</div>
    }
    if (!profile) {
        return <div className='pt-[120px] text-center text-gray-400'>Loading…</div>
    }

    return (
        <div className='w-full min-h-[100vh] pt-[100px] pb-10 flex justify-center bg-[#fff9f6]'>
            <div className='w-full max-w-2xl px-4'>
                <div className='bg-white rounded-xl border border-[#eee] shadow-sm p-6 flex gap-5'>
                    <img
                        src={profile.profileImage || "/vite.svg"}
                        alt={profile.user?.fullName}
                        className='w-24 h-24 rounded-full object-cover border-2 border-[#ff4d2d]'
                    />
                    <div className='flex-1'>
                        <div className='flex items-center gap-2'>
                            <h1 className='text-xl font-bold text-gray-800'>{profile.user?.fullName}</h1>
                            {profile.kyc?.isVerified && (
                                <span className='text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded font-medium'>Verified</span>
                            )}
                        </div>
                        <p className='text-gray-500'>{profile.category?.name} · {profile.category?.group}</p>
                        <div className='flex items-center gap-1 mt-2 text-sm text-gray-700'>
                            <FaStar className='text-yellow-500' />
                            <span>{profile.rating?.average?.toFixed(1) || "New"}</span>
                            {profile.rating?.count > 0 && <span className='text-gray-400'>({profile.rating.count} reviews)</span>}
                            <span className='text-gray-400 mx-1'>·</span>
                            <span>{profile.completedJobs || 0} jobs completed</span>
                        </div>
                        <p className='text-sm text-gray-600 mt-1'>{profile.experienceYears || 0} years experience</p>
                    </div>
                </div>

                {profile.skills?.length > 0 && (
                    <div className='mt-4 flex flex-wrap gap-2'>
                        {profile.skills.map((s, i) => (
                            <span key={i} className='text-xs bg-white border border-[#eee] px-3 py-1 rounded-full text-gray-600'>{s}</span>
                        ))}
                    </div>
                )}

                <div className='mt-6 grid grid-cols-2 gap-4'>
                    <div className='bg-white rounded-xl border border-[#eee] p-4 text-center'>
                        <p className='text-2xl font-bold text-[#ff4d2d]'>₹{profile.hourlyRate}</p>
                        <p className='text-xs text-gray-500'>per hour</p>
                    </div>
                    <div className='bg-white rounded-xl border border-[#eee] p-4 text-center'>
                        <p className='text-2xl font-bold text-[#ff4d2d]'>₹{profile.dailyRate}</p>
                        <p className='text-xs text-gray-500'>per day</p>
                    </div>
                </div>

                <button
                    onClick={() => navigate(`/book/${workerId}`)}
                    className='w-full mt-6 font-semibold py-3 rounded-lg bg-[#ff4d2d] text-white hover:bg-[#e64323] transition-colors'
                >
                    Book this worker
                </button>

                <div className='mt-8'>
                    <h2 className='font-semibold text-gray-800 mb-3'>Reviews {reviews.length > 0 && `(${reviews.length})`}</h2>
                    {reviews.length === 0 && <p className='text-sm text-gray-400'>No reviews yet.</p>}
                    <div className='flex flex-col gap-3'>
                        {reviews.map(r => (
                            <div key={r._id} className='bg-white rounded-xl border border-[#eee] p-4'>
                                <div className='flex items-center justify-between'>
                                    <p className='font-medium text-gray-700 text-sm'>{r.customer?.fullName || "Customer"}</p>
                                    <span className='text-yellow-500 text-sm'>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                                </div>
                                {r.comment && <p className='text-sm text-gray-500 mt-1'>{r.comment}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default WorkerProfilePage
