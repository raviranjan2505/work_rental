import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { serverUrl } from '../App'
import { setChats } from '../redux/chatSlice'

function useGetMyChats() {
    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)

    useEffect(() => {
        if (!userData) return
        const fetchChats = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/chat/my`, { withCredentials: true })
                dispatch(setChats(result.data))
            } catch (error) {
                console.log(error)
            }
        }
        fetchChats()
    }, [userData?._id])
}

export default useGetMyChats
