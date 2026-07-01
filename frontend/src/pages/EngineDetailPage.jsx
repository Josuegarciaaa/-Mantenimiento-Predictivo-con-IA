import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SensorChart from '../components/charts/SensorChart.jsx'
import RULGauge from '../components/charts/RULGauge.jsx'
import ReportExport from '../components/reports/ReportExport.jsx'
import AlertList from '../components/alerts/AlertList.jsx'
import Loading from '../components/common/Loading.jsx'
import { enginesAPI, sensorsAPI, alertsAPI, reportsAPI } from '../services/api.js'

import RULHistoryChart from '../components/charts/RULHistoryChart.jsx'
import { getSocket } from '../services/socket.js'

export default function EngineDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [engine, setEngine] = useState(null)
    const [sensorData, setSensorData] = useState([])
    const [alerts, setAlerts] = useState([])
    const [loading, setLoading] = useState(true)
    const [pdfLoading, setPdfLoading] = useState(false)
    const [error, setError] = useState(null)

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
                    // Mantener maximo de 50 lecturas en la grafica
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
            setEngine(engRes.data)
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
            link.download = `reporte_${engine?.engine_id || id}.pdf`
            link.click()
            window.URL.revokeObjectURL(url)
        } catch (err) {
            console.error('Error al generar PDF:', err)
        } finally {
            setPdfLoading(false)
        }
    }

    async function handleAcknowledge(alertId) {
        try {
            await alertsAPI.acknowledge(alertId, 'Operador')
            setAlerts(prev => prev.map(a =>
                a.id === alertId
                    ? { ...a, is_acknowledged: true, acknowledged_by: 'Operador', acknowledged_at: new Date().toISOString() }
                    : a
            ))
        } catch (err) {
            console.error(err)
        }
    }

    if (loading) return <Loading text="Cargando detalle del motor..." />

    if (error || !engine) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                <p style={{ color: 'var(--color-critical)', marginBottom: 'var(--spacing-md)' }}>
                    {error || 'Motor no encontrado'}
                </p>
                <button className="btn btn-secondary" onClick={() => navigate('/')}>Volver al dashboard</button>
            </div>
        )
    }

    function getRiskLevel(rul) {
        if (rul <= 15) return 'critical'
        if (rul <= 30) return 'high'
        if (rul <= 50) return 'medium'
        return 'low'
    }

    const riskLevel = engine.last_prediction_rul !== null
        ? getRiskLevel(engine.last_prediction_rul)
        : 'low'

    const latestPred = engine.predictions?.length
        ? engine.predictions[engine.predictions.length - 1]
        : null

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-xl)' }}>
                <div>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/')} style={{ marginBottom: 'var(--spacing-sm)' }}>
                        &larr; Volver
                    </button>
                    <h2 className="page-title" style={{ marginBottom: 0 }}>{engine.name}</h2>
                    <p className="page-subtitle" style={{ marginBottom: 0 }}>
                        {engine.engine_id} &middot; {engine.location} &middot;
                        <span className={`badge badge-${engine.status}`} style={{ marginLeft: '0.5rem' }}>
                            {engine.status}
                        </span>
                    </p>
                </div>
                <ReportExport
                    engineId={id}
                    engineName={engine.name}
                    onExport={handleExportPDF}
                    loading={pdfLoading}
                />
            </div>

            <div className="grid-3" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div className="kpi-card kpi-card-primary">
                    <div className="kpi-label">Ciclos totales</div>
                    <div className="kpi-value">{engine.total_cycles}</div>
                    <div className="kpi-sub">Desde instalacion</div>
                </div>
                <div className="kpi-card kpi-card-secondary">
                    <div className="kpi-label">RUL predicho</div>
                    <div className="kpi-value">{engine.last_prediction_rul ?? '--'}</div>
                    <div className="kpi-sub">Ciclos restantes estimados</div>
                </div>
                <div className={`kpi-card kpi-card-${riskLevel === 'low' ? 'healthy' : riskLevel === 'medium' ? 'warning' : 'critical'}`}>
                    <div className="kpi-label">Confianza</div>
                    <div className="kpi-value">
                        {latestPred ? `${(latestPred.confidence * 100).toFixed(0)}%` : '--'}
                    </div>
                    <div className="kpi-sub">Modelo {latestPred?.model_version || 'N/A'}</div>
                </div>
            </div>

            <div className="grid-3" style={{ marginBottom: 'var(--spacing-xl)', alignItems: 'start' }}>
                <div className="card" style={{ textAlign: 'center', height: '100%' }}>
                    <div className="card-header"><span className="card-title">Estado Actual</span></div>
                    <div style={{ padding: 'var(--spacing-md) 0' }}>
                        <RULGauge
                            rul={engine.last_prediction_rul || 0}
                            riskLevel={riskLevel}
                        />
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 'var(--spacing-sm)' }}>
                        Nivel de riesgo: <span className={`badge badge-${riskLevel}`}>{riskLevel}</span>
                    </p>
                </div>
                
                <div className="card" style={{ gridColumn: 'span 2', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div className="card-header"><span className="card-title">Tendencia de Degradación (RUL)</span></div>
                    <div style={{ flex: 1, minHeight: '200px' }}>
                        <RULHistoryChart predictions={engine.predictions} height="100%" />
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div className="card-header"><span className="card-title">Alertas del equipo</span></div>
                <AlertList
                    alerts={alerts}
                    onAcknowledge={handleAcknowledge}
                />
            </div>

            <SensorChart
                data={sensorData}
                sensors={['sensor_3', 'sensor_7', 'sensor_9']}
                title="Temperatura HPC, Presion HPC, RPM Core"
                height={300}
            />

            <div style={{ marginTop: 'var(--spacing-lg)' }}>
                <SensorChart
                    data={sensorData}
                    sensors={['sensor_11', 'sensor_12', 'sensor_14']}
                    title="Ps30, Fuel/Ps30, Core Corregido"
                    height={280}
                />
            </div>
        </div>
    )
}
