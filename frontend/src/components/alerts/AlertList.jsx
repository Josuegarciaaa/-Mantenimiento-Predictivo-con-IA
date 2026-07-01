import './AlertList.css'

export default function AlertList({ alerts = [], onAcknowledge, compact = false }) {
    const activeAlerts = compact ? alerts.filter(a => !a.is_acknowledged).slice(0, 5) : alerts

    if (!activeAlerts.length) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">--</div>
                <div className="empty-state-text">Sin alertas</div>
            </div>
        )
    }

    const typeConfig = {
        critical: { label: 'Critica', className: 'badge-critical' },
        warning: { label: 'Advertencia', className: 'badge-warning' },
        maintenance_due: { label: 'Mantenimiento', className: 'badge-maintenance' },
        info: { label: 'Info', className: 'badge-info' }
    }

    function formatTime(dateStr) {
        const d = new Date(dateStr)
        const now = new Date()
        const diffMs = now - d
        const diffHrs = Math.floor(diffMs / 3600000)
        if (diffHrs < 1) return 'Hace menos de 1h'
        if (diffHrs < 24) return `Hace ${diffHrs}h`
        const diffDays = Math.floor(diffHrs / 24)
        return `Hace ${diffDays}d`
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
                                Reconocer
                            </button>
                        )}
                        {alert.is_acknowledged && (
                            <span className="alert-ack-label">Reconocida</span>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
