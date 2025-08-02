/**
 * @file ComponentErrorBoundary.tsx
 * @description Error boundary for UI component errors
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { errorReporting } from '../../services/errorReporting';
import { 
  StatusCard, 
  ComponentIcon, 
  StatusHeading, 
  StatusDescription, 
  StatusCaption,
  StatusRetryCounter,
  StatusDebugInfo,
  StatusNavigationActions
} from './index';

interface Props {
  children: ReactNode;
  componentName?: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  allowRetry?: boolean;
}

interface State {
  hasError: boolean;
  errorId?: string;
  error?: Error;
  retryCount: number;
}

export class ComponentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { componentName, onError } = this.props;
    
    // Report error using centralized service
    const errorId = errorReporting.reportComponentError(
      `Component error in ${componentName || 'unknown component'}: ${error.message}`,
      error,
      {
        componentStack: errorInfo.componentStack,
        componentName,
        retryCount: this.state.retryCount,
        errorBoundary: 'ComponentErrorBoundary',
      }
    );

    this.setState({ errorId });
    onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      errorId: undefined,
      error: undefined,
      retryCount: prevState.retryCount + 1,
    }));
  };

  private goHome = () => {
    window.location.href = '/';
  };

  private goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.goHome();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { componentName, showDetails = false, allowRetry = true } = this.props;
      const { error, retryCount } = this.state;

      return (
        <StatusCard variant="warning" size="lg" centered>
          {/* Icon and Title */}
          <div className="mb-4">
            <ComponentIcon 
              variant="warning"
              size="2xl"
              className="mb-2"
            />
            <StatusHeading colorVariant="warning">
              Component Error
            </StatusHeading>
            {componentName && (
              <StatusCaption colorVariant="warning">
                in {componentName}
              </StatusCaption>
            )}
          </div>
          
          {/* Description */}
          <StatusDescription colorVariant="neutral">
            This part of the page encountered an error and couldn't be displayed.
          </StatusDescription>

          {/* Retry Counter */}
          {retryCount > 0 && (
            <StatusRetryCounter count={retryCount} />
          )}

          {/* Debug Info */}
          <StatusDebugInfo error={error} context={{ componentName, retryCount }} />

          {/* Actions */}
          <div className="mt-6">
            <StatusNavigationActions
              onRetry={allowRetry ? this.handleRetry : undefined}
              onGoBack={this.goBack}
              onGoHome={this.goHome}
              onRefresh={() => window.location.reload()}
            />
          </div>

          {/* Persistent Error Warning */}
          {retryCount >= 3 && (
            <StatusCard 
              variant="error" 
              size="sm" 
              className="mt-4"
              padding="sm"
            >
              <StatusCaption colorVariant="error">
                This component has failed multiple times. Try refreshing the page or navigating to a different section.
              </StatusCaption>
            </StatusCard>
          )}
        </StatusCard>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withComponentErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: {
    componentName?: string;
    fallback?: ReactNode;
    showDetails?: boolean;
    allowRetry?: boolean;
  } = {}
) {
  const ComponentWithErrorBoundary = (props: P) => (
    <ComponentErrorBoundary
      componentName={options.componentName || WrappedComponent.displayName || WrappedComponent.name}
      fallback={options.fallback}
      showDetails={options.showDetails}
      allowRetry={options.allowRetry}
    >
      <WrappedComponent {...props} />
    </ComponentErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withComponentErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return ComponentWithErrorBoundary;
}