import React, { useState } from 'react'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { ClipLoader } from 'react-spinners'
import { serverUrl } from '../App'
import useGetWallet from '../hooks/useGetWallet'
import { openRazorpayCheckout } from '../utils/razorpayCheckout'

const primaryColor = "#ff4d2d"

const TXN_LABELS = {
    EARNING: "Earning",
    COMMISSION_DEDUCT: "Commission deducted",
    COMMISSION_PAID: "Commission paid off",
    DEPOSIT_PAID: "Deposit paid",
    WITHDRAWAL: "Withdrawal",
    ADJUSTMENT: "Adjustment"
}

function WalletPage() {
    const { userData } = useSelector(state => state.user)
    const { wallet, transactions, withdrawals } = useSelector(state => state.wallet)
    const refresh = useGetWallet()

    const [withdrawAmount, setWithdrawAmount] = useState("")
    const [upiId, setUpiId] = useState("")
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState("")
    const [msg, setMsg] = useState("")

    const handleWithdraw = async () => {
        setErr(""); setMsg("")
        if (!withdrawAmount || Number(withdrawAmount) <= 0) return setErr("enter a valid amount")
        if (!upiId) return setErr("enter your UPI ID for payout")
        setLoading(true)
        try {
            await axios.post(`${serverUrl}/api/wallet/withdraw`, { amount: withdrawAmount, upiId }, { withCredentials: true })
            setMsg("Withdrawal requested - it'll be processed by the admin team.")
            setWithdrawAmount("")
            refresh()
        } catch (error) {
            setErr(error?.response?.data?.message || "withdrawal request failed")
        } finally {
            setLoading(false)
        }
    }

    const handlePayDue = async () => {
        setErr(""); setMsg("")
        setLoading(true)
        try {
            const orderRes = await axios.post(`${serverUrl}/api/wallet/due/create-order`, {}, { withCredentials: true })
            const { order, amount } = orderRes.data
            await openRazorpayCheckout({
                order,
                name: "Men On Rent - Pending Commission",
                description: "Clear pending commission to reactivate your profile",
                prefill: { name: userData.fullName, email: userData.email, contact: userData.mobile },
                onSuccess: async (response) => {
                    try {
                        await axios.post(`${serverUrl}/api/wallet/due/verify`, {
                            amount,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature
                        }, { withCredentials: true })
                        setMsg("Commission cleared - your profile is reactivating.")
                        refresh()
                    } catch (error) {
                        setErr(error?.response?.data?.message || "verification failed")
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

    if (!wallet) {
        return <div className='pt-[120px] text-center text-gray-400'>Loading…</div>
    }

    return (
        <div className='w-full min-h-[100vh] pt-[100px] pb-10 flex justify-center bg-[#fff9f6]'>
            <div className='w-full max-w-lg px-4'>
                <h1 className='text-xl font-bold text-gray-800 mb-4'>Wallet</h1>

                <div className='grid grid-cols-2 gap-3 mb-4'>
                    <div className='bg-white rounded-xl border border-[#eee] p-4'>
                        <p className='text-xs text-gray-400'>Withdrawable balance</p>
                        <p className='text-xl font-bold' style={{ color: primaryColor }}>₹{wallet.withdrawableBalance}</p>
                    </div>
                    <div className='bg-white rounded-xl border border-[#eee] p-4'>
                        <p className='text-xs text-gray-400'>Security deposit</p>
                        <p className='text-xl font-bold text-gray-800'>₹{wallet.securityDepositBalance}</p>
                    </div>
                    <div className='bg-white rounded-xl border border-[#eee] p-4'>
                        <p className='text-xs text-gray-400'>Total earnings</p>
                        <p className='text-xl font-bold text-gray-800'>₹{wallet.totalEarnings}</p>
                    </div>
                    <div className='bg-white rounded-xl border border-[#eee] p-4'>
                        <p className='text-xs text-gray-400'>Total withdrawn</p>
                        <p className='text-xl font-bold text-gray-800'>₹{wallet.totalWithdrawn}</p>
                    </div>
                </div>

                {wallet.pendingCommission > 0 && (
                    <div className='bg-red-50 border border-red-200 rounded-xl p-4 mb-4'>
                        <p className='text-sm text-red-700 font-medium mb-2'>
                            ₹{wallet.pendingCommission} commission due — clear it to stay visible to customers.
                        </p>
                        <button onClick={handlePayDue} disabled={loading} className='w-full font-semibold py-2 rounded-lg text-white bg-red-600'>
                            {loading ? <ClipLoader size={18} color='white' /> : `Pay ₹${wallet.pendingCommission} now`}
                        </button>
                    </div>
                )}

                <div className='bg-white rounded-xl border border-[#eee] p-4 mb-4'>
                    <p className='font-semibold text-gray-800 mb-3'>Request withdrawal</p>
                    <div className='flex flex-col gap-2'>
                        <input
                            type="number" placeholder="Amount"
                            className='border rounded-lg px-3 py-2' style={{ borderColor: "#ddd" }}
                            value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)}
                        />
                        <input
                            placeholder="UPI ID"
                            className='border rounded-lg px-3 py-2' style={{ borderColor: "#ddd" }}
                            value={upiId} onChange={(e) => setUpiId(e.target.value)}
                        />
                        <button onClick={handleWithdraw} disabled={loading} className='font-semibold py-2 rounded-lg text-white' style={{ backgroundColor: primaryColor }}>
                            {loading ? <ClipLoader size={18} color='white' /> : "Request withdrawal"}
                        </button>
                    </div>
                    {msg && <p className='text-green-600 text-sm mt-2'>{msg}</p>}
                    {err && <p className='text-red-500 text-sm mt-2'>*{err}</p>}
                </div>

                {withdrawals.length > 0 && (
                    <div className='bg-white rounded-xl border border-[#eee] p-4 mb-4'>
                        <p className='font-semibold text-gray-800 mb-3'>Withdrawal requests</p>
                        {withdrawals.map(w => (
                            <div key={w._id} className='flex justify-between text-sm py-1 border-b border-[#f5f5f5] last:border-0'>
                                <span className='text-gray-500'>{new Date(w.createdAt).toLocaleDateString()}</span>
                                <span className='text-gray-700'>₹{w.amount}</span>
                                <span className='text-xs font-medium'>{w.status}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className='bg-white rounded-xl border border-[#eee] p-4'>
                    <p className='font-semibold text-gray-800 mb-3'>Transaction history</p>
                    {transactions.length === 0 && <p className='text-sm text-gray-400'>No transactions yet.</p>}
                    {transactions.map(t => (
                        <div key={t._id} className='flex justify-between text-sm py-1.5 border-b border-[#f5f5f5] last:border-0'>
                            <div>
                                <p className='text-gray-700'>{TXN_LABELS[t.type] || t.type}</p>
                                <p className='text-xs text-gray-400'>{new Date(t.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className={`font-medium ${["EARNING", "DEPOSIT_PAID"].includes(t.type) ? "text-green-600" : "text-gray-700"}`}>
                                ₹{t.amount}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default WalletPage
