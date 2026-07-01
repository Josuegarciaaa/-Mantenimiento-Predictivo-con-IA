import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { initSocket, disconnectSocket } from './services/socket.js'
import { AppProvider, useAppState } from './store/index.jsx'
import Sidebar from './components/common/Sidebar.jsx'
import Header from './components/common/Header.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import EngineDetailPage from './pages/EngineDetailPage.jsx'
import AlertsPage from './pages/AlertsPage.jsx'
import ReportsPage from './pages/ReportsPage.jsx'
import LoginPage from './pages/LoginPage.jsx'

function ProtectedLayout() {
    const { state } = useAppState()
    if (!state.isAuthenticated) {
        return <Navigate to="/login" replace />
    }
    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-area">
                <Header />
                <main className="page-content">
                    <Routes>
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/engines/:id" element={<EngineDetailPage />} />
                        <Route path="/alerts" element={<AlertsPage />} />
                        <Route path="/reports" element={<ReportsPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    )
}

import { settingsAPI } from './services/api.js'

function AppRoutes() {
    const { state, dispatch } = useAppState()

    useEffect(() => {
        if (state.isAuthenticated) {
            const socket = initSocket()
            socket.connect()

            // Cargar modelo activo al iniciar
            settingsAPI.getModel()
                .then(res => {
                    if (res.success && res.data) {
                        dispatch({ type: 'SET_MODEL_TYPE', payload: res.data.modelType })
                    }
                })
                .catch(err => console.error('Error cargando modelo:', err))

            // Escuchar cambios en tiempo real
            socket.on('model_changed', (data) => {
                dispatch({ type: 'SET_MODEL_TYPE', payload: data.modelType })
            })
        } else {
            disconnectSocket()
        }
        return () => {
            disconnectSocket()
        }
    }, [state.isAuthenticated, dispatch])

    return (
        <Routes>
            <Route path="/login" element={state.isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
            <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
    )
}

export default function App() {
    return (
        <AppProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AppProvider>
    )
}
