import { Link, useLocation } from 'react-router-dom'

function Navbar() {
    const location = useLocation()

    const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link'

    return (
        <nav className="navbar">
            <div className="nav-container">
                <Link to="/" className="nav-logo">
                    <span className="logo-icon">🛡️</span>
                    <span className="logo-text">RealCheck</span>
                </Link>
                <div className="nav-links">
                    <Link to="/" className={isActive('/')}>Home</Link>
                    <Link to="/upload" className={isActive('/upload')}>Upload</Link>
                    <Link to="/history" className={isActive('/history')}>History</Link>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
