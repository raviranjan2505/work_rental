import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useDispatch } from 'react-redux'
import { serverUrl } from '../App'
import { setUserData } from '../redux/userSlice'

const primaryColor = "#ff4d2d"

const NAV_ITEMS = [
    { to: "/admin", label: "Dashboard", end: true },
    { to: "/admin/workers", label: "Workers" },
    { to: "/admin/customers", label: "Customers" },
    { to: "/admin/bookings", label: "Bookings" },
    { to: "/admin/categories", label: "Categories & Commission" },
    { to: "/admin/withdrawals", label: "Withdrawals" },
    { to: "/admin/reviews", label: "Reviews" },
    { to: "/admin/coupons", label: "Coupons" },
    { to: "/admin/settings", label: "Settings & Broadcast" }
]

function AdminLayout() {
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const handleLogOut = async () => {
        try {
            await axios.get(`${serverUrl}/api/auth/signout`, { withCredentials: true })
            dispatch(setUserData(null))
            navigate("/signin")
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className='w-full min-h-[100vh] flex bg-[#f7f7f8]'>
            <aside className='w-[230px] shrink-0 bg-white border-r border-[#eee] min-h-[100vh] fixed top-0 left-0 flex flex-col'>
                <div className='px-5 py-5 border-b border-[#f0f0f0]'>
                    <h1 className='text-lg font-bold' style={{ color: primaryColor }}>Men On Rent</h1>
                    <p className='text-xs text-gray-400'>Admin Console</p>
                </div>
                <nav className='flex-1 px-3 py-4 flex flex-col gap-1'>
                    {NAV_ITEMS.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? "text-white" : "text-gray-600 hover:bg-gray-100"}`
                            }
                            style={({ isActive }) => isActive ? { backgroundColor: primaryColor } : {}}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                <button onClick={handleLogOut} className='m-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50'>
                    Log Out
                </button>
            </aside>
            <main className='flex-1 ml-[230px] p-6'>
                <Outlet />
            </main>
        </div>
    )
}

export default AdminLayout
