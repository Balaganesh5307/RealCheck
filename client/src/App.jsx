import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Upload from './pages/Upload'
import Result from './pages/Result'
import History from './pages/History'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'

function ProtectedRoute({ children, tokenKey, redirectTo }) {
    return localStorage.getItem(tokenKey) ? children : <Navigate to={redirectTo} replace />
}

function App() {
    return (
        <div className="app">
            <Routes>
                {/* Auth */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin" element={<AdminLogin />} />

                {/* Dashboard redirects to home — public pages ARE the user dashboard */}
                <Route path="/dashboard" element={<Navigate to="/" replace />} />

                {/* Admin Dashboard */}
                <Route path="/admin/dashboard" element={
                    <ProtectedRoute tokenKey="adminToken" redirectTo="/admin">
                        <AdminDashboard />
                    </ProtectedRoute>
                } />

                {/* Public pages with Navbar = User Dashboard */}
                <Route path="/*" element={
                    <>
                        <Navbar />
                        <main className="main-content">
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/upload" element={<Upload />} />
                                <Route path="/result" element={<Result />} />
                                <Route path="/history" element={<History />} />
                            </Routes>
                        </main>
                    </>
                } />
            </Routes>
        </div>
    )
}

export default App
