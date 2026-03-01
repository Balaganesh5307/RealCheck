import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

function AdminLogin() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const res = await axios.post('/api/admin/login', { email, password })
            localStorage.setItem('adminToken', res.data.token)
            localStorage.setItem('adminName', res.data.user?.name || 'Admin')
            navigate('/admin/dashboard')
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid admin credentials')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page auth-page-admin">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-brand">
                        <span className="auth-brand-icon">🛡️</span>
                        <h1>Admin Panel</h1>
                        <p>Sign in with admin credentials</p>
                    </div>
                    {error && <div className="auth-alert">{error}</div>}
                    <form onSubmit={handleLogin}>
                        <div className="field">
                            <label>Email</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@realcheck.com" required />
                        </div>
                        <div className="field">
                            <label>Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                        </div>
                        <button type="submit" className="auth-submit auth-submit-admin" disabled={loading}>
                            {loading ? 'Signing in…' : 'Sign In as Admin'}
                        </button>
                    </form>
                    <p className="auth-switch"><Link to="/login">← Login as User instead</Link></p>
                </div>
            </div>
        </div>
    )
}

export default AdminLogin
