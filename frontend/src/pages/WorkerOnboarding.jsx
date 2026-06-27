import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { ClipLoader } from 'react-spinners'
import { serverUrl } from '../App'
import useGetCategories from '../hooks/useGetCategories'
import useGetMyWorkerProfile from '../hooks/useGetMyWorkerProfile'
import { setMyWorkerProfile } from '../redux/workerSlice'

const borderColor = "#ddd"
const primaryColor = "#ff4d2d"

function WorkerOnboarding() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { categories } = useSelector(state => state.worker)
    const { myWorkerProfile } = useSelector(state => state.worker)
    useGetCategories()
    useGetMyWorkerProfile()

    const [categoryId, setCategoryId] = useState("")
    const [experienceYears, setExperienceYears] = useState(0)
    const [skills, setSkills] = useState("")
    const [hourlyRate, setHourlyRate] = useState("")
    const [dailyRate, setDailyRate] = useState("")
    const [aadhaarNumber, setAadhaarNumber] = useState("")
    const [panNumber, setPanNumber] = useState("")
    const [profileImage, setProfileImage] = useState(null)
    const [aadhaarDoc, setAadhaarDoc] = useState(null)
    const [panDoc, setPanDoc] = useState(null)
    const [selfie, setSelfie] = useState(null)
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState("")

    useEffect(() => {
        if (myWorkerProfile) {
            setCategoryId(myWorkerProfile.category?._id || "")
            setExperienceYears(myWorkerProfile.experienceYears || 0)
            setSkills((myWorkerProfile.skills || []).join(", "))
            setHourlyRate(myWorkerProfile.hourlyRate || "")
            setDailyRate(myWorkerProfile.dailyRate || "")
            setAadhaarNumber(myWorkerProfile.kyc?.aadhaarNumber || "")
            setPanNumber(myWorkerProfile.kyc?.panNumber || "")
        }
    }, [myWorkerProfile])

    const handleSubmit = async () => {
        setErr("")
        if (!categoryId) {
            return setErr("please select a category")
        }
        setLoading(true)
        try {
            const formData = new FormData()
            formData.append("categoryId", categoryId)
            formData.append("experienceYears", experienceYears)
            formData.append("hourlyRate", hourlyRate)
            formData.append("dailyRate", dailyRate)
            formData.append("skills", JSON.stringify(skills.split(",").map(s => s.trim()).filter(Boolean)))
            formData.append("aadhaarNumber", aadhaarNumber)
            formData.append("panNumber", panNumber)
            if (profileImage) formData.append("profileImage", profileImage)
            if (aadhaarDoc) formData.append("aadhaarDoc", aadhaarDoc)
            if (panDoc) formData.append("panDoc", panDoc)
            if (selfie) formData.append("selfie", selfie)

            const result = await axios.post(`${serverUrl}/api/worker/profile`, formData, {
                withCredentials: true,
                headers: { "Content-Type": "multipart/form-data" }
            })
            dispatch(setMyWorkerProfile(result.data))
            navigate("/")
        } catch (error) {
            setErr(error?.response?.data?.message || "something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='w-full min-h-[100vh] pt-[100px] pb-10 flex justify-center bg-[#fff9f6]'>
            <div className='bg-white rounded-xl shadow-lg w-full max-w-lg p-8 border' style={{ border: `1px solid ${borderColor}` }}>
                <h1 className='text-2xl font-bold mb-1' style={{ color: primaryColor }}>Worker profile</h1>
                <p className='text-gray-500 mb-6 text-sm'>This information is what customers see when they search for workers nearby.</p>

                <div className='mb-4'>
                    <label className='block text-gray-700 font-medium mb-1 text-sm'>Category</label>
                    <select
                        className='w-full border rounded-lg px-3 py-2 focus:outline-none'
                        style={{ border: `1px solid ${borderColor}` }}
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                    >
                        <option value="">Select a category</option>
                        {categories.map(c => (
                            <option key={c._id} value={c._id}>{c.group} — {c.name}</option>
                        ))}
                    </select>
                </div>

                <div className='grid grid-cols-2 gap-3 mb-4'>
                    <div>
                        <label className='block text-gray-700 font-medium mb-1 text-sm'>Hourly rate (₹)</label>
                        <input type="number" min="0" className='w-full border rounded-lg px-3 py-2' style={{ border: `1px solid ${borderColor}` }} value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
                    </div>
                    <div>
                        <label className='block text-gray-700 font-medium mb-1 text-sm'>Daily rate (₹)</label>
                        <input type="number" min="0" className='w-full border rounded-lg px-3 py-2' style={{ border: `1px solid ${borderColor}` }} value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} />
                    </div>
                </div>

                <div className='mb-4'>
                    <label className='block text-gray-700 font-medium mb-1 text-sm'>Experience (years)</label>
                    <input type="number" min="0" className='w-full border rounded-lg px-3 py-2' style={{ border: `1px solid ${borderColor}` }} value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} />
                </div>

                <div className='mb-4'>
                    <label className='block text-gray-700 font-medium mb-1 text-sm'>Skills (comma separated)</label>
                    <input type="text" placeholder="e.g. wiring, AC repair, fan installation" className='w-full border rounded-lg px-3 py-2' style={{ border: `1px solid ${borderColor}` }} value={skills} onChange={(e) => setSkills(e.target.value)} />
                </div>

                <div className='mb-4'>
                    <label className='block text-gray-700 font-medium mb-1 text-sm'>Profile photo</label>
                    <input type="file" accept="image/*" onChange={(e) => setProfileImage(e.target.files[0])} />
                </div>

                <hr className='my-5' style={{ borderColor }} />
                <p className='font-medium text-gray-700 mb-3 text-sm'>KYC verification</p>

                <div className='grid grid-cols-2 gap-3 mb-4'>
                    <div>
                        <label className='block text-gray-700 mb-1 text-sm'>Aadhaar number</label>
                        <input type="text" className='w-full border rounded-lg px-3 py-2' style={{ border: `1px solid ${borderColor}` }} value={aadhaarNumber} onChange={(e) => setAadhaarNumber(e.target.value)} />
                    </div>
                    <div>
                        <label className='block text-gray-700 mb-1 text-sm'>PAN number</label>
                        <input type="text" className='w-full border rounded-lg px-3 py-2' style={{ border: `1px solid ${borderColor}` }} value={panNumber} onChange={(e) => setPanNumber(e.target.value)} />
                    </div>
                </div>

                <div className='mb-3'>
                    <label className='block text-gray-700 mb-1 text-sm'>Upload Aadhaar</label>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => setAadhaarDoc(e.target.files[0])} />
                </div>
                <div className='mb-3'>
                    <label className='block text-gray-700 mb-1 text-sm'>Upload PAN</label>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => setPanDoc(e.target.files[0])} />
                </div>
                <div className='mb-6'>
                    <label className='block text-gray-700 mb-1 text-sm'>Upload selfie</label>
                    <input type="file" accept="image/*" onChange={(e) => setSelfie(e.target.files[0])} />
                </div>

                {myWorkerProfile?.kyc && (
                    <p className='text-xs mb-4 text-gray-500'>
                        KYC status: <span className={myWorkerProfile.kyc.isVerified ? "text-green-600 font-medium" : "text-orange-600 font-medium"}>
                            {myWorkerProfile.kyc.isVerified ? "Verified" : "Pending admin review"}
                        </span>
                    </p>
                )}

                <button
                    className='w-full font-semibold py-2 rounded-lg bg-[#ff4d2d] text-white hover:bg-[#e64323] transition-colors'
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? <ClipLoader size={20} color='white' /> : "Save profile"}
                </button>
                {err && <p className='text-red-500 text-center mt-3 text-sm'>*{err}</p>}
            </div>
        </div>
    )
}

export default WorkerOnboarding
