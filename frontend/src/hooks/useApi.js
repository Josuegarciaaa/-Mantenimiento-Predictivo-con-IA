import { useState, useEffect, useCallback } from 'react'

export default function useApi(apiCall, immediate = true) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(immediate)
    const [error, setError] = useState(null)

    const execute = useCallback(async (...args) => {
        setLoading(true)
        setError(null)
        try {
            const result = await apiCall(...args)
            setData(result.data !== undefined ? result.data : result)
            return result
        } catch (err) {
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [apiCall])

    useEffect(() => {
        if (immediate) {
            execute().catch(() => {})
        }
    }, [])

    return { data, loading, error, execute, setData }
}
