import { useEffect, useState } from 'react'
import { useAppState } from '../../store/index.jsx'
import './Toast.css'

const ICONS = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
}

const TITLES = {
    success: 'Éxito',
    error: 'Error',
    warning: 'Advertencia',
    info: 'Información'
}

function ToastItem({ toast, onRemove }) {
    const [exiting, setExiting] = useState(false)
    const duration = toast.duration || 4500

    useEffect(() => {
        const timer = setTimeout(() => {
            setExiting(true)
            setTimeout(() => onRemove(toast.id), 350)
        }, duration)
        return () => clearTimeout(timer)
    }, [toast.id, duration, onRemove])

    function handleClose() {
        setExiting(true)
        setTimeout(() => onRemove(toast.id), 350)
    }

    const type = toast.type || 'info'

    return (
        <div className={`toast toast-${type} ${exiting ? 'toast-exiting' : ''}`}>
            <div className="toast-icon">{ICONS[type]}</div>
            <div className="toast-body">
                <div className="toast-title">{toast.title || TITLES[type]}</div>
                {toast.message && <div className="toast-message">{toast.message}</div>}
            </div>
            <button className="toast-close" onClick={handleClose} aria-label="Close">×</button>
            <div className="toast-progress" style={{ animationDuration: `${duration}ms` }} />
        </div>
    )
}

export default function ToastContainer() {
    const { state, dispatch } = useAppState()
    const toasts = state.toasts || []

    function removeToast(id) {
        dispatch({ type: 'REMOVE_TOAST', payload: id })
    }

    if (toasts.length === 0) return null

    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
        </div>
    )
}
