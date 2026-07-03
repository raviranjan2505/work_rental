import React from 'react'

const STATUS_STYLES = {
    PENDING: "bg-yellow-50 text-yellow-700",
    ACCEPTED: "bg-blue-50 text-blue-700",
    REJECTED: "bg-red-50 text-red-700",
    ON_THE_WAY: "bg-blue-50 text-blue-700",
    ARRIVED: "bg-purple-50 text-purple-700",
    WORK_STARTED: "bg-indigo-50 text-indigo-700",
    COMPLETED: "bg-green-50 text-green-700",
    CANCELLED: "bg-gray-100 text-gray-500"
}

const STATUS_LABELS = {
    PENDING: "Pending",
    ACCEPTED: "Accepted",
    REJECTED: "Rejected",
    ON_THE_WAY: "On the way",
    ARRIVED: "Arrived",
    WORK_STARTED: "Work in progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled"
}

function BookingStatusBadge({ status }) {
    return (
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${STATUS_STYLES[status] || "bg-gray-100 text-gray-500"}`}>
            {STATUS_LABELS[status] || status}
        </span>
    )
}

export default BookingStatusBadge
