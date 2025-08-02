/**
 * @file LazyLoadErrorBoundary.tsx
 * @description Error boundary specifically for handling lazy loading failures
 */

import React, { Component, ReactNode } from 'react';
import { Button } from './Button';

interface LazyLoadErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface LazyLoadErrorBoundaryProps {
  children: ReactNode;
  /** Fallback component to render on error */
  fallback?: ReactNode;
  /** Component name for better error reporting */
  componentName?: string;
}

export class LazyLoadErrorBoundary extends Component<LazyLoadErrorBoundaryProps, LazyLoadErrorBoundaryState> {
  constructor(props: LazyLoadErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): LazyLoadErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('LazyLoadErrorBoundary caught an error:', error, errorInfo);
    }

    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // This would integrate with your error reporting service
      console.error('Lazy loading failed:', {
        error: error.message,
        componentName: this.props.componentName,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    
    // Force a full page reload to retry loading the chunk
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mb-4">
              <svg 
                className="w-12 h-12 text-red-500 mx-auto"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h2>
            
            <p className="text-gray-600 mb-6">
              {this.props.componentName 
                ? `Failed to load ${this.props.componentName}. This might be due to a network issue.`
                : 'There was an error loading this page. This might be due to a network issue.'
              }
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={this.handleRetry}
                variant="primary"
                className="flex-1 sm:flex-none"
              >
                Try Again
              </Button>
              
              <Button 
                onClick={this.handleGoHome}
                variant="secondary"
                className="flex-1 sm:flex-none"
              >
                Go Home
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-3 rounded border overflow-auto max-h-40">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LazyLoadErrorBoundary;