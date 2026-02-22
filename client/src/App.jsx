import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Upload from './pages/Upload'
import Result from './pages/Result'
import History from './pages/History'

function App() {
    return (
        <div className="app">
            <Navbar />
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/upload" element={<Upload />} />
                    <Route path="/result" element={<Result />} />
                    <Route path="/history" element={<History />} />
                </Routes>
            </main>
        </div>
    )
}

export default App
