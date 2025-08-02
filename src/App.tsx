import React, { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AppLayout, ErrorBoundary } from './shared/components'
import { OfflineIndicator, UpdatePrompt, PageLoader, LazyLoadErrorBoundary } from './shared/components/UI'
import { useNetworkMonitor } from './shared/hooks/useOfflineStatus'
import { ThemeProvider } from './shared/contexts/ThemeContext'
import './App.css'

// Lazy load main page components for better code splitting
const HomePage = React.lazy(() => import('./features/auth/components/HomePage'))
const SongsPage = React.lazy(() => import('./features/songs/components/SongsPage'))
const SetlistsPage = React.lazy(() => import('./features/setlists/components/SetlistsPage'))

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
            
            <LazyLoadErrorBoundary>
              <Suspense fallback={<PageLoader message="Loading page..." showSkeleton />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route 
                    path="/songs" 
                    element={
                      <LazyLoadErrorBoundary componentName="Songs Page">
                        <SongsPage />
                      </LazyLoadErrorBoundary>
                    } 
                  />
                  <Route 
                    path="/setlists" 
                    element={
                      <LazyLoadErrorBoundary componentName="Setlists Page">
                        <SetlistsPage />
                      </LazyLoadErrorBoundary>
                    } 
                  />
                </Routes>
              </Suspense>
            </LazyLoadErrorBoundary>
            
            {/* Update prompt for PWA updates */}
            <UpdatePrompt position="bottom" />
          </AppLayout>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  )
}


export default App
