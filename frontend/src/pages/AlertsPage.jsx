import { useEffect, useState } from 'react'
import AlertList from '../components/alerts/AlertList.jsx'
import Loading from '../components/common/Loading.jsx'
import { useAppState } from '../store/index.js'
import { alertsAPI } from '../services/api.js'

export default function AlertsPage() {
    const { state, dispatch } = useAppState()
    const [filter, setFilter] = useState('all') // 'all', 'active', 'critical'
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadAlerts()
    }, [])

    async function loadAlerts() {
        setLoading(true)
        try {
            const response = await alertsAPI.getAll()
            dispatch({ type: 'SET_ALERTS', payload: response.data })
        } catch (err) {
            console.error('Error al cargar alertas', err)
        } finally {
            setLoading(false)
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

    const filteredAlerts = state.alerts.filter(alert => {
        if (filter === 'active') return !alert.is_acknowledged
        if (filter === 'critical') return alert.type === 'critical' && !alert.is_acknowledged
        return true
    })

    if (loading) return <Loading text="Cargando alertas..." />

    return (
        <div className="fade-in">
            <div className="card">
                <div className="card-header">
                    <span className="card-title">Gestión de Alertas</span>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        <button
                            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilter('all')}
                        >
                            Todas
                        </button>
                        <button
                            className={`btn btn-sm ${filter === 'active' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilter('active')}
                        >
                            Activas
                        </button>
                        <button
                            className={`btn btn-sm ${filter === 'critical' ? 'btn-danger' : 'btn-secondary'}`}
                            onClick={() => setFilter('critical')}
                        >
                            Críticas
                        </button>
                    </div>
                </div>
                <div style={{ padding: 'var(--spacing-md) 0' }}>
                    <AlertList
                        alerts={filteredAlerts}
                        onAcknowledge={handleAcknowledge}
                    />
                </div>
            </div>
        </div>
    )
}
