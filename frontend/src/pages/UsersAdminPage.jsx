import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import Loading from '../components/common/Loading'
import './EnginesAdminPage.css' // Reusing some table styles

export default function UsersAdminPage() {
    const { t } = useTranslation()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [notification, setNotification] = useState(null)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const data = await api.get('/users')
            if (data.success) {
                setUsers(data.data)
            } else {
                setError(t('common.error'))
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleRoleChange = async (userId, newRole) => {
        try {
            const res = await api.put(`/users/${userId}/role`, { role: newRole })
            if (res.success) {
                setNotification({ type: 'success', message: t('admin.role_updated') })
                fetchUsers()
            } else {
                setNotification({ type: 'error', message: res.error?.message || t('common.error') })
            }
        } catch (err) {
            setNotification({ type: 'error', message: err.message })
        }
    }

    const handleDelete = async (userId) => {
        if (!window.confirm(t('admin.delete_confirm'))) return
        try {
            const res = await api.delete(`/users/${userId}`)
            if (res.success) {
                setNotification({ type: 'success', message: t('admin.user_deleted') })
                fetchUsers()
            } else {
                setNotification({ type: 'error', message: res.error?.message || t('common.error') })
            }
        } catch (err) {
            setNotification({ type: 'error', message: err.message })
        }
    }

    if (loading) return <Loading text={t('common.loading')} />

    return (
        <div className="admin-page animate-fade-in">
            <header className="admin-header">
                <div>
                    <h1 className="page-title">{t('admin.users_title')}</h1>
                    <p className="page-subtitle">{t('admin.users_subtitle')}</p>
                </div>
            </header>

            {notification && (
                <div className={`notification ${notification.type}`}>
                    {notification.message}
                    <button onClick={() => setNotification(null)} className="btn-close">×</button>
                </div>
            )}

            {error && <div className="alert alert-critical">{error}</div>}

            <div className="admin-content">
                <div className="card">
                    <div className="table-responsive">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>{t('auth.username')}</th>
                                    <th>{t('admin.role')}</th>
                                    <th>{t('admin.created_at')}</th>
                                    <th>{t('admin.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.id}</td>
                                        <td><strong>{user.username}</strong></td>
                                        <td>
                                            <select
                                                className="form-input"
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            >
                                                <option value="operator">{t('admin.operator_role')}</option>
                                                <option value="admin">{t('admin.admin_role')}</option>
                                            </select>
                                        </td>
                                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <button 
                                                className="btn btn-outline" 
                                                style={{ color: 'var(--color-critical)', borderColor: 'var(--color-critical)' }}
                                                onClick={() => handleDelete(user.id)}
                                            >
                                                {t('common.delete')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center' }}>No hay usuarios</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
