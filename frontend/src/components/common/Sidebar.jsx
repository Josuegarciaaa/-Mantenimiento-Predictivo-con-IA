import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppState } from '../../store/index.jsx'
import Logo from './Logo.jsx'
import './Sidebar.css'

const navItems = [
    { path: '/', labelKey: 'dashboard', icon: 'grid' },
    { path: '/alerts', labelKey: 'alerts', icon: 'bell' },
    { path: '/calendar', labelKey: 'calendar', icon: 'calendar' },
    { path: '/reports', labelKey: 'reports', icon: 'file' },
    { path: '/glossary', labelKey: 'glossary', icon: 'book' }
]

const adminItems = [
    { path: '/engines-admin', labelKey: 'engines', icon: 'engine' },
    { path: '/mlops', labelKey: 'mlops', icon: 'settings' },
    { path: '/settings', labelKey: 'settings', icon: 'settings' },
    { path: '/users', labelKey: 'users', icon: 'users' }
]

const icons = {
    grid: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
        </svg>
    ),
    bell: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    ),
    file: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        </svg>
    ),
    engine: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
        </svg>
    ),
    settings: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
    ),
    users: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
    ),
    calendar: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
    ),
    book: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
        </svg>
    )
}

export default function Sidebar() {
    const { state, dispatch } = useAppState()
    const { t, i18n } = useTranslation()

    function handleLogout() {
        dispatch({ type: 'LOGOUT' })
    }

    function toggleLanguage(lang) {
        i18n.changeLanguage(lang)
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="sidebar-logo">
                    <Logo size={28} color="var(--color-primary-light)" />
                </div>
                <div className="sidebar-brand-text">
                    <span className="sidebar-brand-name">PredMaint</span>
                    <span className="sidebar-brand-sub">Industrial AI</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="sidebar-section-label">{t('sidebar.main')}</div>
                {navItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                        }
                    >
                        <span className="sidebar-link-icon">{icons[item.icon]}</span>
                        <span className="sidebar-link-label">{t(`sidebar.${item.labelKey}`)}</span>
                    </NavLink>
                ))}

                {state.user?.role === 'admin' && (
                    <>
                        <div className="sidebar-section-label" style={{ marginTop: 'var(--spacing-md)' }}>{t('sidebar.admin')}</div>
                        {adminItems.map(item => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                                }
                            >
                                <span className="sidebar-link-icon">{icons[item.icon]}</span>
                                <span className="sidebar-link-label">{t(`sidebar.${item.labelKey}`)}</span>
                            </NavLink>
                        ))}
                    </>
                )}
            </nav>

            <div className="sidebar-footer">
                {state.user && (
                    <div className="sidebar-user-info" style={{ marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{state.user.username}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{state.user.role}</div>
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <div className="sidebar-status">
                        <span className="status-dot status-dot-healthy"></span>
                        <span className="sidebar-status-text">{t('sidebar.online')}</span>
                    </div>
                    <button onClick={handleLogout} className="btn-logout" style={{ background: 'none', border: 'none', color: 'var(--color-critical)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, padding: 0 }}>
                        {t('sidebar.logout')}
                    </button>
                </div>
                
                <div className="language-selector">
                    <button 
                        onClick={() => toggleLanguage('es')} 
                        className={`lang-btn ${i18n.language === 'es' ? 'active' : ''}`}
                    >
                        ES
                    </button>
                    <button 
                        onClick={() => toggleLanguage('en')} 
                        className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
                    >
                        EN
                    </button>
                </div>
            </div>
        </aside>
    )
}
