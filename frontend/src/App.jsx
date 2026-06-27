import React, { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { io } from 'socket.io-client'

import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import ForgotPassword from './pages/ForgotPassword'
import Home from './pages/Home'
import WorkerOnboarding from './pages/WorkerOnboarding'
import WorkerProfilePage from './pages/WorkerProfilePage'
import BookWorkerPage from './pages/BookWorkerPage'
import BookingDetailPage from './pages/BookingDetailPage'
import MyBookingsPage from './pages/MyBookingsPage'
import WorkerBookingsPage from './pages/WorkerBookingsPage'
import DepositPage from './pages/DepositPage'
import WalletPage from './pages/WalletPage'
import ChatListPage from './pages/ChatListPage'
import ChatPage from './pages/ChatPage'
import NotificationsPage from './pages/NotificationsPage'
import Nav from './components/Nav'

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
            {userData && <Nav />}
            <Routes>
                <Route path='/signup' element={!userData ? <SignUp /> : <Navigate to={"/"} />} />
                <Route path='/signin' element={!userData ? <SignIn /> : <Navigate to={"/"} />} />
                <Route path='/forgot-password' element={!userData ? <ForgotPassword /> : <Navigate to={"/"} />} />
                <Route path='/' element={userData ? <Home /> : <Navigate to={"/signin"} />} />
                <Route path='/worker-onboarding' element={userData?.role === "worker" ? <WorkerOnboarding /> : <Navigate to={"/signin"} />} />
                <Route path='/worker/:workerId' element={userData ? <WorkerProfilePage /> : <Navigate to={"/signin"} />} />
                <Route path='/book/:workerId' element={userData?.role === "customer" ? <BookWorkerPage /> : <Navigate to={"/signin"} />} />
                <Route path='/bookings/:bookingId' element={userData ? <BookingDetailPage /> : <Navigate to={"/signin"} />} />
                <Route path='/bookings' element={userData?.role === "customer" ? <MyBookingsPage /> : <Navigate to={"/signin"} />} />
                <Route path='/worker-bookings' element={userData?.role === "worker" ? <WorkerBookingsPage /> : <Navigate to={"/signin"} />} />
                <Route path='/deposit' element={userData?.role === "worker" ? <DepositPage /> : <Navigate to={"/signin"} />} />
                <Route path='/wallet' element={userData?.role === "worker" ? <WalletPage /> : <Navigate to={"/signin"} />} />
                <Route path='/chats' element={userData ? <ChatListPage /> : <Navigate to={"/signin"} />} />
                <Route path='/chat/:bookingId' element={userData ? <ChatPage /> : <Navigate to={"/signin"} />} />
                <Route path='/notifications' element={userData ? <NotificationsPage /> : <Navigate to={"/signin"} />} />
            </Routes>
        </>
    )
}

export default App
