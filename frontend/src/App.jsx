import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './store/index.js'
import Sidebar from './components/common/Sidebar.jsx'
import Header from './components/common/Header.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import EngineDetailPage from './pages/EngineDetailPage.jsx'
import AlertsPage from './pages/AlertsPage.jsx'
import ReportsPage from './pages/ReportsPage.jsx'

export default function App() {
    return (
        <AppProvider>
            <BrowserRouter>
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
            </BrowserRouter>
        </AppProvider>
    )
}
