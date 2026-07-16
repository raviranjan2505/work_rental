import React, { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { io } from 'socket.io-client'

import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import ForgotPassword from './pages/ForgotPassword'
import Home from './pages/Home'
import WorkerOnboarding from './pages/worker/WorkerOnboarding'
import WorkerProfilePage from './pages/WorkerProfilePage'
import BookWorkerPage from './pages/BookWorkerPage'
import BookingDetailPage from './pages/BookingDetailPage'
import MyBookingsPage from './pages/MyBookingsPage'
import WorkerBookingsPage from './pages/worker/WorkerBookingsPage'
import DepositPage from './pages/worker/DepositPage'
import WalletPage from './pages/worker/WalletPage'
import ChatListPage from './pages/ChatListPage'
import ChatPage from './pages/ChatPage'
import NotificationsPage from './pages/NotificationsPage'
import CategoriesPage from './pages/CategoriesPage'
import AllWorkersPage from './pages/AllWorkersPage'
import ProfilePage from './pages/ProfilePage'
import Nav from './components/Nav'
import MobileBottomNav from './components/MobileBottomNav'

import AdminLayout from './admin/AdminLayout'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminWorkersPage from './pages/admin/AdminWorkersPage'
import AdminCustomersPage from './pages/admin/AdminCustomersPage'
import AdminBookingsPage from './pages/admin/AdminBookingsPage'
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage'
import AdminWithdrawalsPage from './pages/admin/AdminWithdrawalsPage'
import AdminReviewsPage from './pages/admin/AdminReviewsPage'
import AdminCouponsPage from './pages/admin/AdminCouponsPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'

import useGetCurrentUser from './hooks/useGetCurrentUser'
import useGetCity from './hooks/useGetCity'
import useUpdateLocation from './hooks/useUpdateLocation'
import useUpdateWorkerLocation from './hooks/useUpdateWorkerLocation'
import { setSocket } from './redux/userSlice'

export const serverUrl = "http://localhost:8000"

function App() {
    const { userData } = useSelector(state => state.user)
    const dispatch = useDispatch()

    useGetCurrentUser()
    useGetCity()
    useUpdateLocation()
    useUpdateWorkerLocation()

    useEffect(() => {
        const socketInstance = io(serverUrl, { withCredentials: true })
        dispatch(setSocket(socketInstance))
        socketInstance.on('connect', () => {
            if (userData) {
                socketInstance.emit('identity', { userId: userData._id })
            }
        })
        return () => {
            socketInstance.disconnect()
        }
    }, [userData?._id])

    return (
        <>
            {userData?.role !== 'worker' && (!userData || userData.role !== 'admin') && <Nav />}
            {userData?.role !== 'worker' && (!userData || userData.role !== 'admin') && <MobileBottomNav />}
            <Routes>
                <Route path='/signup' element={!userData ? <SignUp /> : <Navigate to={"/"} />} />
                <Route path='/signin' element={!userData ? <SignIn /> : <Navigate to={"/"} />} />
                <Route path='/forgot-password' element={!userData ? <ForgotPassword /> : <Navigate to={"/"} />} />
                <Route path='/' element={userData?.role === "admin" ? <Navigate to={"/admin"} /> : <Home />} />
                <Route path='/worker-onboarding' element={userData?.role === "worker" ? <WorkerOnboarding /> : <Navigate to={"/signin"} />} />
                <Route path='/worker/:workerId' element={<WorkerProfilePage />} />
                <Route path='/book/:workerId' element={userData?.role === "customer" ? <BookWorkerPage /> : <Navigate to={"/signin"} />} />
                <Route path='/bookings/:bookingId' element={userData ? <BookingDetailPage /> : <Navigate to={"/signin"} />} />
                <Route path='/bookings' element={userData?.role === "customer" ? <MyBookingsPage /> : <Navigate to={"/signin"} />} />
                <Route path='/worker-bookings' element={userData?.role === "worker" ? <WorkerBookingsPage /> : <Navigate to={"/signin"} />} />
                <Route path='/deposit' element={userData?.role === "worker" ? <DepositPage /> : <Navigate to={"/signin"} />} />
                <Route path='/wallet' element={userData?.role === "worker" ? <WalletPage /> : <Navigate to={"/signin"} />} />
                <Route path='/chats' element={userData ? <ChatListPage /> : <Navigate to={"/signin"} />} />
                <Route path='/chat/:bookingId' element={userData ? <ChatPage /> : <Navigate to={"/signin"} />} />
                <Route path='/notifications' element={userData ? <NotificationsPage /> : <Navigate to={"/signin"} />} />
                <Route path='/categories' element={<CategoriesPage />} />
                <Route path='/workers' element={<AllWorkersPage />} />
                <Route path='/profile' element={<ProfilePage />} />

                <Route path='/admin' element={userData?.role === "admin" ? <AdminLayout /> : <Navigate to={"/signin"} />}>
                    <Route index element={<AdminDashboardPage />} />
                    <Route path='workers' element={<AdminWorkersPage />} />
                    <Route path='customers' element={<AdminCustomersPage />} />
                    <Route path='bookings' element={<AdminBookingsPage />} />
                    <Route path='categories' element={<AdminCategoriesPage />} />
                    <Route path='withdrawals' element={<AdminWithdrawalsPage />} />
                    <Route path='reviews' element={<AdminReviewsPage />} />
                    <Route path='coupons' element={<AdminCouponsPage />} />
                    <Route path='settings' element={<AdminSettingsPage />} />
                </Route>
            </Routes>
        </>
    )
}

export default App
