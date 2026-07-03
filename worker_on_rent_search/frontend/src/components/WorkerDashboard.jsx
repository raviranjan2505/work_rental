import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { serverUrl } from '../App'
import useGetMyWorkerProfile from '../hooks/useGetMyWorkerProfile'
import { setMyWorkerProfile } from '../redux/workerSlice'

const STATUS_COPY = {
    PENDING_DEPOSIT: { label: "Pending deposit", color: "text-orange-600 bg-orange-50", note: "Pay your security deposit to start receiving bookings." },
    ACTIVE: { label: "Active", color: "text-green-700 bg-green-50", note: "You're visible to customers searching nearby." },
    PAYMENT_DUE: { label: "Payment due", color: "text-red-600 bg-red-50", note: "You have commission due. Clear it to stay visible." },
    SUSPENDED: { label: "Suspended", color: "text-red-700 bg-red-100", note: "Your profile is hidden until the due amount is cleared." }
}

function WorkerDashboard() {
    const { myWorkerProfile } = useSelector(state => state.worker)
    const dispatch = useDispatch()
    const navigate = useNavigate()
    useGetMyWorkerProfile()

    const toggleAvailability = async () => {
        try {
            const result = await axios.patch(
                `${serverUrl}/api/worker/availability`,
                { isAvailable: !myWorkerProfile.isAvailable },
                { withCredentials: true }
            )
            dispatch(setMyWorkerProfile(result.data))
        } catch (error) {
            console.log(error)
        }
    }

    if (!myWorkerProfile) {
        return (
            <div className='w-full max-w-lg px-4 text-center mt-10'>
                <h2 className='text-xl font-semibold text-gray-800 mb-2'>Set up your worker profile</h2>
                <p className='text-gray-500 mb-6'>Add your category, rates, and KYC documents so customers can find and book you.</p>
                <button
                    onClick={() => navigate('/worker-onboarding')}
                    className='bg-[#ff4d2d] text-white font-semibold px-6 py-2 rounded-lg hover:bg-[#e64323] transition-colors'
                >
                    Complete profile
                </button>
            </div>
        )
    }

    const statusInfo = STATUS_COPY[myWorkerProfile.status] || STATUS_COPY.PENDING_DEPOSIT

    return (
        <div className='w-full max-w-lg px-4'>
            <div className='bg-white rounded-xl border border-[#eee] shadow-sm p-5'>
                <div className='flex items-center justify-between'>
                    <div>
                        <p className='font-semibold text-gray-800'>{myWorkerProfile.category?.name}</p>
                        <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded ${statusInfo.color}`}>
                            {statusInfo.label}
                        </span>
                    </div>
                    <button
                        onClick={() => navigate('/worker-onboarding')}
                        className='text-sm text-[#ff4d2d] font-medium'
                    >
                        Edit profile
                    </button>
                </div>
                <p className='text-sm text-gray-500 mt-3'>{statusInfo.note}</p>

                {(myWorkerProfile.status === "PENDING_DEPOSIT") && (
                    <button
                        onClick={() => navigate('/deposit')}
                        className='w-full mt-3 font-semibold py-2 rounded-lg text-white'
                        style={{ backgroundColor: "#ff4d2d" }}
                    >
                        Pay security deposit
                    </button>
                )}
                {["PAYMENT_DUE", "SUSPENDED"].includes(myWorkerProfile.status) && (
                    <button
                        onClick={() => navigate('/wallet')}
                        className='w-full mt-3 font-semibold py-2 rounded-lg text-white bg-red-600'
                    >
                        Clear pending commission
                    </button>
                )}

                <div className='flex items-center justify-between mt-5 pt-4 border-t border-[#f0f0f0]'>
                    <span className='text-sm font-medium text-gray-700'>Available for bookings</span>
                    <button
                        onClick={toggleAvailability}
                        className={`w-12 h-7 rounded-full relative transition-colors ${myWorkerProfile.isAvailable ? "bg-[#ff4d2d]" : "bg-gray-300"}`}
                    >
                        <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${myWorkerProfile.isAvailable ? "translate-x-5" : ""}`} />
                    </button>
                </div>

                <button
                    onClick={() => navigate('/worker-bookings')}
                    className='w-full mt-4 text-sm font-medium py-2 rounded-lg border border-[#ff4d2d] text-[#ff4d2d]'
                >
                    View booking requests
                </button>
                <button
                    onClick={() => navigate('/wallet')}
                    className='w-full mt-2 text-sm font-medium py-2 rounded-lg border border-gray-300 text-gray-600'
                >
                    View wallet
                </button>
            </div>

            <p className='text-xs text-gray-400 text-center mt-4'>
                Reviews/ratings and the admin analytics dashboard are coming in later phases of this build.
            </p>
        </div>
    )
}

export default WorkerDashboard
