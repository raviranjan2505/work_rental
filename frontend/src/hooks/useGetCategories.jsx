import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { serverUrl } from '../App'
import { setCategories } from '../redux/workerSlice'

function useGetCategories() {
    const dispatch = useDispatch()
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/category`, { withCredentials: true })
                dispatch(setCategories(result.data))
            } catch (error) {
                console.log(error)
            }
        }
        fetchCategories()
    }, [])
}

export default useGetCategories
