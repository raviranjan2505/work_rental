import { createSlice } from "@reduxjs/toolkit";

const walletSlice = createSlice({
    name: "wallet",
    initialState: {
        wallet: null,
        transactions: [],
        withdrawals: [],
        commissionDues: []
    },
    reducers: {
        setWallet: (state, action) => {
            state.wallet = action.payload
        },
        setTransactions: (state, action) => {
            state.transactions = action.payload
        },
        setWithdrawals: (state, action) => {
            state.withdrawals = action.payload
        },
        setCommissionDues: (state, action) => {
            state.commissionDues = action.payload
        }
    }
})

export const { setWallet, setTransactions, setWithdrawals, setCommissionDues } = walletSlice.actions
export default walletSlice.reducer
