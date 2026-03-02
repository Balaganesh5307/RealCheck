import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
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
            saveAndRedirect(res.data)
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('')
        setLoading(true)
        try {
            const res = await axios.post('/api/auth/google', { credential: credentialResponse.credential })
            saveAndRedirect(res.data)
        } catch (err) {
            setError(err.response?.data?.error || 'Google sign-up failed')
        } finally {
            setLoading(false)
        }
    }

    const saveAndRedirect = (data) => {
        localStorage.setItem('token', data.token)
        localStorage.setItem('userName', data.user.name)
        localStorage.setItem('userEmail', data.user.email)
        navigate('/')
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

                    {/* Google Sign-Up */}
                    <div className="google-btn-wrapper">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google sign-up was cancelled or failed')}
                            theme="outline"
                            size="large"
                            width={360}
                            text="continue_with"
                            shape="rectangular"
                        />
                    </div>

                    <div className="auth-divider">
                        <span>or register with email</span>
                    </div>

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
