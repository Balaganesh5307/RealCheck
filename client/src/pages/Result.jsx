import { useLocation, Link, Navigate } from 'react-router-dom'

function Result() {
    const location = useLocation()
    const data = location.state?.result

    if (!data) {
        return <Navigate to="/upload" replace />
    }

    const isReal = data.result === 'Real'
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    const getFullUrl = (path) => path?.startsWith('http') ? path : `${apiUrl}${path}`

    return (
        <div className="result-page">
            <div className="result-container">
                <h1 className="page-title">Analysis Result</h1>

                <div className="result-images-grid">
                    <div className="image-card">
                        <div className="image-card-inner">
                            <img
                                src={getFullUrl(data.imageUrl)}
                                alt="Original"
                                className="result-image"
                            />
                        </div>
                        <div className="image-card-label">🖼️ Original Image</div>
                    </div>

                    {data.heatmapImage && (
                        <div className="image-card">
                            <div className="image-card-inner">
                                <img
                                    src={`data:image/jpeg;base64,${data.heatmapImage}`}
                                    alt="Grad-CAM Heatmap"
                                    className="result-image heatmap-image"
                                />
                            </div>
                            <div className="image-card-label">🧠 Model Attention Heatmap</div>
                        </div>
                    )}
                </div>

                <div className="result-card">
                    <div className="result-details">
                        <div className={`result-badge ${isReal ? 'badge-real' : 'badge-ai'}`}>
                            <span className="badge-icon">{isReal ? '✅' : '⚠️'}</span>
                            <span className="badge-text">{data.result === 'Real' ? 'Real Image' : 'AI Generated'}</span>
                        </div>

                        <div className="confidence-section">
                            <div className="confidence-header">
                                <span className="confidence-label">Confidence Level</span>
                                <span className="confidence-value">{data.confidence}%</span>
                            </div>
                            <div className="confidence-bar-bg">
                                <div
                                    className={`confidence-bar-fill ${isReal ? 'fill-real' : 'fill-ai'}`}
                                    style={{ width: `${data.confidence}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="result-meta">
                            <div className="meta-item">
                                <span className="meta-label">Classification</span>
                                <span className="meta-value">{data.result}</span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">Model</span>
                                <span className="meta-value">MobileNetV2</span>
                            </div>
                        </div>
                    </div>
                </div>

                {data.explanation && (
                    <div className={`explanation-card ${isReal ? 'explanation-real' : 'explanation-ai'}`}>
                        <div className="explanation-header">
                            <span className="explanation-badge">AI Explanation</span>
                        </div>
                        <p className="explanation-paragraph">
                            {(() => {
                                const text = Array.isArray(data.explanation) ? data.explanation.join('. ') : data.explanation
                                const keywords = [
                                    'frequency spectrum', 'frequency domain', 'camera sensor', 'depth-of-field',
                                    'micro-texture', 'color channels', 'RGB color', 'noise patterns',
                                    'high confidence', 'moderate confidence', 'limited confidence',
                                    'synthetically generated', 'authentic photograph', 'AI-generated',
                                    'edge transitions', 'saturation', 'brightness', 'neural network',
                                    'optical lens', 'forensic', 'spectral distribution'
                                ]
                                const regex = new RegExp(`(${keywords.join('|')})`, 'gi')
                                const parts = text.split(regex)
                                return parts.map((part, i) =>
                                    keywords.some(k => k.toLowerCase() === part.toLowerCase())
                                        ? <strong key={i} className="explanation-keyword">{part}</strong>
                                        : part
                                )
                            })()}
                        </p>
                    </div>
                )}

                <div className="result-actions">
                    <Link to="/upload" className="btn btn-primary">
                        📤 Analyze Another Image
                    </Link>
                    <Link to="/history" className="btn btn-secondary">
                        View History
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Result
