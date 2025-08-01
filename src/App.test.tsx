import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App'

// Mock Clerk Provider
const MockClerkProvider = ({ children }: { children: React.ReactNode }) => (
  <ClerkProvider publishableKey="pk_test_mock">
    {children}
  </ClerkProvider>
)

describe('App', () => {
  it('renders the home page by default', () => {
    render(
      <MockClerkProvider>
        <App />
      </MockClerkProvider>
    )
    expect(screen.getByText('HSA Songbook')).toBeInTheDocument()
    expect(screen.getByText('Welcome to the HSA Songbook application.')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(
      <MockClerkProvider>
        <App />
      </MockClerkProvider>
    )
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getAllByText('Songs')).toHaveLength(2) // Nav and card link
    expect(screen.getAllByText('Setlists')).toHaveLength(2) // Nav and card link
  })
})