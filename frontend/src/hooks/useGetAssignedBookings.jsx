import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { serverUrl } from '../App'
import { setAssignedBookings } from '../redux/bookingSlice'

function useGetAssignedBookings() {
    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)

    useEffect(() => {
        if (!userData || userData.role !== "worker") return
        const fetchBookings = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/booking/assigned`, { withCredentials: true })
                dispatch(setAssignedBookings(result.data))
            } catch (error) {
                console.log(error)
            }
        }
        fetchBookings()
    }, [userData?._id])
}

export default useGetAssignedBookings
