import './AlertList.css'
import { useTranslation } from 'react-i18next'

export default function AlertList({ alerts = [], onAcknowledge, compact = false }) {
    const { t } = useTranslation()
    const activeAlerts = compact ? alerts.filter(a => !a.is_acknowledged).slice(0, 5) : alerts

    if (!activeAlerts.length) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">--</div>
                <div className="empty-state-text">{t('dashboard.no_alerts')}</div>
            </div>
        )
    }

    const typeConfig = {
        critical: { label: t('status.critical'), className: 'badge-critical' },
        warning: { label: t('status.warning'), className: 'badge-warning' },
        maintenance_due: { label: t('status.maintenance_due'), className: 'badge-maintenance' },
        info: { label: t('status.info'), className: 'badge-info' }
    }

    function formatTime(dateStr) {
        const d = new Date(dateStr)
        const now = new Date()
        const diffMs = now - d
        const diffHrs = Math.floor(diffMs / 3600000)
        if (diffHrs < 1) return t('common.less_than_hour')
        if (diffHrs < 24) return t('common.hours_ago', { count: diffHrs })
        const diffDays = Math.floor(diffHrs / 24)
        return t('common.days_ago', { count: diffDays })
    }

    return (
        <div className="alert-list">
            {activeAlerts.map((alert, index) => {
                const config = typeConfig[alert.type] || typeConfig.info
                return (
                    <div
                        key={alert.id}
                        className={`alert-item ${alert.is_acknowledged ? 'alert-item-ack' : ''}`}
                        style={{ animationDelay: `${index * 60}ms` }}
                    >
                        <div className="alert-item-left">
                            <span className={`badge ${config.className}`}>{config.label}</span>
                            <div className="alert-item-content">
                                <p className="alert-item-message">{alert.message}</p>
                                <span className="alert-item-time">{formatTime(alert.created_at)}</span>
                            </div>
                        </div>
                        {!alert.is_acknowledged && onAcknowledge && (
                            <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => onAcknowledge(alert.id)}
                            >
                                {t('common.acknowledge')}
                            </button>
                        )}
                        {alert.is_acknowledged && (
                            <span className="alert-ack-label">{t('common.acknowledged')}</span>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
