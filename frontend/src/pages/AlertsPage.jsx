import { useEffect, useState } from 'react'
import AlertList from '../components/alerts/AlertList.jsx'
import Loading from '../components/common/Loading.jsx'
import { useAppState } from '../store/index.jsx'
import { alertsAPI } from '../services/api.js'
import { useTranslation } from 'react-i18next'

export default function AlertsPage() {
    const { state, dispatch } = useAppState()
    const [filter, setFilter] = useState('all') // 'all', 'active', 'critical'
    const [loading, setLoading] = useState(true)
    const { t } = useTranslation()

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

    const filteredAlerts = state.alerts.filter(alert => {
        if (filter === 'active') return !alert.is_acknowledged
        if (filter === 'critical') return alert.type === 'critical' && !alert.is_acknowledged
        return true
    })

    if (loading) return <Loading text={t('common.loading')} />

    return (
        <div className="fade-in">
            <h2 className="page-title">{t('alerts.management')}</h2>
            <div className="card">
                <div className="card-header">
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        <button
                            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilter('all')}
                        >
                            {t('alerts.all')}
                        </button>
                        <button
                            className={`btn btn-sm ${filter === 'active' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilter('active')}
                        >
                            {t('alerts.active')}
                        </button>
                        <button
                            className={`btn btn-sm ${filter === 'critical' ? 'btn-danger' : 'btn-secondary'}`}
                            onClick={() => setFilter('critical')}
                        >
                            {t('alerts.critical')}
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
