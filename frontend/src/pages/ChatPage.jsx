import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FaPaperPlane, FaImage } from "react-icons/fa"
import { serverUrl } from '../App'
import { setActiveChat, setMessages } from '../redux/chatSlice'
import useChatMessageSocketEvent from '../hooks/useChatMessageSocketEvent'

const primaryColor = "#ff4d2d"

function ChatPage() {
    const { bookingId } = useParams()
    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)
    const { activeChat, messages } = useSelector(state => state.chat)
    const [text, setText] = useState("")
    const [err, setErr] = useState("")
    const [sending, setSending] = useState(false)
    const fileInputRef = useRef(null)
    const bottomRef = useRef(null)

    const loadChat = async () => {
        try {
            const startRes = await axios.post(`${serverUrl}/api/chat/start`, { bookingId }, { withCredentials: true })
            const chat = startRes.data
            const msgRes = await axios.get(`${serverUrl}/api/chat/${chat._id}/messages`, { withCredentials: true })
            dispatch(setActiveChat(msgRes.data.chat))
            dispatch(setMessages(msgRes.data.messages))
            axios.patch(`${serverUrl}/api/chat/${chat._id}/read`, {}, { withCredentials: true }).catch(() => {})
        } catch (error) {
            setErr(error?.response?.data?.message || "could not load chat")
        }
    }

    useEffect(() => {
        loadChat()
        return () => dispatch(setActiveChat(null))
    }, [bookingId])

    useChatMessageSocketEvent()

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages.length])

    const send = async (file) => {
        if (!activeChat || (!text.trim() && !file)) return
        setSending(true)
        try {
            const formData = new FormData()
            if (text.trim()) formData.append("text", text.trim())
            if (file) formData.append("image", file)
            const result = await axios.post(`${serverUrl}/api/chat/${activeChat._id}/message`, formData, { withCredentials: true })
            dispatch(setMessages([...messages, result.data]))
            setText("")
        } catch (error) {
            setErr(error?.response?.data?.message || "could not send message")
        } finally {
            setSending(false)
        }
    }

    if (err && !activeChat) {
        return <div className='pt-[120px] text-center text-gray-500'>{err}</div>
    }
    if (!activeChat) {
        return <div className='pt-[120px] text-center text-gray-400'>Loading…</div>
    }

    const otherPartyName = activeChat.customer?._id === userData._id ? activeChat.worker?.fullName : activeChat.customer?.fullName

    return (
        <div className='w-full min-h-[100vh] pt-[90px] pb-4 flex justify-center bg-[#fff9f6]'>
            <div className='w-full max-w-lg flex flex-col px-4' style={{ height: "calc(100vh - 90px)" }}>
                <div className='bg-white rounded-t-xl border border-[#eee] px-4 py-3'>
                    <p className='font-semibold text-gray-800'>{otherPartyName}</p>
                </div>

                <div className='flex-1 bg-white border-x border-[#eee] overflow-y-auto px-4 py-3 flex flex-col gap-2'>
                    {messages.map(m => {
                        const isMine = (m.sender?._id || m.sender) === userData._id
                        return (
                            <div key={m._id} className={`max-w-[75%] rounded-2xl px-3 py-2 ${isMine ? "self-end text-white" : "self-start bg-gray-100 text-gray-800"}`}
                                style={isMine ? { backgroundColor: primaryColor } : {}}>
                                {m.imageUrl && <img src={m.imageUrl} alt="shared" className='rounded-lg mb-1 max-h-48 object-cover' />}
                                {m.text && <p className='text-sm'>{m.text}</p>}
                            </div>
                        )
                    })}
                    <div ref={bottomRef} />
                </div>

                <div className='bg-white rounded-b-xl border border-[#eee] p-3 flex items-center gap-2'>
                    <input type="file" accept="image/*" ref={fileInputRef} hidden onChange={(e) => { if (e.target.files[0]) send(e.target.files[0]); e.target.value = "" }} />
                    <button onClick={() => fileInputRef.current.click()} className='text-gray-400 p-2'>
                        <FaImage size={18} />
                    </button>
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") send() }}
                        placeholder="Type a message…"
                        className='flex-1 border rounded-full px-4 py-2 text-sm'
                        style={{ borderColor: "#ddd" }}
                    />
                    <button onClick={() => send()} disabled={sending} className='p-2 rounded-full text-white' style={{ backgroundColor: primaryColor }}>
                        <FaPaperPlane size={14} />
                    </button>
                </div>
                {err && <p className='text-red-500 text-xs text-center mt-2'>*{err}</p>}
            </div>
        </div>
    )
}

export default ChatPage
