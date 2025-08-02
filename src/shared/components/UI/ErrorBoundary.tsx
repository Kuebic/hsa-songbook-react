import { Component, type ReactNode, type ErrorInfo } from 'react'
import { errorReporting } from '../../services/errorReporting'
import { Button } from './Button'
import { Card } from './Card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorId?: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Report error using centralized service instead of console.error
    const errorId = errorReporting.reportComponentError(
      `ErrorBoundary caught an error: ${error.message}`,
      error,
      {
        componentStack: errorInfo.componentStack,
        errorBoundary: 'ErrorBoundary',
      }
    );

    this.setState({ errorId });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-6">
            We encountered an unexpected error. Please try refreshing the page.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left mb-4">
              <summary className="cursor-pointer text-sm text-gray-500 mb-2">
                Error details (development only)
              </summary>
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
                {this.state.error?.stack}
              </pre>
            </details>
          )}
          <Button
            onClick={() => window.location.reload()}
            variant="primary"
          >
            Refresh Page
          </Button>
        </Card>
      )
    }

    return this.props.children
  }
}

interface ErrorMessageProps {
  error: Error | string
  onRetry?: () => void
}

export function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  const message = typeof error === 'string' ? error : error.message

  return (
    <Card className="text-center">
      <div className="text-red-600 mb-4">
        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 className="text-lg font-semibold">Error</h3>
      </div>
      <p className="text-gray-600 mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="primary">
          Try Again
        </Button>
      )}
    </Card>
  )
}