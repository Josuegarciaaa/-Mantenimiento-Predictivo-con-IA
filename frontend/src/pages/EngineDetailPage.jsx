import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SensorChart from '../components/charts/SensorChart.jsx'
import ScatterSensorChart from '../components/charts/ScatterSensorChart.jsx'
import RULGauge from '../components/charts/RULGauge.jsx'
import ReportExport from '../components/reports/ReportExport.jsx'
import AlertList from '../components/alerts/AlertList.jsx'
import Loading from '../components/common/Loading.jsx'
import Tooltip from '../components/common/Tooltip.jsx'
import { enginesAPI, sensorsAPI, alertsAPI, reportsAPI, predictionsAPI } from '../services/api.js'
import { useAppState } from '../store/index.jsx'
import RULHistoryChart from '../components/charts/RULHistoryChart.jsx'
import ShapChart from '../components/charts/ShapChart.jsx'
import { getSocket } from '../services/socket.js'
import { useTranslation } from 'react-i18next'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import moment from 'moment'
import CopilotChat from '../components/chat/CopilotChat.jsx'
import DigitalTwinSimulator from '../components/charts/DigitalTwinSimulator.jsx'
import EngineSchematic from '../components/dashboard/EngineSchematic.jsx'

export default function EngineDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { state } = useAppState()
    const [engine, setEngine] = useState(null)
    const [sensorData, setSensorData] = useState([])
    const [alerts, setAlerts] = useState([])
    const [loading, setLoading] = useState(true)
    const [pdfLoading, setPdfLoading] = useState(false)
    const [error, setError] = useState(null)
    const { t } = useTranslation()

    useEffect(() => {
        loadEngine()
    }, [id])

    useEffect(() => {
        const socket = getSocket()
        if (!socket || !engine) return

        const engineIntId = parseInt(id)

        socket.on('sensor_update', (data) => {
            if (data.engine_id === engineIntId) {
                setSensorData(prev => {
                    const exists = prev.some(r => r.cycle === data.reading.cycle)
                    if (exists) return prev
                    const next = [...prev, data.reading]
                    // mantener maximo de 50 lecturas en la grafica
                    if (next.length > 50) next.shift()
                    return next
                })
            }
        })

        socket.on('prediction_update', (data) => {
            if (data.engine_id === engineIntId) {
                setEngine(prev => {
                    if (!prev) return null
                    const preds = prev.predictions || []
                    const exists = preds.some(p => p.id === data.prediction.id)
                    const updatedPreds = exists ? preds : [...preds, data.prediction]
                    return {
                        ...prev,
                        last_prediction_rul: data.prediction.predicted_rul,
                        last_prediction_date: data.prediction.prediction_date,
                        status: data.engine_status,
                        total_cycles: data.total_cycles,
                        predictions: updatedPreds
                    }
                })
            }
        })

        socket.on('alert_new', (newAlert) => {
            if (newAlert.engine_id === engineIntId) {
                setAlerts(prev => {
                    if (prev.some(a => a.id === newAlert.id)) return prev
                    return [newAlert, ...prev]
                })
            }
        })

        return () => {
            socket.off('sensor_update')
            socket.off('prediction_update')
            socket.off('alert_new')
        }
    }, [id, engine])

    async function loadEngine() {
        setLoading(true)
        setError(null)
        try {
            const [engRes, sensorRes, alertRes] = await Promise.all([
                enginesAPI.getById(id),
                sensorsAPI.getData(id, 50),
                alertsAPI.getAll({ engine_id: id })
            ])

            let engineData = engRes.data

            // Si no hay predicciones o la ultima no tiene SHAP values,
            // disparar una prediccion automaticamente para poblar el panel XAI.
            const preds = engineData.predictions || []
            const lastPred = preds.length ? preds[preds.length - 1] : null
            const hasShap = lastPred?.shap_values && Object.keys(lastPred.shap_values).length > 0

            if (!hasShap && sensorRes.data?.readings?.length > 0) {
                try {
                    await predictionsAPI.generate(id)
                    // Recargar el motor para obtener la prediccion fresca con SHAP
                    const freshEng = await enginesAPI.getById(id)
                    engineData = freshEng.data
                } catch (predErr) {
                    // Si falla la prediccion, continuar con los datos que ya tenemos
                    console.warn('Auto-prediction failed:', predErr.message)
                }
            }

            setEngine(engineData)
            setSensorData(sensorRes.data.readings || [])
            setAlerts(alertRes.data || [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleExportPDF() {
        setPdfLoading(true)
        try {
            const response = await reportsAPI.getPDF(id)
            const blob = response instanceof Blob ? response : new Blob([response], { type: 'application/pdf' })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `report_${engine?.engine_id || id}.pdf`
            link.click()
            window.URL.revokeObjectURL(url)
        } catch (err) {
            console.error('Error al generar PDF:', err)
        } finally {
            setPdfLoading(false)
        }
    }

    async function handleExportCSV() {
        try {
            const response = await sensorsAPI.getData(id, 2000) // Fetch up to 2000 records
            if (response.success && response.data.readings?.length > 0) {
                const data = response.data.readings
                const headers = Object.keys(data[0]).filter(k => k !== 'engine_id').join(',')
                
                const rows = data.map(row => {
                    return Object.keys(row)
                        .filter(k => k !== 'engine_id')
                        .map(k => row[k])
                        .join(',')
                })
                
                const csvContent = headers + '\n' + rows.join('\n')
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `sensor_data_${engine?.engine_id || id}.csv`
                link.click()
                window.URL.revokeObjectURL(url)
            } else {
                alert(t('engineDetail.no_sensor_data'))
            }
        } catch (err) {
            console.error('Error al exportar CSV:', err)
            alert(t('common.error') + ' CSV')
        }
    }

    async function handleAcknowledge(alertId) {
        try {
            const userName = state.user?.username || t('common.unknown_user')
            await alertsAPI.acknowledge(alertId, userName)
            setAlerts(prev => prev.map(a =>
                a.id === alertId
                    ? { ...a, is_acknowledged: true, acknowledged_by: userName, acknowledged_at: new Date().toISOString() }
                    : a
            ))
        } catch (err) {
            console.error(err)
        }
    }

    const generatePDF = async () => {
        const element = document.getElementById('pdf-report-content');
        if (!element) return;
        
        try {
            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Health_Report_${engine.engine_id}_${moment().format('YYYYMMDD')}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Check console.');
        }
    };

    if (loading) return <Loading text={t('common.loading')} />

    if (error || !engine) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                <p style={{ color: 'var(--color-critical)', marginBottom: 'var(--spacing-md)' }}>
                    {error || t('common.error')}
                </p>
                <button className="btn btn-secondary" onClick={() => navigate('/')}>{t('common.back')}</button>
            </div>
        )
    }

    function getRiskLevel(rul) {
        if (rul <= 15) return 'critical'
        if (rul <= 30) return 'high'
        if (rul <= 60) return 'medium'
        return 'low'
    }

    const riskLevel = engine.last_prediction_rul !== null
        ? getRiskLevel(engine.last_prediction_rul)
        : 'low'

    const latestPred = engine.predictions?.length
        ? engine.predictions[engine.predictions.length - 1]
        : null

    const latestSensor = sensorData?.length > 0 ? sensorData[sensorData.length - 1] : null;
    
    const currentRpm = latestSensor?.sensor_8 || 0;
    const currentHpcTemp = latestSensor?.sensor_3 || 0;
    const isAnomalous = engine.anomaly_check?.multivariate_anomaly || false;

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-xl)' }}>
                <div>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/')} style={{ marginBottom: 'var(--spacing-sm)' }}>
                        &larr; {t('common.back')}
                    </button>
                    <h2 className="page-title" style={{ marginBottom: 0 }}>{engine.name}</h2>
                    <p className="page-subtitle" style={{ marginBottom: 0 }}>
                        {engine.engine_id} &middot; {engine.location} &middot;
                        <span className={`badge badge-${engine.status}`} style={{ marginLeft: '0.5rem' }}>
                            {t(`status.${engine.status}`) || engine.status}
                        </span>
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button onClick={generatePDF} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {t('engineDetail.export_pdf', 'export health report (pdf)')}
                    </button>
                    <button 
                        className="btn btn-outline" 
                        onClick={handleExportCSV}
                        title={t('common.export_csv')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem' }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 3v5h5M8 13h2M8 17h2M14 13h2M14 17h2"/>
                        </svg>
                        {t('common.export_csv')}
                    </button>
                </div>
            </div>

            <div className="engine-detail-grid" id="pdf-report-content" style={{ backgroundColor: 'var(--bg-main)', padding: '1rem', borderRadius: '8px' }}>
                <div className="grid-3" style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <div className="kpi-card kpi-card-primary">
                        <div className="kpi-label">
                            {t('engineDetail.temp_hpc')}
                            <Tooltip content={t('engineDetail.temp_hpc_tooltip')}>
                                <span style={{ marginLeft: '4px', fontSize: '10px', color: 'var(--color-primary)' }}>ⓘ</span>
                            </Tooltip>
                        </div>
                        <div className="kpi-value">{sensorData.length > 0 ? sensorData[sensorData.length - 1].sensor_3.toFixed(2) : '--'} °C</div>
                    <div className="kpi-sub">{t('engineDetail.since_install')}</div>
                </div>
                <div className="kpi-card kpi-card-secondary">
                    <div className="kpi-label">
                        {t('engineDetail.predicted_rul')}
                        <Tooltip content={t('engineDetail.predicted_rul_tooltip')}>
                            <span style={{ marginLeft: '4px', fontSize: '10px', color: 'var(--color-primary)' }}>ⓘ</span>
                        </Tooltip>
                    </div>
                    <div className="kpi-value">{engine.last_prediction_rul ?? '--'}</div>
                    {/* intervalo de confianza 95% */}
                    {latestPred?.lower_95 != null && latestPred?.upper_95 != null ? (
                        <div className="kpi-sub" style={{ fontSize: '0.72rem' }}>
                            {t('engineDetail.ic_95', { lower: Math.round(latestPred.lower_95), upper: Math.round(latestPred.upper_95) })}
                        </div>
                    ) : (
                        <div className="kpi-sub">{t('engineDetail.predicted_rul_desc')}</div>
                    )}
                </div>
                <div className={`kpi-card kpi-card-${riskLevel === 'low' ? 'healthy' : riskLevel === 'medium' ? 'warning' : 'critical'}`}>
                    <div className="kpi-label">
                        {t('engineDetail.confidence')}
                        <Tooltip content={t('engineDetail.confidence_tooltip')}>
                            <span style={{ marginLeft: '4px', fontSize: '10px', color: 'var(--color-primary)' }}>ⓘ</span>
                        </Tooltip>
                    </div>
                    <div className="kpi-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {latestPred ? `${(latestPred.confidence * 100).toFixed(0)}%` : '--'}
                        {/* indicador de tendencia rul */}
                        {latestPred?.rul_trend != null && (
                            <span
                                title={t('engineDetail.rul_trend', { trend: (latestPred.rul_trend > 0 ? '+' : '') + latestPred.rul_trend.toFixed(2) })}
                                style={{
                                    fontSize: '1rem',
                                    color: latestPred.rul_trend >= 0
                                        ? 'var(--color-low, #4ade80)'
                                        : 'var(--color-critical, #ef4444)'
                                }}
                            >
                                {latestPred.rul_trend >= 0 ? '↑' : '↓'}
                            </span>
                        )}
                    </div>
                    <div className="kpi-sub">
                        {t('engineDetail.model_version')} {latestPred?.model_version || 'N/A'}
                        {latestPred?.rul_trend != null && (
                            <span style={{
                                marginLeft: '0.4rem',
                                color: latestPred.rul_trend < -1
                                    ? 'var(--color-critical)'
                                    : latestPred.rul_trend < 0
                                    ? 'var(--color-warning, #f59e0b)'
                                    : 'var(--color-low, #4ade80)'
                            }}>
                                ({latestPred.rul_trend > 0 ? '+' : ''}{latestPred.rul_trend.toFixed(2)})
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                 LIVE SENSOR TELEMETRY — seccion principal
             ═══════════════════════════════════════════════════════════ */}
            <div style={{
                marginBottom: 'var(--spacing-xl)',
                borderRadius: '20px',
                background: 'rgba(0, 229, 255, 0.02)',
                border: '1px solid rgba(0, 229, 255, 0.12)',
                boxShadow: '0 0 40px rgba(0, 229, 255, 0.06), 0 20px 60px rgba(0,0,0,0.4)',
                padding: '24px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* glow top line accent */}
                <div style={{
                    position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.6), transparent)'
                }} />

                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '20px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '4px', height: '32px',
                            background: 'linear-gradient(180deg, #00e5ff, #3b82f6)',
                            borderRadius: '4px',
                            boxShadow: '0 0 12px rgba(0,229,255,0.7)'
                        }} />
                        <div>
                            <div style={{ fontSize: '0.7rem', color: '#00e5ff', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', marginBottom: '2px' }}>REAL-TIME TELEMETRY</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Live Sensor Feed</div>
                        </div>
                    </div>
                </div>

                <SensorChart
                    data={sensorData}
                    sensors={['sensor_3', 'sensor_7', 'sensor_9']}
                    title={t('engineDetail.temp_pressure_rpm_chart')}
                    height={340}
                    isLive={true}
                />

                <div style={{ marginTop: '20px' }}>
                    <SensorChart
                        data={sensorData}
                        sensors={['sensor_11', 'sensor_12', 'sensor_14']}
                        title={t('engineDetail.ps30_fuel_core_chart')}
                        height={300}
                        isLive={true}
                    />
                </div>

                <div style={{ marginTop: '20px' }}>
                    <ScatterSensorChart
                        data={sensorData}
                        xSensor="sensor_3"
                        ySensor="sensor_11"
                        xLabel="Temp HPC (sensor_3)"
                        yLabel="Presión Ps30 (sensor_11)"
                        title={t('engineDetail.correlation_analysis')}
                        height={300}
                    />
                </div>
            </div>

            <div className="grid-3" style={{ marginBottom: 'var(--spacing-xl)', alignItems: 'start' }}>
                <div className="card" style={{ textAlign: 'center', height: '100%' }}>
                    <div className="card-header"><span className="card-title">{t('engineDetail.current_state')}</span></div>
                    <div style={{ padding: 'var(--spacing-md) 0' }}>
                        <RULGauge
                            rul={engine.last_prediction_rul || 0}
                            riskLevel={riskLevel}
                        />
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 'var(--spacing-sm)' }}>
                        {t('engineDetail.risk_level')}: <span className={`badge badge-${riskLevel}`}>{t(`risk.${riskLevel}`)}</span>
                    </p>
                    
                    {engine.anomaly_check?.multivariate_anomaly && (
                        <div style={{ marginTop: 'var(--spacing-md)' }}>
                            <span className="badge badge-critical" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', animation: 'pulse 2s infinite' }}>
                                atencion: {t('engineDetail.zero_day_anomaly', 'zero-day anomaly detected')}
                            </span>
                        </div>
                    )}
                </div>
                
                <div className="card" style={{ gridColumn: 'span 2', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div className="card-header"><span className="card-title">{t('engineDetail.degradation_trend')}</span></div>
                    <div style={{ flex: 1, minHeight: '200px' }}>
                        <RULHistoryChart predictions={engine.predictions} height="100%" />
                    </div>
                </div>
            </div>

            <div className="grid-2" style={{ marginBottom: 'var(--spacing-xl)', gap: 'var(--spacing-xl)', alignItems: 'stretch' }}>
                {/* GEMELO DIGITAL 3D / ESQUEMATICO */}
                <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div className="card-header">
                        <span className="card-title">Gemelo Digital en Vivo (Turbofan)</span>
                    </div>
                    <div style={{ flex: 1, padding: 'var(--spacing-md) 0' }}>
                        <EngineSchematic 
                            rpm={currentRpm} 
                            hpcTemp={currentHpcTemp} 
                            isAnomalous={isAnomalous} 
                            riskLevel={riskLevel} 
                        />
                    </div>
                </div>

                {/* explainable ai (shap) section */}
                <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div className="card-header">
                        <span className="card-title">{t('engineDetail.xai_title', 'explainable ai (xai) - factores de degradacion')}</span>
                        <Tooltip content={t('engineDetail.xai_tooltip', 'valores shap que explican cuantos ciclos aporta (verde) o resta (rojo) cada sensor al rul actual')}>
                            <span style={{ marginLeft: '6px', fontSize: '12px', color: 'var(--color-primary)' }}>i</span>
                        </Tooltip>
                    </div>
                    <div style={{ flex: 1, padding: 'var(--spacing-md) 0' }}>
                        <ShapChart shapValues={latestPred?.shap_values} height={300} />
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div className="card-header"><span className="card-title">{t('engineDetail.equipment_alerts')}</span></div>
                <AlertList
                    alerts={alerts}
                    onAcknowledge={handleAcknowledge}
                />
            </div>

            {/* digital twin simulator */}
            {latestSensor && (
                <div className="grid-2" style={{ marginBottom: 'var(--spacing-xl)', gap: 'var(--spacing-xl)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <DigitalTwinSimulator engineId={id} initialData={latestSensor} />
                    </div>
                    
                    {/* fault injection simulator */}
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div className="card-header">
                            <span className="card-title">Inyección de Fallas (Zero-Day Simulator)</span>
                        </div>
                        <div style={{ padding: 'var(--spacing-md) 0', flex: 1 }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 'var(--spacing-lg)' }}>
                                Simula fallas catastróficas en el motor virtual para probar la resiliencia del modelo de IA (Isolation Forest). El sistema debería detectar la anomalía de inmediato.
                            </p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <button 
                                    className="btn btn-secondary" 
                                    style={{ justifyContent: 'space-between', padding: '12px' }}
                                    onClick={() => enginesAPI.injectFault(id, 'hpc_degradation')}
                                >
                                    <span>🔥 Degradación Súbita HPC</span>
                                    <span style={{ color: 'var(--text-muted)' }}>Temp ++ / Presion --</span>
                                </button>
                                
                                <button 
                                    className="btn btn-secondary"
                                    style={{ justifyContent: 'space-between', padding: '12px' }}
                                    onClick={() => enginesAPI.injectFault(id, 'fan_failure')}
                                >
                                    <span>⚙ Falla de Rodamientos (Fan)</span>
                                    <span style={{ color: 'var(--text-muted)' }}>RPM --</span>
                                </button>

                                <button 
                                    className="btn btn-primary"
                                    style={{ justifyContent: 'center', padding: '12px', marginTop: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#4ade80', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                                    onClick={() => enginesAPI.injectFault(id, null)}
                                >
                                    🔄 Restablecer Operación Normal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <CopilotChat 
                engineContext={{
                    engineName: engine.name,
                    last_prediction_rul: engine.last_prediction_rul,
                    rul_trend: latestPred?.rul_trend,
                    status: engine.status,
                    shap_values: latestPred?.shap_values,
                    multivariate_anomaly: engine.anomaly_check?.multivariate_anomaly
                }} 
            />
            </div>
        </div>
    )
}
