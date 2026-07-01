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

function AppRoutes() {
    const { state } = useAppState()

    useEffect(() => {
        if (state.isAuthenticated) {
            const socket = initSocket()
            socket.connect()
        } else {
            disconnectSocket()
        }
        return () => {
            disconnectSocket()
        }
    }, [state.isAuthenticated])

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
