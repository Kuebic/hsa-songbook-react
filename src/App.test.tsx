import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the home page by default', () => {
    render(<App />)
    expect(screen.getByText('HSA Songbook')).toBeInTheDocument()
    expect(screen.getByText('Welcome to the HSA Songbook application.')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(<App />)
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Songs')).toBeInTheDocument()
    expect(screen.getByText('Setlists')).toBeInTheDocument()
  })
})