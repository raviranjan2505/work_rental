import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { serverUrl } from '../App'
import { setMyBookings } from '../redux/bookingSlice'

function useGetMyBookings() {
    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)

    useEffect(() => {
        if (!userData || userData.role !== "customer") return
        const fetchBookings = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/booking/my`, { withCredentials: true })
                dispatch(setMyBookings(result.data))
            } catch (error) {
                console.log(error)
            }
        }
        fetchBookings()
    }, [userData?._id])
}

export default useGetMyBookings
