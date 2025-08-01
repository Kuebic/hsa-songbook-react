import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './App.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-blue-600 text-white p-4">
          <div className="container mx-auto flex space-x-4">
            <Link to="/" className="hover:text-blue-200">Home</Link>
            <Link to="/songs" className="hover:text-blue-200">Songs</Link>
            <Link to="/setlists" className="hover:text-blue-200">Setlists</Link>
          </div>
        </nav>
        
        <main className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/songs" element={<SongsPage />} />
            <Route path="/setlists" element={<SetlistsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

function HomePage() {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">HSA Songbook</h1>
      <p className="text-gray-600">Welcome to the HSA Songbook application.</p>
    </div>
  )
}

function SongsPage() {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Songs</h1>
      <p className="text-gray-600">Manage your songs here.</p>
    </div>
  )
}

function SetlistsPage() {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Setlists</h1>
      <p className="text-gray-600">Manage your setlists here.</p>
    </div>
  )
}

export default App
