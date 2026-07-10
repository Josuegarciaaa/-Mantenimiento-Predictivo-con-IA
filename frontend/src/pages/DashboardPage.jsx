import { useEffect } from 'react'
import Dashboard from '../components/dashboard/Dashboard.jsx'
import Loading from '../components/common/Loading.jsx'
import { useAppState } from '../store/index.jsx'
import { useTranslation } from 'react-i18next'
import { dashboardAPI, enginesAPI, alertsAPI } from '../services/api.js'
import { getSocket } from '../services/socket.js'

export default function DashboardPage() {
    const { state, dispatch } = useAppState()
    const { t } = useTranslation()

    useEffect(() => {
        loadDashboard()
    }, [])

    useEffect(() => {
        loadDashboard(true) // Carga silenciosa ante cambios de modelo
    }, [state.activeModelType])

    useEffect(() => {
        const socket = getSocket()
        if (!socket) return

        socket.on('dashboard_update', (data) => {
            dispatch({ type: 'SET_DASHBOARD', payload: data.summary })
        })

        socket.on('prediction_update', (data) => {
            dispatch({
                type: 'SET_ENGINES',
                payload: state.engines.map(e => 
                    e.id === data.engine_id 
                        ? { ...e, last_prediction_rul: data.prediction.predicted_rul, status: data.engine_status, total_cycles: data.total_cycles }
                        : e
                )
            })
        })

        socket.on('alert_new', (newAlert) => {
            // Solo agregar si no existe ya en la lista
            if (!state.alerts.some(a => a.id === newAlert.id)) {
                dispatch({ type: 'SET_ALERTS', payload: [newAlert, ...state.alerts] })
            }
        })

        return () => {
            socket.off('dashboard_update')
            socket.off('prediction_update')
            socket.off('alert_new')
        }
    }, [state.engines, state.alerts])

    async function loadDashboard(silent = false) {
        if (!silent) dispatch({ type: 'SET_LOADING', payload: true })
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
            if (!silent) dispatch({ type: 'SET_ERROR', payload: err.message })
        }
    }

    async function handleAcknowledge(alertId) {
        try {
            const userName = state.user?.username || t('common.unknown_user')
            await alertsAPI.acknowledge(alertId, userName)
            dispatch({
                type: 'UPDATE_ALERT',
                payload: {
                    ...state.alerts.find(a => a.id === alertId),
                    is_acknowledged: true,
                    acknowledged_by: userName,
                    acknowledged_at: new Date().toISOString()
                }
            })
        } catch (err) {
            console.error(err)
        }
    }

    if (state.isLoading) return <Loading text={t('common.loading')} />

    if (state.error) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                <p style={{ color: 'var(--color-critical)', marginBottom: 'var(--spacing-md)' }}>
                    {t('common.error')} {state.error}
                </p>
                <button className="btn btn-primary" onClick={loadDashboard}>{t('common.retry')}</button>
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
