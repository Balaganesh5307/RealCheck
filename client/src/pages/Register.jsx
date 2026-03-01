import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

function Register() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleRegister = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const res = await axios.post('/api/auth/register', { name, email, password })
            localStorage.setItem('token', res.data.token)
            localStorage.setItem('userName', res.data.user.name)
            localStorage.setItem('userEmail', res.data.user.email)
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed')
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
                        <h1>Create account</h1>
                        <p>Start detecting AI-generated images</p>
                    </div>
                    {error && <div className="auth-alert">{error}</div>}
                    <form onSubmit={handleRegister}>
                        <div className="field">
                            <label>Full Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required />
                        </div>
                        <div className="field">
                            <label>Email</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
                        </div>
                        <div className="field">
                            <label>Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} />
                        </div>
                        <button type="submit" className="auth-submit" disabled={loading}>
                            {loading ? 'Creating…' : 'Create Account'}
                        </button>
                    </form>
                    <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
                </div>
            </div>
        </div>
    )
}

export default Register
