import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ClipLoader } from 'react-spinners'
import { serverUrl } from '../App'

const borderColor = "#ddd"
const primaryColor = "#ff4d2d"

function BookWorkerPage() {
    const { workerId } = useParams()
    const navigate = useNavigate()
    const { currentAddress } = useSelector(state => state.user)
    const { location } = useSelector(state => state.map)

    const [worker, setWorker] = useState(null)
    const [bookingType, setBookingType] = useState("hourly")
    const [date, setDate] = useState("")
    const [startTime, setStartTime] = useState("")
    const [durationHours, setDurationHours] = useState(1)
    const [durationDays, setDurationDays] = useState(1)
    const [addressText, setAddressText] = useState("")
    const [paymentMethod, setPaymentMethod] = useState("offline")
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState("")

    // Task-booking fields (Grocery/Medicine/Parcel/Shopping Assistance)
    const [itemDetails, setItemDetails] = useState("")
    const [budget, setBudget] = useState("")
    const [pickupAddress, setPickupAddress] = useState("")
    const [deliveryAddress, setDeliveryAddress] = useState("")

    const isDeliveryWorker = worker?.category?.group === "Delivery Services"

    useEffect(() => {
        const fetchWorker = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/worker/${workerId}`, { withCredentials: true })
                setWorker(result.data)
                if (result.data?.category?.group === "Delivery Services") {
                    setBookingType("task")
                }
            } catch (error) {
                setErr(error?.response?.data?.message || "could not load worker")
            }
        }
        fetchWorker()
    }, [workerId])

    useEffect(() => {
        if (currentAddress) {
            setAddressText(currentAddress)
            setPickupAddress(currentAddress)
            setDeliveryAddress(currentAddress)
        }
    }, [currentAddress])

    const rate = bookingType === "hourly" ? worker?.hourlyRate : worker?.dailyRate
    const units = bookingType === "hourly" ? Number(durationHours || 0) : Number(durationDays || 0)
    const estimatedAmount = bookingType === "task" ? (worker?.hourlyRate || 0) : (rate ? rate * units : 0)

    const handleSubmit = async () => {
        setErr("")
        if (!location?.lat || !location?.lon) return setErr("waiting for your location, please allow location access")

        const payload = {
            workerId,
            bookingType,
            paymentMethod
        }

        if (bookingType === "task") {
            if (!itemDetails) return setErr("please describe what you need")
            if (!pickupAddress) return setErr("please enter a pickup address")
            if (!deliveryAddress) return setErr("please enter a delivery address")
            payload.taskDetails = {
                itemDetails,
                budget: Number(budget) || 0,
                pickupAddress: { text: pickupAddress, latitude: location.lat, longitude: location.lon },
                deliveryAddress: { text: deliveryAddress, latitude: location.lat, longitude: location.lon }
            }
        } else {
            if (!date) return setErr("please select a date")
            if (!addressText) return setErr("please enter the job address")
            payload.schedule = { date, startTime, durationHours, durationDays }
            payload.address = { text: addressText, latitude: location.lat, longitude: location.lon }
        }

        setLoading(true)
        try {
            const result = await axios.post(`${serverUrl}/api/booking`, payload, { withCredentials: true })
            navigate(`/bookings/${result.data._id}`)
        } catch (error) {
            setErr(error?.response?.data?.message || "could not create booking")
        } finally {
            setLoading(false)
        }
    }

    if (err && !worker) {
        return <div className='pt-[120px] text-center text-gray-500'>{err}</div>
    }
    if (!worker) {
        return <div className='pt-[120px] text-center text-gray-400'>Loading…</div>
    }

    return (
        <div className='w-full min-h-[100vh] pt-[100px] pb-10 flex justify-center bg-[#fff9f6]'>
            <div className='bg-white rounded-xl shadow-lg w-full max-w-lg p-8' style={{ border: `1px solid ${borderColor}` }}>
                <h1 className='text-2xl font-bold mb-1' style={{ color: primaryColor }}>Book {worker.user?.fullName}</h1>
                <p className='text-gray-500 mb-6 text-sm'>{worker.category?.name} · {worker.experienceYears || 0} yrs experience</p>

                {!isDeliveryWorker && (
                    <div className='flex gap-2 mb-4'>
                        {[{ value: "hourly", label: `Hourly (₹${worker.hourlyRate}/hr)` }, { value: "daily", label: `Daily (₹${worker.dailyRate}/day)` }].map(o => (
                            <button
                                key={o.value}
                                onClick={() => setBookingType(o.value)}
                                className='flex-1 border rounded-lg px-3 py-2 text-sm font-medium'
                                style={bookingType === o.value ? { backgroundColor: primaryColor, color: "white" } : { border: `1px solid ${borderColor}`, color: "#555" }}
                            >
                                {o.label}
                            </button>
                        ))}
                    </div>
                )}

                {bookingType === "task" ? (
                    <>
                        <div className='mb-4'>
                            <label className='block text-gray-700 font-medium mb-1 text-sm'>What do you need?</label>
                            <textarea
                                className='w-full border rounded-lg px-3 py-2' style={{ border: `1px solid ${borderColor}` }}
                                rows={2} placeholder="e.g. 2kg rice, 1L milk, a packet of bread"
                                value={itemDetails} onChange={(e) => setItemDetails(e.target.value)}
                            />
                        </div>
                        <div className='mb-4'>
                            <label className='block text-gray-700 font-medium mb-1 text-sm'>Item budget (₹)</label>
                            <input
                                type="number" min="0"
                                className='w-full border rounded-lg px-3 py-2' style={{ border: `1px solid ${borderColor}` }}
                                placeholder="Estimated cost of the items - reimbursed to the worker directly"
                                value={budget} onChange={(e) => setBudget(e.target.value)}
                            />
                        </div>
                        <div className='mb-4'>
                            <label className='block text-gray-700 font-medium mb-1 text-sm'>Pickup address</label>
                            <textarea
                                className='w-full border rounded-lg px-3 py-2' style={{ border: `1px solid ${borderColor}` }}
                                rows={2} value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)}
                            />
                        </div>
                        <div className='mb-4'>
                            <label className='block text-gray-700 font-medium mb-1 text-sm'>Delivery address</label>
                            <textarea
                                className='w-full border rounded-lg px-3 py-2' style={{ border: `1px solid ${borderColor}` }}
                                rows={2} value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)}
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <div className='grid grid-cols-2 gap-3 mb-4'>
                            <div>
                                <label className='block text-gray-700 font-medium mb-1 text-sm'>Date</label>
                                <input type="date" className='w-full border rounded-lg px-3 py-2' style={{ border: `1px solid ${borderColor}` }} value={date} onChange={(e) => setDate(e.target.value)} />
                            </div>
                            <div>
                                <label className='block text-gray-700 font-medium mb-1 text-sm'>Start time</label>
                                <input type="time" className='w-full border rounded-lg px-3 py-2' style={{ border: `1px solid ${borderColor}` }} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                            </div>
                        </div>

                        <div className='mb-4'>
                            <label className='block text-gray-700 font-medium mb-1 text-sm'>
                                {bookingType === "hourly" ? "Duration (hours)" : "Duration (days)"}
                            </label>
                            <input
                                type="number" min="1"
                                className='w-full border rounded-lg px-3 py-2' style={{ border: `1px solid ${borderColor}` }}
                                value={bookingType === "hourly" ? durationHours : durationDays}
                                onChange={(e) => bookingType === "hourly" ? setDurationHours(e.target.value) : setDurationDays(e.target.value)}
                            />
                        </div>

                        <div className='mb-4'>
                            <label className='block text-gray-700 font-medium mb-1 text-sm'>Job address</label>
                            <textarea
                                className='w-full border rounded-lg px-3 py-2' style={{ border: `1px solid ${borderColor}` }}
                                rows={2} value={addressText} onChange={(e) => setAddressText(e.target.value)}
                            />
                        </div>
                    </>
                )}

                <div className='mb-6'>
                    <label className='block text-gray-700 font-medium mb-2 text-sm'>Payment method (service fee)</label>
                    <div className='flex gap-2'>
                        {[{ value: "offline", label: "Pay worker directly" }, { value: "online", label: "Pay online" }].map(o => (
                            <button
                                key={o.value}
                                onClick={() => setPaymentMethod(o.value)}
                                className='flex-1 border rounded-lg px-3 py-2 text-sm font-medium'
                                style={paymentMethod === o.value ? { backgroundColor: primaryColor, color: "white" } : { border: `1px solid ${borderColor}`, color: "#555" }}
                            >
                                {o.label}
                            </button>
                        ))}
                    </div>
                    {paymentMethod === "online" && (
                        <p className='text-xs text-gray-400 mt-2'>You'll be prompted to pay online once the job is marked completed.</p>
                    )}
                    {bookingType === "task" && (
                        <p className='text-xs text-gray-400 mt-2'>This only covers the worker's service fee. The item budget above is cash you reimburse the worker directly at pickup.</p>
                    )}
                </div>

                <div className='flex items-center justify-between bg-[#fff5f0] rounded-lg px-4 py-3 mb-6'>
                    <span className='text-sm text-gray-600'>Estimated {bookingType === "task" ? "service fee" : "amount"}</span>
                    <span className='font-bold text-lg' style={{ color: primaryColor }}>₹{estimatedAmount || 0}</span>
                </div>

                <button
                    className='w-full font-semibold py-2 rounded-lg text-white transition-colors'
                    style={{ backgroundColor: primaryColor }}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? <ClipLoader size={20} color='white' /> : "Send booking request"}
                </button>
                {err && <p className='text-red-500 text-center mt-3 text-sm'>*{err}</p>}
            </div>
        </div>
    )
}

export default BookWorkerPage
