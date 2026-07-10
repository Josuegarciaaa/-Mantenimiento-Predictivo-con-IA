import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Loading from '../components/common/Loading.jsx'
import { enginesAPI } from '../services/api.js'
import { useTranslation } from 'react-i18next'
import './EnginesAdminPage.css'

const STATUS_OPTIONS = ['healthy', 'warning', 'critical', 'maintenance']
const TYPE_OPTIONS = ['turbofan', 'piston', 'jet', 'turboprop']

const emptyForm = {
    engine_id: '',
    name: '',
    type: 'turbofan',
    location: '',
    installation_date: new Date().toISOString().split('T')[0]
}

export default function EnginesAdminPage() {
    const navigate = useNavigate()
    const [engines, setEngines] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingEngine, setEditingEngine] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [formError, setFormError] = useState(null)
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const { t } = useTranslation()

    useEffect(() => {
        loadEngines()
    }, [])

    async function loadEngines() {
        setLoading(true)
        try {
            const res = await enginesAPI.getAll()
            setEngines(res.data)
        } catch (err) {
            console.error('Error al cargar motores:', err)
        } finally {
            setLoading(false)
        }
    }

    function openCreateModal() {
        setEditingEngine(null)
        setForm(emptyForm)
        setFormError(null)
        setShowModal(true)
    }

    function openEditModal(engine) {
        setEditingEngine(engine)
        setForm({
            engine_id: engine.engine_id,
            name: engine.name,
            type: engine.type || 'turbofan',
            location: engine.location || '',
            installation_date: engine.installation_date || new Date().toISOString().split('T')[0],
            status: engine.status
        })
        setFormError(null)
        setShowModal(true)
    }

    function closeModal() {
        setShowModal(false)
        setEditingEngine(null)
        setForm(emptyForm)
        setFormError(null)
    }

    function handleChange(e) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setFormError(null)

        if (!form.engine_id.trim() || !form.name.trim()) {
            setFormError('El ID de motor y el nombre son obligatorios.')
            return
        }

        setSaving(true)
        try {
            if (editingEngine) {
                await enginesAPI.update(editingEngine.id, {
                    name: form.name,
                    type: form.type,
                    location: form.location,
                    installation_date: form.installation_date,
                    status: form.status
                })
                setSuccess(t('admin.engine_updated'))
            } else {
                await enginesAPI.create({
                    engine_id: form.engine_id,
                    name: form.name,
                    type: form.type,
                    location: form.location,
                    installation_date: form.installation_date
                })
                setSuccess(t('admin.engine_created'))
            }
            await loadEngines()
            closeModal()
            setTimeout(() => setSuccess(null), 3500)
        } catch (err) {
            setFormError(err.message || t('common.error'))
        } finally {
            setSaving(false)
        }
    }

    const filteredEngines = engines.filter(engine => {
        const matchSearch = !searchTerm ||
            engine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            engine.engine_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (engine.location || '').toLowerCase().includes(searchTerm.toLowerCase())
        const matchStatus = statusFilter === 'all' || engine.status === statusFilter
        return matchSearch && matchStatus
    })

    const statusCounts = {
        total: engines.length,
        healthy: engines.filter(e => e.status === 'healthy').length,
        warning: engines.filter(e => e.status === 'warning').length,
        critical: engines.filter(e => e.status === 'critical').length,
        maintenance: engines.filter(e => e.status === 'maintenance').length
    }

    if (loading) return <Loading text={t('common.loading')} />

    return (
        <div className="fade-in engines-admin-page">
            <div className="engines-admin-header">
                <div>
                    <h2 className="page-title">{t('admin.engines_title')}</h2>
                    <p className="page-subtitle">{t('admin.engines_subtitle')}</p>
                </div>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}>
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    {t('admin.add_engine')}
                </button>
            </div>

            {success && (
                <div className="admin-success-banner fade-in">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {success}
                </div>
            )}

            <div className="grid-4 engines-admin-kpis">
                <div className="kpi-card kpi-card-primary">
                    <div className="kpi-label">{t('admin.kpi_total')}</div>
                    <div className="kpi-value">{statusCounts.total}</div>
                </div>
                <div className="kpi-card kpi-card-healthy">
                    <div className="kpi-label">{t('admin.kpi_healthy')}</div>
                    <div className="kpi-value">{statusCounts.healthy}</div>
                </div>
                <div className="kpi-card kpi-card-warning">
                    <div className="kpi-label">{t('admin.kpi_attention')}</div>
                    <div className="kpi-value">{statusCounts.warning + statusCounts.critical}</div>
                </div>
                <div className="kpi-card" style={{ borderTop: '2px solid var(--color-maintenance)' }}>
                    <div className="kpi-label">{t('admin.kpi_maintenance')}</div>
                    <div className="kpi-value" style={{ color: 'var(--color-maintenance)' }}>{statusCounts.maintenance}</div>
                </div>
            </div>

            <div className="card engines-admin-filters">
                <div className="admin-search-wrap">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="admin-search-icon">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                        type="text"
                        className="admin-search-input"
                        placeholder={t('admin.search_placeholder')}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="admin-filter-btns">
                    {['all', ...STATUS_OPTIONS].map(s => (
                        <button
                            key={s}
                            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setStatusFilter(s)}
                        >
                            {s === 'all' ? t('common.all') : t(`status.${s}`)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <span className="card-title">{t('admin.inventory_title')}</span>
                    <span className="card-title" style={{ opacity: 0.5 }}>{filteredEngines.length}</span>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>{t('admin.table_engine')}</th>
                                <th>{t('admin.table_type')}</th>
                                <th>{t('admin.table_location')}</th>
                                <th>{t('admin.table_status')}</th>
                                <th>{t('admin.table_cycles')}</th>
                                <th>RUL</th>
                                <th>{t('admin.table_installation')}</th>
                                <th>{t('admin.table_actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEngines.length === 0 ? (
                                <tr>
                                    <td colSpan="8">
                                        <div className="empty-state">
                                            <div className="empty-state-text">{t('common.no_results')}</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredEngines.map(engine => (
                                <tr key={engine.id} className="engine-admin-row">
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{engine.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{engine.engine_id}</div>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                                            {engine.type || 'turbofan'}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {engine.location || '—'}
                                    </td>
                                    <td>
                                        <span className={`badge badge-${engine.status}`}>{t(`status.${engine.status}`)}</span>
                                    </td>
                                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>{engine.total_cycles ?? '—'}</td>
                                    <td>
                                        <span style={{
                                            fontWeight: 700,
                                            color: engine.last_prediction_rul <= 15 ? 'var(--color-critical)'
                                                : engine.last_prediction_rul <= 30 ? 'var(--color-warning)'
                                                : 'var(--color-healthy)'
                                        }}>
                                            {engine.last_prediction_rul ?? '—'}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {engine.installation_date || '—'}
                                    </td>
                                    <td>
                                        <div className="admin-actions">
                                            <button
                                                className="btn btn-sm btn-secondary"
                                                onClick={() => navigate(`/engines/${engine.id}`)}
                                                title={t('common.view')}
                                            >
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                                </svg>
                                            </button>
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => openEditModal(engine)}
                                                title={t('common.edit')}
                                            >
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay fade-in" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {editingEngine ? t('admin.edit_engine') : t('admin.new_engine')}
                            </h3>
                            <button className="modal-close" onClick={closeModal}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            {formError && <div className="form-error-banner">{formError}</div>}

                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label htmlFor="engine_id">{t('admin.id_label')} *</label>
                                    <input
                                        id="engine_id"
                                        name="engine_id"
                                        type="text"
                                        value={form.engine_id}
                                        onChange={handleChange}
                                        placeholder="Ej. ENG-009"
                                        disabled={!!editingEngine}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="name">{t('admin.name_label')} *</label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="Ej. Turbofan Motor E1"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label htmlFor="type">{t('admin.type_label')}</label>
                                    <select id="type" name="type" value={form.type} onChange={handleChange}>
                                        {TYPE_OPTIONS.map(t => (
                                            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>
                                {editingEngine && (
                                    <div className="form-group">
                                        <label htmlFor="status">{t('admin.status_label')}</label>
                                        <select id="status" name="status" value={form.status} onChange={handleChange}>
                                            {STATUS_OPTIONS.map(s => (
                                                <option key={s} value={s}>{t(`status.${s}`)}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="location">{t('admin.location_label')}</label>
                                <input
                                    id="location"
                                    name="location"
                                    type="text"
                                    value={form.location}
                                    onChange={handleChange}
                                    placeholder="Ej. Linea 5 - Planta Monterrey"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="installation_date">Fecha de Instalacion</label>
                                <input
                                    id="installation_date"
                                    name="installation_date"
                                    type="date"
                                    value={form.installation_date}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={saving}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving
                                        ? (editingEngine ? 'Guardando...' : 'Creando...')
                                        : (editingEngine ? 'Guardar Cambios' : 'Crear Motor')
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
