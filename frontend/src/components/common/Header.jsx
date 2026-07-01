import { useLocation } from 'react-router-dom'
import './Header.css'

const pageTitles = {
    '/': 'Dashboard',
    '/alerts': 'Alertas',
    '/reports': 'Reportes'
}

export default function Header() {
    const location = useLocation()
    let title = pageTitles[location.pathname] || ''

    if (location.pathname.startsWith('/engines/')) {
        title = 'Detalle de Motor'
    }

    const now = new Date()
    const formattedDate = now.toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

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
                    <input type="text" placeholder="Buscar equipo..." className="header-search-input" />
                </div>
                <div className="header-user">
                    <div className="header-avatar">OP</div>
                    <span className="header-username">Operador</span>
                </div>
            </div>
        </header>
    )
}
