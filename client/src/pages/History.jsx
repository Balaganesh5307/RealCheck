import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import LoginModal from '../components/LoginModal'

function History() {
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [deleteId, setDeleteId] = useState(null)
    const [showDeleteAll, setShowDeleteAll] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'))
    const navigate = useNavigate()

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    const getFullUrl = (path) => path?.startsWith('http') ? path : `${apiUrl}${path}`

    useEffect(() => {
        if (isLoggedIn) fetchHistory()
        else setLoading(false)
    }, [isLoggedIn])

    if (!isLoggedIn) {
        return (
            <LoginModal
                onSuccess={() => setIsLoggedIn(true)}
                onClose={() => navigate('/')}
            />
        )
    }

    const fetchHistory = async () => {
        try {
            const response = await axios.get('/api/history')
            setResults(response.data)
        } catch (err) {
            setError('Failed to load history. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/api/history/${id}`)
            setResults(results.filter((item) => item._id !== id))
            setDeleteId(null)
        } catch (err) {
            setError('Failed to delete record. Please try again.')
            setDeleteId(null)
        }
    }

    const handleDeleteAll = async () => {
        try {
            await axios.delete('/api/history')
            setResults([])
            setShowDeleteAll(false)
        } catch (err) {
            setError('Failed to delete all records. Please try again.')
            setShowDeleteAll(false)
        }
    }

    const viewResult = (item) => {
        navigate('/result', {
            state: {
                result: {
                    id: item._id,
                    result: item.prediction,
                    confidence: item.confidence,
                    explanation: item.explanation || [],
                    heatmapImage: item.heatmapImage || '',
                    imageUrl: getFullUrl(item.imagePath),
                    createdAt: item.createdAt
                }
            }
        })
    }

    const formatDate = (dateStr) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="history-page">
                <div className="history-container">
                    <h1 className="page-title">Analysis History</h1>
                    <div className="loading-state">
                        <span className="spinner spinner-lg"></span>
                        <p>Loading history...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="history-page">
            <div className="history-container">
                <div className="history-header">
                    <div>
                        <h1 className="page-title">Analysis History</h1>
                        <p className="page-subtitle">View all previously analyzed images</p>
                    </div>
                    {results.length > 0 && (
                        <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteAll(true)}>
                            🗑️ Delete All
                        </button>
                    )}
                </div>

                {error && <div className="error-message">{error}</div>}

                {results.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <h3>No Results Yet</h3>
                        <p>Upload and analyze images to see your history here.</p>
                    </div>
                ) : (
                    <div className="history-card">
                        <div className="table-wrapper">
                            <table className="history-table">
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>Prediction</th>
                                        <th>Confidence</th>
                                        <th>Date & Time</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((item) => (
                                        <tr key={item._id}>
                                            <td>
                                                <div className="thumb-wrapper thumb-clickable" onClick={() => viewResult(item)} title="View result details">
                                                    <img
                                                        src={getFullUrl(item.imagePath)}
                                                        alt="Thumbnail"
                                                        className="table-thumb"
                                                    />
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`table-badge ${item.prediction === 'Real' ? 'badge-real' : 'badge-ai'}`}>
                                                    {item.prediction === 'Real' ? '✅ Real Image' : '⚠️ AI Generated'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="table-confidence">
                                                    <div className="mini-bar-bg">
                                                        <div
                                                            className={`mini-bar-fill ${item.prediction === 'Real' ? 'fill-real' : 'fill-ai'}`}
                                                            style={{ width: `${item.confidence}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="confidence-text">{item.confidence}%</span>
                                                </div>
                                            </td>
                                            <td className="date-cell">{formatDate(item.createdAt)}</td>
                                            <td>
                                                <button
                                                    className="btn-delete"
                                                    onClick={() => setDeleteId(item._id)}
                                                    title="Delete record"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {deleteId && (
                <div className="modal-overlay" onClick={() => setDeleteId(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-icon">⚠️</div>
                        <h3 className="modal-title">Delete Record?</h3>
                        <p className="modal-text">Are you sure you want to delete this record? This action cannot be undone.</p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>
                                Cancel
                            </button>
                            <button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteAll && (
                <div className="modal-overlay" onClick={() => setShowDeleteAll(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-icon">🚨</div>
                        <h3 className="modal-title">Delete All Records?</h3>
                        <p className="modal-text">This will permanently delete all {results.length} records and their images. This action cannot be undone.</p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowDeleteAll(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-danger" onClick={handleDeleteAll}>
                                Delete All
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default History
