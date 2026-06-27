import { createSlice } from "@reduxjs/toolkit";

const bookingSlice = createSlice({
    name: "booking",
    initialState: {
        myBookings: [],        // customer side list
        assignedBookings: [],  // worker side list
        activeBooking: null,   // currently open booking detail
        liveWorkerLocation: null // { latitude, longitude } for the worker on activeBooking
    },
    reducers: {
        setMyBookings: (state, action) => {
            state.myBookings = action.payload
        },
        setAssignedBookings: (state, action) => {
            state.assignedBookings = action.payload
        },
        setActiveBooking: (state, action) => {
            state.activeBooking = action.payload
        },
        setLiveWorkerLocation: (state, action) => {
            state.liveWorkerLocation = action.payload
        },
        // patches activeBooking + the relevant list in place when a socket update arrives
        applyBookingUpdate: (state, action) => {
            const updated = action.payload
            if (state.activeBooking?._id === updated._id) {
                state.activeBooking = updated
            }
            state.myBookings = state.myBookings.map(b => b._id === updated._id ? updated : b)
            state.assignedBookings = state.assignedBookings.map(b => b._id === updated._id ? updated : b)
        }
    }
})

export const {
    setMyBookings,
    setAssignedBookings,
    setActiveBooking,
    setLiveWorkerLocation,
    applyBookingUpdate
} = bookingSlice.actions
export default bookingSlice.reducer
