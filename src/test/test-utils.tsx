/* eslint-disable react-refresh/only-export-components */
import type { ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { ClerkProvider } from '@clerk/clerk-react'

// Mock Clerk for testing
const mockClerkPublishableKey = 'pk_test_mock_key_for_testing'

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ClerkProvider publishableKey={mockClerkPublishableKey}>
      {children}
    </ClerkProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }