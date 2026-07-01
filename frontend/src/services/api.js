import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' }
})

// Adjuntar token JWT si existe
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    error => Promise.reject(error)
)

api.interceptors.response.use(
    response => response.data,
    error => {
        const message = error.response?.data?.error?.message || error.message || 'Error de conexion'
        
        // Si el servidor responde con 401 o 403 (no autorizado o expirado), podemos forzar logout
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            if (window.location.pathname !== '/login') {
                window.location.href = '/login'
            }
        }
        
        return Promise.reject(new Error(message))
    }
)

export const authAPI = {
    login: (username, password) => api.post('/auth/login', { username, password }),
    register: (username, password, role) => api.post('/auth/register', { username, password, role })
}

export const dashboardAPI = {
    getSummary: () => api.get('/dashboard')
}

export const enginesAPI = {
    getAll: () => api.get('/engines'),
    getById: (id) => api.get(`/engines/${id}`),
    create: (data) => api.post('/engines', data),
    update: (id, data) => api.put(`/engines/${id}`, data),
    getHistory: (id) => api.get(`/engines/${id}/history`)
}

export const sensorsAPI = {
    getData: (engineId, limit) => api.get(`/sensors/${engineId}`, { params: { limit } }),
    getLatest: (engineId) => api.get(`/sensors/${engineId}/latest`),
    addReading: (data) => api.post('/sensors', data)
}

export const predictionsAPI = {
    getAll: () => api.get('/predictions'),
    getByEngine: (engineId) => api.get(`/predictions/${engineId}`),
    generate: (engineId) => api.post('/predictions/predict', { engine_id: engineId }),
    batch: () => api.post('/predictions/batch')
}

export const alertsAPI = {
    getAll: (filters) => api.get('/alerts', { params: filters }),
    getById: (id) => api.get(`/alerts/${id}`),
    acknowledge: (id, user) => api.put(`/alerts/${id}/ack`, { user }),
    getStats: () => api.get('/alerts/stats')
}

export const reportsAPI = {
    getPDF: (engineId) => api.get(`/reports/pdf/${engineId}`, { responseType: 'blob' }),
    getSummary: () => api.get('/reports/summary')
}

export const settingsAPI = {
    getModel: () => api.get('/settings/model'),
    updateModel: (modelType) => api.post('/settings/model', { modelType })
}

export default api
