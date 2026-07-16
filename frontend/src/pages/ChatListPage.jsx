import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { FaSearch, FaCommentDots, FaChevronRight } from 'react-icons/fa'
import { MdBookmarkBorder } from 'react-icons/md'
import useGetMyChats from '../hooks/useGetMyChats'
import WorkerLayout from '../worker/WorkerLayout'

function timeLabel(date) {
    if (!date) return ''
    const d = new Date(date)
    const now = new Date()
    const diff = now - d
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' })
    return d.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

function Avatar({ name = '', size = 44 }) {
    const colors = ['#ff4d2d', '#f97316', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']
    const color = colors[(name.charCodeAt(0) || 0) % colors.length]
    return (
        <div className='rounded-full flex items-center justify-center font-bold text-white shrink-0 text-base'
            style={{ width: size, height: size, background: color }}>
            {name?.slice(0, 1)?.toUpperCase() || '?'}
        </div>
    )
}

export default function ChatListPage() {
    const { chats } = useSelector(state => state.chat)
    const { userData } = useSelector(state => state.user)
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const isWorker = userData?.role === 'worker'

    useGetMyChats()

    const filtered = chats.filter(c => {
        const other = c.customer?._id === userData?._id ? c.worker?.fullName : c.customer?.fullName
        return !search || other?.toLowerCase().includes(search.toLowerCase())
    })

    const content = (
        <div className={isWorker ? 'w-full bg-[#fff9f6] rounded-2xl' : 'w-full min-h-screen pt-[80px] pb-24 md:pb-10 bg-[#fff9f6]'}>
            <div className={isWorker ? 'w-full' : 'max-w-2xl mx-auto px-0 md:px-4'}>

                {/* ── header ── */}
                <div className={isWorker ? 'z-[700] bg-[#fff9f6] pb-3' : 'sticky top-[80px] z-[700] bg-[#fff9f6] px-4 pt-4 pb-3'}>
                    <div className='flex items-center justify-between mb-4'>
                        <h1 className='text-2xl font-extrabold text-gray-900'>Messages</h1>
                        <span className='text-xs text-gray-400 font-medium'>{chats.length} conversation{chats.length !== 1 ? 's' : ''}</span>
                    </div>
                    {/* search */}
                    <div className='flex items-center bg-white border border-gray-200 rounded-2xl px-3.5 gap-2.5 focus-within:border-[#ff4d2d] transition-colors shadow-sm'>
                        <FaSearch size={13} className='text-gray-400 shrink-0' />
                        <input
                            type='text' value={search} onChange={e => setSearch(e.target.value)}
                            placeholder='Search conversations…'
                            className='flex-1 py-3 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400'
                        />
                    </div>
                </div>

                {/* ── empty state ── */}
                {!userData && (
                    <div className='text-center py-24 px-6'>
                        <FaCommentDots size={48} className='text-gray-200 mx-auto mb-4' />
                        <p className='font-bold text-gray-700'>Sign in to view messages</p>
                        <button onClick={() => navigate('/signin')}
                            className='mt-4 px-6 py-2.5 bg-[#ff4d2d] text-white rounded-full font-semibold text-sm'>
                            Sign In
                        </button>
                    </div>
                )}

                {userData && filtered.length === 0 && (
                    <div className='text-center py-24 px-6'>
                        <FaCommentDots size={48} className='text-gray-200 mx-auto mb-4' />
                        <p className='font-bold text-gray-700 text-lg'>
                            {search ? 'No conversations match' : 'No messages yet'}
                        </p>
                        <p className='text-sm text-gray-400 mt-1'>
                            {search ? 'Try a different name' : 'Book a worker to start chatting'}
                        </p>
                        {!search && (
                            <button onClick={() => navigate('/')}
                                className='mt-4 px-6 py-2.5 bg-[#ff4d2d] text-white rounded-full font-semibold text-sm'>
                                Find Workers
                            </button>
                        )}
                    </div>
                )}

                {/* ── chat list ── */}
                {filtered.length > 0 && (
                    <div className='bg-white md:rounded-2xl md:border md:border-gray-100 md:shadow-sm overflow-hidden mx-0 md:mx-4 mt-2'>
                        {filtered.map((c, idx) => {
                            const isCustomer = c.customer?._id === userData?._id
                            const otherName = isCustomer ? c.worker?.fullName : c.customer?.fullName
                            const preview = c.lastMessage || 'Say hello 👋'
                            const time = timeLabel(c.lastMessageAt)
                            const bookingStatus = c.booking?.status

                            return (
                                <div key={c._id}>
                                    {idx > 0 && <div className='h-px bg-gray-50 mx-4' />}
                                    <div
                                        onClick={() => navigate(`/chat/${c.booking?._id}`)}
                                        className='flex items-center gap-3.5 px-4 py-3.5 hover:bg-[#fff9f6] cursor-pointer transition-colors active:bg-gray-50'
                                    >
                                        <Avatar name={otherName} size={50} />

                                        <div className='flex-1 min-w-0'>
                                            <div className='flex items-center justify-between gap-2'>
                                                <p className='font-bold text-gray-800 text-sm truncate'>{otherName || 'Unknown'}</p>
                                                <span className='text-[10px] text-gray-400 shrink-0'>{time}</span>
                                            </div>
                                            <p className='text-xs text-gray-500 truncate mt-0.5 max-w-[260px]'>
                                                {preview}
                                            </p>
                                            {bookingStatus && (
                                                <span className={`inline-block mt-1 text-[9px] font-semibold px-2 py-0.5 rounded-full
                                                    ${bookingStatus === 'COMPLETED' ? 'bg-green-50 text-green-600'
                                                    : bookingStatus === 'CONFIRMED' ? 'bg-blue-50 text-blue-600'
                                                    : 'bg-orange-50 text-orange-500'}`}>
                                                    {bookingStatus}
                                                </span>
                                            )}
                                        </div>

                                        <FaChevronRight size={11} className='text-gray-300 shrink-0' />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )

    if (isWorker) {
        return <WorkerLayout>{content}</WorkerLayout>
    }

    return content
}
