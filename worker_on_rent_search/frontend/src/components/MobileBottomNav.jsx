import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FaHome, FaCalendarAlt, FaTh, FaCommentDots, FaUser } from 'react-icons/fa'
import { useSelector } from 'react-redux'

export default function MobileBottomNav() {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const { userData } = useSelector(state => state.user)
    const { chats } = useSelector(state => state.chat)
    const { unreadCount: notifCount } = useSelector(state => state.notification)

    // unread chat count: chats that have a lastMessage and haven't been read
    // (backend doesn't track per-chat unread; we use total chats with messages as proxy)
    const chatCount = chats.filter(c => c.lastMessage).length

    const profilePath = !userData
        ? '/signin'
        : userData.role === 'worker'
            ? '/worker-onboarding'
            : '/profile'

    const bookingsPath = userData?.role === 'worker' ? '/worker-bookings' : '/bookings'

    const tabs = [
        { label: 'Home',      icon: FaHome,        path: '/' },
        { label: 'Bookings',  icon: FaCalendarAlt, path: bookingsPath },
        { label: 'Categories',icon: FaTh,          path: '/categories' },
        { label: 'Chats',     icon: FaCommentDots, path: '/chats',   badge: userData && chatCount > 0 ? chatCount : null },
        { label: 'Profile',   icon: FaUser,        path: profilePath },
    ]

    // which tab is active (handle worker-onboarding as profile)
    const isActive = (tab) => {
        if (tab.path === profilePath && (pathname === '/profile' || pathname === '/worker-onboarding')) return true
        if (tab.path === bookingsPath && (pathname === '/bookings' || pathname === '/worker-bookings')) return true
        if (tab.path === '/chats' && pathname.startsWith('/chat')) return true
        return pathname === tab.path
    }

    return (
        <div className='fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-gray-100 flex md:hidden'
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {tabs.map(tab => {
                const Icon = tab.icon
                const active = isActive(tab)
                return (
                    <button
                        key={tab.label}
                        onClick={() => navigate(tab.path)}
                        className='flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative'
                    >
                        <div className='relative'>
                            <Icon size={21} className={active ? 'text-[#ff4d2d]' : 'text-gray-400'} />
                            {tab.badge && (
                                <span className='absolute -top-1.5 -right-2 bg-[#ff4d2d] text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1'>
                                    {tab.badge > 9 ? '9+' : tab.badge}
                                </span>
                            )}
                        </div>
                        <span className={`text-[10px] font-semibold ${active ? 'text-[#ff4d2d]' : 'text-gray-400'}`}>
                            {tab.label}
                        </span>
                        {active && (
                            <span className='absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#ff4d2d] rounded-full' />
                        )}
                    </button>
                )
            })}
        </div>
    )
}
