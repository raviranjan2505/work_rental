import React, { useState } from 'react'
import { FaLocationDot } from "react-icons/fa6"
import { FaBell, FaComment } from "react-icons/fa"
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { serverUrl } from '../App'
import { setUserData } from '../redux/userSlice'
import { useNavigate, useLocation } from 'react-router-dom'
import useGetNotifications from '../hooks/useGetNotifications'
import useNotificationSocketEvents from '../hooks/useNotificationSocketEvents'

function Nav() {
    const { userData, currentCity } = useSelector(state => state.user)
    const { unreadCount } = useSelector(state => state.notification)
    const [showInfo, setShowInfo] = useState(false)
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { pathname } = useLocation()

    // Only show the nav search bar on the home page for customers/guests
    const isHome = pathname === '/'
    const showNavSearch = isHome && (!userData || userData.role === 'customer')

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
        <div className='w-full h-[80px] flex items-center justify-between px-4 md:px-6 gap-3 fixed top-0 z-[9999] bg-[#fff9f6] shadow-sm'>

            {/* Logo */}
            <h1 className='text-xl md:text-2xl font-extrabold text-[#ff4d2d] cursor-pointer shrink-0' onClick={() => navigate('/')}>
                Men On Rent
            </h1>

            {/* Desktop: location chip */}
            {(userData?.role === 'customer' || !userData) && (
                <div className='hidden md:flex items-center gap-1.5 text-gray-500 text-sm shrink-0'>
                    <FaLocationDot className='text-[#ff4d2d]' size={13} />
                    <span className='truncate max-w-[140px] font-medium'>{currentCity || 'Detecting…'}</span>
                </div>
            )}

            {/* Spacer on desktop so right side stays right */}
            <div className='flex-1' />

            {/* ── Guest buttons ── */}
            {!userData && (
                <div className='flex items-center gap-2 shrink-0'>
                    <button onClick={() => navigate('/signin')}
                        className='px-3 py-1.5 rounded-lg text-[#ff4d2d] text-sm font-semibold border border-[#ff4d2d]'>
                        Sign In
                    </button>
                    <button onClick={() => navigate('/signup')}
                        className='px-3 py-1.5 rounded-lg bg-[#ff4d2d] text-white text-sm font-semibold'>
                        Sign Up
                    </button>
                </div>
            )}

            {/* ── Logged-in user ── */}
            {userData && (
                <div className='flex items-center gap-3 shrink-0'>
                    {userData.role === 'customer' && (
                        <button onClick={() => navigate('/bookings')}
                            className='hidden md:block px-3 py-1.5 rounded-lg bg-[#ff4d2d]/10 text-[#ff4d2d] text-sm font-semibold'>
                            My Bookings
                        </button>
                    )}
                    {userData.role === 'worker' && (
                        <>
                            <button onClick={() => navigate('/worker-bookings')}
                                className='hidden md:block px-3 py-1.5 rounded-lg bg-[#ff4d2d]/10 text-[#ff4d2d] text-sm font-semibold'>
                                Booking Requests
                            </button>
                            <button onClick={() => navigate('/worker-onboarding')}
                                className='hidden md:block px-3 py-1.5 rounded-lg bg-[#ff4d2d]/10 text-[#ff4d2d] text-sm font-semibold'>
                                My Profile
                            </button>
                        </>
                    )}

                    <button onClick={() => navigate('/chats')} className='relative p-2 text-gray-400 hover:text-[#ff4d2d] hidden md:block'>
                        <FaComment size={17} />
                    </button>

                    <button onClick={() => navigate('/notifications')} className='relative p-2 text-gray-400 hover:text-[#ff4d2d] hidden md:block'>
                        <FaBell size={17} />
                        {unreadCount > 0 && (
                            <span className='absolute -top-0.5 -right-0.5 bg-[#ff4d2d] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center'>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    <div
                        onClick={() => setShowInfo(p => !p)}
                        className='w-9 h-9 rounded-full bg-[#ff4d2d] text-white flex items-center justify-center font-bold text-base cursor-pointer select-none'>
                        {userData.fullName?.slice(0, 1)}
                    </div>

                    {showInfo && (
                        <div className='fixed top-[84px] right-4 w-[190px] bg-white shadow-2xl rounded-2xl p-5 flex flex-col gap-2 z-[9999]'>
                            <p className='font-bold text-gray-800'>{userData.fullName}</p>
                            <p className='text-xs text-gray-400 capitalize -mt-1'>{userData.role}</p>
                            {userData.role === 'customer' && (
                                <button onClick={() => { navigate('/bookings'); setShowInfo(false) }}
                                    className='text-left text-sm text-[#ff4d2d] font-semibold py-1'>My Bookings</button>
                            )}
                            {userData.role === 'worker' && (
                                <>
                                    <button onClick={() => { navigate('/worker-bookings'); setShowInfo(false) }}
                                        className='text-left text-sm text-[#ff4d2d] font-semibold py-1'>Booking Requests</button>
                                    <button onClick={() => { navigate('/worker-onboarding'); setShowInfo(false) }}
                                        className='text-left text-sm text-[#ff4d2d] font-semibold py-1'>My Profile</button>
                                </>
                            )}
                            <button onClick={handleLogOut}
                                className='text-left text-sm text-[#ff4d2d] font-semibold pt-1 border-t border-gray-100'>Log Out</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default Nav
