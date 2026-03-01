import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

function LoginModal({ onSuccess, onClose }) {
    const [mode, setMode] = useState('login')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            if (mode === 'login') {
                const res = await axios.post('/api/auth/login', { email, password })
                if (res.data.user.role === 'admin') {
                    localStorage.setItem('adminToken', res.data.token)
                    localStorage.setItem('adminName', res.data.user.name)
                    navigate('/admin/dashboard')
                    return
                }
                localStorage.setItem('token', res.data.token)
                localStorage.setItem('userName', res.data.user.name)
                localStorage.setItem('userEmail', res.data.user.email)
            } else {
                const res = await axios.post('/api/auth/register', { name, email, password })
                localStorage.setItem('token', res.data.token)
                localStorage.setItem('userName', res.data.user.name)
                localStorage.setItem('userEmail', res.data.user.email)
            }
            onSuccess()
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-bg" onClick={onClose}>
            <div className="modal-box login-modal" onClick={e => e.stopPropagation()}>
                <button className="login-modal-close" onClick={onClose}>✕</button>
                <div className="auth-brand">
                    <span className="auth-brand-icon">🔍</span>
                    <h1>{mode === 'login' ? 'Sign in to continue' : 'Create account'}</h1>
                    <p>{mode === 'login' ? 'Login required to use this feature' : 'Get started with RealCheck'}</p>
                </div>
                {error && <div className="auth-alert">{error}</div>}
                <form onSubmit={handleSubmit}>
                    {mode === 'register' && (
                        <div className="field">
                            <label>Full Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required />
                        </div>
                    )}
                    <div className="field">
                        <label>Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
                    </div>
                    <div className="field">
                        <label>Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                    </div>
                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? (mode === 'login' ? 'Signing in…' : 'Creating…') : (mode === 'login' ? 'Sign In' : 'Create Account')}
                    </button>
                </form>
                <p className="auth-switch">
                    {mode === 'login' ? (
                        <>Don't have an account? <button className="link-btn" onClick={() => { setMode('register'); setError('') }}>Create one</button></>
                    ) : (
                        <>Already have an account? <button className="link-btn" onClick={() => { setMode('login'); setError('') }}>Sign in</button></>
                    )}
                </p>
            </div>
        </div>
    )
}

export default LoginModal
