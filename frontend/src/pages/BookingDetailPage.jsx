import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { ClipLoader } from 'react-spinners'
import { FaComment } from "react-icons/fa"
import { serverUrl } from '../App'
import WorkerLayout from '../worker/WorkerLayout'
import { setActiveBooking } from '../redux/bookingSlice'
import BookingStatusBadge from '../components/BookingStatusBadge'
import LiveTrackingMap from '../components/LiveTrackingMap'
import ReviewForm from '../components/ReviewForm'
import useBookingSocketEvents from '../hooks/useBookingSocketEvents'
import useGetWallet from '../hooks/useGetWallet'
import { openRazorpayCheckout } from '../utils/razorpayCheckout'

const primaryColor = "#ff4d2d"

function BookingDetailPage() {
    const { bookingId } = useParams()
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)
    const { activeBooking, liveWorkerLocation } = useSelector(state => state.booking)
    const refreshWallet = useGetWallet()
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState("")
    const [otpInput, setOtpInput] = useState("")
    const [showOfflineConfirm, setShowOfflineConfirm] = useState(false)
    const [existingReview, setExistingReview] = useState(null)
    const [reviewChecked, setReviewChecked] = useState(false)

    useBookingSocketEvents()

    const fetchBooking = async () => {
        try {
            const result = await axios.get(`${serverUrl}/api/booking/${bookingId}`, { withCredentials: true })
            dispatch(setActiveBooking(result.data))
        } catch (error) {
            setErr(error?.response?.data?.message || "could not load booking")
        }
    }

    useEffect(() => {
        fetchBooking()
        return () => dispatch(setActiveBooking(null))
    }, [bookingId])

    useEffect(() => {
        if (!activeBooking || userData?.role !== "customer" || !["COMPLETED", "PAYMENT_RECEIVED"].includes(activeBooking.status)) return
        const checkReview = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/review/my`, { withCredentials: true })
                const found = result.data.find(r => r.booking === bookingId || r.booking?._id === bookingId)
                setExistingReview(found || null)
            } catch (error) {
                console.log(error)
            } finally {
                setReviewChecked(true)
            }
        }
        checkReview()
    }, [activeBooking?.status])

    const isWorker = userData?.role === "worker"
    const booking = activeBooking

    const callAction = async (path, body, method = "patch") => {
        setLoading(true)
        setErr("")
        try {
            const result = await axios[method](`${serverUrl}/api/booking/${bookingId}/${path}`, body, { withCredentials: true })
            dispatch(setActiveBooking(result.data))
            if (path === 'receive-offline-payment' || path === 'payment/verify') {
                await refreshWallet()
            }
            setOtpInput("")
            setShowOfflineConfirm(false)
        } catch (error) {
            setErr(error?.response?.data?.message || "action failed")
        } finally {
            setLoading(false)
        }
    }

    const handlePayOnline = async () => {
        setErr("")
        setLoading(true)
        try {
            const orderRes = await axios.post(`${serverUrl}/api/booking/${bookingId}/payment/create-order`, {}, { withCredentials: true })
            const { order } = orderRes.data
            await openRazorpayCheckout({
                order,
                name: "Men On Rent",
                description: booking.category?.name,
                prefill: { name: userData.fullName, email: userData.email, contact: userData.mobile },
                onSuccess: async (response) => {
                    try {
                        const result = await axios.post(`${serverUrl}/api/booking/${bookingId}/payment/verify`, {
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature
                        }, { withCredentials: true })
                        dispatch(setActiveBooking(result.data))
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

    if (err && !booking) {
        return isWorker
            ? <WorkerLayout><div className='text-center text-gray-500'>{err}</div></WorkerLayout>
            : <div className='pt-[120px] text-center text-gray-500'>{err}</div>
    }
    if (!booking) {
        return isWorker
            ? <WorkerLayout><div className='text-center text-gray-400'>Loading…</div></WorkerLayout>
            : <div className='pt-[120px] text-center text-gray-400'>Loading…</div>
    }

    const otherParty = isWorker ? booking.customer : booking.worker

    const content = (
        <div className={isWorker ? 'w-full' : 'w-full min-h-[100vh] pt-[100px] pb-10 flex justify-center bg-[#fff9f6]'}>
            <div className={isWorker ? 'w-full' : 'w-full max-w-lg px-4'}>
                <div className='bg-white rounded-xl border border-[#eee] shadow-sm p-5 mb-4'>
                    <div className='flex items-center justify-between mb-1'>
                        <h1 className='text-lg font-bold text-gray-800'>{booking.category?.name}</h1>
                        <div className='flex items-center gap-2'>
                            <BookingStatusBadge status={booking.status} />
                            {booking.worker && !["PENDING", "REJECTED", "CANCELLED"].includes(booking.status) && (
                                <button onClick={() => navigate(`/chat/${bookingId}`)} className='p-1.5 rounded-full bg-[#fff5f0] text-[#ff4d2d]'>
                                    <FaComment size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                    <p className='text-sm text-gray-500'>
                        {isWorker ? "Customer" : "Worker"}: {otherParty?.fullName || "—"} {otherParty?.mobile ? `· ${otherParty.mobile}` : ""}
                    </p>
                    {booking.bookingType === "task" ? (
                        <>
                            <p className='text-sm text-gray-700 mt-1 font-medium'>{booking.taskDetails?.itemDetails}</p>
                            {booking.taskDetails?.budget > 0 && (
                                <p className='text-sm text-gray-500'>Item budget: ₹{booking.taskDetails.budget} (reimbursed directly to worker)</p>
                            )}
                            <p className='text-sm text-gray-500 mt-1'>📍 Pickup: {booking.taskDetails?.pickupAddress?.text}</p>
                            <p className='text-sm text-gray-500'>🏠 Delivery: {booking.taskDetails?.deliveryAddress?.text}</p>
                        </>
                    ) : (
                        <>
                            <p className='text-sm text-gray-500 mt-1'>{booking.address?.text}</p>
                            <p className='text-sm text-gray-500'>
                                {new Date(booking.schedule?.date).toLocaleDateString()} {booking.schedule?.startTime && `· ${booking.schedule.startTime}`}
                                {" · "}{booking.bookingType === "hourly" ? `${booking.schedule?.durationHours || 1} hr(s)` : `${booking.schedule?.durationDays || 1} day(s)`}
                            </p>
                        </>
                    )}
                    <div className='flex items-center justify-between mt-3 pt-3 border-t border-[#f0f0f0]'>
                        <span className='text-sm text-gray-600'>
                            {booking.bookingType === "task" ? "Service fee" : "Amount"} ({booking.paymentMethod === "online" ? "online" : "pay on completion"})
                        </span>
                        <span className='font-bold' style={{ color: primaryColor }}>₹{booking.amount}</span>
                    </div>
                </div>

                {["ON_THE_WAY", "ARRIVED", "WORK_STARTED"].includes(booking.status) && (
                    <div className='mb-4'>
                        <LiveTrackingMap
                            workerLocation={liveWorkerLocation}
                            destination={
                                booking.bookingType === "task"
                                    ? (booking.status === "WORK_STARTED" ? booking.taskDetails?.deliveryAddress : booking.taskDetails?.pickupAddress)
                                    : (booking.address?.latitude ? { latitude: booking.address.latitude, longitude: booking.address.longitude } : null)
                            }
                        />
                    </div>
                )}

                {/* Customer sees whichever OTP is currently live */}
                {!isWorker && booking.status === "ARRIVED" && (
                    <div className='bg-white rounded-xl border border-[#eee] p-5 mb-4 text-center'>
                        <p className='text-sm text-gray-500 mb-1'>
                            {booking.bookingType === "task" ? "Give this OTP to your worker once they're at the pickup point" : "Give this OTP to your worker to start the job"}
                        </p>
                        <p className='text-3xl font-bold tracking-widest' style={{ color: primaryColor }}>{booking.startOtp}</p>
                    </div>
                )}
                {!isWorker && booking.status === "WORK_STARTED" && (
                    <div className='bg-white rounded-xl border border-[#eee] p-5 mb-4 text-center'>
                        <p className='text-sm text-gray-500 mb-1'>
                            {booking.bookingType === "task" ? "Give this OTP to your worker once your delivery arrives" : "Give this OTP to your worker once the job is done"}
                        </p>
                        <p className='text-3xl font-bold tracking-widest' style={{ color: primaryColor }}>{booking.completionOtp}</p>
                    </div>
                )}

                {/* Worker actions */}
                {isWorker && (
                    <div className='bg-white rounded-xl border border-[#eee] p-5 mb-4 flex flex-col gap-3'>
                        {booking.status === "PENDING" && (
                            <div className='flex gap-3'>
                                <button onClick={() => callAction("accept", {})} disabled={loading} className='flex-1 font-semibold py-2 rounded-lg text-white' style={{ backgroundColor: primaryColor }}>Accept</button>
                                <button onClick={() => callAction("reject", {})} disabled={loading} className='flex-1 font-semibold py-2 rounded-lg border border-gray-300 text-gray-600'>Reject</button>
                            </div>
                        )}
                        {booking.status === "ACCEPTED" && (
                            <button onClick={() => callAction("start-journey", {})} disabled={loading} className='font-semibold py-2 rounded-lg text-white' style={{ backgroundColor: primaryColor }}>
                                {booking.bookingType === "task" ? "Head to pickup point" : "Start journey"}
                            </button>
                        )}
                        {booking.status === "ON_THE_WAY" && (
                            <button onClick={() => callAction("arrived", {})} disabled={loading} className='font-semibold py-2 rounded-lg text-white' style={{ backgroundColor: primaryColor }}>
                                {booking.bookingType === "task" ? "I'm at the pickup point" : "I've arrived"}
                            </button>
                        )}
                        {booking.status === "ARRIVED" && (
                            <div>
                                <label className='block text-sm text-gray-600 mb-1'>
                                    {booking.bookingType === "task" ? "Enter the OTP the customer gave you to confirm pickup" : "Enter the OTP the customer gave you to start work"}
                                </label>
                                <div className='flex gap-2'>
                                    <input value={otpInput} onChange={(e) => setOtpInput(e.target.value)} maxLength={4} className='flex-1 border rounded-lg px-3 py-2 text-center tracking-widest' placeholder="0000" />
                                    <button onClick={() => callAction("verify-start-otp", { otp: otpInput }, "post")} disabled={loading || otpInput.length !== 4} className='px-4 rounded-lg text-white font-semibold' style={{ backgroundColor: primaryColor }}>Verify</button>
                                </div>
                            </div>
                        )}
                        {booking.status === "WORK_STARTED" && (
                            <div>
                                <label className='block text-sm text-gray-600 mb-1'>
                                    {booking.bookingType === "task" ? "Enter the OTP the customer gave you to confirm delivery" : "Enter the OTP the customer gave you to mark the job complete"}
                                </label>
                                <div className='flex gap-2'>
                                    <input value={otpInput} onChange={(e) => setOtpInput(e.target.value)} maxLength={4} className='flex-1 border rounded-lg px-3 py-2 text-center tracking-widest' placeholder="0000" />
                                    <button onClick={() => callAction("verify-completion-otp", { otp: otpInput }, "post")} disabled={loading || otpInput.length !== 4} className='px-4 rounded-lg text-white font-semibold' style={{ backgroundColor: primaryColor }}>Verify</button>
                                </div>
                            </div>
                        )}
                        {loading && <div className='text-center'><ClipLoader size={20} color={primaryColor} /></div>}
                    </div>
                )}

                {/* Worker: post-completion payment actions (no OTP - Work Completed / Receive Offline Payment / Receive Online Payment) */}
                {isWorker && ["COMPLETED", "PAYMENT_RECEIVED"].includes(booking.status) && (
                    <div className='bg-white rounded-xl border border-[#eee] p-5 mb-4'>
                        <p className='font-semibold text-gray-800 mb-3'>Payment</p>
                        <div className='flex flex-col gap-2'>
                            <button disabled className='w-full font-semibold py-2 rounded-lg border border-green-200 bg-green-50 text-green-700 cursor-default'>
                                ✓ Work Completed
                            </button>

                            {booking.paymentStatus === "PAID" ? (
                                <div className='w-full text-center font-semibold py-2 rounded-lg border border-green-200 bg-green-50 text-green-700'>
                                    ✓ Payment Received {booking.paymentMethod === "offline" ? "(Cash)" : "(Online)"}
                                </div>
                            ) : (
                                <>
                                    {booking.paymentMethod === "offline" && !showOfflineConfirm && (
                                        <button onClick={() => setShowOfflineConfirm(true)} disabled={loading}
                                            className='w-full font-semibold py-2 rounded-lg text-white' style={{ backgroundColor: primaryColor }}>
                                            Receive Offline Payment
                                        </button>
                                    )}
                                    {booking.paymentMethod === "offline" && showOfflineConfirm && (
                                        <div className='border border-gray-200 rounded-lg p-3'>
                                            <p className='text-sm text-gray-700 mb-2 text-center'>Have you received the payment from the customer?</p>
                                            <div className='flex gap-2'>
                                                <button onClick={() => callAction("receive-offline-payment", {}, "post")} disabled={loading}
                                                    className='flex-1 font-semibold py-2 rounded-lg text-white bg-green-600 hover:bg-green-700'>
                                                    {loading ? <ClipLoader size={16} color='white' /> : "YES"}
                                                </button>
                                                <button onClick={() => setShowOfflineConfirm(false)} disabled={loading}
                                                    className='flex-1 font-semibold py-2 rounded-lg border border-gray-300 text-gray-600'>
                                                    NO
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {booking.paymentMethod === "online" && (
                                        <div className='w-full text-center text-sm text-gray-500 py-2 rounded-lg border border-gray-200 bg-gray-50'>
                                            Receive Online Payment — waiting for the customer to pay online
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {["PENDING", "ACCEPTED", "ON_THE_WAY"].includes(booking.status) && (
                    <button
                        onClick={() => callAction("cancel", { reason: "cancelled from app" })}
                        disabled={loading}
                        className='w-full font-medium py-2 rounded-lg border border-gray-300 text-gray-500'
                    >
                        Cancel booking
                    </button>
                )}

                {!isWorker && booking.status === "COMPLETED" && booking.paymentMethod === "online" && booking.paymentStatus !== "PAID" && (
                    <div className='bg-white rounded-xl border border-[#eee] p-5 mb-4 text-center'>
                        <p className='text-sm text-gray-600 mb-3'>Job complete — pay online to settle this booking.</p>
                        <button onClick={handlePayOnline} disabled={loading} className='w-full font-semibold py-2 rounded-lg text-white' style={{ backgroundColor: primaryColor }}>
                            {loading ? <ClipLoader size={18} color='white' /> : `Pay ₹${booking.amount}`}
                        </button>
                    </div>
                )}

                {/* Customer: payment status for cash bookings */}
                {!isWorker && ["COMPLETED", "PAYMENT_RECEIVED"].includes(booking.status) && booking.paymentMethod === "offline" && (
                    <div className='bg-white rounded-xl border border-[#eee] p-5 mb-4 text-center'>
                        {booking.paymentStatus === "PAID" ? (
                            <>
                                <p className='text-green-600 font-semibold text-sm'>✅ Payment Successfully Received by Worker</p>
                                {booking.paidAt && (
                                    <p className='text-xs text-gray-400 mt-1'>Confirmed on {new Date(booking.paidAt).toLocaleString()}</p>
                                )}
                            </>
                        ) : (
                            <p className='text-sm text-gray-500'>Pay your worker in cash — payment confirmation from the worker is pending.</p>
                        )}
                    </div>
                )}

                {["COMPLETED", "PAYMENT_RECEIVED"].includes(booking.status) && (
                    <p className='text-center text-sm text-gray-400 mb-4'>
                        Job completed{booking.completedAt ? ` on ${new Date(booking.completedAt).toLocaleString()}` : ""}.
                        {booking.paymentMethod === "offline"
                            ? (booking.paymentStatus === "PAID" ? " Cash payment confirmed." : " Awaiting cash payment confirmation.")
                            : booking.paymentStatus === "PAID" ? " Payment received." : ""}
                    </p>
                )}

                {!isWorker && ["COMPLETED", "PAYMENT_RECEIVED"].includes(booking.status) && reviewChecked && !existingReview && (
                    <ReviewForm bookingId={bookingId} onSubmitted={setExistingReview} />
                )}
                {!isWorker && ["COMPLETED", "PAYMENT_RECEIVED"].includes(booking.status) && existingReview && (
                    <div className='bg-white rounded-xl border border-[#eee] p-5 text-center'>
                        <p className='text-sm text-gray-500'>You rated this job</p>
                        <p className='text-2xl font-bold text-yellow-500 mt-1'>{"★".repeat(existingReview.rating)}{"☆".repeat(5 - existingReview.rating)}</p>
                        {existingReview.comment && <p className='text-sm text-gray-600 mt-2'>"{existingReview.comment}"</p>}
                    </div>
                )}

                {err && <p className='text-red-500 text-center mt-3 text-sm'>*{err}</p>}
            </div>
        </div>
    )

    if (isWorker) {
        return <WorkerLayout>{content}</WorkerLayout>
    }

    return content
}

export default BookingDetailPage