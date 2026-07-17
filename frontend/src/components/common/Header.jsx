import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppState } from '../../store/index.jsx'
import { useTranslation } from 'react-i18next'
import './Header.css'

export default function Header() {
    const location = useLocation()
    const navigate = useNavigate()
    const { state, dispatch } = useAppState()
    const { t, i18n } = useTranslation()
    const [searchQuery, setSearchQuery] = useState('')
    const [searchOpen, setSearchOpen] = useState(false)
    const [bellOpen, setBellOpen] = useState(false)
    const searchRef = useRef(null)
    const bellRef = useRef(null)
    
    let title = ''
    if (location.pathname === '/') title = t('sidebar.dashboard')
    else if (location.pathname === '/alerts') title = t('sidebar.alerts')
    else if (location.pathname === '/reports') title = t('sidebar.reports')
    else if (location.pathname === '/engines-admin') title = t('admin.engines_title')
    else if (location.pathname === '/settings') title = t('settings.title')
    else if (location.pathname === '/users') title = t('admin.users_title')
    else if (location.pathname === '/calendar') title = t('calendar.title')
    else if (location.pathname === '/glossary') title = t('glossary.title')

    if (location.pathname.startsWith('/engines/')) {
        title = t('engineDetail.engine_detail')
    }

    const now = new Date()
    const localeToUse = i18n.language === 'es' ? 'es-MX' : 'en-US'
    const formattedDate = now.toLocaleDateString(localeToUse, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    const username = state.user?.username || t('common.unknown_user')
    const avatarText = username.slice(0, 2).toUpperCase()

    // Search filtering
    const engines = state.engines || []
    const searchResults = searchQuery.trim().length > 0
        ? engines.filter(e =>
            e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.engine_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.location?.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5)
        : []

    function handleSearchSelect(engineId) {
        navigate(`/engines/${engineId}`)
        setSearchQuery('')
        setSearchOpen(false)
    }

    // Unread alerts
    const unreadAlerts = (state.alerts || []).filter(a => !a.is_acknowledged)
    const unreadCount = unreadAlerts.length

    // Click outside to close dropdowns
    useEffect(() => {
        function handleClickOutside(e) {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setSearchOpen(false)
            }
            if (bellRef.current && !bellRef.current.contains(e.target)) {
                setBellOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    function handleToggleSidebar() {
        dispatch({ type: 'TOGGLE_SIDEBAR' })
    }

    return (
        <header className="header">
            <div className="header-left">
                <button className="header-hamburger" onClick={handleToggleSidebar} aria-label="Toggle menu">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
                <div>
                    <h1 className="header-title">{title}</h1>
                    <span className="header-date">{formattedDate}</span>
                </div>
            </div>
            <div className="header-right">
                {/* Functional Search */}
                <div className="header-search" ref={searchRef}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        placeholder={t('common.search_equipment')}
                        className="header-search-input"
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true) }}
                        onFocus={() => setSearchOpen(true)}
                    />
                    {searchOpen && searchResults.length > 0 && (
                        <div className="header-search-dropdown">
                            {searchResults.map(engine => (
                                <button
                                    key={engine.id}
                                    className="header-search-item"
                                    onClick={() => handleSearchSelect(engine.id)}
                                >
                                    <span className={`status-dot status-dot-${engine.status}`} />
                                    <div className="header-search-item-info">
                                        <span className="header-search-item-name">{engine.name}</span>
                                        <span className="header-search-item-id">{engine.engine_id} · {engine.location}</span>
                                    </div>
                                    <span className="header-search-item-rul">
                                        RUL {engine.last_prediction_rul ?? '--'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                    {searchOpen && searchQuery.trim().length > 0 && searchResults.length === 0 && (
                        <div className="header-search-dropdown">
                            <div className="header-search-empty">{t('common.no_results')}</div>
                        </div>
                    )}
                </div>

                {/* Notification Bell */}
                <div className="header-bell-wrap" ref={bellRef}>
                    <button className="header-bell" onClick={() => setBellOpen(!bellOpen)} aria-label="Notifications">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        {unreadCount > 0 && (
                            <span className="header-bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                        )}
                    </button>
                    {bellOpen && (
                        <div className="header-bell-dropdown">
                            <div className="header-bell-dropdown-header">
                                <span className="header-bell-dropdown-title">{t('sidebar.alerts')}</span>
                                <span className="header-bell-dropdown-count">{unreadCount} {t('alerts.active')}</span>
                            </div>
                            <div className="header-bell-dropdown-list">
                                {unreadAlerts.length === 0 ? (
                                    <div className="header-bell-empty">{t('dashboard.no_alerts')}</div>
                                ) : (
                                    unreadAlerts.slice(0, 5).map(alert => (
                                        <div key={alert.id} className="header-bell-item" onClick={() => { navigate('/alerts'); setBellOpen(false) }}>
                                            <span className={`header-bell-item-dot header-bell-item-dot-${alert.type}`} />
                                            <div className="header-bell-item-info">
                                                <span className="header-bell-item-msg">{alert.message}</span>
                                                <span className="header-bell-item-time">
                                                    {alert.created_at ? new Date(alert.created_at).toLocaleTimeString(localeToUse) : ''}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            {unreadAlerts.length > 5 && (
                                <button className="header-bell-view-all" onClick={() => { navigate('/alerts'); setBellOpen(false) }}>
                                    {t('common.view_all')} →
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="header-user">
                    <div className="header-avatar">{avatarText}</div>
                    <span className="header-username" style={{ textTransform: 'capitalize' }}>{username}</span>
                </div>
            </div>
        </header>
    )
}
