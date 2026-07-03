import React from 'react'
import axios from 'axios'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { serverUrl } from '../App'
import useGetNotifications from '../hooks/useGetNotifications'
import { setNotifications, setUnreadCount } from '../redux/notificationSlice'

function NotificationsPage() {
    const { notifications } = useSelector(state => state.notification)
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const refresh = useGetNotifications()

    const markAllRead = async () => {
        try {
            await axios.patch(`${serverUrl}/api/notification/read-all`, {}, { withCredentials: true })
            dispatch(setNotifications(notifications.map(n => ({ ...n, isRead: true }))))
            dispatch(setUnreadCount(0))
        } catch (error) {
            console.log(error)
        }
    }

    const openNotification = async (n) => {
        if (!n.isRead) {
            try {
                await axios.patch(`${serverUrl}/api/notification/${n._id}/read`, {}, { withCredentials: true })
                refresh()
            } catch (error) { console.log(error) }
        }
        if (n.data?.bookingId) navigate(`/bookings/${n.data.bookingId}`)
    }

    return (
        <div className='w-full min-h-[100vh] pt-[100px] pb-10 flex justify-center bg-[#fff9f6]'>
            <div className='w-full max-w-lg px-4'>
                <div className='flex items-center justify-between mb-4'>
                    <h1 className='text-xl font-bold text-gray-800'>Notifications</h1>
                    <button onClick={markAllRead} className='text-sm text-[#ff4d2d] font-medium'>Mark all read</button>
                </div>
                {notifications.length === 0 && <p className='text-center text-gray-400 mt-10'>You're all caught up.</p>}
                <div className='flex flex-col gap-2'>
                    {notifications.map(n => (
                        <div
                            key={n._id}
                            onClick={() => openNotification(n)}
                            className={`rounded-xl border p-4 cursor-pointer ${n.isRead ? "bg-white border-[#eee]" : "bg-[#fff5f0] border-[#ffd9c9]"}`}
                        >
                            <p className='font-semibold text-gray-800'>{n.title}</p>
                            <p className='text-sm text-gray-500 mt-0.5'>{n.message}</p>
                            <p className='text-xs text-gray-400 mt-1'>{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default NotificationsPage
