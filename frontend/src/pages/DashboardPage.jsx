import { useEffect } from 'react'
import Dashboard from '../components/dashboard/Dashboard.jsx'
import Loading from '../components/common/Loading.jsx'
import { useAppState } from '../store/index.js'
import { dashboardAPI, enginesAPI, alertsAPI } from '../services/api.js'

export default function DashboardPage() {
    const { state, dispatch } = useAppState()

    useEffect(() => {
        loadDashboard()
    }, [])

    async function loadDashboard() {
        dispatch({ type: 'SET_LOADING', payload: true })
        try {
            const [dashRes, enginesRes, alertsRes] = await Promise.all([
                dashboardAPI.getSummary(),
                enginesAPI.getAll(),
                alertsAPI.getAll({ active: true })
            ])
            dispatch({ type: 'SET_DASHBOARD', payload: dashRes.data })
            dispatch({ type: 'SET_ENGINES', payload: enginesRes.data })
            dispatch({ type: 'SET_ALERTS', payload: alertsRes.data })
        } catch (err) {
            dispatch({ type: 'SET_ERROR', payload: err.message })
        }
    }

    async function handleAcknowledge(alertId) {
        try {
            await alertsAPI.acknowledge(alertId, 'Operador')
            dispatch({
                type: 'UPDATE_ALERT',
                payload: {
                    ...state.alerts.find(a => a.id === alertId),
                    is_acknowledged: true,
                    acknowledged_by: 'Operador',
                    acknowledged_at: new Date().toISOString()
                }
            })
        } catch (err) {
            console.error(err)
        }
    }

    if (state.isLoading) return <Loading text="Cargando dashboard..." />

    if (state.error) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                <p style={{ color: 'var(--color-critical)', marginBottom: 'var(--spacing-md)' }}>
                    Error al cargar: {state.error}
                </p>
                <button className="btn btn-primary" onClick={loadDashboard}>Reintentar</button>
            </div>
        )
    }

    return (
        <Dashboard
            summary={state.dashboard}
            engines={state.engines}
            alerts={state.alerts}
            onAcknowledgeAlert={handleAcknowledge}
        />
    )
}
