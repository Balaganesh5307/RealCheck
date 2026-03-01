import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

function Login() {
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
            const res = await axios.post('/api/auth/login', { email, password })
            if (res.data.user.role === 'admin') {
                localStorage.setItem('adminToken', res.data.token)
                localStorage.setItem('adminName', res.data.user.name)
                navigate('/admin/dashboard')
            } else {
                localStorage.setItem('token', res.data.token)
                localStorage.setItem('userName', res.data.user.name)
                localStorage.setItem('userEmail', res.data.user.email)
                navigate('/')
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <Link to="/" className="auth-back">← Back to Home</Link>
                    <div className="auth-brand">
                        <span className="auth-brand-icon">🔍</span>
                        <h1>Welcome back</h1>
                        <p>Sign in to your RealCheck account</p>
                    </div>
                    {error && <div className="auth-alert">{error}</div>}
                    <form onSubmit={handleLogin}>
                        <div className="field">
                            <label>Email</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
                        </div>
                        <div className="field">
                            <label>Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                        </div>
                        <button type="submit" className="auth-submit" disabled={loading}>
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>
                    <p className="auth-switch">Don't have an account? <Link to="/register">Create one</Link></p>
                </div>
            </div>
        </div>
    )
}

export default Login
