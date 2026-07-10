import { useState, useEffect } from 'react'
import { useAppState } from '../store/index.jsx'
import Loading from '../components/common/Loading.jsx'
import { settingsAPI } from '../services/api.js'
import { useTranslation } from 'react-i18next'
import './SettingsPage.css'

const MODEL_OPTIONS_KEYS = [
    {
        id: 'auto',
        labelKey: 'settings.hybrid',
        icon: 'A',
        descKey: 'settings.auto_desc',
        prosKeys: ['settings.auto_pro1', 'settings.auto_pro2', 'settings.auto_pro3']
    },
    {
        id: 'rf',
        labelKey: 'settings.rf',
        icon: 'RF',
        descKey: 'settings.rf_desc',
        prosKeys: ['settings.rf_pro1', 'settings.rf_pro2', 'settings.rf_pro3']
    },
    {
        id: 'lstm',
        labelKey: 'settings.lstm',
        icon: 'NN',
        descKey: 'settings.lstm_desc',
        prosKeys: ['settings.lstm_pro1', 'settings.lstm_pro2', 'settings.lstm_pro3']
    }
]

const ALERT_THRESHOLDS_KEYS = [
    { key: 'critical', labelKey: 'settings.threshold_critical', color: 'var(--color-critical)', defaultValue: 15 },
    { key: 'high', labelKey: 'settings.threshold_warning', color: 'var(--color-warning)', defaultValue: 30 },
    { key: 'medium', labelKey: 'settings.threshold_medium', color: 'var(--color-info)', defaultValue: 50 }
]

export default function SettingsPage() {
    const { state, dispatch } = useAppState()
    const [selectedModel, setSelectedModel] = useState(state.activeModelType || 'auto')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const { t } = useTranslation()
    const [thresholds, setThresholds] = useState({ critical: 15, high: 30, medium: 50 })
    const [thresholdSuccess, setThresholdSuccess] = useState(false)
    const [simulatorInterval, setSimulatorInterval] = useState(4)
    const [maxHistory, setMaxHistory] = useState(50)

    useEffect(() => {
        setLoading(false)
    }, [])

    async function handleSave() {
        setSaving(true)
        try {
            await settingsAPI.updateModel(selectedModel)
            dispatch({ type: 'SET_MODEL_TYPE', payload: selectedModel })
            setSaving(false)
        } catch (err) {
            console.error(err)
            alert(t('common.error'))
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <Loading text={t('common.loading')} />

    const modelChanged = selectedModel !== state.activeModelType

    return (
        <div className="fade-in settings-page">
            <h2 className="page-title">{t('settings.title')}</h2>

            <section className="settings-section card">
                <div className="card-header"><span className="card-title">{t('settings.ml_settings')}</span></div>
                
                <div className="form-group" style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <label className="form-label">{t('settings.active_model')}</label>
                    <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="form-select">
                        <option value="auto">{t('settings.hybrid')}</option>
                        <option value="rf">{t('settings.rf')}</option>
                        <option value="lstm">{t('settings.lstm')}</option>
                    </select>
                </div>

                <div style={{ marginTop: 'var(--spacing-xl)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={saving || !modelChanged}
                    >
                        {saving ? t('common.loading') : t('settings.update_settings')}
                    </button>
                </div>
            </section>

            <section className="settings-section card">
                <div className="card-header"><span className="card-title">{t('settings.alert_settings')}</span></div>
                
                <form className="thresholds-form">
                    {ALERT_THRESHOLDS_KEYS.map(th => (
                        <div key={th.key} className="threshold-row">
                            <div className="threshold-info">
                                <div className="threshold-dot" style={{ background: th.color }} />
                                <div>
                                    <div className="threshold-label">{t(th.labelKey)} (RUL &lt;=)</div>
                                </div>
                            </div>
                            <div className="threshold-input-wrap">
                                <input
                                    type="number"
                                    className="threshold-input"
                                    value={thresholds[th.key]}
                                    onChange={e => setThresholds(prev => ({ ...prev, [th.key]: parseInt(e.target.value) || th.defaultValue }))}
                                />
                            </div>
                        </div>
                    ))}
                </form>
            </section>

            <section className="settings-section card">
                <div className="settings-section-header">
                    <h3 className="settings-section-title">{t('settings.simulator')}</h3>
                </div>

                <div className="simulator-settings">
                    <div className="sim-setting-row">
                        <div>
                            <div className="threshold-label">{t('settings.cycle_interval')}</div>
                        </div>
                        <div className="threshold-input-wrap">
                            <input
                                type="number"
                                className="threshold-input"
                                value={simulatorInterval}
                                onChange={e => setSimulatorInterval(parseInt(e.target.value) || 4)}
                            />
                        </div>
                    </div>

                    <div className="sim-setting-row">
                        <div>
                            <div className="threshold-label">{t('settings.max_history')}</div>
                        </div>
                        <div className="threshold-input-wrap">
                            <input
                                type="number"
                                className="threshold-input"
                                value={maxHistory}
                                onChange={e => setMaxHistory(parseInt(e.target.value) || 50)}
                            />
                            <span className="threshold-unit">{t('settings.readings')}</span>
                        </div>
                    </div>

                    <div className="settings-info-banner">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        {t('settings.restart_warning')}
                    </div>

                    <div className="settings-save-row">
                        <button className="btn btn-primary" disabled>{t('settings.save_simulator')}</button>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('settings.requires_restart')}</span>
                    </div>
                </div>
            </section>

            {/* -- Seccion: Info del Sistema -- */}
            <section className="settings-section card">
                <div className="settings-section-header">
                    <div className="settings-section-icon" style={{ background: 'rgba(139,92,246,0.12)', color: 'var(--color-maintenance)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                    </div>
                    <div>
                        <h3 className="settings-section-title">{t('settings.system_info')}</h3>
                        <p className="settings-section-desc">{t('settings.system_info_desc')}</p>
                    </div>
                </div>

                <div className="system-info-grid">
                    {[
                        { label: t('settings.app'), value: 'PredMaint Industrial AI' },
                        { label: t('settings.api_version'), value: 'v1.0.0' },
                        { label: t('settings.dataset'), value: 'C-MAPSS NASA FD001' },
                        { label: t('settings.available_models'), value: 'Random Forest + LSTM' },
                        { label: t('settings.database'), value: 'SQLite (dev) / PostgreSQL (prod)' },
                        { label: t('settings.websockets'), value: 'Socket.IO 4.x' },
                        { label: t('settings.current_user'), value: state.user?.username || '—' },
                        { label: t('settings.role'), value: state.user?.role || '—' }
                    ].map(item => (
                        <div key={item.label} className="system-info-row">
                            <span className="system-info-label">{item.label}</span>
                            <span className="system-info-value">{item.value}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
