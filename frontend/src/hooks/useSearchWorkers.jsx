import { useState, useRef, useCallback } from 'react'
import axios from 'axios'
import { serverUrl } from '../App'

const DEBOUNCE_MS = 350

export default function useSearchWorkers() {
    const [results, setResults] = useState([])
    const [categorySuggestions, setCategorySuggestions] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const timerRef = useRef(null)

    const search = useCallback((query, lat, lng) => {
        clearTimeout(timerRef.current)
        if (!query || query.trim().length < 1) {
            setResults([])
            setCategorySuggestions([])
            setLoading(false)
            return
        }
        setLoading(true)
        timerRef.current = setTimeout(async () => {
            try {
                const params = new URLSearchParams({ q: query.trim(), limit: 12 })
                if (lat) params.append('lat', lat)
                if (lng) params.append('lng', lng)
                const { data } = await axios.get(
                    `${serverUrl}/api/worker/search?${params}`,
                    { withCredentials: true }
                )
                setResults(data.workers || [])
                setCategorySuggestions(data.categorySuggestions || [])
                setError(null)
            } catch (err) {
                setError(err?.response?.data?.message || 'Search failed')
                setResults([])
            } finally {
                setLoading(false)
            }
        }, DEBOUNCE_MS)
    }, [])

    const clear = useCallback(() => {
        clearTimeout(timerRef.current)
        setResults([])
        setCategorySuggestions([])
        setLoading(false)
        setError(null)
    }, [])

    return { results, categorySuggestions, loading, error, search, clear }
}
