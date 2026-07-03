import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { serverUrl } from '../../App'

const primaryColor = "#ff4d2d"

function AdminSettingsPage() {
    const [depositAmount, setDepositAmount] = useState("")
    const [gracePeriodDays, setGracePeriodDays] = useState("")
    const [busy, setBusy] = useState(false)
    const [err, setErr] = useState("")
    const [msg, setMsg] = useState("")

    const [audience, setAudience] = useState("all")
    const [title, setTitle] = useState("")
    const [message, setMessage] = useState("")
    const [broadcasting, setBroadcasting] = useState(false)
    const [broadcastMsg, setBroadcastMsg] = useState("")

    const fetchSettings = async () => {
        try {
            const result = await axios.get(`${serverUrl}/api/settings`, { withCredentials: true })
            setDepositAmount(result.data.securityDepositAmount)
            setGracePeriodDays(result.data.gracePeriodDays)
        } catch (error) {
            setErr(error?.response?.data?.message || "could not load settings")
        }
    }

    useEffect(() => { fetchSettings() }, [])

    const saveSettings = async () => {
        setBusy(true); setErr(""); setMsg("")
        try {
            await axios.put(`${serverUrl}/api/settings`, {
                securityDepositAmount: Number(depositAmount),
                gracePeriodDays: Number(gracePeriodDays)
            }, { withCredentials: true })
            setMsg("Settings updated.")
        } catch (error) {
            setErr(error?.response?.data?.message || "could not update settings")
        } finally {
            setBusy(false)
        }
    }

    const sendBroadcast = async () => {
        if (!title || !message) return setErr("title and message are required for a broadcast")
        setBroadcasting(true); setErr(""); setBroadcastMsg("")
        try {
            const result = await axios.post(`${serverUrl}/api/admin/notify/broadcast`, { audience, title, message }, { withCredentials: true })
            setBroadcastMsg(result.data.message)
            setTitle(""); setMessage("")
        } catch (error) {
            setErr(error?.response?.data?.message || "could not send broadcast")
        } finally {
            setBroadcasting(false)
        }
    }

    return (
        <div>
            <h1 className='text-xl font-bold text-gray-800 mb-4'>Settings & Broadcast</h1>

            <div className='bg-white rounded-xl border border-[#eee] p-4 mb-6 max-w-md'>
                <p className='font-semibold text-gray-700 mb-3 text-sm'>Worker deposit & grace period</p>
                <div className='mb-3'>
                    <label className='block text-xs text-gray-500 mb-1'>Security deposit amount (₹)</label>
                    <input type="number" className='w-full border rounded-lg px-3 py-2 text-sm' style={{ borderColor: "#ddd" }} value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
                </div>
                <div className='mb-3'>
                    <label className='block text-xs text-gray-500 mb-1'>Grace period (days)</label>
                    <input type="number" className='w-full border rounded-lg px-3 py-2 text-sm' style={{ borderColor: "#ddd" }} value={gracePeriodDays} onChange={(e) => setGracePeriodDays(e.target.value)} />
                    <p className='text-xs text-gray-400 mt-1'>Workers with pending commission stay visible for this many days before being auto-suspended.</p>
                </div>
                <button disabled={busy} onClick={saveSettings} className='px-4 py-2 rounded-lg text-white text-sm font-semibold' style={{ backgroundColor: primaryColor }}>
                    Save settings
                </button>
                {msg && <p className='text-green-600 text-sm mt-2'>{msg}</p>}
            </div>

            <div className='bg-white rounded-xl border border-[#eee] p-4 max-w-md'>
                <p className='font-semibold text-gray-700 mb-3 text-sm'>Broadcast notification</p>
                <div className='mb-3'>
                    <label className='block text-xs text-gray-500 mb-1'>Audience</label>
                    <select className='w-full border rounded-lg px-3 py-2 text-sm' style={{ borderColor: "#ddd" }} value={audience} onChange={(e) => setAudience(e.target.value)}>
                        <option value="all">Everyone</option>
                        <option value="customer">Customers only</option>
                        <option value="worker">Workers only</option>
                    </select>
                </div>
                <input placeholder="Title" className='w-full border rounded-lg px-3 py-2 text-sm mb-2' style={{ borderColor: "#ddd" }} value={title} onChange={(e) => setTitle(e.target.value)} />
                <textarea placeholder="Message" rows={3} className='w-full border rounded-lg px-3 py-2 text-sm mb-3' style={{ borderColor: "#ddd" }} value={message} onChange={(e) => setMessage(e.target.value)} />
                <button disabled={broadcasting} onClick={sendBroadcast} className='px-4 py-2 rounded-lg text-white text-sm font-semibold' style={{ backgroundColor: primaryColor }}>
                    Send broadcast
                </button>
                {broadcastMsg && <p className='text-green-600 text-sm mt-2'>{broadcastMsg}</p>}
            </div>

            {err && <p className='text-red-500 text-sm mt-3'>*{err}</p>}
        </div>
    )
}

export default AdminSettingsPage
