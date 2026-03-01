import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function UserDashboard() {
    const [tab, setTab] = useState('upload')
    const [history, setHistory] = useState([])
    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const [dragging, setDragging] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [result, setResult] = useState(null)
    const [detailResult, setDetailResult] = useState(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [deleteId, setDeleteId] = useState(null)
    const [loading, setLoading] = useState(false)
    const fileRef = useRef(null)
    const navigate = useNavigate()
    const userName = localStorage.getItem('userName') || 'User'
    const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    const getFullUrl = (path) => path?.startsWith('http') ? path : `${apiUrl}${path}`

    api.interceptors.response.use(r => r, err => {
        if (err.response?.status === 401) { localStorage.clear(); navigate('/login') }
        return Promise.reject(err)
    })

    const fetchHistory = async () => {
        setLoading(true)
        try {
            const res = await api.get('/api/dashboard/history')
            setHistory(res.data)
        } catch (_) { } finally { setLoading(false) }
    }

    const handleTab = (t) => {
        setTab(t)
        setDetailResult(null)
        if (t === 'history') fetchHistory()
    }

    const handleFile = (f) => {
        if (!f) return
        setFile(f); setResult(null)
        const reader = new FileReader()
        reader.onload = e => setPreview(e.target.result)
        reader.readAsDataURL(f)
    }

    const handleAnalyze = async () => {
        if (!file) return
        setUploading(true); setResult(null)
        try {
            const fd = new FormData()
            fd.append('image', file)
            const res = await api.post('/api/dashboard/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
            setResult(res.data)
        } catch (err) {
            setResult({ error: err.response?.data?.error || 'Analysis failed' })
        } finally { setUploading(false) }
    }

    const resetUpload = () => { setFile(null); setPreview(null); setResult(null) }

    const handleDelete = async (id) => {
        try {
            await api.delete(`/api/dashboard/history/${id}`)
            setHistory(h => h.filter(r => r._id !== id))
            setDeleteId(null)
        } catch (_) { }
    }

    const viewDetail = async (id) => {
        setDetailLoading(true)
        try {
            const res = await api.get(`/api/dashboard/history/${id}`)
            setDetailResult(res.data)
        } catch (_) { } finally { setDetailLoading(false) }
    }

    const fmtDate = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

    const highlightKeywords = (text) => {
        if (!text) return text
        const str = Array.isArray(text) ? text.join('. ') : text
        const kw = ['frequency spectrum', 'camera sensor', 'depth-of-field', 'micro-texture', 'color channels', 'noise patterns', 'high confidence', 'moderate confidence', 'synthetically generated', 'authentic photograph', 'forensic', 'neural network', 'spectral distribution', 'edge transitions']
        const regex = new RegExp(`(${kw.join('|')})`, 'gi')
        return str.split(regex).map((part, i) =>
            kw.some(k => k.toLowerCase() === part.toLowerCase())
                ? <strong key={i} className="kw-highlight">{part}</strong>
                : part
        )
    }

    return (
        <div className="panel">
            <header className="panel-header">
                <div className="panel-brand">
                    <span>🔍</span>
                    <span className="panel-title">RealCheck</span>
                </div>
                <nav className="panel-tabs">
                    <button className={`panel-tab ${tab === 'upload' ? 'active' : ''}`} onClick={() => handleTab('upload')}>
                        📤 <span>Upload</span>
                    </button>
                    <button className={`panel-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => handleTab('history')}>
                        📜 <span>History</span>
                    </button>
                </nav>
                <div className="panel-user">
                    <div className="panel-avatar">{userName.charAt(0).toUpperCase()}</div>
                    <span className="panel-user-name">{userName}</span>
                    <button className="panel-logout" onClick={() => { localStorage.clear(); navigate('/login') }}>Logout</button>
                </div>
            </header>

            <main className="panel-body">
                {tab === 'upload' && (
                    <div className="panel-section">
                        <h2 className="section-title">Upload & Analyze</h2>
                        {!result ? (
                            <>
                                <div
                                    className={`dropzone ${dragging ? 'dropzone-active' : ''} ${preview ? 'dropzone-has' : ''}`}
                                    onDragOver={e => { e.preventDefault(); setDragging(true) }}
                                    onDragLeave={() => setDragging(false)}
                                    onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
                                    onClick={() => fileRef.current?.click()}
                                >
                                    {preview ? (
                                        <div className="dropzone-preview">
                                            <img src={preview} alt="Preview" />
                                            <span className="dropzone-name">{file?.name}</span>
                                        </div>
                                    ) : (
                                        <div className="dropzone-empty">
                                            <span className="dropzone-icon">📤</span>
                                            <p className="dropzone-text">Drag & drop an image here</p>
                                            <p className="dropzone-hint">or click to browse — JPEG, PNG, WebP up to 10MB</p>
                                        </div>
                                    )}
                                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={e => handleFile(e.target.files[0])} hidden />
                                </div>
                                {file && (
                                    <div className="upload-actions">
                                        <button className="btn btn-primary" onClick={handleAnalyze} disabled={uploading}>
                                            {uploading ? '⏳ Analyzing…' : '🔍 Analyze Image'}
                                        </button>
                                        <button className="btn btn-secondary" onClick={resetUpload}>Clear</button>
                                    </div>
                                )}
                            </>
                        ) : result.error ? (
                            <div className="result-error">
                                <p>{result.error}</p>
                                <button className="btn btn-primary" onClick={resetUpload}>Try Again</button>
                            </div>
                        ) : (
                            <div className="result-view">
                                <div className="result-images">
                                    <div className="result-img-card">
                                        <img src={preview} alt="Original" />
                                        <span>Original</span>
                                    </div>
                                    {result.heatmapImage && (
                                        <div className="result-img-card">
                                            <img src={`data:image/jpeg;base64,${result.heatmapImage}`} alt="Heatmap" />
                                            <span>Heatmap</span>
                                        </div>
                                    )}
                                </div>
                                <div className="result-details">
                                    <div className={`result-verdict ${result.result === 'Real' ? 'verdict-real' : 'verdict-ai'}`}>
                                        <span className="verdict-icon">{result.result === 'Real' ? '✅' : '⚠️'}</span>
                                        <span className="verdict-text">{result.result === 'Real' ? 'Real Image' : 'AI Generated'}</span>
                                    </div>
                                    <div className="result-conf">
                                        <span>Confidence</span>
                                        <div className="conf-bar conf-bar-lg"><div className={`conf-fill ${result.result === 'Real' ? 'fill-green' : 'fill-red'}`} style={{ width: `${result.confidence}%` }}></div></div>
                                        <span className="conf-pct">{result.confidence}%</span>
                                    </div>
                                    {result.explanation && (
                                        <div className="result-explanation">
                                            <h4>AI Explanation</h4>
                                            <p>{highlightKeywords(result.explanation)}</p>
                                        </div>
                                    )}
                                </div>
                                <button className="btn btn-primary" onClick={resetUpload}>📤 Analyze Another</button>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'history' && (
                    <div className="panel-section">
                        {detailResult ? (
                            <>
                                <div className="detail-back">
                                    <button className="btn btn-secondary btn-sm" onClick={() => setDetailResult(null)}>← Back to History</button>
                                </div>
                                <h2 className="section-title">Analysis Result</h2>
                                <div className="result-view">
                                    <div className="result-images">
                                        <div className="result-img-card">
                                            <img src={getFullUrl(detailResult.imageUrl)} alt="Original" />
                                            <span>Original</span>
                                        </div>
                                        {detailResult.heatmapImage && (
                                            <div className="result-img-card">
                                                <img src={`data:image/jpeg;base64,${detailResult.heatmapImage}`} alt="Heatmap" />
                                                <span>Heatmap</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="result-details">
                                        <div className={`result-verdict ${detailResult.result === 'Real' ? 'verdict-real' : 'verdict-ai'}`}>
                                            <span className="verdict-icon">{detailResult.result === 'Real' ? '✅' : '⚠️'}</span>
                                            <span className="verdict-text">{detailResult.result === 'Real' ? 'Real Image' : 'AI Generated'}</span>
                                        </div>
                                        <div className="result-conf">
                                            <span>Confidence</span>
                                            <div className="conf-bar conf-bar-lg"><div className={`conf-fill ${detailResult.result === 'Real' ? 'fill-green' : 'fill-red'}`} style={{ width: `${detailResult.confidence}%` }}></div></div>
                                            <span className="conf-pct">{detailResult.confidence}%</span>
                                        </div>
                                        {detailResult.explanation && (
                                            <div className="result-explanation">
                                                <h4>AI Explanation</h4>
                                                <p>{highlightKeywords(detailResult.explanation)}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="section-title">History</h2>
                                {loading ? (
                                    <div className="panel-loading"><div className="spinner"></div></div>
                                ) : history.length === 0 ? (
                                    <div className="empty-box">No analysis history yet — upload your first image!</div>
                                ) : (
                                    <div className="tbl-wrap">
                                        <table className="tbl">
                                            <thead><tr><th>Image</th><th>Result</th><th>Confidence</th><th>Date</th><th></th></tr></thead>
                                            <tbody>
                                                {history.map(r => (
                                                    <tr key={r._id}>
                                                        <td>
                                                            <img
                                                                src={getFullUrl(r.imagePath)}
                                                                alt=""
                                                                className="tbl-thumb tbl-thumb-click"
                                                                onClick={() => viewDetail(r._id)}
                                                                title="Click to view result"
                                                            />
                                                        </td>
                                                        <td><span className={`badge ${r.prediction === 'Real' ? 'badge-green' : 'badge-red'}`}>{r.prediction}</span></td>
                                                        <td><div className="conf-bar"><div className={`conf-fill ${r.prediction === 'Real' ? 'fill-green' : 'fill-red'}`} style={{ width: `${r.confidence}%` }}></div></div><span className="conf-val">{r.confidence}%</span></td>
                                                        <td className="muted">{fmtDate(r.createdAt)}</td>
                                                        <td><button className="btn-icon" onClick={() => setDeleteId(r._id)} title="Delete">🗑️</button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        )}
                        {detailLoading && <div className="panel-loading"><div className="spinner"></div></div>}
                    </div>
                )}
            </main>

            {deleteId && (
                <div className="modal-bg" onClick={() => setDeleteId(null)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <h3>Delete this record?</h3>
                        <p>This action cannot be undone.</p>
                        <div className="modal-btns">
                            <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default UserDashboard
