import { createSlice } from "@reduxjs/toolkit";

const walletSlice = createSlice({
    name: "wallet",
    initialState: {
        wallet: null,
        transactions: [],
        withdrawals: [],
        depositConfig: null
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
        setDepositConfig: (state, action) => {
            state.depositConfig = action.payload
        }
    }
})

export const { setWallet, setTransactions, setWithdrawals, setDepositConfig } = walletSlice.actions
export default walletSlice.reducer
