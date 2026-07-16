import React, { useState } from 'react'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { FaWallet, FaArrowDown, FaExchangeAlt, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaShieldAlt } from 'react-icons/fa'
import { MdArrowUpward, MdArrowDownward } from 'react-icons/md'
import { ClipLoader } from 'react-spinners'
import WorkerLayout from '../../worker/WorkerLayout'
import { serverUrl } from '../../App'
import useGetWallet from '../../hooks/useGetWallet'
import { openRazorpayCheckout } from '../../utils/razorpayCheckout'

const TXN_LABELS = {
    EARNING:          { label: 'Booking Earning',       icon: MdArrowUpward,   color: 'text-green-600', bg: 'bg-green-50'  },
    COMMISSION_DEDUCT:{ label: 'Commission Deducted',   icon: MdArrowDownward, color: 'text-red-500',   bg: 'bg-red-50'    },
    COMMISSION_DEDUCTION:{ label: 'Commission Deducted', icon: MdArrowDownward, color: 'text-red-500', bg: 'bg-red-50' },
    COMMISSION_PAID:  { label: 'Commission Cleared',    icon: FaCheckCircle,   color: 'text-blue-600',  bg: 'bg-blue-50'   },
    DEPOSIT_PAID:     { label: 'Deposit Paid',          icon: FaCheckCircle,   color: 'text-purple-600',bg: 'bg-purple-50' },
    WITHDRAWAL:       { label: 'Withdrawal',            icon: MdArrowDownward, color: 'text-orange-600',bg: 'bg-orange-50' },
    ADJUSTMENT:       { label: 'Adjustment',            icon: FaExchangeAlt,   color: 'text-gray-600',  bg: 'bg-gray-50'   },
}

const WITHDRAWAL_STATUS = {
    PENDING:  { label: 'Pending',   cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    APPROVED: { label: 'Approved',  cls: 'bg-green-50 text-green-700 border-green-200'   },
    REJECTED: { label: 'Rejected',  cls: 'bg-red-50 text-red-600 border-red-200'         },
    PAID:     { label: 'Paid',      cls: 'bg-blue-50 text-blue-700 border-blue-200'      },
}

function BalanceCard({ icon: Icon, label, value, color, bg, sub }) {
    return (
        <div className='bg-white rounded-xl border border-[#eee] p-5 flex items-start gap-4'>
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon size={20} className={color} />
            </div>
            <div>
                <p className='text-xs text-gray-400 font-medium'>{label}</p>
                <p className='text-2xl font-extrabold text-gray-800'>{value}</p>
                {sub && <p className='text-xs text-gray-400 mt-0.5'>{sub}</p>}
            </div>
        </div>
    )
}

export default function WalletPage() {
    const { userData }   = useSelector(s => s.user)
    const { wallet, transactions, withdrawals } = useSelector(s => s.wallet)
    const refresh = useGetWallet()

    const [amount, setAmount]   = useState('')
    const [upiId, setUpiId]     = useState('')
    const [loading, setLoading] = useState(false)
    const [err, setErr]         = useState('')
    const [msg, setMsg]         = useState('')
    const [txnTab, setTxnTab]   = useState('transactions')

    const handleWithdraw = async () => {
        setErr(''); setMsg('')
        if (!amount || Number(amount) <= 0) return setErr('Enter a valid amount')
        if (!upiId.trim()) return setErr('Enter your UPI ID')
        if (Number(amount) > wallet?.withdrawableBalance) return setErr('Amount exceeds withdrawable balance')
        setLoading(true)
        try {
            await axios.post(`${serverUrl}/api/wallet/withdraw`, { amount, upiId }, { withCredentials: true })
            setMsg('Withdrawal request submitted — admin will process it shortly.')
            setAmount(''); setUpiId('')
            refresh()
        } catch (e) { setErr(e?.response?.data?.message || 'Withdrawal failed') }
        finally { setLoading(false) }
    }

    const handlePayDue = async () => {
        setErr(''); setMsg(''); setLoading(true)
        try {
            const { data } = await axios.post(`${serverUrl}/api/wallet/due/create-order`, {}, { withCredentials: true })
            await openRazorpayCheckout({
                order: data.order,
                name: 'Men On Rent — Pending Commission',
                description: 'Clear pending commission to reactivate your profile',
                prefill: { name: userData.fullName, email: userData.email, contact: userData.mobile },
                onSuccess: async (r) => {
                    try {
                        await axios.post(`${serverUrl}/api/wallet/due/verify`, {
                            amount: data.amount,
                            razorpayOrderId: r.razorpay_order_id,
                            razorpayPaymentId: r.razorpay_payment_id,
                            razorpaySignature: r.razorpay_signature,
                        }, { withCredentials: true })
                        setMsg('Commission cleared — your profile is reactivating.')
                        refresh()
                    } catch (e) { setErr(e?.response?.data?.message || 'Verification failed') }
                    finally { setLoading(false) }
                },
                onDismiss: () => setLoading(false),
            })
        } catch (e) { setErr(e?.response?.data?.message || 'Could not start payment'); setLoading(false) }
    }

    if (!wallet) {
        return (
            <WorkerLayout>
                <div className='flex items-center justify-center h-64 gap-2 text-gray-400'>
                    <div className='w-5 h-5 border-2 border-[#ff4d2d]/30 border-t-[#ff4d2d] rounded-full animate-spin' />
                    <span className='text-sm'>Loading wallet…</span>
                </div>
            </WorkerLayout>
        )
    }

    const securityDeposit = Number(wallet?.securityDepositBalance || 0)
    const totalCommissionDeducted = Number(wallet?.totalCommissionDeducted || 0)
    const remainingDepositBalance = wallet?.remainingDepositBalance !== undefined
        ? Number(wallet.remainingDepositBalance)
        : securityDeposit - totalCommissionDeducted
    const minimumRequiredDeposit = Number(wallet?.minimumRequiredDeposit || 0)
    const pendingCommission = Number(wallet?.pendingCommission || 0)

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

    return (
        <WorkerLayout>
            <div className='mb-6'>
                <h1 className='text-2xl font-extrabold text-gray-800'>Wallet</h1>
                <p className='text-sm text-gray-400 mt-0.5'>Manage your earnings and withdrawals</p>
            </div>

            {/* balance cards */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mb-6'>
                <BalanceCard icon={FaWallet}      label='Withdrawable Balance'  value={`₹${wallet.withdrawableBalance}`}  color='text-[#ff4d2d]'   bg='bg-[#fff0eb]' />
                <BalanceCard icon={FaCheckCircle} label='Total Earned'          value={`₹${wallet.totalEarnings}`}        color='text-green-600'   bg='bg-green-50'  />
                <BalanceCard icon={FaArrowDown}   label='Total Withdrawn'       value={`₹${wallet.totalWithdrawn}`}       color='text-blue-600'    bg='bg-blue-50'   />
                <BalanceCard icon={FaCheckCircle} label='Security Deposit'      value={`₹${wallet.securityDepositBalance}`} color='text-purple-600' bg='bg-purple-50' />
            </div>

            <div className='bg-white rounded-xl border border-[#eee] p-5 mb-6'>
                <div className='flex items-start justify-between gap-3 mb-4'>
                    <div>
                        <p className='font-bold text-gray-800 flex items-center gap-2'>
                            <FaShieldAlt size={14} className='text-[#ff4d2d]' />
                            Deposit & Commission Summary
                        </p>
                        <p className='text-sm text-gray-400 mt-0.5'>Track your security deposit health and commission deductions</p>
                    </div>
                </div>

                <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
                    <BalanceCard icon={FaShieldAlt} label='Security Deposit' value={formatCurrency(securityDeposit)} color='text-purple-600' bg='bg-purple-50' />
                    <BalanceCard icon={FaArrowDown} label='Total Commission Deducted' value={formatCurrency(totalCommissionDeducted)} color='text-red-500' bg='bg-red-50' />
                    <BalanceCard icon={FaCheckCircle} label='Remaining Deposit Balance' value={formatCurrency(remainingDepositBalance)} color='text-green-600' bg='bg-green-50' />
                    <BalanceCard icon={FaHourglassHalf} label='Pending Commission' value={formatCurrency(pendingCommission)} color='text-orange-600' bg='bg-orange-50' />
                </div>

                {depositWarning && (
                    <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${depositWarning.type === 'red' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                        <p className='font-semibold'>{depositWarning.message}</p>
                    </div>
                )}
            </div>

            {/* pending commission */}
            {pendingCommission > 0 && (
                <div className='bg-red-50 border border-red-200 rounded-xl p-5 mb-6 flex flex-col md:flex-row md:items-center gap-4'>
                    <div className='flex-1'>
                        <p className='font-bold text-red-700'>Commission Due: {formatCurrency(pendingCommission)}</p>
                        <p className='text-sm text-red-600 mt-0.5 opacity-80'>
                            Your profile is {pendingCommission > 0 ? 'at risk of suspension' : 'suspended'}. Clear this to stay visible.
                        </p>
                    </div>
                    <button onClick={handlePayDue} disabled={loading}
                        className='bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 min-w-[160px]'>
                        {loading ? <ClipLoader size={16} color='white' /> : `Pay ${formatCurrency(pendingCommission)} Now`}
                    </button>
                </div>
            )}

            {msg && <div className='bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 text-green-700 text-sm font-medium'>✅ {msg}</div>}
            {err && <div className='bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-red-600 text-sm'>⚠ {err}</div>}

            <div className='grid md:grid-cols-3 gap-4'>
                {/* withdrawal form */}
                <div className='bg-white rounded-xl border border-[#eee] p-5'>
                    <p className='font-bold text-gray-800 mb-4 flex items-center gap-2'>
                        <FaArrowDown size={14} className='text-[#ff4d2d]' />
                        Request Withdrawal
                    </p>
                    <div className='space-y-3'>
                        <div>
                            <label className='text-xs font-semibold text-gray-500 block mb-1'>Amount (₹)</label>
                            <input type='number' value={amount} onChange={e => setAmount(e.target.value)}
                                placeholder={`Max ₹${wallet.withdrawableBalance}`}
                                className='w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#ff4d2d] transition-colors' />
                        </div>
                        <div>
                            <label className='text-xs font-semibold text-gray-500 block mb-1'>UPI ID</label>
                            <input type='text' value={upiId} onChange={e => setUpiId(e.target.value)}
                                placeholder='yourname@upi'
                                className='w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#ff4d2d] transition-colors' />
                        </div>
                        <button onClick={handleWithdraw} disabled={loading}
                            className='w-full bg-[#ff4d2d] hover:bg-[#e64323] text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2'>
                            {loading ? <ClipLoader size={16} color='white' /> : 'Request Withdrawal'}
                        </button>
                    </div>
                    <p className='text-[10px] text-gray-400 mt-3 text-center'>Withdrawals are processed within 2-3 working days</p>
                </div>

                {/* history */}
                <div className='md:col-span-2 bg-white rounded-xl border border-[#eee] overflow-hidden'>
                    <div className='flex border-b border-[#eee]'>
                        {['transactions', 'withdrawals'].map(t => (
                            <button key={t} onClick={() => setTxnTab(t)}
                                className={`flex-1 py-3 text-xs font-bold capitalize transition-colors
                                    ${txnTab === t ? 'text-[#ff4d2d] border-b-2 border-[#ff4d2d] bg-[#fff9f6]' : 'text-gray-400 hover:text-gray-600'}`}>
                                {t === 'transactions' ? 'Transaction History' : 'Withdrawal Requests'}
                            </button>
                        ))}
                    </div>

                    {txnTab === 'transactions' && (
                        <div className='max-h-80 overflow-y-auto'>
                            {transactions.length === 0 ? (
                                <p className='text-center text-gray-400 text-sm py-10'>No transactions yet</p>
                            ) : (
                                <table className='w-full text-sm'>
                                    <thead className='bg-[#f7f7f8] text-[10px] text-gray-400 font-semibold sticky top-0'>
                                        <tr>
                                            <th className='text-left px-4 py-2.5'>Type</th>
                                            <th className='text-left px-4 py-2.5'>Date</th>
                                            <th className='text-right px-4 py-2.5'>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map(t => {
                                            const meta = TXN_LABELS[t.type] || TXN_LABELS.ADJUSTMENT
                                            const TIcon = meta.icon
                                            const isCredit = ['EARNING', 'DEPOSIT_PAID'].includes(t.type)
                                            return (
                                                <tr key={t._id} className='border-b border-[#f7f7f7]'>
                                                    <td className='px-4 py-3'>
                                                        <div className='flex items-center gap-2.5'>
                                                            <div className={`w-7 h-7 rounded-lg ${meta.bg} flex items-center justify-center shrink-0`}>
                                                                <TIcon size={12} className={meta.color} />
                                                            </div>
                                                            <span className='text-gray-700 text-xs font-medium'>{meta.label}</span>
                                                        </div>
                                                    </td>
                                                    <td className='px-4 py-3 text-xs text-gray-400'>
                                                        {new Date(t.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className={`px-4 py-3 text-right font-bold text-sm ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                                                        {isCredit ? '+' : '-'}₹{t.amount}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {txnTab === 'withdrawals' && (
                        <div className='max-h-80 overflow-y-auto'>
                            {withdrawals.length === 0 ? (
                                <p className='text-center text-gray-400 text-sm py-10'>No withdrawal requests yet</p>
                            ) : (
                                <table className='w-full text-sm'>
                                    <thead className='bg-[#f7f7f8] text-[10px] text-gray-400 font-semibold sticky top-0'>
                                        <tr>
                                            <th className='text-left px-4 py-2.5'>Date</th>
                                            <th className='text-left px-4 py-2.5'>UPI ID</th>
                                            <th className='text-right px-4 py-2.5'>Amount</th>
                                            <th className='text-left px-4 py-2.5'>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {withdrawals.map(w => {
                                            const ws = WITHDRAWAL_STATUS[w.status] || WITHDRAWAL_STATUS.PENDING
                                            return (
                                                <tr key={w._id} className='border-b border-[#f7f7f7]'>
                                                    <td className='px-4 py-3 text-xs text-gray-500'>
                                                        {new Date(w.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className='px-4 py-3 text-xs text-gray-600'>{w.upiId || '—'}</td>
                                                    <td className='px-4 py-3 text-right font-bold text-gray-800'>₹{w.amount}</td>
                                                    <td className='px-4 py-3'>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ws.cls}`}>{ws.label}</span>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </WorkerLayout>
    )
}
