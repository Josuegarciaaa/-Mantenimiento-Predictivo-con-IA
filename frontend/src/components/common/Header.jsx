import { useLocation } from 'react-router-dom'
import { useAppState } from '../../store/index.jsx'
import { useTranslation } from 'react-i18next'
import './Header.css'

export default function Header() {
    const location = useLocation()
    const { state } = useAppState()
    const { t, i18n } = useTranslation()
    
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

    return (
        <header className="header">
            <div className="header-left">
                <h1 className="header-title">{title}</h1>
                <span className="header-date">{formattedDate}</span>
            </div>
            <div className="header-right">
                <div className="header-search">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input type="text" placeholder={t('common.search_equipment')} className="header-search-input" />
                </div>
                <div className="header-user">
                    <div className="header-avatar">{avatarText}</div>
                    <span className="header-username" style={{ textTransform: 'capitalize' }}>{username}</span>
                </div>
            </div>
        </header>
    )
}
