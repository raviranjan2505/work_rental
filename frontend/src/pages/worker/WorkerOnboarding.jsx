import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { FaUser, FaTools, FaIdCard, FaCheckCircle, FaUpload, FaImage } from 'react-icons/fa'
import { MdVerified } from 'react-icons/md'
import { ClipLoader } from 'react-spinners'
import WorkerLayout from '../../worker/WorkerLayout'
import { serverUrl } from '../../App'
import useGetCategories from '../../hooks/useGetCategories'
import useGetMyWorkerProfile from '../../hooks/useGetMyWorkerProfile'
import { setMyWorkerProfile } from '../../redux/workerSlice'

const SECTIONS = [
    { id: 'profile',   label: 'Basic Info',  icon: FaUser    },
    { id: 'rates',     label: 'Rates',       icon: FaTools   },
    { id: 'kyc',       label: 'KYC Docs',    icon: FaIdCard  },
]

function SectionCard({ title, icon: Icon, children }) {
    return (
        <div className='bg-white rounded-xl border border-[#eee] overflow-hidden mb-4'>
            <div className='flex items-center gap-3 px-5 py-4 border-b border-[#f0f0f0] bg-[#fafafa]'>
                <div className='w-8 h-8 rounded-lg bg-[#fff0eb] flex items-center justify-center shrink-0'>
                    <Icon size={14} className='text-[#ff4d2d]' />
                </div>
                <p className='font-bold text-gray-800'>{title}</p>
            </div>
            <div className='px-5 py-5'>{children}</div>
        </div>
    )
}

function Field({ label, required, hint, children }) {
    return (
        <div>
            <label className='text-xs font-bold text-gray-500 block mb-1.5'>
                {label}{required && <span className='text-red-400 ml-0.5'>*</span>}
            </label>
            {children}
            {hint && <p className='text-[10px] text-gray-400 mt-1'>{hint}</p>}
        </div>
    )
}

const inp = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#ff4d2d] transition-colors bg-white'

function FileUploadBox({ label, onChange, current, accept = 'image/*,.pdf' }) {
    const [preview, setPreview] = useState(null)
    const handleChange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        onChange(file)
        if (file.type.startsWith('image/')) setPreview(URL.createObjectURL(file))
    }
    return (
        <label className='block cursor-pointer'>
            <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors hover:border-[#ff4d2d] hover:bg-[#fff9f6]
                ${preview || current ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-[#fafafa]'}`}>
                {preview ? (
                    <img src={preview} alt='' className='w-20 h-20 object-cover rounded-lg mx-auto mb-2' />
                ) : current ? (
                    <FaCheckCircle size={24} className='text-green-500 mx-auto mb-2' />
                ) : (
                    <FaUpload size={20} className='text-gray-400 mx-auto mb-2' />
                )}
                <p className='text-xs font-semibold text-gray-600'>{label}</p>
                <p className='text-[10px] text-gray-400 mt-0.5'>
                    {preview || current ? 'Click to replace' : 'Click to upload'}
                </p>
            </div>
            <input type='file' accept={accept} hidden onChange={handleChange} />
        </label>
    )
}

export default function WorkerOnboarding() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { categories }      = useSelector(s => s.worker)
    const { myWorkerProfile } = useSelector(s => s.worker)

    useGetCategories()
    useGetMyWorkerProfile()

    const [categoryId,      setCategoryId]      = useState('')
    const [experienceYears, setExperienceYears] = useState(0)
    const [skills,          setSkills]          = useState('')
    const [hourlyRate,      setHourlyRate]      = useState('')
    const [dailyRate,       setDailyRate]       = useState('')
    const [aadhaarNumber,   setAadhaarNumber]   = useState('')
    const [panNumber,       setPanNumber]       = useState('')
    const [profileImage,    setProfileImage]    = useState(null)
    const [aadhaarDoc,      setAadhaarDoc]      = useState(null)
    const [panDoc,          setPanDoc]          = useState(null)
    const [selfie,          setSelfie]          = useState(null)
    const [loading,         setLoading]         = useState(false)
    const [err,             setErr]             = useState('')
    const [success,         setSuccess]         = useState(false)

    useEffect(() => {
        if (myWorkerProfile) {
            setCategoryId(myWorkerProfile.category?._id || '')
            setExperienceYears(myWorkerProfile.experienceYears || 0)
            setSkills((myWorkerProfile.skills || []).join(', '))
            setHourlyRate(myWorkerProfile.hourlyRate || '')
            setDailyRate(myWorkerProfile.dailyRate || '')
            setAadhaarNumber(myWorkerProfile.kyc?.aadhaarNumber || '')
            setPanNumber(myWorkerProfile.kyc?.panNumber || '')
        }
    }, [myWorkerProfile])

    const handleSubmit = async () => {
        setErr(''); setSuccess(false)
        if (!categoryId) return setErr('Please select a category')
        if (!hourlyRate) return setErr('Please enter your hourly rate')
        setLoading(true)
        try {
            const fd = new FormData()
            fd.append('categoryId', categoryId)
            fd.append('experienceYears', experienceYears)
            fd.append('hourlyRate', hourlyRate)
            fd.append('dailyRate', dailyRate)
            fd.append('skills', JSON.stringify(skills.split(',').map(s => s.trim()).filter(Boolean)))
            fd.append('aadhaarNumber', aadhaarNumber)
            fd.append('panNumber', panNumber)
            if (profileImage) fd.append('profileImage', profileImage)
            if (aadhaarDoc)   fd.append('aadhaarDoc', aadhaarDoc)
            if (panDoc)       fd.append('panDoc', panDoc)
            if (selfie)       fd.append('selfie', selfie)

            const res = await axios.post(`${serverUrl}/api/worker/profile`, fd, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            dispatch(setMyWorkerProfile(res.data))
            setSuccess(true)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } catch (e) { setErr(e?.response?.data?.message || 'Something went wrong') }
        finally { setLoading(false) }
    }

    const kyc = myWorkerProfile?.kyc

    return (
        <WorkerLayout>
            {/* header */}
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6'>
                <div>
                    <h1 className='text-2xl font-extrabold text-gray-800'>Edit Profile</h1>
                    <p className='text-sm text-gray-400 mt-0.5'>Update your information visible to customers</p>
                </div>
                {kyc?.isVerified && (
                    <div className='flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-xl'>
                        <MdVerified size={18} className='text-green-600' />
                        <p className='text-sm font-bold text-green-700'>KYC Verified</p>
                    </div>
                )}
            </div>

            {success && (
                <div className='flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-5'>
                    <FaCheckCircle className='text-green-500 shrink-0' />
                    <p className='font-semibold text-green-700 text-sm'>Profile saved successfully!</p>
                </div>
            )}
            {err && (
                <div className='bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-5 text-red-600 text-sm'>
                    ⚠ {err}
                </div>
            )}

            {/* KYC status banner */}
            {kyc && !kyc.isVerified && (
                <div className='flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl px-5 py-4 mb-5'>
                    <span className='text-lg'>⏳</span>
                    <div>
                        <p className='font-bold text-orange-700 text-sm'>KYC Under Review</p>
                        <p className='text-orange-600 text-xs mt-0.5'>Your documents are being verified by the admin team. This usually takes 1–2 business days.</p>
                    </div>
                </div>
            )}

            {/* Section 1 – Basic Info */}
            <SectionCard title='Basic Information' icon={FaUser}>
                <div className='grid md:grid-cols-2 gap-4'>
                    <Field label='Service Category' required>
                        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={inp}>
                            <option value=''>Select a category</option>
                            {categories.map(c => (
                                <option key={c._id} value={c._id}>{c.group} — {c.name}</option>
                            ))}
                        </select>
                    </Field>
                    <Field label='Experience' required hint='Years of professional experience'>
                        <input type='number' min='0' value={experienceYears} onChange={e => setExperienceYears(e.target.value)} className={inp} />
                    </Field>
                    <Field label='Skills' hint='Comma-separated: e.g. wiring, AC repair, fan installation' className='md:col-span-2'>
                        <input type='text' value={skills} onChange={e => setSkills(e.target.value)}
                            placeholder='wiring, AC repair, fan installation…' className={inp} />
                    </Field>
                    <Field label='Profile Photo'>
                        <FileUploadBox label='Profile Photo' accept='image/*'
                            onChange={setProfileImage}
                            current={myWorkerProfile?.profileImage} />
                    </Field>
                </div>
            </SectionCard>

            {/* Section 2 – Rates */}
            <SectionCard title='Rates & Pricing' icon={FaTools}>
                <div className='grid md:grid-cols-2 gap-4'>
                    <Field label='Hourly Rate (₹)' required>
                        <div className='relative'>
                            <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm'>₹</span>
                            <input type='number' min='0' value={hourlyRate} onChange={e => setHourlyRate(e.target.value)}
                                placeholder='e.g. 150' className={inp + ' pl-7'} />
                        </div>
                    </Field>
                    <Field label='Daily Rate (₹)' hint='Optional'>
                        <div className='relative'>
                            <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm'>₹</span>
                            <input type='number' min='0' value={dailyRate} onChange={e => setDailyRate(e.target.value)}
                                placeholder='e.g. 800' className={inp + ' pl-7'} />
                        </div>
                    </Field>
                </div>
            </SectionCard>

            {/* Section 3 – KYC */}
            <SectionCard title='KYC Documents' icon={FaIdCard}>
                {kyc?.isVerified ? (
                    <div className='flex items-center gap-3 bg-green-50 rounded-xl p-4'>
                        <FaCheckCircle size={20} className='text-green-500 shrink-0' />
                        <div>
                            <p className='font-bold text-green-700 text-sm'>Documents Verified</p>
                            <p className='text-green-600 text-xs mt-0.5'>Your KYC is complete. You can still update documents if needed.</p>
                        </div>
                    </div>
                ) : (
                    <p className='text-xs text-gray-400 mb-4 bg-[#f7f7f8] rounded-lg px-3 py-2'>
                        📌 Upload clear, legible images. Documents are reviewed by the admin team within 1–2 business days.
                    </p>
                )}
                <div className='grid md:grid-cols-2 gap-4 mt-4'>
                    <Field label='Aadhaar Number'>
                        <input type='text' value={aadhaarNumber} onChange={e => setAadhaarNumber(e.target.value)}
                            placeholder='1234 5678 9012' maxLength={12} className={inp} />
                    </Field>
                    <Field label='PAN Number'>
                        <input type='text' value={panNumber} onChange={e => setPanNumber(e.target.value)}
                            placeholder='ABCDE1234F' maxLength={10}
                            className={inp + ' uppercase'} />
                    </Field>
                </div>
                <div className='grid grid-cols-3 gap-3 mt-4'>
                    <Field label='Aadhaar Document'>
                        <FileUploadBox label='Upload Aadhaar'
                            onChange={setAadhaarDoc}
                            current={kyc?.aadhaarDoc} />
                    </Field>
                    <Field label='PAN Document'>
                        <FileUploadBox label='Upload PAN'
                            onChange={setPanDoc}
                            current={kyc?.panDoc} />
                    </Field>
                    <Field label='Selfie' hint='Clear face photo'>
                        <FileUploadBox label='Upload Selfie' accept='image/*'
                            onChange={setSelfie}
                            current={kyc?.selfie} />
                    </Field>
                </div>
            </SectionCard>

            {/* save */}
            <div className='flex items-center justify-end gap-3 mt-2'>
                <button onClick={() => navigate('/')}
                    className='px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:border-gray-300 transition-colors'>
                    Cancel
                </button>
                <button onClick={handleSubmit} disabled={loading}
                    className='px-8 py-2.5 bg-[#ff4d2d] hover:bg-[#e64323] text-white font-extrabold rounded-xl transition-colors shadow-lg shadow-[#ff4d2d]/20 flex items-center gap-2'>
                    {loading ? <ClipLoader size={16} color='white' /> : ''}
                    {loading ? 'Saving…' : 'Save Profile'}
                </button>
            </div>
        </WorkerLayout>
    )
}
