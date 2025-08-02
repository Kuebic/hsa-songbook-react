import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AppLayout, ErrorBoundary } from './shared/components'
import { HomePage } from './features/auth'
import { SongsPage } from './features/songs'
import { SetlistsPage } from './features/setlists'
import { OfflineIndicator, UpdatePrompt } from './shared/components/UI'
import { useNetworkMonitor } from './shared/hooks/useOfflineStatus'
import { ThemeProvider } from './shared/contexts/ThemeContext'
import './App.css'

function App() {
  // Initialize network monitoring
  useNetworkMonitor();

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <AppLayout>
            {/* Offline status indicator */}
            <OfflineIndicator position="top" autoHide showDetails />
            
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/songs" element={<SongsPage />} />
              <Route path="/setlists" element={<SetlistsPage />} />
            </Routes>
            
            {/* Update prompt for PWA updates */}
            <UpdatePrompt position="bottom" />
          </AppLayout>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  )
}


export default App
