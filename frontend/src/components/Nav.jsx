import React, { useState } from 'react'
import { FaLocationDot } from "react-icons/fa6"
import { FaBell, FaComment } from "react-icons/fa"
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { serverUrl } from '../App'
import { setUserData } from '../redux/userSlice'
import { useNavigate } from 'react-router-dom'
import useGetNotifications from '../hooks/useGetNotifications'
import useNotificationSocketEvents from '../hooks/useNotificationSocketEvents'

function Nav() {
    const { userData, currentCity } = useSelector(state => state.user)
    const { unreadCount } = useSelector(state => state.notification)
    const [showInfo, setShowInfo] = useState(false)
    const dispatch = useDispatch()
    const navigate = useNavigate()

    useGetNotifications()
    useNotificationSocketEvents()

    const handleLogOut = async () => {
        try {
            await axios.get(`${serverUrl}/api/auth/signout`, { withCredentials: true })
            dispatch(setUserData(null))
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className='w-full h-[80px] flex items-center justify-between px-[20px] fixed top-0 z-[9999] bg-[#fff9f6] shadow-sm'>
            <h1 className='text-2xl md:text-3xl font-bold text-[#ff4d2d] cursor-pointer' onClick={() => navigate("/")}>
                Men On Rent
            </h1>

            {userData.role === "customer" && (
                <div className='hidden md:flex items-center gap-2 text-gray-600'>
                    <FaLocationDot className='text-[#ff4d2d]' />
                    <span className='truncate max-w-[200px]'>{currentCity || "Detecting location..."}</span>
                </div>
            )}

            <div className='flex items-center gap-4'>
                {userData.role === "customer" && (
                    <button
                        className='hidden md:block px-3 py-1.5 rounded-lg bg-[#ff4d2d]/10 text-[#ff4d2d] text-sm font-medium'
                        onClick={() => navigate("/bookings")}
                    >
                        My Bookings
                    </button>
                )}
                {userData.role === "worker" && (
                    <button
                        className='hidden md:block px-3 py-1.5 rounded-lg bg-[#ff4d2d]/10 text-[#ff4d2d] text-sm font-medium'
                        onClick={() => navigate("/worker-bookings")}
                    >
                        Booking Requests
                    </button>
                )}
                {userData.role === "worker" && (
                    <button
                        className='hidden md:block px-3 py-1.5 rounded-lg bg-[#ff4d2d]/10 text-[#ff4d2d] text-sm font-medium'
                        onClick={() => navigate("/worker-onboarding")}
                    >
                        My Profile
                    </button>
                )}

                <button onClick={() => navigate("/chats")} className='relative p-2 text-gray-500 hover:text-[#ff4d2d]'>
                    <FaComment size={18} />
                </button>
                <button onClick={() => navigate("/notifications")} className='relative p-2 text-gray-500 hover:text-[#ff4d2d]'>
                    <FaBell size={18} />
                    {unreadCount > 0 && (
                        <span className='absolute -top-0.5 -right-0.5 bg-[#ff4d2d] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center'>
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </button>

                <div
                    className='w-[40px] h-[40px] rounded-full flex items-center justify-center bg-[#ff4d2d] text-white text-[18px] shadow-xl font-semibold cursor-pointer'
                    onClick={() => setShowInfo(prev => !prev)}
                >
                    {userData?.fullName?.slice(0, 1)}
                </div>

                {showInfo && (
                    <div className='fixed top-[80px] right-[10px] w-[180px] bg-white shadow-2xl rounded-xl p-[20px] flex flex-col gap-[10px] z-[9999]'>
                        <div className='text-[17px] font-semibold'>{userData.fullName}</div>
                        <div className='text-xs text-gray-400 -mt-2 capitalize'>{userData.role}</div>
                        {userData.role === "customer" && (
                            <div className='text-[#ff4d2d] font-semibold cursor-pointer text-sm' onClick={() => navigate("/bookings")}>
                                My Bookings
                            </div>
                        )}
                        {userData.role === "worker" && (
                            <div className='text-[#ff4d2d] font-semibold cursor-pointer text-sm' onClick={() => navigate("/worker-bookings")}>
                                Booking Requests
                            </div>
                        )}
                        {userData.role === "worker" && (
                            <div className='text-[#ff4d2d] font-semibold cursor-pointer text-sm' onClick={() => navigate("/worker-onboarding")}>
                                My Profile
                            </div>
                        )}
                        <div className='text-[#ff4d2d] font-semibold cursor-pointer text-sm' onClick={handleLogOut}>Log Out</div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Nav
