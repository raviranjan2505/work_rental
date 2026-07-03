import { configureStore } from "@reduxjs/toolkit";
import userSlice from "./userSlice"
import workerSlice from "./workerSlice"
import bookingSlice from "./bookingSlice"
import walletSlice from "./walletSlice"
import chatSlice from "./chatSlice"
import notificationSlice from "./notificationSlice"
import mapSlice from "./mapSlice"
export const store=configureStore({
    reducer:{
        user:userSlice,
        worker:workerSlice,
        booking:bookingSlice,
        wallet:walletSlice,
        chat:chatSlice,
        notification:notificationSlice,
        map:mapSlice
    }
})
