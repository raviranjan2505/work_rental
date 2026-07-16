import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FaPaperPlane, FaImage, FaArrowLeft, FaTimes, FaCheck, FaCheckDouble } from 'react-icons/fa'
import { MdDoneAll } from 'react-icons/md'
import { serverUrl } from '../App'
import WorkerLayout from '../worker/WorkerLayout'
import { setActiveChat, setMessages } from '../redux/chatSlice'
import useChatMessageSocketEvent from '../hooks/useChatMessageSocketEvent'

function Avatar({ name = '', size = 38 }) {
    const colors = ['#ff4d2d', '#f97316', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']
    const color = colors[(name.charCodeAt(0) || 0) % colors.length]
    return (
        <div className='rounded-full flex items-center justify-center font-bold text-white shrink-0'
            style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>
            {name?.slice(0, 1)?.toUpperCase() || '?'}
        </div>
    )
}

function timeStr(date) {
    if (!date) return ''
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function dateDivider(date) {
    const d = new Date(date)
    const now = new Date()
    const diff = now - d
    if (diff < 86400000 && now.getDate() === d.getDate()) return 'Today'
    if (diff < 172800000) return 'Yesterday'
    return d.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ChatPage() {
    const { bookingId } = useParams()
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)
    const { activeChat, messages } = useSelector(state => state.chat)
    const [text, setText] = useState('')
    const [err, setErr] = useState('')
    const [sending, setSending] = useState(false)
    const [imagePreview, setImagePreview] = useState(null)
    const [imageFile, setImageFile] = useState(null)
    const fileInputRef = useRef(null)
    const bottomRef = useRef(null)
    const inputRef = useRef(null)
    const isWorker = userData?.role === 'worker'

    const loadChat = async () => {
        try {
            const startRes = await axios.post(`${serverUrl}/api/chat/start`, { bookingId }, { withCredentials: true })
            const chat = startRes.data
            const msgRes = await axios.get(`${serverUrl}/api/chat/${chat._id}/messages`, { withCredentials: true })
            dispatch(setActiveChat(msgRes.data.chat))
            dispatch(setMessages(msgRes.data.messages))
            axios.patch(`${serverUrl}/api/chat/${chat._id}/read`, {}, { withCredentials: true }).catch(() => {})
        } catch (error) {
            setErr(error?.response?.data?.message || 'Could not load chat')
        }
    }

    useEffect(() => {
        loadChat()
        return () => dispatch(setActiveChat(null))
    }, [bookingId])

    useChatMessageSocketEvent()

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages.length])

    const handleImagePick = (e) => {
        const file = e.target.files[0]
        if (!file) return
        setImageFile(file)
        setImagePreview(URL.createObjectURL(file))
        e.target.value = ''
    }

    const clearImage = () => {
        setImageFile(null)
        setImagePreview(null)
    }

    const send = async () => {
        if (!activeChat || (!text.trim() && !imageFile)) return
        setSending(true)
        try {
            const formData = new FormData()
            if (text.trim()) formData.append('text', text.trim())
            if (imageFile) formData.append('image', imageFile)
            const result = await axios.post(
                `${serverUrl}/api/chat/${activeChat._id}/message`,
                formData, { withCredentials: true }
            )
            dispatch(setMessages([...messages, result.data]))
            setText('')
            clearImage()
        } catch (error) {
            setErr(error?.response?.data?.message || 'Could not send message')
        } finally {
            setSending(false)
        }
    }

    if (err && !activeChat) {
        const errBody = (
            <div className={isWorker
                ? 'w-full min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-[#fff9f6] rounded-2xl'
                : 'w-full min-h-screen pt-[80px] flex flex-col items-center justify-center gap-4 bg-[#fff9f6]'}>
                <p className='text-5xl'>💬</p>
                <p className='text-gray-600 font-semibold'>{err}</p>
                <button onClick={() => navigate(-1)}
                    className='px-5 py-2 bg-[#ff4d2d] text-white rounded-full font-semibold text-sm'>Go Back</button>
            </div>
        )
        return isWorker ? <WorkerLayout>{errBody}</WorkerLayout> : errBody
    }

    if (!activeChat) {
        const loadingBody = (
            <div className={isWorker
                ? 'w-full min-h-[60vh] flex items-center justify-center bg-[#fff9f6] rounded-2xl'
                : 'w-full min-h-screen pt-[80px] flex items-center justify-center bg-[#fff9f6]'}>
                <div className='flex items-center gap-2 text-gray-400'>
                    <div className='w-5 h-5 border-2 border-[#ff4d2d]/30 border-t-[#ff4d2d] rounded-full animate-spin' />
                    <span className='text-sm'>Loading chat…</span>
                </div>
            </div>
        )
        return isWorker ? <WorkerLayout>{loadingBody}</WorkerLayout> : loadingBody
    }

    const otherName = activeChat.customer?._id === userData?._id
        ? activeChat.worker?.fullName
        : activeChat.customer?.fullName

    // Group messages by date for dividers
    const grouped = []
    let lastDate = ''
    messages.forEach(m => {
        const d = dateDivider(m.createdAt)
        if (d !== lastDate) { grouped.push({ type: 'divider', label: d }); lastDate = d }
        grouped.push({ type: 'message', data: m })
    })

    const chatBody = (
        <div
            className={isWorker
                ? 'w-full flex flex-col bg-[#fff9f6] rounded-2xl overflow-hidden border border-gray-100'
                : 'w-full h-screen flex flex-col bg-[#fff9f6]'}
            style={isWorker ? { height: 'calc(100vh - 6rem)' } : { paddingTop: 80 }}
        >

            {/* ── HEADER ── */}
            <div className='bg-white border-b border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3 shrink-0'>
                <button onClick={() => navigate('/chats')}
                    className='p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors'>
                    <FaArrowLeft size={15} />
                </button>
                <Avatar name={otherName} size={40} />
                <div className='flex-1 min-w-0'>
                    <p className='font-bold text-gray-800 text-sm truncate'>{otherName || 'Chat'}</p>
                    <p className='text-[11px] text-gray-400'>
                        Booking · <span className={`font-medium
                            ${activeChat.booking?.status === 'COMPLETED' ? 'text-green-600'
                            : activeChat.booking?.status === 'CONFIRMED' ? 'text-blue-600'
                            : 'text-orange-500'}`}>
                            {activeChat.booking?.status || 'Active'}
                        </span>
                    </p>
                </div>
            </div>

            {/* ── MESSAGES ── */}
            <div className='flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1'
                style={{ background: 'linear-gradient(135deg, #fff9f6 0%, #fff5f0 100%)' }}>

                {grouped.length === 0 && (
                    <div className='flex flex-col items-center justify-center h-full gap-3 text-center'>
                        <div className='w-16 h-16 bg-[#fff0eb] rounded-full flex items-center justify-center'>
                            <FaPaperPlane size={24} className='text-[#ff4d2d]' />
                        </div>
                        <p className='font-semibold text-gray-600'>Start the conversation</p>
                        <p className='text-xs text-gray-400'>Say hello to {otherName?.split(' ')[0]} 👋</p>
                    </div>
                )}

                {grouped.map((item, idx) => {
                    if (item.type === 'divider') {
                        return (
                            <div key={idx} className='flex items-center gap-3 my-3'>
                                <div className='flex-1 h-px bg-gray-200' />
                                <span className='text-[10px] text-gray-400 font-semibold px-2 bg-[#fff9f6] shrink-0'>{item.label}</span>
                                <div className='flex-1 h-px bg-gray-200' />
                            </div>
                        )
                    }

                    const m = item.data
                    const isMine = (m.sender?._id || m.sender) === userData?._id

                    return (
                        <div key={m._id || idx}
                            className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-0.5`}>

                            {!isMine && (
                                <Avatar name={otherName} size={26} />
                            )}

                            <div className={`max-w-[72%] md:max-w-[55%] ml-1.5 mr-1.5`}>
                                {/* image */}
                                {m.imageUrl && (
                                    <div className={`overflow-hidden rounded-2xl mb-1 ${isMine ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
                                        <img src={m.imageUrl} alt='shared'
                                            className='max-h-56 w-auto object-cover cursor-pointer'
                                            onClick={() => window.open(m.imageUrl, '_blank')} />
                                    </div>
                                )}
                                {/* text bubble */}
                                {m.text && (
                                    <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed
                                        ${isMine
                                            ? 'bg-[#ff4d2d] text-white rounded-br-sm'
                                            : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'}`}>
                                        {m.text}
                                    </div>
                                )}
                                {/* time */}
                                <p className={`text-[10px] mt-1 ${isMine ? 'text-right text-gray-400' : 'text-left text-gray-400'}`}>
                                    {timeStr(m.createdAt)}
                                    {isMine && <span className='ml-1 text-[#ff4d2d]/60'>✓✓</span>}
                                </p>
                            </div>
                        </div>
                    )
                })}

                <div ref={bottomRef} className='h-1' />
            </div>

            {/* ── IMAGE PREVIEW ── */}
            {imagePreview && (
                <div className='bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0'>
                    <div className='relative'>
                        <img src={imagePreview} alt='preview' className='h-16 w-16 rounded-xl object-cover' />
                        <button onClick={clearImage}
                            className='absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#ff4d2d] rounded-full flex items-center justify-center'>
                            <FaTimes size={9} className='text-white' />
                        </button>
                    </div>
                    <p className='text-xs text-gray-500'>Image ready to send</p>
                </div>
            )}

            {/* ── INPUT ── */}
            <div className='bg-white border-t border-gray-100 px-3 py-3 flex items-center gap-2 shrink-0 pb-safe'
                style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
                <input type='file' accept='image/*' ref={fileInputRef} hidden onChange={handleImagePick} />
                <button onClick={() => fileInputRef.current.click()}
                    className='p-2.5 rounded-xl text-gray-400 hover:text-[#ff4d2d] hover:bg-[#fff0eb] transition-colors'>
                    <FaImage size={17} />
                </button>
                <div className='flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 gap-2 focus-within:border-[#ff4d2d] transition-colors'>
                    <input
                        ref={inputRef}
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                        placeholder='Type a message…'
                        className='flex-1 py-2.5 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400'
                    />
                </div>
                <button
                    onClick={send}
                    disabled={sending || (!text.trim() && !imageFile)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0
                        ${(text.trim() || imageFile) && !sending
                            ? 'bg-[#ff4d2d] text-white hover:bg-[#e64323] shadow-md shadow-[#ff4d2d]/30'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                    {sending
                        ? <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                        : <FaPaperPlane size={14} />
                    }
                </button>
            </div>

            {err && (
                <div className='bg-red-50 border-t border-red-100 px-4 py-2 text-center'>
                    <p className='text-red-500 text-xs'>⚠ {err}</p>
                </div>
            )}
        </div>
    )

    if (isWorker) {
        return <WorkerLayout>{chatBody}</WorkerLayout>
    }

    return chatBody
}
