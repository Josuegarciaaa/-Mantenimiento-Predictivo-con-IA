import { useNavigate } from 'react-router-dom'
import { useAppState } from '../../store/index.jsx'
import { useTranslation } from 'react-i18next'
import { settingsAPI } from '../../services/api.js'
import RULGauge from '../charts/RULGauge.jsx'
import EngineSparkline from './EngineSparkline.jsx'
import Tooltip from '../common/Tooltip.jsx'
import FleetMap from './FleetMap.jsx'
import './Dashboard.css'

function getRiskLevel(rul) {
    if (rul <= 15) return 'critical'
    if (rul <= 30) return 'high'
    if (rul <= 50) return 'medium'
    return 'low'
}

export default function Dashboard({ summary, engines = [], alerts = [], onAcknowledgeAlert }) {
    const navigate = useNavigate()
    const { state, dispatch } = useAppState()
    const { t } = useTranslation()
    const activeModelType = state.activeModelType

    if (!summary) return null

    const { engines: engineStats, alerts: alertStats, average_rul } = summary

    async function handleModelChange(type) {
        try {
            await settingsAPI.updateModel(type)
            dispatch({ type: 'SET_MODEL_TYPE', payload: type })
        } catch (err) {
            console.error('Error al cambiar de modelo:', err)
        }
    }

    return (
        <div className="dashboard fade-in">
            <div className="model-selector-bar">
                <div className="model-selector-label">
                    <span className="brain-icon">AI</span>
                    <div>
                        <div className="model-label-title">{t('dashboard.algorithm_title')}</div>
                        <div className="model-label-desc">{t('dashboard.algorithm_desc')}</div>
                    </div>
                </div>
                <div className="model-btn-group">
                    <button 
                        className={`model-btn ${activeModelType === 'auto' ? 'active' : ''}`}
                        onClick={() => handleModelChange('auto')}
                    >
                        {t('dashboard.auto')}
                    </button>
                    <button 
                        className={`model-btn ${activeModelType === 'rf' ? 'active' : ''}`}
                        onClick={() => handleModelChange('rf')}
                    >
                        {t('dashboard.rf')}
                    </button>
                    <button 
                        className={`model-btn ${activeModelType === 'lstm' ? 'active' : ''}`}
                        onClick={() => handleModelChange('lstm')}
                    >
                        {t('dashboard.lstm')}
                    </button>
                </div>
            </div>

            <div className="grid-4 dashboard-kpis">
                <div className="kpi-card kpi-card-primary">
                    <div className="kpi-label">{t('dashboard.total_engines')}</div>
                    <div className="kpi-value">{engineStats.total}</div>
                    <div className="kpi-sub">{t('dashboard.in_production')}</div>
                </div>
                <div className="kpi-card kpi-card-healthy">
                    <div className="kpi-label">{t('dashboard.operational')}</div>
                    <div className="kpi-value">{engineStats.healthy}</div>
                    <div className="kpi-sub">{t('dashboard.healthy_state')}</div>
                </div>
                <div className="kpi-card kpi-card-warning">
                    <div className="kpi-label">{t('dashboard.in_alert')}</div>
                    <div className="kpi-value">{engineStats.warning + engineStats.critical}</div>
                    <div className="kpi-sub">{t('dashboard.critical_warning', { critical: engineStats.critical, warning: engineStats.warning })}</div>
                </div>
                <div className="kpi-card kpi-card-secondary">
                    <div className="kpi-label">
                        {t('dashboard.avg_rul')}
                        <Tooltip content={t('dashboard.avg_rul_tooltip')}>
                            <span style={{ marginLeft: '6px', fontSize: '11px', color: 'var(--color-primary)' }}>ⓘ</span>
                        </Tooltip>
                    </div>
                    <div className="kpi-value">{average_rul}</div>
                    <div className="kpi-sub">{t('dashboard.avg_rul_desc')}</div>
                </div>
            </div>

            <div className="grid-2 dashboard-main">
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">{t('dashboard.engine_status')}</span>
                        <span className="card-title" style={{ opacity: 0.5 }}>{engines.length} {t('dashboard.registered')}</span>
                    </div>
                    <div className="engine-grid">
                        {engines.map(engine => {
                            const risk = engine.last_prediction_rul !== null
                                ? getRiskLevel(engine.last_prediction_rul)
                                : 'low'
                            return (
                                <div
                                    key={engine.id}
                                    className="engine-card"
                                    onClick={() => navigate(`/engines/${engine.id}`)}
                                >
                                    <div className="engine-card-header">
                                        <div className="engine-card-info">
                                            <span className={`status-dot status-dot-${engine.status}`}></span>
                                            <div>
                                                <div className="engine-card-name">{engine.name}</div>
                                                <div className="engine-card-id">{engine.engine_id}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                            {engine.status !== 'maintenance' && (
                                                <EngineSparkline 
                                                    engineId={engine.id} 
                                                    color={risk === 'low' ? 'var(--color-healthy)' : risk === 'medium' ? 'var(--color-warning)' : 'var(--color-critical)'} 
                                                />
                                            )}
                                            <span className={`badge badge-${engine.status}`}>
                                                {t(`status.${engine.status}`) || engine.status}
                                            </span>
                                        </div>
                                    </div>
                                    {engine.status !== 'maintenance' && engine.last_prediction_rul !== null && (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <Tooltip content={t('engineDetail.predicted_rul_tooltip')}>
                                                <div style={{ marginBottom: '-10px', fontSize: '11px', color: 'var(--text-muted)' }}>RUL ⓘ</div>
                                            </Tooltip>
                                            <RULGauge
                                                rul={engine.last_prediction_rul}
                                                riskLevel={risk}
                                            />
                                        </div>
                                    )}
                                    {engine.status === 'maintenance' && (
                                        <div className="engine-maintenance-label">{t('dashboard.maintenance_label')}</div>
                                    )}
                                    <div className="engine-card-footer">
                                        <span>{engine.total_cycles} {t('dashboard.cycles')}</span>
                                        <span>{engine.location}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="card dashboard-alerts-panel">
                    <div className="card-header">
                        <span className="card-title">{t('dashboard.active_alerts')}</span>
                        <span className={`badge ${alertStats.active > 0 ? 'badge-critical' : 'badge-healthy'}`}>
                            {alertStats.active}
                        </span>
                    </div>
                    <div className="dashboard-alerts-list">
                        {alerts.filter(a => !a.is_acknowledged).length === 0 && (
                            <div className="empty-state">
                                <div className="empty-state-text">{t('dashboard.no_alerts')}</div>
                            </div>
                        )}
                        {alerts.filter(a => !a.is_acknowledged).slice(0, 6).map((alert, i) => {
                            const typeStyles = {
                                critical: 'badge-critical',
                                warning: 'badge-warning',
                                maintenance_due: 'badge-maintenance',
                                info: 'badge-info'
                            }
                            return (
                                <div key={alert.id} className="dashboard-alert-item fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                                    <div className="dashboard-alert-top">
                                        <span className={`badge ${typeStyles[alert.type] || 'badge-info'}`}>
                                            {t(`status.${alert.type}`) || alert.type}
                                        </span>
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => onAcknowledgeAlert && onAcknowledgeAlert(alert.id)}
                                        >
                                            {t('common.acknowledge')}
                                        </button>
                                    </div>
                                    <p className="dashboard-alert-msg">{alert.message}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Fleet Map (Geospatial) */}
            <div className="card fade-in" style={{ marginTop: '24px', animationDelay: '0.2s' }}>
                <div className="card-header">
                    <span className="card-title">global fleet tracking (live)</span>
                </div>
                <FleetMap engines={engines} />
            </div>
        </div>
    )
}
