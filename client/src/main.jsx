import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import axios from 'axios'
import './index.css'

// Set globally for all generic axios calls in components
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
// Ensure credentials are sent with requests (cookies/sessions) if needed
axios.defaults.withCredentials = true

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
)
