import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { serverUrl } from '../App'
import { setWallet, setTransactions, setWithdrawals, setCommissionDues } from '../redux/walletSlice'

function useGetWallet() {
    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)

    const refresh = async () => {
        try {
            const [walletRes, txnRes, withdrawalsRes, duesRes] = await Promise.all([
                axios.get(`${serverUrl}/api/wallet/me`, { withCredentials: true }),
                axios.get(`${serverUrl}/api/wallet/transactions`, { withCredentials: true }),
                axios.get(`${serverUrl}/api/wallet/withdrawals/my`, { withCredentials: true }),
                axios.get(`${serverUrl}/api/wallet/commission-dues`, { withCredentials: true })
            ])
            dispatch(setWallet(walletRes.data))
            dispatch(setTransactions(txnRes.data))
            dispatch(setWithdrawals(withdrawalsRes.data))
            dispatch(setCommissionDues(duesRes.data))
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        if (!userData || userData.role !== "worker") return
        refresh()
    }, [userData?._id])

    return refresh
}

export default useGetWallet
