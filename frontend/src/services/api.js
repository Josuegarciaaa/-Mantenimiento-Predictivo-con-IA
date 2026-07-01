import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' }
})

api.interceptors.response.use(
    response => response.data,
    error => {
        const message = error.response?.data?.error?.message || error.message || 'Error de conexion'
        return Promise.reject(new Error(message))
    }
)

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

export default api
