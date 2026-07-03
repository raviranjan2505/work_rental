import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { serverUrl } from '../../App'

const primaryColor = "#ff4d2d"
const GROUPS = ["Home Services", "Technical Services", "Labour Services", "Delivery Services", "Assistant Services"]

function AdminCategoriesPage() {
    const [categories, setCategories] = useState([])
    const [globalPercent, setGlobalPercent] = useState("")
    const [newGlobalPercent, setNewGlobalPercent] = useState("")
    const [err, setErr] = useState("")
    const [msg, setMsg] = useState("")
    const [busy, setBusy] = useState(false)

    const [newName, setNewName] = useState("")
    const [newGroup, setNewGroup] = useState(GROUPS[0])
    const [newCommission, setNewCommission] = useState("")

    const fetchAll = async () => {
        try {
            const [catRes, commRes] = await Promise.all([
                axios.get(`${serverUrl}/api/category/admin/all`, { withCredentials: true }),
                axios.get(`${serverUrl}/api/commission`, { withCredentials: true })
            ])
            setCategories(catRes.data)
            setGlobalPercent(commRes.data.globalPercent)
        } catch (error) {
            setErr(error?.response?.data?.message || "could not load categories")
        }
    }

    useEffect(() => { fetchAll() }, [])

    const createCategory = async () => {
        if (!newName) return setErr("category name is required")
        setBusy(true); setErr(""); setMsg("")
        try {
            await axios.post(`${serverUrl}/api/category`, {
                name: newName, group: newGroup,
                commissionPercent: newCommission === "" ? null : Number(newCommission)
            }, { withCredentials: true })
            setNewName(""); setNewCommission("")
            setMsg("Category created.")
            fetchAll()
        } catch (error) {
            setErr(error?.response?.data?.message || "could not create category")
        } finally {
            setBusy(false)
        }
    }

    const updateCommission = async (categoryId, value) => {
        setBusy(true); setErr("")
        try {
            await axios.put(`${serverUrl}/api/category/${categoryId}`, {
                commissionPercent: value === "" ? null : Number(value)
            }, { withCredentials: true })
            fetchAll()
        } catch (error) {
            setErr(error?.response?.data?.message || "could not update commission")
        } finally {
            setBusy(false)
        }
    }

    const toggleActive = async (categoryId, isActive) => {
        setBusy(true); setErr("")
        try {
            await axios.put(`${serverUrl}/api/category/${categoryId}`, { isActive }, { withCredentials: true })
            fetchAll()
        } catch (error) {
            setErr(error?.response?.data?.message || "could not update category")
        } finally {
            setBusy(false)
        }
    }

    const deleteCategory = async (categoryId) => {
        if (!window.confirm("Delete this category? Workers already in it will keep their reference but it won't show in search.")) return
        setBusy(true); setErr("")
        try {
            await axios.delete(`${serverUrl}/api/category/${categoryId}`, { withCredentials: true })
            fetchAll()
        } catch (error) {
            setErr(error?.response?.data?.message || "could not delete category")
        } finally {
            setBusy(false)
        }
    }

    const submitGlobalCommission = async () => {
        if (newGlobalPercent === "") return
        setBusy(true); setErr(""); setMsg("")
        try {
            await axios.post(`${serverUrl}/api/commission/global`, { percent: Number(newGlobalPercent) }, { withCredentials: true })
            setNewGlobalPercent("")
            setMsg("Global commission updated.")
            fetchAll()
        } catch (error) {
            setErr(error?.response?.data?.message || "could not update global commission")
        } finally {
            setBusy(false)
        }
    }

    const groupedCategories = GROUPS.map(g => ({ group: g, items: categories.filter(c => c.group === g) }))

    return (
        <div>
            <h1 className='text-xl font-bold text-gray-800 mb-4'>Categories & Commission</h1>

            <div className='bg-white rounded-xl border border-[#eee] p-4 mb-6'>
                <p className='font-semibold text-gray-700 mb-2 text-sm'>Global default commission</p>
                <p className='text-sm text-gray-500 mb-3'>Currently <strong>{globalPercent}%</strong> — applies to any category without its own override below.</p>
                <div className='flex gap-2 max-w-xs'>
                    <input type="number" min="0" max="100" placeholder="New %" className='border rounded-lg px-3 py-2 text-sm flex-1' style={{ borderColor: "#ddd" }} value={newGlobalPercent} onChange={(e) => setNewGlobalPercent(e.target.value)} />
                    <button disabled={busy} onClick={submitGlobalCommission} className='px-4 rounded-lg text-white text-sm font-semibold' style={{ backgroundColor: primaryColor }}>Update</button>
                </div>
            </div>

            <div className='bg-white rounded-xl border border-[#eee] p-4 mb-6'>
                <p className='font-semibold text-gray-700 mb-3 text-sm'>Add a category</p>
                <div className='grid grid-cols-4 gap-2'>
                    <input placeholder="Name" className='border rounded-lg px-3 py-2 text-sm' style={{ borderColor: "#ddd" }} value={newName} onChange={(e) => setNewName(e.target.value)} />
                    <select className='border rounded-lg px-3 py-2 text-sm' style={{ borderColor: "#ddd" }} value={newGroup} onChange={(e) => setNewGroup(e.target.value)}>
                        {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <input type="number" placeholder="Commission % (optional)" className='border rounded-lg px-3 py-2 text-sm' style={{ borderColor: "#ddd" }} value={newCommission} onChange={(e) => setNewCommission(e.target.value)} />
                    <button disabled={busy} onClick={createCategory} className='px-3 rounded-lg text-white text-sm font-semibold' style={{ backgroundColor: primaryColor }}>Add</button>
                </div>
            </div>

            {groupedCategories.map(({ group, items }) => items.length > 0 && (
                <div key={group} className='mb-5'>
                    <p className='text-sm font-semibold text-gray-600 mb-2'>{group}</p>
                    <div className='bg-white rounded-xl border border-[#eee] overflow-hidden'>
                        <table className='w-full text-sm'>
                            <thead>
                                <tr className='text-left text-gray-400 border-b border-[#f0f0f0]'>
                                    <th className='py-2 px-3'>Name</th>
                                    <th className='py-2 px-3'>Commission %</th>
                                    <th className='py-2 px-3'>Active</th>
                                    <th className='py-2 px-3'></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(c => (
                                    <tr key={c._id} className='border-b border-[#f7f7f7]'>
                                        <td className='py-2 px-3 font-medium text-gray-700'>{c.name}</td>
                                        <td className='py-2 px-3'>
                                            <input
                                                type="number" min="0" max="100" placeholder="default"
                                                defaultValue={c.commissionPercent ?? ""}
                                                onBlur={(e) => updateCommission(c._id, e.target.value)}
                                                className='border rounded px-2 py-1 w-24 text-sm' style={{ borderColor: "#ddd" }}
                                            />
                                        </td>
                                        <td className='py-2 px-3'>
                                            <button onClick={() => toggleActive(c._id, !c.isActive)} className={`text-xs px-2 py-1 rounded ${c.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                                {c.isActive ? "Active" : "Inactive"}
                                            </button>
                                        </td>
                                        <td className='py-2 px-3'>
                                            <button onClick={() => deleteCategory(c._id)} className='text-xs text-red-500'>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}

            {msg && <p className='text-green-600 text-sm mt-2'>{msg}</p>}
            {err && <p className='text-red-500 text-sm mt-2'>*{err}</p>}
        </div>
    )
}

export default AdminCategoriesPage
