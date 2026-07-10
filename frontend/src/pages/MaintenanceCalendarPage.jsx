import { useState, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './MaintenanceCalendarPage.css'
import { useTranslation } from 'react-i18next'
import { enginesAPI } from '../services/api'
import Loading from '../components/common/Loading'

const localizer = momentLocalizer(moment)

export default function MaintenanceCalendarPage() {
    const { t, i18n } = useTranslation()
    const [events, setEvents] = useState([])
    const [engines, setEngines] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [selectedEngine, setSelectedEngine] = useState('')
    const [selectedDate, setSelectedDate] = useState('')
    const [description, setDescription] = useState('')

    useEffect(() => {
        moment.locale(i18n.language === 'es' ? 'es' : 'en')
        loadData()
    }, [i18n.language])

    async function loadData() {
        setLoading(true)
        try {
            const response = await enginesAPI.getAll()
            if (response.success) {
                setEngines(response.data)
                
                // Mapear motores en mantenimiento como eventos de calendario
                const maintenanceEvents = response.data
                    .filter(e => e.status === 'maintenance' || e.status === 'critical')
                    .map((e, index) => ({
                        id: index,
                        title: `${t('calendar.maintenance')}: ${e.name}`,
                        start: new Date(), // En un caso real vendría de la BD
                        end: new Date(new Date().setHours(new Date().getHours() + 4)),
                        resource: e
                    }))
                
                setEvents(maintenanceEvents)
            }
        } catch (err) {
            console.error('Error cargando datos para calendario', err)
        } finally {
            setLoading(false)
        }
    }

    async function handleSchedule(e) {
        e.preventDefault()
        if (!selectedEngine || !selectedDate) return

        try {
            const res = await enginesAPI.scheduleMaintenance(selectedEngine, {
                date: selectedDate,
                description
            })
            
            if (res.success) {
                setShowModal(false)
                setSelectedEngine('')
                setDescription('')
                loadData()
            } else {
                alert(t('alerts.error_schedule') + res.error?.message)
            }
        } catch (err) {
            alert(t('common.error'))
        }
    }

    if (loading) return <Loading text={t('common.loading')} />

    return (
        <div className="fade-in">
            <div className="card">
                <div className="card-header">
                    <span className="card-title">{t('sidebar.calendar')}</span>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        {t('calendar.schedule_new')}
                    </button>
                </div>
                <div style={{ padding: 'var(--spacing-md) 0' }}>
                    <p className="page-subtitle" style={{ padding: '0 var(--spacing-lg)' }}>
                        {t('calendar.subtitle')}
                    </p>
                </div>
            </div>

            <div className="card" style={{ height: 'calc(100vh - 200px)', padding: '1rem' }}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    messages={{
                        next: t('common.next'),
                        previous: t('common.previous'),
                        today: t('common.today'),
                        month: t('common.month'),
                        week: t('common.week'),
                        day: t('common.day')
                    }}
                />
            </div>

            {showModal && (
                <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content" style={{ width: '400px', padding: '2rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-primary)' }}>
                            {t('calendar.schedule_maintenance')}
                        </h3>
                        <form onSubmit={handleSchedule}>
                            <div className="form-group">
                                <label>{t('admin.equipment')}</label>
                                <select 
                                    className="form-control"
                                    value={selectedEngine} 
                                    onChange={e => setSelectedEngine(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '0.5rem' }}
                                >
                                    <option value="">-- {t('calendar.select_engine')} --</option>
                                    {engines.filter(e => e.status !== 'maintenance').map(e => (
                                        <option key={e.id} value={e.id}>{e.name} ({e.engine_id})</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label>{t('calendar.date')}</label>
                                <input 
                                    type="datetime-local" 
                                    className="form-control"
                                    value={selectedDate}
                                    onChange={e => setSelectedDate(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '0.5rem' }}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label>{t('calendar.description')}</label>
                                <textarea 
                                    className="form-control"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows="3"
                                    style={{ width: '100%', padding: '0.5rem' }}
                                ></textarea>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('common.cancel')}</button>
                                <button type="submit" className="btn btn-primary">{t('calendar.save')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
