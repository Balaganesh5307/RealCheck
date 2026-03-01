import { Link } from 'react-router-dom'

function Home() {
    return (
        <div className="home-page">
            {/* Hero */}
            <section className="hero">
                <div className="hero-glow"></div>
                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="hero-badge-dot"></span>
                        AI-Powered Detection
                    </div>
                    <h1 className="hero-title">
                        Detect <span className="hero-gradient">AI-Generated</span> Images in Seconds
                    </h1>
                    <p className="hero-description">
                        Upload any image and our deep learning model analyzes pixel-level forensic patterns,
                        frequency spectrums, and texture artifacts to determine authenticity with high confidence.
                    </p>
                    <div className="hero-actions">
                        <Link to="/upload" className="btn btn-primary btn-lg">
                            <span>📤</span> Analyze Image
                        </Link>
                        <Link to="/history" className="btn btn-outline btn-lg">
                            View History
                        </Link>
                    </div>
                    <div className="hero-stats-inline">
                        <div className="hero-stat-item">
                            <strong>MobileNetV2</strong>
                            <span>Deep Learning</span>
                        </div>
                        <div className="hero-stat-divider"></div>
                        <div className="hero-stat-item">
                            <strong>&lt; 3 sec</strong>
                            <span>Analysis Time</span>
                        </div>
                        <div className="hero-stat-divider"></div>
                        <div className="hero-stat-item">
                            <strong>Grad-CAM</strong>
                            <span>Heatmap Visualization</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="how-section">
                <div className="section-container">
                    <div className="section-header">
                        <span className="section-badge">How It Works</span>
                        <h2>Three simple steps to verify any image</h2>
                        <p>Our pipeline combines deep learning classification with visual forensic analysis</p>
                    </div>
                    <div className="steps-grid">
                        <div className="step-card">
                            <div className="step-num">01</div>
                            <div className="step-icon">📤</div>
                            <h3>Upload</h3>
                            <p>Drag & drop or browse to upload any JPEG, PNG, or WebP image up to 10MB</p>
                        </div>
                        <div className="step-arrow">→</div>
                        <div className="step-card">
                            <div className="step-num">02</div>
                            <div className="step-icon">🧠</div>
                            <h3>Analyze</h3>
                            <p>MobileNetV2 examines pixel patterns, color distributions, and texture artifacts</p>
                        </div>
                        <div className="step-arrow">→</div>
                        <div className="step-card">
                            <div className="step-num">03</div>
                            <div className="step-icon">📊</div>
                            <h3>Results</h3>
                            <p>Get Real/AI verdict, confidence score, Grad-CAM heatmap, and AI explanation</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="feat-section">
                <div className="section-container">
                    <div className="section-header">
                        <span className="section-badge">Features</span>
                        <h2>What makes RealCheck powerful</h2>
                    </div>
                    <div className="feat-grid">
                        <div className="feat-card">
                            <div className="feat-icon">🔬</div>
                            <h3>Forensic Analysis</h3>
                            <p>Detects frequency spectrum anomalies, unnatural texture smoothness, and synthetic noise patterns invisible to the human eye.</p>
                        </div>
                        <div className="feat-card">
                            <div className="feat-icon">🗺️</div>
                            <h3>Grad-CAM Heatmap</h3>
                            <p>Visual overlay showing exactly which regions of the image the model focused on to make its classification decision.</p>
                        </div>
                        <div className="feat-card">
                            <div className="feat-icon">💡</div>
                            <h3>AI Explanations</h3>
                            <p>Dynamic natural language explanations describing what forensic markers were detected and why the verdict was reached.</p>
                        </div>
                        <div className="feat-card">
                            <div className="feat-icon">📜</div>
                            <h3>History Tracking</h3>
                            <p>All your analyses are saved with full results. Review, compare, and delete past scans anytime from your personal history.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="cta-section">
                <div className="section-container">
                    <div className="cta-box">
                        <h2>Ready to verify an image?</h2>
                        <p>Start analyzing images for AI manipulation right now — it's fast, free, and accurate.</p>
                        <Link to="/upload" className="btn btn-primary btn-lg">
                            🔍 Start Analyzing
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="site-footer">
                <div className="footer-inner">
                    <span className="footer-brand">🛡️ RealCheck</span>
                    <span className="footer-copy">AI Image Authenticity Detector — Built with MobileNetV2 + Grad-CAM</span>
                </div>
            </footer>
        </div>
    )
}

export default Home
