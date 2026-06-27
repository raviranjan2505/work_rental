import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { serverUrl } from '../App'
import { setNearbyWorkers, setSearchLoading } from '../redux/workerSlice'

// filters: { category, minRating, minPrice, maxPrice, rateType, sort }
function useGetNearbyWorkers(filters = {}) {
    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)
    const { location } = useSelector(state => state.map)
    const filterKey = JSON.stringify(filters)

    useEffect(() => {
        if (!userData || userData.role !== "customer") return
        if (!location?.lat || !location?.lon) return

        const fetchWorkers = async () => {
            dispatch(setSearchLoading(true))
            try {
                const params = {
                    lat: location.lat,
                    lng: location.lon,
                    ...filters
                }
                const result = await axios.get(`${serverUrl}/api/worker/search/nearby`, {
                    params,
                    withCredentials: true
                })
                dispatch(setNearbyWorkers(result.data.workers))
            } catch (error) {
                console.log(error)
                dispatch(setNearbyWorkers([]))
            } finally {
                dispatch(setSearchLoading(false))
            }
        }
        fetchWorkers()
    }, [userData?._id, location?.lat, location?.lon, filterKey])
}

export default useGetNearbyWorkers
