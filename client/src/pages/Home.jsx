import { Link } from 'react-router-dom'

function Home() {
    return (
        <div className="home-page">
            <section className="hero">
                <div className="hero-content">
                    <div className="hero-badge">AI-Powered Detection</div>
                    <h1 className="hero-title">RealCheck</h1>
                    <p className="hero-subtitle">Detect AI-Generated Images Instantly</p>
                    <p className="hero-description">
                        Upload any image and our advanced AI system powered by MobileNetV2
                        will analyze it to determine whether it's a real photograph or
                        AI-generated content. Fast, accurate, and easy to use.
                    </p>
                    <div className="hero-actions">
                        <Link to="/upload" className="btn btn-primary">
                            <span>📤</span> Upload Image
                        </Link>
                        <Link to="/history" className="btn btn-secondary">
                            View History
                        </Link>
                    </div>
                </div>
            </section>

            <section className="features">
                <h2 className="section-title">How It Works</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">📁</div>
                        <h3>Upload</h3>
                        <p>Drag & drop or select an image file from your device</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🧠</div>
                        <h3>Analyze</h3>
                        <p>Our MobileNetV2 model processes and classifies the image</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">✅</div>
                        <h3>Results</h3>
                        <p>Get instant results with confidence scores and visual indicators</p>
                    </div>
                </div>
            </section>

            <section className="stats-section">
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-number">MobileNetV2</div>
                        <div className="stat-label">Deep Learning Model</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">Binary</div>
                        <div className="stat-label">Classification</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">Instant</div>
                        <div className="stat-label">Results</div>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Home
