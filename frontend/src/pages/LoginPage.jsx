import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '../store/index.jsx'
import { authAPI } from '../services/api'
import Logo from '../components/common/Logo.jsx'
import './LoginPage.css'

export default function LoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const { dispatch } = useAppState()
    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault()
        if (!username.trim() || !password.trim()) {
            setError('Por favor llena todos los campos')
            return
        }
        
        setError(null)
        setLoading(true)
        try {
            const res = await authAPI.login(username, password)
            if (res.success && res.data) {
                dispatch({
                    type: 'LOGIN_SUCCESS',
                    payload: {
                        token: res.data.token,
                        user: res.data.user
                    }
                })
                navigate('/')
            } else {
                setError(res.error?.message || 'Error al iniciar sesion')
            }
        } catch (err) {
            setError(err.message || 'Error de conexion con el servidor')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-container">
            <div className="login-card fade-in">
                <div className="login-header">
                    <div className="login-logo">
                        <Logo size={42} color="var(--text-primary)" />
                        <h2>PredMaint</h2>
                    </div>
                    <p className="login-subtitle">Monitoreo y Mantenimiento Predictivo con IA</p>
                </div>

                {error && <div className="login-error">{error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="username">Usuario</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Ej. operator"
                            autoComplete="username"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                        {loading ? 'Iniciando sesion...' : 'Ingresar al Dashboard'}
                    </button>
                </form>

                <div className="login-footer">
                    <p>Credenciales de demo:</p>
                    <p><code>admin / admin123</code> &middot; <code>operator / operator123</code></p>
                </div>
            </div>
        </div>
    )
}
