import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { serverUrl } from '../App'
import { setMyWorkerProfile } from '../redux/workerSlice'

function useGetMyWorkerProfile() {
    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)

    useEffect(() => {
        if (!userData || userData.role !== "worker") return
        const fetchProfile = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/worker/profile/me`, { withCredentials: true })
                dispatch(setMyWorkerProfile(result.data))
            } catch (error) {
                // 404 just means the worker hasn't completed onboarding yet
                dispatch(setMyWorkerProfile(null))
            }
        }
        fetchProfile()
    }, [userData?._id])
}

export default useGetMyWorkerProfile
