import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import {
    FaTachometerAlt, FaCalendarCheck, FaWallet,
    FaUserEdit, FaSignOutAlt, FaCommentDots, FaBell, FaBars, FaTimes
} from 'react-icons/fa'
import { MdToggleOn, MdToggleOff } from 'react-icons/md'
import { serverUrl } from '../App'
import { setUserData } from '../redux/userSlice'
import { setMyWorkerProfile } from '../redux/workerSlice'

const NAV = [
    { to: '/',                icon: FaTachometerAlt, label: 'Dashboard',         end: true },
    { to: '/worker-bookings', icon: FaCalendarCheck, label: 'Booking Requests' },
    { to: '/wallet',          icon: FaWallet,        label: 'Wallet'            },
    { to: '/worker-onboarding', icon: FaUserEdit,    label: 'Edit Profile'      },
    { to: '/chats',           icon: FaCommentDots,   label: 'Messages'          },
    { to: '/notifications',   icon: FaBell,          label: 'Notifications'     },
]

const STATUS_STYLES = {
    ACTIVE:   'bg-green-100 text-green-700',
    INACTIVE: 'bg-red-200 text-red-800',
}

export default function WorkerLayout({ children }) {
    const dispatch   = useDispatch()
    const navigate   = useNavigate()
    const { userData }       = useSelector(s => s.user)
    const { myWorkerProfile } = useSelector(s => s.worker)
    const { unreadCount }    = useSelector(s => s.notification)
    const [mobileOpen, setMobileOpen] = useState(false)

    const logout = async () => {
        await axios.get(`${serverUrl}/api/auth/signout`, { withCredentials: true }).catch(() => {})
        dispatch(setUserData(null))
        navigate('/')
    }

    const toggleAvailability = async () => {
        if (!myWorkerProfile) return
        try {
            const res = await axios.patch(
                `${serverUrl}/api/worker/availability`,
                { isAvailable: !myWorkerProfile.isAvailable },
                { withCredentials: true }
            )
            dispatch(setMyWorkerProfile(res.data))
        } catch (e) { console.error(e) }
    }

    const status      = myWorkerProfile?.status || 'ACTIVE'
    const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.ACTIVE
    const initials    = userData?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'W'

    const Sidebar = () => (
        <div className='flex flex-col h-full'>
            {/* brand */}
            <div className='px-5 py-5 border-b border-[#f0f0f0]'>
                <h1 className='text-lg font-extrabold text-[#ff4d2d]'>Men On Rent</h1>
                <p className='text-[11px] text-gray-400 mt-0.5'>Worker Portal</p>
            </div>

            {/* worker identity */}
            <div className='px-5 py-4 border-b border-[#f0f0f0]'>
                <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-xl bg-[#ff4d2d] text-white flex items-center justify-center font-bold text-sm shrink-0'>
                        {initials}
                    </div>
                    <div className='min-w-0'>
                        <p className='font-semibold text-gray-800 text-sm truncate'>{userData?.fullName}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusStyle}`}>
                            {status.replace('_', ' ')}
                        </span>
                    </div>
                </div>

                {/* availability toggle */}
                {myWorkerProfile && (
                    <button onClick={toggleAvailability}
                        className={`mt-3 w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm font-medium transition-all
                            ${myWorkerProfile.isAvailable ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                        <span>{myWorkerProfile.isAvailable ? '🟢 Available' : '⚫ Unavailable'}</span>
                        {myWorkerProfile.isAvailable
                            ? <MdToggleOn size={22} className='text-green-600' />
                            : <MdToggleOff size={22} className='text-gray-400' />
                        }
                    </button>
                )}
            </div>

            {/* nav links */}
            <nav className='flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto'>
                {NAV.map(item => (
                    <NavLink key={item.to} to={item.to} end={item.end}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                            ${isActive ? 'bg-[#ff4d2d] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`
                        }>
                        {({ isActive }) => (
                            <>
                                <item.icon size={15} className={isActive ? 'text-white' : 'text-gray-400'} />
                                <span className='flex-1'>{item.label}</span>
                                {item.to === '/notifications' && unreadCount > 0 && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                                        ${isActive ? 'bg-white text-[#ff4d2d]' : 'bg-[#ff4d2d] text-white'}`}>
                                        {unreadCount}
                                    </span>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* logout */}
            <div className='px-3 py-3 border-t border-[#f0f0f0]'>
                <button onClick={logout}
                    className='w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all'>
                    <FaSignOutAlt size={14} />
                    Sign Out
                </button>
            </div>
        </div>
    )

    return (
        <div className='w-full min-h-screen flex bg-[#f7f7f8]'>
            {/* ── DESKTOP SIDEBAR ── */}
            <aside className='w-[240px] shrink-0 bg-white border-r border-[#eee] min-h-screen fixed top-0 left-0 hidden md:block z-50'>
                <Sidebar />
            </aside>

            {/* ── MOBILE HEADER ── */}
            <div className='md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#eee] h-14 flex items-center px-4 gap-3'>
                <button onClick={() => setMobileOpen(true)} className='p-2 rounded-lg hover:bg-gray-100'>
                    <FaBars size={16} className='text-gray-600' />
                </button>
                <h1 className='font-extrabold text-[#ff4d2d] text-base flex-1'>Men On Rent</h1>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusStyle}`}>
                    {status.replace('_', ' ')}
                </span>
            </div>

            {/* ── MOBILE DRAWER ── */}
            {mobileOpen && (
                <div className='fixed inset-0 z-[9999] flex md:hidden'>
                    <div className='absolute inset-0 bg-black/40' onClick={() => setMobileOpen(false)} />
                    <div className='relative w-[260px] bg-white h-full flex flex-col shadow-2xl'>
                        <button onClick={() => setMobileOpen(false)}
                            className='absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100'>
                            <FaTimes size={14} className='text-gray-500' />
                        </button>
                        <Sidebar />
                    </div>
                </div>
            )}

            {/* ── MAIN CONTENT ── */}
            <main className='flex-1 md:ml-[240px] pt-14 md:pt-0 pb-4'>
                <div className='p-4 md:p-6'>
                    {children}
                </div>
            </main>
        </div>
    )
}
