import type { ReactNode } from 'react'
import { Navigation } from './Navigation'

interface AppLayoutProps {
  children: ReactNode
  variant?: 'contained' | 'full-width'
}

export function AppLayout({ children, variant = 'full-width' }: AppLayoutProps) {
  const mainClasses = variant === 'contained' 
    ? "container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl"
    : "px-4 sm:px-6 lg:px-8 py-6 w-full"

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <Navigation />
      <main className={mainClasses}>
        {children}
      </main>
    </div>
  )
}