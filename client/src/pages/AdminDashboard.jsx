import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line
} from 'recharts'

function AdminDashboard() {
    const [tab, setTab] = useState('overview')
    const [stats, setStats] = useState(null)
    const [users, setUsers] = useState([])
    const [history, setHistory] = useState([])
    const [filterUser, setFilterUser] = useState('')
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [actionModal, setActionModal] = useState(null)
    const [deleteRecordId, setDeleteRecordId] = useState(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()
    const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    })

    api.interceptors.response.use(r => r, err => {
        if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem('adminToken')
            navigate('/admin')
        }
        return Promise.reject(err)
    })

    useEffect(() => { fetchStats() }, [])

    const fetchStats = async () => {
        try {
            const [statsRes, historyRes] = await Promise.all([
                api.get('/api/admin/stats'),
                api.get('/api/admin/history')
            ])
            setStats(statsRes.data)
            setHistory(historyRes.data.slice(0, 10))
        } catch (_) { } finally { setLoading(false) }
    }

    const fetchUsers = async () => {
        try {
            const res = await api.get('/api/admin/users')
            setUsers(res.data)
        } catch (_) { }
    }

    const fetchHistory = async () => {
        try {
            const params = {}
            if (filterUser) params.userId = filterUser
            if (fromDate) params.from = fromDate
            if (toDate) params.to = toDate
            const res = await api.get('/api/admin/history', { params })
            setHistory(res.data)
        } catch (_) { }
    }

    const handleTab = (t) => {
        setTab(t)
        if (t === 'users') fetchUsers()
        if (t === 'history') { fetchUsers(); fetchHistory() }
        if (t === 'overview') fetchStats()
    }

    const handleSuspend = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
        try {
            await api.patch(`/api/admin/users/${id}/status`, { status: newStatus })
            setUsers(users.map(u => u._id === id ? { ...u, status: newStatus } : u))
            setActionModal(null)
        } catch (_) { }
    }

    const handleResetPw = async (id) => {
        try {
            await api.patch(`/api/admin/users/${id}/reset-password`)
            setActionModal(null)
            alert('Password reset to: realcheck123')
        } catch (_) { }
    }

    const handleDeleteUser = async (id) => {
        try {
            await api.delete(`/api/admin/users/${id}`)
            setUsers(users.filter(u => u._id !== id))
            setActionModal(null)
        } catch (_) { }
    }

    const handleDeleteRecord = async (id) => {
        try {
            await api.delete(`/api/admin/history/${id}`)
            setHistory(history.filter(r => r._id !== id))
            setDeleteRecordId(null)
        } catch (_) { }
    }

    const fmtDate = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

    const getUserName = (item) => {
        if (item.userId && typeof item.userId === 'object') return item.userId.name || item.userId.email || 'Unknown'
        return 'Guest'
    }

    if (loading) return <div className="panel-loading"><div className="spinner"></div></div>

    return (
        <div className="panel panel-admin">
            <header className="panel-header panel-header-admin">
                <div className="panel-brand">
                    <span>🛡️</span>
                    <span className="panel-title">Admin Panel</span>
                </div>
                <nav className="panel-tabs">
                    {['overview', 'users', 'history'].map(t => (
                        <button key={t} className={`panel-tab ${tab === t ? 'active' : ''}`} onClick={() => handleTab(t)}>
                            {t === 'overview' && '📊'} {t === 'users' && '👥'} {t === 'history' && '📋'}
                            <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                        </button>
                    ))}
                </nav>
                <button className="panel-logout" onClick={() => { localStorage.removeItem('adminToken'); navigate('/admin') }}>Logout</button>
            </header>

            <main className="panel-body">
                {tab === 'overview' && (
                    <div className="panel-section">
                        <h2 className="section-title">System Overview</h2>
                        <div className="stat-row stat-row-5">
                            <div className="stat-box"><div className="stat-num">{stats?.totalUsers || 0}</div><div className="stat-lbl">Users</div></div>
                            <div className="stat-box"><div className="stat-num">{stats?.total || 0}</div><div className="stat-lbl">Analyzed</div></div>
                            <div className="stat-box stat-real"><div className="stat-num">{stats?.realCount || 0}</div><div className="stat-lbl">Real</div></div>
                            <div className="stat-box stat-ai"><div className="stat-num">{stats?.aiCount || 0}</div><div className="stat-lbl">AI</div></div>
                            <div className="stat-box"><div className="stat-num">{stats?.avgConfidence || 0}%</div><div className="stat-lbl">Avg Conf.</div></div>
                        </div>

                        {stats?.dailyData && stats.dailyData.length > 0 && (
                            <div className="chart-row">
                                <div className="chart-box">
                                    <h4>Real vs AI</h4>
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={stats.dailyData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="real" name="Real" fill="#16a34a" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="ai" name="AI" fill="#dc2626" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="chart-box">
                                    <h4>Daily Uploads</h4>
                                    <ResponsiveContainer width="100%" height={260}>
                                        <LineChart data={stats.dailyData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="total" name="Total" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb' }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'users' && (
                    <div className="panel-section">
                        <h2 className="section-title">Manage Users <span className="title-count">{users.length}</span></h2>
                        {users.length === 0 ? (
                            <div className="empty-box">No registered users yet.</div>
                        ) : (
                            <div className="tbl-wrap">
                                <table className="tbl">
                                    <thead><tr><th>User</th><th>Email</th><th>Uploads</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u._id}>
                                                <td><div className="user-cell"><div className="user-av">{u.name.charAt(0).toUpperCase()}</div>{u.name}</div></td>
                                                <td className="muted">{u.email}</td>
                                                <td><span className="count-pill">{u.uploadCount}</span></td>
                                                <td className="muted">{fmtDate(u.createdAt)}</td>
                                                <td><span className={`status-pill ${u.status === 'active' ? 'sp-active' : 'sp-suspended'}`}>{u.status === 'active' ? '● Active' : '● Suspended'}</span></td>
                                                <td>
                                                    <div className="act-btns">
                                                        <button className="btn-icon" onClick={() => setActionModal({ type: 'suspend', user: u })} title={u.status === 'active' ? 'Suspend' : 'Activate'}>
                                                            {u.status === 'active' ? '⏸️' : '▶️'}
                                                        </button>
                                                        <button className="btn-icon" onClick={() => setActionModal({ type: 'reset', user: u })} title="Reset Password">🔑</button>
                                                        <button className="btn-icon" onClick={() => setActionModal({ type: 'delete', user: u })} title="Delete">🗑️</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'history' && (
                    <div className="panel-section">
                        <h2 className="section-title">All History</h2>
                        <div className="filter-row">
                            <select className="filter-select" value={filterUser} onChange={e => setFilterUser(e.target.value)}>
                                <option value="">All Users</option>
                                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                            </select>
                            <input type="date" className="filter-date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                            <input type="date" className="filter-date" value={toDate} onChange={e => setToDate(e.target.value)} />
                            <button className="btn btn-primary btn-sm" onClick={fetchHistory}>Filter</button>
                            {(filterUser || fromDate || toDate) && (
                                <button className="btn btn-secondary btn-sm" onClick={() => { setFilterUser(''); setFromDate(''); setToDate(''); fetchHistory() }}>Clear</button>
                            )}
                        </div>
                        {history.length === 0 ? (
                            <div className="empty-box">No records found.</div>
                        ) : (
                            <div className="tbl-wrap">
                                <table className="tbl">
                                    <thead><tr><th>Image</th><th>User</th><th>Result</th><th>Confidence</th><th>Date</th><th></th></tr></thead>
                                    <tbody>
                                        {history.map(r => (
                                            <tr key={r._id}>
                                                <td><img src={r.imagePath} alt="" className="tbl-thumb" /></td>
                                                <td className="muted">{getUserName(r)}</td>
                                                <td><span className={`badge ${r.prediction === 'Real' ? 'badge-green' : 'badge-red'}`}>{r.prediction}</span></td>
                                                <td><span className="conf-val">{r.confidence}%</span></td>
                                                <td className="muted">{fmtDate(r.createdAt)}</td>
                                                <td><button className="btn-icon" onClick={() => setDeleteRecordId(r._id)}>🗑️</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {actionModal && (
                <div className="modal-bg" onClick={() => setActionModal(null)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <h3>
                            {actionModal.type === 'delete' && 'Delete User?'}
                            {actionModal.type === 'reset' && 'Reset Password?'}
                            {actionModal.type === 'suspend' && (actionModal.user.status === 'active' ? 'Suspend User?' : 'Activate User?')}
                        </h3>
                        <p>
                            {actionModal.type === 'delete' && `Permanently delete ${actionModal.user.name} and all their data.`}
                            {actionModal.type === 'reset' && `Reset ${actionModal.user.name}'s password to "realcheck123".`}
                            {actionModal.type === 'suspend' && (actionModal.user.status === 'active'
                                ? `${actionModal.user.name} will not be able to log in.`
                                : `Reactivate ${actionModal.user.name}'s access.`)}
                        </p>
                        <div className="modal-btns">
                            <button className="btn btn-secondary" onClick={() => setActionModal(null)}>Cancel</button>
                            {actionModal.type === 'delete' && <button className="btn btn-danger" onClick={() => handleDeleteUser(actionModal.user._id)}>Delete</button>}
                            {actionModal.type === 'reset' && <button className="btn btn-primary" onClick={() => handleResetPw(actionModal.user._id)}>Reset</button>}
                            {actionModal.type === 'suspend' && <button className={`btn ${actionModal.user.status === 'active' ? 'btn-danger' : 'btn-primary'}`} onClick={() => handleSuspend(actionModal.user._id, actionModal.user.status)}>{actionModal.user.status === 'active' ? 'Suspend' : 'Activate'}</button>}
                        </div>
                    </div>
                </div>
            )}

            {deleteRecordId && (
                <div className="modal-bg" onClick={() => setDeleteRecordId(null)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <h3>Delete this record?</h3>
                        <p>This action cannot be undone.</p>
                        <div className="modal-btns">
                            <button className="btn btn-secondary" onClick={() => setDeleteRecordId(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={() => handleDeleteRecord(deleteRecordId)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminDashboard
