import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FaHome, FaCalendarAlt, FaTh, FaCommentDots, FaUser } from 'react-icons/fa'
import { useSelector } from 'react-redux'

function MobileBottomNav() {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const { userData } = useSelector(state => state.user)

    const tabs = [
        { label: 'Home', icon: FaHome, path: '/' },
        { label: 'Bookings', icon: FaCalendarAlt, path: userData?.role === 'worker' ? '/worker-bookings' : '/bookings' },
        { label: 'Categories', icon: FaTh, path: '/?cat=all' },
        { label: 'Chats', icon: FaCommentDots, path: '/chats' },
        { label: 'Profile', icon: FaUser, path: userData ? '/worker-onboarding' : '/signin' },
    ]

    return (
        <div className='fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-gray-100 flex md:hidden'>
            {tabs.map(tab => {
                const Icon = tab.icon
                const active = pathname === tab.path || (tab.path === '/' && pathname === '/')
                return (
                    <button
                        key={tab.label}
                        onClick={() => navigate(tab.path)}
                        className='flex-1 flex flex-col items-center justify-center py-2 gap-0.5'
                    >
                        <Icon size={20} className={active ? 'text-[#ff4d2d]' : 'text-gray-400'} />
                        <span className={`text-[10px] font-medium ${active ? 'text-[#ff4d2d]' : 'text-gray-400'}`}>
                            {tab.label}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}

export default MobileBottomNav
