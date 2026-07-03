import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import CustomerDashboard from '../components/CustomerDashboard'
import WorkerDashboard from '../components/WorkerDashboard'

function Home() {
  const { userData } = useSelector(state => state.user)

  if (userData?.role === 'admin') return <Navigate to='/admin' />

  return (
    <div className='w-full min-h-[100vh] pt-[80px] bg-[#fff9f6]'>
      {(!userData || userData.role === 'customer') && <CustomerDashboard />}
      {userData?.role === 'worker' && (
        <div className='flex justify-center px-4'>
          <WorkerDashboard />
        </div>
      )}
    </div>
  )
}

export default Home
