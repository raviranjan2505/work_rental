import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import CustomerDashboard from '../components/CustomerDashboard'
import WorkerDashboard from '../components/WorkerDashboard'

function Home() {
  const { userData } = useSelector(state => state.user)

  if (userData?.role === "admin") return <Navigate to="/admin" />

  return (
    <div className='w-full min-h-[100vh] pt-[100px] flex flex-col items-center bg-[#fff9f6]'>
      {/* Guests (not logged in) and customers both see the browse/search dashboard. */}
      {(!userData || userData.role === "customer") && <CustomerDashboard />}
      {userData?.role === "worker" && <WorkerDashboard />}
    </div>
  )
}

export default Home
