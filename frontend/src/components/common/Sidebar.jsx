import { NavLink } from 'react-router-dom'
import { useAppState } from '../../store/index.jsx'
import Logo from './Logo.jsx'
import './Sidebar.css'

const navItems = [
    { path: '/', label: 'Dashboard', icon: 'grid' },
    { path: '/alerts', label: 'Alertas', icon: 'bell' },
    { path: '/reports', label: 'Reportes', icon: 'file' }
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
    )
}

export default function Sidebar() {
    const { state, dispatch } = useAppState()

    function handleLogout() {
        dispatch({ type: 'LOGOUT' })
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
                <div className="sidebar-section-label">Principal</div>
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
                        <span className="sidebar-link-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                {state.user && (
                    <div className="sidebar-user-info" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{state.user.username}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{state.user.role}</div>
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="sidebar-status">
                        <span className="status-dot status-dot-healthy"></span>
                        <span className="sidebar-status-text">Online</span>
                    </div>
                    <button onClick={handleLogout} className="btn-logout" style={{ background: 'none', border: 'none', color: 'var(--color-critical)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, padding: 0 }}>
                        Cerrar Sesion
                    </button>
                </div>
            </div>
        </aside>
    )
}
