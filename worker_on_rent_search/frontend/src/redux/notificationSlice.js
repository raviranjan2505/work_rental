import { createSlice } from "@reduxjs/toolkit";

const notificationSlice = createSlice({
    name: "notification",
    initialState: {
        notifications: [],
        unreadCount: 0
    },
    reducers: {
        setNotifications: (state, action) => {
            state.notifications = action.payload
        },
        setUnreadCount: (state, action) => {
            state.unreadCount = action.payload
        },
        prependNotification: (state, action) => {
            state.notifications.unshift(action.payload)
            state.unreadCount += 1
        }
    }
})

export const { setNotifications, setUnreadCount, prependNotification } = notificationSlice.actions
export default notificationSlice.reducer
