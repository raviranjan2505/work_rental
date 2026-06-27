import React from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import useGetMyChats from '../hooks/useGetMyChats'

function ChatListPage() {
    const { chats } = useSelector(state => state.chat)
    const { userData } = useSelector(state => state.user)
    const navigate = useNavigate()
    useGetMyChats()

    return (
        <div className='w-full min-h-[100vh] pt-[100px] pb-10 flex justify-center bg-[#fff9f6]'>
            <div className='w-full max-w-lg px-4'>
                <h1 className='text-xl font-bold text-gray-800 mb-4'>Messages</h1>
                {chats.length === 0 && <p className='text-center text-gray-400 mt-10'>No conversations yet.</p>}
                <div className='flex flex-col gap-2'>
                    {chats.map(c => {
                        const otherName = c.customer?._id === userData._id ? c.worker?.fullName : c.customer?.fullName
                        return (
                            <div
                                key={c._id}
                                onClick={() => navigate(`/chat/${c.booking?._id}`)}
                                className='bg-white rounded-xl border border-[#eee] p-4 cursor-pointer hover:shadow-md transition-shadow flex items-center justify-between'
                            >
                                <div>
                                    <p className='font-semibold text-gray-800'>{otherName}</p>
                                    <p className='text-sm text-gray-500 truncate max-w-[220px]'>{c.lastMessage || "Say hello 👋"}</p>
                                </div>
                                {c.lastMessageAt && (
                                    <span className='text-xs text-gray-400'>{new Date(c.lastMessageAt).toLocaleDateString()}</span>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default ChatListPage
