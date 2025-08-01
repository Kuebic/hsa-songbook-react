import type { ReactNode } from 'react'
import { Navigation } from './Navigation'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <main className="container mx-auto p-4">
        {children}
      </main>
    </div>
  )
}