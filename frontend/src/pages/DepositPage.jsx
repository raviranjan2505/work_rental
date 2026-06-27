import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { ClipLoader } from 'react-spinners'
import { serverUrl } from '../App'
import { openRazorpayCheckout } from '../utils/razorpayCheckout'
import { setMyWorkerProfile } from '../redux/workerSlice'

const primaryColor = "#ff4d2d"

function DepositPage() {
    const { userData } = useSelector(state => state.user)
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [config, setConfig] = useState(null)
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState("")

    const fetchConfig = async () => {
        try {
            const result = await axios.get(`${serverUrl}/api/deposit/config`, { withCredentials: true })
            setConfig(result.data)
        } catch (error) {
            setErr(error?.response?.data?.message || "could not load deposit info")
        }
    }

    useEffect(() => { fetchConfig() }, [])

    const remaining = config ? Math.max(0, config.requiredAmount - config.currentBalance) : 0

    const handlePay = async () => {
        setErr("")
        setLoading(true)
        try {
            const orderRes = await axios.post(`${serverUrl}/api/deposit/create-order`, {}, { withCredentials: true })
            const { order, depositId } = orderRes.data

            await openRazorpayCheckout({
                order,
                name: "Men On Rent - Security Deposit",
                description: "One-time refundable security deposit",
                prefill: { name: userData.fullName, email: userData.email, contact: userData.mobile },
                onSuccess: async (response) => {
                    try {
                        await axios.post(`${serverUrl}/api/deposit/verify`, {
                            depositId,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature
                        }, { withCredentials: true })
                        const profileRes = await axios.get(`${serverUrl}/api/worker/profile/me`, { withCredentials: true })
                        dispatch(setMyWorkerProfile(profileRes.data))
                        navigate('/')
                    } catch (error) {
                        setErr(error?.response?.data?.message || "payment verification failed")
                    } finally {
                        setLoading(false)
                    }
                },
                onDismiss: () => setLoading(false)
            })
        } catch (error) {
            setErr(error?.response?.data?.message || "could not start payment")
            setLoading(false)
        }
    }

    if (!config) {
        return <div className='pt-[120px] text-center text-gray-400'>Loading…</div>
    }

    return (
        <div className='w-full min-h-[100vh] pt-[100px] flex justify-center bg-[#fff9f6]'>
            <div className='bg-white rounded-xl shadow-lg w-full max-w-md p-8 border border-[#eee] text-center'>
                <h1 className='text-2xl font-bold mb-2' style={{ color: primaryColor }}>Security Deposit</h1>
                <p className='text-gray-500 mb-6 text-sm'>
                    A one-time refundable deposit keeps your profile active and lets us auto-settle commission on cash jobs without chasing you for it.
                </p>

                <div className='bg-[#fff5f0] rounded-lg p-4 mb-6'>
                    <div className='flex justify-between text-sm text-gray-600 mb-1'>
                        <span>Required</span><span>₹{config.requiredAmount}</span>
                    </div>
                    <div className='flex justify-between text-sm text-gray-600 mb-1'>
                        <span>Already paid</span><span>₹{config.currentBalance}</span>
                    </div>
                    <div className='flex justify-between font-bold mt-2 pt-2 border-t border-[#ffe0d5]' style={{ color: primaryColor }}>
                        <span>Amount due</span><span>₹{remaining}</span>
                    </div>
                </div>

                {remaining <= 0 ? (
                    <p className='text-green-600 font-medium'>Your deposit is fully paid ✓</p>
                ) : (
                    <button
                        onClick={handlePay}
                        disabled={loading}
                        className='w-full font-semibold py-3 rounded-lg text-white'
                        style={{ backgroundColor: primaryColor }}
                    >
                        {loading ? <ClipLoader size={20} color='white' /> : `Pay ₹${remaining}`}
                    </button>
                )}
                {err && <p className='text-red-500 text-sm mt-3'>*{err}</p>}
            </div>
        </div>
    )
}

export default DepositPage
