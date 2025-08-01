import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AppLayout, ErrorBoundary } from './shared/components'
import { HomePage } from './features/auth'
import { SongsPage } from './features/songs'
import { SetlistsPage } from './features/setlists'
import './App.css'

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/songs" element={<SongsPage />} />
            <Route path="/setlists" element={<SetlistsPage />} />
          </Routes>
        </AppLayout>
      </Router>
    </ErrorBoundary>
  )
}


export default App
