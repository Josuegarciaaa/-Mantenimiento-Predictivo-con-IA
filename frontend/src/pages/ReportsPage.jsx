import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Loading from '../components/common/Loading.jsx'
import ReportExport from '../components/reports/ReportExport.jsx'
import { enginesAPI, reportsAPI, sensorsAPI } from '../services/api.js'

export default function ReportsPage() {
    const { t } = useTranslation()
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
            console.error(err)
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

    async function handleExportCSV(engineId) {
        try {
            const response = await sensorsAPI.getData(engineId, 1000) // Fetch up to 1000 records
            if (response.success && response.data.length > 0) {
                const data = response.data
                // Create CSV headers
                const headers = Object.keys(data[0]).filter(k => k !== 'engine_id').join(',')
                
                // Create CSV rows
                const rows = data.map(row => {
                    return Object.keys(row)
                        .filter(k => k !== 'engine_id')
                        .map(k => row[k])
                        .join(',')
                })
                
                const csvContent = headers + '\\n' + rows.join('\\n')
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                const engine = engines.find(e => e.id === engineId)
                link.href = url
                link.download = `datos_sensores_${engine?.engine_id || engineId}.csv`
                link.click()
                window.URL.revokeObjectURL(url)
            } else {
                alert(t('common.no_results'))
            }
        } catch (err) {
            console.error(err)
            alert(t('common.error'))
        }
    }

    if (loading) return <Loading text={t('common.loading')} />

    return (
        <div className="fade-in">
            <div className="card">
                <div className="card-header">
                    <span className="card-title">{t('sidebar.reports')}</span>
                </div>
                <div style={{ padding: 'var(--spacing-md) 0' }}>
                    <p className="page-subtitle" style={{ padding: '0 var(--spacing-lg)' }}>
                        {t('reports.subtitle')}
                    </p>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>{t('admin.equipment')}</th>
                                    <th>{t('admin.location')}</th>
                                    <th>{t('admin.status')}</th>
                                    <th>{t('admin.predicted_rul')}</th>
                                    <th>{t('admin.actions')}</th>
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
                                        <td>{engine.last_prediction_rul ?? '--'} {t('engineDetail.cycles')}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <ReportExport
                                                    engineId={engine.id}
                                                    onExport={handleExportPDF}
                                                    loading={pdfLoading}
                                                />
                                                <button 
                                                    className="btn btn-outline" 
                                                    onClick={() => handleExportCSV(engine.id)}
                                                    title={t('common.export_csv')}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem' }}>
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 3v5h5M8 13h2M8 17h2M14 13h2M14 17h2"/>
                                                    </svg>
                                                    CSV
                                                </button>
                                            </div>
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
