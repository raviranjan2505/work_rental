import React from 'react'

function WorkerCardSkeleton() {
    return (
        <div className='bg-white rounded-xl border border-[#eee] p-4 flex gap-4 animate-pulse'>
            <div className='w-[64px] h-[64px] rounded-full bg-gray-200 shrink-0' />
            <div className='flex-1 space-y-2'>
                <div className='h-4 bg-gray-200 rounded w-1/2' />
                <div className='h-3 bg-gray-200 rounded w-1/3' />
                <div className='h-3 bg-gray-200 rounded w-2/3' />
            </div>
        </div>
    )
}

export default WorkerCardSkeleton
