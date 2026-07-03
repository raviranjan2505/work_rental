import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
    FaCalendarAlt, FaBell, FaSignOutAlt, FaChevronRight,
    FaStar, FaWallet, FaUser, FaHeadset, FaShieldAlt
} from 'react-icons/fa'
import { MdWorkOutline, MdVerified } from 'react-icons/md'
import { serverUrl } from '../App'
import { setUserData } from '../redux/userSlice'

const BRAND = '#ff4d2d'

function MenuRow({ icon: Icon, label, sub, onClick, color = 'text-gray-600', danger = false, badge }) {
    return (
        <button onClick={onClick}
            className={`w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left
                ${danger ? 'hover:bg-red-50' : ''}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                ${danger ? 'bg-red-50' : 'bg-[#fff0eb]'}`}>
                <Icon size={16} className={danger ? 'text-red-500' : `text-[${BRAND}]`} style={!danger ? { color: BRAND } : {}} />
            </div>
            <div className='flex-1 min-w-0'>
                <p className={`text-sm font-semibold ${danger ? 'text-red-500' : 'text-gray-800'}`}>{label}</p>
                {sub && <p className='text-xs text-gray-400 mt-0.5'>{sub}</p>}
            </div>
            {badge && (
                <span className='bg-[#ff4d2d] text-white text-[10px] font-bold px-2 py-0.5 rounded-full'>{badge}</span>
            )}
            {!danger && <FaChevronRight size={11} className='text-gray-300 shrink-0' />}
        </button>
    )
}

function Divider({ label }) {
    return (
        <div className='px-4 pt-5 pb-1'>
            <p className='text-[10px] font-bold text-gray-400 uppercase tracking-widest'>{label}</p>
        </div>
    )
}

export default function ProfilePage() {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)
    const { unreadCount } = useSelector(state => state.notification)
    const { chats } = useSelector(state => state.chat)
    const [loggingOut, setLoggingOut] = useState(false)

    if (!userData) {
        return (
            <div className='w-full min-h-screen pt-[80px] pb-24 flex flex-col items-center justify-center bg-[#fff9f6] gap-4'>
                <div className='w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center'>
                    <FaUser size={32} className='text-gray-300' />
                </div>
                <p className='font-bold text-gray-700 text-lg'>You're not signed in</p>
                <p className='text-sm text-gray-400'>Sign in to access your profile</p>
                <button onClick={() => navigate('/signin')}
                    className='mt-2 px-8 py-3 bg-[#ff4d2d] text-white rounded-xl font-bold shadow-lg shadow-[#ff4d2d]/20'>
                    Sign In
                </button>
                <button onClick={() => navigate('/signup')}
                    className='px-8 py-2.5 border-2 border-[#ff4d2d] text-[#ff4d2d] rounded-xl font-bold'>
                    Create Account
                </button>
            </div>
        )
    }

    const handleLogout = async () => {
        setLoggingOut(true)
        try {
            await axios.get(`${serverUrl}/api/auth/signout`, { withCredentials: true })
            dispatch(setUserData(null))
            navigate('/')
        } catch (e) { console.error(e) } finally { setLoggingOut(false) }
    }

    const initials = userData.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
    const colors = ['#ff4d2d', '#f97316', '#8b5cf6', '#06b6d4', '#10b981']
    const avatarColor = colors[(userData.fullName?.charCodeAt(0) || 0) % colors.length]

    return (
        <div className='w-full min-h-screen pt-[80px] pb-28 bg-[#fff9f6]'>
            <div className='max-w-lg mx-auto'>

                {/* ── HERO CARD ── */}
                <div className='mx-4 mt-4 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden'>
                    {/* gradient top strip */}
                    <div className='h-20 relative' style={{
                        background: `linear-gradient(135deg, ${avatarColor}22 0%, #fff0eb 100%)`
                    }}>
                        <div className='absolute -bottom-10 left-5'>
                            <div className='w-20 h-20 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl border-4 border-white shadow-lg'
                                style={{ background: avatarColor }}>
                                {initials}
                            </div>
                        </div>
                    </div>

                    <div className='pt-14 px-5 pb-5'>
                        <div className='flex items-start justify-between'>
                            <div>
                                <div className='flex items-center gap-2'>
                                    <h2 className='text-xl font-extrabold text-gray-900'>{userData.fullName}</h2>
                                    {userData.role === 'worker' && (
                                        <MdVerified size={18} className='text-[#ff4d2d]' />
                                    )}
                                </div>
                                <p className='text-sm text-gray-400 mt-0.5 capitalize'>{userData.email || userData.phone}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize
                                ${userData.role === 'worker' ? 'bg-blue-50 text-blue-600'
                                : userData.role === 'customer' ? 'bg-green-50 text-green-600'
                                : 'bg-gray-100 text-gray-500'}`}>
                                {userData.role}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── QUICK STATS ── (customer only) */}
                {userData.role === 'customer' && (
                    <div className='mx-4 mt-3 grid grid-cols-3 gap-2'>
                        {[
                            { icon: '📅', label: 'Bookings', val: '—' },
                            { icon: '⭐', label: 'Reviews', val: '—' },
                            { icon: '❤️', label: 'Saved', val: '—' },
                        ].map((s, i) => (
                            <div key={i} className='bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center'>
                                <p className='text-xl'>{s.icon}</p>
                                <p className='font-extrabold text-gray-800 text-lg mt-0.5'>{s.val}</p>
                                <p className='text-[10px] text-gray-400'>{s.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── MENU ── */}
                <div className='mx-4 mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden'>

                    {/* Customer menu */}
                    {userData.role === 'customer' && (
                        <>
                            <Divider label='My Activity' />
                            <MenuRow icon={FaCalendarAlt} label='My Bookings' sub='View all your bookings'
                                onClick={() => navigate('/bookings')} />
                            <div className='h-px bg-gray-50 mx-4' />
                            <MenuRow icon={FaBell} label='Notifications' sub='Alerts & updates'
                                onClick={() => navigate('/notifications')} badge={unreadCount > 0 ? unreadCount : null} />
                        </>
                    )}

                    {/* Worker menu */}
                    {userData.role === 'worker' && (
                        <>
                            <Divider label='Worker Tools' />
                            <MenuRow icon={MdWorkOutline} label='My Profile' sub='Update skills, rates & documents'
                                onClick={() => navigate('/worker-onboarding')} />
                            <div className='h-px bg-gray-50 mx-4' />
                            <MenuRow icon={FaCalendarAlt} label='Booking Requests' sub='View incoming jobs'
                                onClick={() => navigate('/worker-bookings')} />
                            <div className='h-px bg-gray-50 mx-4' />
                            <MenuRow icon={FaWallet} label='Wallet' sub='Earnings & payouts'
                                onClick={() => navigate('/wallet')} />
                            <div className='h-px bg-gray-50 mx-4' />
                            <MenuRow icon={FaBell} label='Notifications'
                                onClick={() => navigate('/notifications')} badge={unreadCount > 0 ? unreadCount : null} />
                        </>
                    )}

                    <Divider label='Support' />
                    <MenuRow icon={FaShieldAlt} label='Privacy & Security' sub='Manage your data'
                        onClick={() => {}} />
                    <div className='h-px bg-gray-50 mx-4' />
                    <MenuRow icon={FaHeadset} label='Help & Support' sub='Contact us anytime'
                        onClick={() => {}} />

                    <Divider label='Account' />
                    <MenuRow
                        icon={FaSignOutAlt}
                        label={loggingOut ? 'Signing out…' : 'Sign Out'}
                        danger
                        onClick={handleLogout}
                    />
                </div>

                {/* app version */}
                <p className='text-center text-[10px] text-gray-300 mt-6'>Men On Rent v1.0.0</p>
            </div>
        </div>
    )
}
