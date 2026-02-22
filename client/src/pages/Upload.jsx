import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function Upload() {
    const [selectedFile, setSelectedFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const [loading, setLoading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [error, setError] = useState('')
    const fileInputRef = useRef(null)
    const navigate = useNavigate()

    const handleFile = (file) => {
        setError('')
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            setError('Please select a valid image file (JPEG, PNG, or WebP)')
            return
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB')
            return
        }
        setSelectedFile(file)
        const reader = new FileReader()
        reader.onloadend = () => setPreview(reader.result)
        reader.readAsDataURL(file)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0])
        }
    }

    const handleDrag = (e) => {
        e.preventDefault()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0])
        }
    }

    const handleAnalyze = async () => {
        if (!selectedFile) return
        setLoading(true)
        setError('')

        try {
            const formData = new FormData()
            formData.append('image', selectedFile)
            const response = await axios.post('/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            navigate('/result', { state: { result: response.data } })
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to analyze image. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const removeImage = () => {
        setSelectedFile(null)
        setPreview(null)
        setError('')
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    return (
        <div className="upload-page">
            <div className="upload-container">
                <h1 className="page-title">Upload Image</h1>
                <p className="page-subtitle">Select or drag an image to analyze its authenticity</p>

                {!preview ? (
                    <div
                        className={`drop-zone ${dragActive ? 'drag-active' : ''}`}
                        onDrop={handleDrop}
                        onDragOver={handleDrag}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="drop-zone-content">
                            <div className="drop-icon">📁</div>
                            <p className="drop-text">Drag & drop your image here</p>
                            <p className="drop-hint">or click to browse files</p>
                            <p className="drop-formats">Supports: JPEG, PNG, WebP (max 10MB)</p>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="file-input"
                            accept="image/jpeg,image/png,image/jpg,image/webp"
                            onChange={handleChange}
                        />
                    </div>
                ) : (
                    <div className="preview-section">
                        <div className="preview-card">
                            <img src={preview} alt="Preview" className="preview-image" />
                            <div className="preview-info">
                                <span className="file-name">{selectedFile?.name}</span>
                                <span className="file-size">
                                    {(selectedFile?.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                            </div>
                            <button className="btn-remove" onClick={removeImage}>✕ Remove</button>
                        </div>
                    </div>
                )}

                {error && <div className="error-message">{error}</div>}

                {preview && (
                    <button
                        className="btn btn-primary btn-analyze"
                        onClick={handleAnalyze}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="loading-content">
                                <span className="spinner"></span>
                                Analyzing...
                            </span>
                        ) : (
                            <span>🔍 Analyze Image</span>
                        )}
                    </button>
                )}
            </div>
        </div>
    )
}

export default Upload
