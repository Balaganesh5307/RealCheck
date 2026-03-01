import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'

function Navbar() {
    const location = useLocation()
    const navigate = useNavigate()
    const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'))
    const [menuOpen, setMenuOpen] = useState(false)
    const userName = localStorage.getItem('userName') || 'User'
    const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link'

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('userName')
        localStorage.removeItem('userEmail')
        setLoggedIn(false)
        navigate('/')
    }

    const closeMenu = () => setMenuOpen(false)

    return (
        <nav className="navbar">
            <div className="nav-container">
                <Link to="/" className="nav-logo" onClick={closeMenu}>
                    <span className="logo-icon">🛡️</span>
                    <span className="logo-text">RealCheck</span>
                </Link>
                <button className={`nav-hamburger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
                    <span></span><span></span><span></span>
                </button>
                <div className={`nav-links ${menuOpen ? 'nav-open' : ''}`}>
                    <Link to="/" className={isActive('/')} onClick={closeMenu}>Home</Link>
                    <Link to="/upload" className={isActive('/upload')} onClick={closeMenu}>Upload</Link>
                    <Link to="/history" className={isActive('/history')} onClick={closeMenu}>History</Link>
                    {loggedIn ? (
                        <div className="nav-user-group">
                            <div className="nav-avatar">{userName.charAt(0).toUpperCase()}</div>
                            <span className="nav-user-name">{userName}</span>
                            <button className="nav-logout-btn" onClick={() => { handleLogout(); closeMenu() }}>Logout</button>
                        </div>
                    ) : (
                        <>
                            <Link to="/login" className="nav-link nav-login" onClick={closeMenu}>Login</Link>
                            <Link to="/register" className="nav-link nav-cta" onClick={closeMenu}>Sign Up</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}

export default Navbar
