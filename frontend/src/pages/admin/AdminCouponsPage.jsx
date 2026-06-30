import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { serverUrl } from '../../App'

const primaryColor = "#ff4d2d"

function AdminCouponsPage() {
    const [coupons, setCoupons] = useState([])
    const [err, setErr] = useState("")
    const [busy, setBusy] = useState(false)

    const [code, setCode] = useState("")
    const [discountType, setDiscountType] = useState("PERCENT")
    const [discountValue, setDiscountValue] = useState("")
    const [maxUses, setMaxUses] = useState("")
    const [expiresAt, setExpiresAt] = useState("")

    const fetchCoupons = async () => {
        try {
            const result = await axios.get(`${serverUrl}/api/coupon/admin/all`, { withCredentials: true })
            setCoupons(result.data)
        } catch (error) {
            setErr(error?.response?.data?.message || "could not load coupons")
        }
    }

    useEffect(() => { fetchCoupons() }, [])

    const createCoupon = async () => {
        if (!code || !discountValue) return setErr("code and discount value are required")
        setBusy(true); setErr("")
        try {
            await axios.post(`${serverUrl}/api/coupon`, {
                code, discountType, discountValue: Number(discountValue),
                maxUses: maxUses ? Number(maxUses) : null,
                expiresAt: expiresAt || null
            }, { withCredentials: true })
            setCode(""); setDiscountValue(""); setMaxUses(""); setExpiresAt("")
            fetchCoupons()
        } catch (error) {
            setErr(error?.response?.data?.message || "could not create coupon")
        } finally {
            setBusy(false)
        }
    }

    const toggleActive = async (couponId, isActive) => {
        setBusy(true); setErr("")
        try {
            await axios.patch(`${serverUrl}/api/coupon/admin/${couponId}/active`, { isActive }, { withCredentials: true })
            fetchCoupons()
        } catch (error) {
            setErr(error?.response?.data?.message || "could not update coupon")
        } finally {
            setBusy(false)
        }
    }

    return (
        <div>
            <h1 className='text-xl font-bold text-gray-800 mb-4'>Coupons</h1>

            <div className='bg-white rounded-xl border border-[#eee] p-4 mb-6'>
                <p className='font-semibold text-gray-700 mb-3 text-sm'>Create a coupon</p>
                <div className='grid grid-cols-5 gap-2'>
                    <input placeholder="CODE" className='border rounded-lg px-3 py-2 text-sm uppercase' style={{ borderColor: "#ddd" }} value={code} onChange={(e) => setCode(e.target.value)} />
                    <select className='border rounded-lg px-3 py-2 text-sm' style={{ borderColor: "#ddd" }} value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                        <option value="PERCENT">% off</option>
                        <option value="FLAT">₹ flat off</option>
                    </select>
                    <input type="number" placeholder="Value" className='border rounded-lg px-3 py-2 text-sm' style={{ borderColor: "#ddd" }} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
                    <input type="number" placeholder="Max uses (optional)" className='border rounded-lg px-3 py-2 text-sm' style={{ borderColor: "#ddd" }} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
                    <input type="date" className='border rounded-lg px-3 py-2 text-sm' style={{ borderColor: "#ddd" }} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
                </div>
                <button disabled={busy} onClick={createCoupon} className='mt-3 px-4 py-2 rounded-lg text-white text-sm font-semibold' style={{ backgroundColor: primaryColor }}>
                    Create coupon
                </button>
            </div>

            <div className='bg-white rounded-xl border border-[#eee] overflow-hidden'>
                <table className='w-full text-sm'>
                    <thead>
                        <tr className='text-left text-gray-400 border-b border-[#f0f0f0]'>
                            <th className='py-2 px-3'>Code</th>
                            <th className='py-2 px-3'>Discount</th>
                            <th className='py-2 px-3'>Used</th>
                            <th className='py-2 px-3'>Expires</th>
                            <th className='py-2 px-3'>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {coupons.map(c => (
                            <tr key={c._id} className='border-b border-[#f7f7f7]'>
                                <td className='py-2 px-3 font-mono font-medium text-gray-700'>{c.code}</td>
                                <td className='py-2 px-3'>{c.discountType === "PERCENT" ? `${c.discountValue}%` : `₹${c.discountValue}`}</td>
                                <td className='py-2 px-3 text-gray-500'>{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ""}</td>
                                <td className='py-2 px-3 text-gray-500'>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}</td>
                                <td className='py-2 px-3'>
                                    <button onClick={() => toggleActive(c._id, !c.isActive)} className={`text-xs px-2 py-1 rounded ${c.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                        {c.isActive ? "Active" : "Inactive"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {coupons.length === 0 && <p className='text-center text-gray-400 py-6 text-sm'>No coupons created yet.</p>}
            </div>

            {err && <p className='text-red-500 text-sm mt-3'>*{err}</p>}
        </div>
    )
}

export default AdminCouponsPage
