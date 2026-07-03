import { createSlice } from "@reduxjs/toolkit";

const workerSlice = createSlice({
    name: "worker",
    initialState: {
        myWorkerProfile: null,   // the logged-in worker's own WorkerProfile doc
        categories: [],          // full category list for browse grid + filters
        nearbyWorkers: [],       // current search results (customer side)
        searchLoading: false
    },
    reducers: {
        setMyWorkerProfile: (state, action) => {
            state.myWorkerProfile = action.payload
        },
        setCategories: (state, action) => {
            state.categories = action.payload
        },
        setNearbyWorkers: (state, action) => {
            state.nearbyWorkers = action.payload
        },
        setSearchLoading: (state, action) => {
            state.searchLoading = action.payload
        }
    }
})

export const { setMyWorkerProfile, setCategories, setNearbyWorkers, setSearchLoading } = workerSlice.actions
export default workerSlice.reducer
