import React from 'react'
import { useSelector } from 'react-redux'
import CustomerDashboard from '../components/CustomerDashboard'
import WorkerDashboard from '../components/WorkerDashboard'

function Home() {
  const { userData } = useSelector(state => state.user)
  return (
    <div className='w-full min-h-[100vh] pt-[100px] flex flex-col items-center bg-[#fff9f6]'>
      {userData.role === "customer" && <CustomerDashboard />}
      {userData.role === "worker" && <WorkerDashboard />}
    </div>
  )
}

export default Home
