import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FaShieldAlt, FaCheckCircle, FaLock, FaArrowRight, FaArrowDown, FaHourglassHalf } from 'react-icons/fa'
import { ClipLoader } from 'react-spinners'
import WorkerLayout from '../../worker/WorkerLayout'
import { serverUrl } from '../../App'
import { openRazorpayCheckout } from '../../utils/razorpayCheckout'
import { setMyWorkerProfile } from '../../redux/workerSlice'

export default function DepositPage() {
    const { userData } = useSelector(s => s.user)
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [config, setConfig]   = useState(null)
    const [loading, setLoading] = useState(false)
    const [err, setErr]         = useState('')
    const [paid, setPaid]       = useState(false)

    useEffect(() => {
        axios.get(`${serverUrl}/api/deposit/config`, { withCredentials: true })
            .then(r => setConfig(r.data))
            .catch(e => setErr(e?.response?.data?.message || 'Could not load deposit info'))
    }, [])

    const remaining = config ? Math.max(0, config.requiredAmount - config.currentBalance) : 0
    const paidPct   = config ? Math.min(100, Math.round((config.currentBalance / config.requiredAmount) * 100)) : 0
    const fullyPaid = remaining === 0

    const securityDeposit = Number(config?.currentBalance || 0)
    const totalCommissionDeducted = Number(config?.totalCommissionDeducted || 0)
    const remainingDepositBalance = config?.remainingDepositBalance !== undefined
        ? Number(config.remainingDepositBalance)
        : securityDeposit - totalCommissionDeducted
    const minimumRequiredDeposit = Number(config?.minimumRequiredDeposit || 0)
    const pendingCommission = Number(config?.pendingCommission || 0)

    const depositWarning = remainingDepositBalance <= 0
        ? {
            type: 'red',
            message: 'Your account is temporarily inactive because your security deposit has been exhausted.'
        }
        : remainingDepositBalance < minimumRequiredDeposit
            ? {
                type: 'yellow',
                message: 'Your security deposit is running low. Please recharge to continue receiving bookings.'
            }
            : null

    const formatCurrency = value => `₹${Number(value || 0).toLocaleString('en-IN')}`

    const handlePay = async () => {
        setErr(''); setLoading(true)
        try {
            const { data } = await axios.post(`${serverUrl}/api/deposit/create-order`, {}, { withCredentials: true })
            await openRazorpayCheckout({
                order: data.order,
                name: 'Men On Rent — Security Deposit',
                description: 'One-time refundable security deposit',
                prefill: { name: userData.fullName, email: userData.email, contact: userData.mobile },
                onSuccess: async (r) => {
                    try {
                        const res = await axios.post(`${serverUrl}/api/deposit/verify`, {
                            depositId: data.depositId,
                            razorpayOrderId: r.razorpay_order_id,
                            razorpayPaymentId: r.razorpay_payment_id,
                            razorpaySignature: r.razorpay_signature,
                        }, { withCredentials: true })
                        if (res.data.workerProfile) dispatch(setMyWorkerProfile(res.data.workerProfile))
                        setPaid(true)
                    } catch (e) { setErr(e?.response?.data?.message || 'Verification failed') }
                    finally { setLoading(false) }
                },
                onDismiss: () => setLoading(false),
            })
        } catch (e) { setErr(e?.response?.data?.message || 'Could not start payment'); setLoading(false) }
    }

    return (
        <WorkerLayout>
            <div className='mb-6'>
                <h1 className='text-2xl font-extrabold text-gray-800'>Security Deposit</h1>
                <p className='text-sm text-gray-400 mt-0.5'>One-time refundable deposit required to activate your profile</p>
            </div>

            <div className='max-w-xl'>
                {/* success state */}
                {(paid || fullyPaid) && (
                    <div className='bg-green-50 border border-green-200 rounded-2xl p-8 text-center mb-6'>
                        <FaCheckCircle size={48} className='text-green-500 mx-auto mb-3' />
                        <h2 className='text-xl font-extrabold text-green-800'>Deposit Paid!</h2>
                        <p className='text-green-700 text-sm mt-1'>Your profile is now active. Customers can find and book you.</p>
                        <button onClick={() => navigate('/')}
                            className='mt-5 bg-[#ff4d2d] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#e64323] transition-colors'>
                            Go to Dashboard →
                        </button>
                    </div>
                )}

                {/* main card */}
                {!paid && !fullyPaid && (
                    <>
                        <div className='bg-white rounded-xl border border-[#eee] p-6 mb-4'>
                            <div className='flex items-center gap-3 mb-5 pb-5 border-b border-[#f0f0f0]'>
                                <div className='w-12 h-12 rounded-xl bg-[#fff0eb] flex items-center justify-center shrink-0'>
                                    <FaShieldAlt size={22} className='text-[#ff4d2d]' />
                                </div>
                                <div>
                                    <p className='font-extrabold text-gray-800 text-lg'>Security Deposit</p>
                                    <p className='text-xs text-gray-400'>Fully refundable on account closure</p>
                                </div>
                            </div>

                            {config ? (
                                <>
                                    <div className='grid grid-cols-2 gap-3 mb-4'>
                                        {[
                                            { label: 'Required', value: formatCurrency(config.requiredAmount) },
                                            { label: 'Paid So Far', value: formatCurrency(config.currentBalance) },
                                            { label: 'Remaining', value: formatCurrency(remaining), highlight: true },
                                            { label: 'Remaining Deposit Balance', value: formatCurrency(remainingDepositBalance), highlight: true },
                                        ].map((s, i) => (
                                            <div key={i} className={`rounded-xl p-3 text-center ${s.highlight ? 'bg-[#fff0eb]' : 'bg-[#f7f7f8]'}`}>
                                                <p className='text-xs text-gray-400'>{s.label}</p>
                                                <p className={`font-extrabold text-lg ${s.highlight ? 'text-[#ff4d2d]' : 'text-gray-800'}`}>{s.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className='grid grid-cols-2 gap-3 mb-5'>
                                        {[
                                            { label: 'Commission Deducted', value: formatCurrency(totalCommissionDeducted), icon: FaArrowDown, color: 'text-red-500' },
                                            { label: 'Pending Commission', value: formatCurrency(pendingCommission), icon: FaHourglassHalf, color: 'text-orange-600' },
                                        ].map((s, i) => (
                                            <div key={i} className='rounded-xl border border-[#eee] p-3 flex items-center gap-3'>
                                                <div className='w-10 h-10 rounded-xl bg-[#f7f7f8] flex items-center justify-center shrink-0'>
                                                    <s.icon size={16} className={s.color} />
                                                </div>
                                                <div>
                                                    <p className='text-xs text-gray-400'>{s.label}</p>
                                                    <p className='font-extrabold text-gray-800'>{s.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {depositWarning && (
                                        <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${depositWarning.type === 'red' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                            <p className='font-semibold'>{depositWarning.message}</p>
                                        </div>
                                    )}

                                    {/* progress bar */}
                                    <div className='mb-5'>
                                        <div className='flex justify-between text-xs text-gray-400 mb-1.5'>
                                            <span>Progress</span>
                                            <span>{paidPct}%</span>
                                        </div>
                                        <div className='h-2.5 bg-gray-100 rounded-full overflow-hidden'>
                                            <div className='h-full bg-[#ff4d2d] rounded-full transition-all duration-500'
                                                style={{ width: `${paidPct}%` }} />
                                        </div>
                                    </div>

                                    <button onClick={handlePay} disabled={loading}
                                        className='w-full bg-[#ff4d2d] hover:bg-[#e64323] text-white font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#ff4d2d]/20'>
                                        {loading ? <ClipLoader size={18} color='white' />
                                            : <><FaLock size={14} /> Pay ₹{remaining} Securely</>
                                        }
                                    </button>
                                </>
                            ) : err ? (
                                <p className='text-red-500 text-sm text-center py-4'>{err}</p>
                            ) : (
                                <div className='flex items-center justify-center py-8 gap-2 text-gray-400'>
                                    <div className='w-4 h-4 border-2 border-[#ff4d2d]/30 border-t-[#ff4d2d] rounded-full animate-spin' />
                                    <span className='text-sm'>Loading…</span>
                                </div>
                            )}
                            {err && config && <p className='text-red-500 text-sm text-center mt-3'>⚠ {err}</p>}
                        </div>

                        {/* info bullets */}
                        <div className='bg-white rounded-xl border border-[#eee] p-5'>
                            <p className='font-bold text-gray-700 mb-3 text-sm'>Why is this needed?</p>
                            {[
                                'Ensures commitment from our worker partners',
                                'Fully refundable when you close your account',
                                'Helps maintain quality and trust on the platform',
                                'Activates your profile so customers can book you',
                            ].map((point, i) => (
                                <div key={i} className='flex items-start gap-2.5 mb-2.5 last:mb-0'>
                                    <FaCheckCircle size={14} className='text-green-500 shrink-0 mt-0.5' />
                                    <p className='text-sm text-gray-600'>{point}</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </WorkerLayout>
    )
}
