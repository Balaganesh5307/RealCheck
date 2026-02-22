import { useLocation, Link, Navigate } from 'react-router-dom'

function Result() {
    const location = useLocation()
    const data = location.state?.result

    if (!data) {
        return <Navigate to="/upload" replace />
    }

    const isReal = data.result === 'Real'

    return (
        <div className="result-page">
            <div className="result-container">
                <h1 className="page-title">Analysis Result</h1>

                <div className="result-card">
                    <div className="result-image-wrapper">
                        <img
                            src={data.imageUrl}
                            alt="Analyzed"
                            className="result-image"
                        />
                    </div>

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

                {data.explanation && data.explanation.length > 0 && (
                    <div className={`explanation-card ${isReal ? 'explanation-real' : 'explanation-ai'}`}>
                        <h3 className="explanation-title">🔍 Why This Result?</h3>
                        <ul className="explanation-list">
                            {data.explanation.map((reason, index) => (
                                <li key={index} className="explanation-item">
                                    <span className={`explanation-dot ${isReal ? 'dot-real' : 'dot-ai'}`}></span>
                                    {reason}
                                </li>
                            ))}
                        </ul>
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
