import { useEffect, useState } from 'react'
import Loading from '../components/common/Loading.jsx'
import ReportExport from '../components/reports/ReportExport.jsx'
import { enginesAPI, reportsAPI } from '../services/api.js'

export default function ReportsPage() {
    const [engines, setEngines] = useState([])
    const [loading, setLoading] = useState(true)
    const [pdfLoading, setPdfLoading] = useState(false)

    useEffect(() => {
        loadEngines()
    }, [])

    async function loadEngines() {
        setLoading(true)
        try {
            const response = await enginesAPI.getAll()
            setEngines(response.data)
        } catch (err) {
            console.error('Error al cargar equipos', err)
        } finally {
            setLoading(false)
        }
    }

    async function handleExportPDF(engineId) {
        setPdfLoading(true)
        try {
            const response = await reportsAPI.getPDF(engineId)
            const engine = engines.find(e => e.id === engineId)
            const blob = response instanceof Blob ? response : new Blob([response], { type: 'application/pdf' })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `reporte_${engine?.engine_id || engineId}.pdf`
            link.click()
            window.URL.revokeObjectURL(url)
        } catch (err) {
            console.error('Error al generar PDF:', err)
        } finally {
            setPdfLoading(false)
        }
    }

    if (loading) return <Loading text="Cargando reportes..." />

    return (
        <div className="fade-in">
            <div className="card">
                <div className="card-header">
                    <span className="card-title">Generación de Reportes</span>
                </div>
                <div style={{ padding: 'var(--spacing-md) 0' }}>
                    <p className="page-subtitle" style={{ padding: '0 var(--spacing-lg)' }}>
                        Seleccione un equipo para generar un reporte detallado en PDF con su historial de RUL, alertas y lecturas recientes.
                    </p>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Equipo</th>
                                    <th>Ubicación</th>
                                    <th>Estado</th>
                                    <th>RUL Predicho</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {engines.map(engine => (
                                    <tr key={engine.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{engine.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{engine.engine_id}</div>
                                        </td>
                                        <td>{engine.location}</td>
                                        <td>
                                            <span className={`badge badge-${engine.status}`}>
                                                {engine.status}
                                            </span>
                                        </td>
                                        <td>{engine.last_prediction_rul ?? '--'} ciclos</td>
                                        <td>
                                            <ReportExport
                                                engineId={engine.id}
                                                onExport={handleExportPDF}
                                                loading={pdfLoading}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
