import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { serverUrl } from '../App'
import { setNotifications, setUnreadCount } from '../redux/notificationSlice'

function useGetNotifications() {
    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)

    const refresh = async () => {
        try {
            const [listRes, countRes] = await Promise.all([
                axios.get(`${serverUrl}/api/notification/my`, { withCredentials: true }),
                axios.get(`${serverUrl}/api/notification/unread-count`, { withCredentials: true })
            ])
            dispatch(setNotifications(listRes.data))
            dispatch(setUnreadCount(countRes.data.count))
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        if (!userData) return
        refresh()
    }, [userData?._id])

    return refresh
}

export default useGetNotifications
