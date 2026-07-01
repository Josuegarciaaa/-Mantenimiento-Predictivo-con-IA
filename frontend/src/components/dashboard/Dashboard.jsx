import { useNavigate } from 'react-router-dom'
import { useAppState } from '../../store/index.jsx'
import { settingsAPI } from '../../services/api.js'
import RULGauge from '../charts/RULGauge.jsx'
import EngineSparkline from './EngineSparkline.jsx'
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
                    <span className="brain-icon">🧠</span>
                    <div>
                        <div className="model-label-title">Algoritmo Predictivo de IA</div>
                        <div className="model-label-desc">Controla qué modelo de Machine Learning realiza el diagnóstico de RUL</div>
                    </div>
                </div>
                <div className="model-btn-group">
                    <button 
                        className={`model-btn ${activeModelType === 'auto' ? 'active' : ''}`}
                        onClick={() => handleModelChange('auto')}
                    >
                        Auto (Híbrido)
                    </button>
                    <button 
                        className={`model-btn ${activeModelType === 'rf' ? 'active' : ''}`}
                        onClick={() => handleModelChange('rf')}
                    >
                        Random Forest
                    </button>
                    <button 
                        className={`model-btn ${activeModelType === 'lstm' ? 'active' : ''}`}
                        onClick={() => handleModelChange('lstm')}
                    >
                        LSTM (Red Neuronal)
                    </button>
                </div>
            </div>

            <div className="grid-4 dashboard-kpis">
                <div className="kpi-card kpi-card-primary">
                    <div className="kpi-label">Total equipos</div>
                    <div className="kpi-value">{engineStats.total}</div>
                    <div className="kpi-sub">En linea de produccion</div>
                </div>
                <div className="kpi-card kpi-card-healthy">
                    <div className="kpi-label">Operativos</div>
                    <div className="kpi-value">{engineStats.healthy}</div>
                    <div className="kpi-sub">Estado saludable</div>
                </div>
                <div className="kpi-card kpi-card-warning">
                    <div className="kpi-label">En alerta</div>
                    <div className="kpi-value">{engineStats.warning + engineStats.critical}</div>
                    <div className="kpi-sub">{engineStats.critical} criticos, {engineStats.warning} advertencia</div>
                </div>
                <div className="kpi-card kpi-card-secondary">
                    <div className="kpi-label">RUL promedio</div>
                    <div className="kpi-value">{average_rul}</div>
                    <div className="kpi-sub">Ciclos restantes (prom.)</div>
                </div>
            </div>

            <div className="grid-2 dashboard-main">
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Estado de equipos</span>
                        <span className="card-title" style={{ opacity: 0.5 }}>{engines.length} registrados</span>
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
                                                {engine.status}
                                            </span>
                                        </div>
                                    </div>
                                    {engine.status !== 'maintenance' && engine.last_prediction_rul !== null && (
                                        <RULGauge
                                            rul={engine.last_prediction_rul}
                                            riskLevel={risk}
                                        />
                                    )}
                                    {engine.status === 'maintenance' && (
                                        <div className="engine-maintenance-label">En mantenimiento</div>
                                    )}
                                    <div className="engine-card-footer">
                                        <span>{engine.total_cycles} ciclos</span>
                                        <span>{engine.location}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="card dashboard-alerts-panel">
                    <div className="card-header">
                        <span className="card-title">Alertas activas</span>
                        <span className={`badge ${alertStats.active > 0 ? 'badge-critical' : 'badge-healthy'}`}>
                            {alertStats.active}
                        </span>
                    </div>
                    <div className="dashboard-alerts-list">
                        {alerts.filter(a => !a.is_acknowledged).length === 0 && (
                            <div className="empty-state">
                                <div className="empty-state-text">Sin alertas activas</div>
                            </div>
                        )}
                        {alerts.filter(a => !a.is_acknowledged).slice(0, 6).map((alert, i) => {
                            const typeLabels = {
                                critical: 'Critica',
                                warning: 'Advertencia',
                                maintenance_due: 'Mantenimiento',
                                info: 'Info'
                            }
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
                                            {typeLabels[alert.type] || alert.type}
                                        </span>
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => onAcknowledgeAlert && onAcknowledgeAlert(alert.id)}
                                        >
                                            Reconocer
                                        </button>
                                    </div>
                                    <p className="dashboard-alert-msg">{alert.message}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
