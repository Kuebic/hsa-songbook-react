/**
 * @file AsyncErrorBoundary.tsx
 * @description Error boundary for async operations (service worker, sync, background tasks)
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { errorReporting } from '../../services/errorReporting';
import { 
  StatusCard, 
  AsyncIcon, 
  StatusHeading, 
  StatusDescription, 
  StatusCaption,
  StatusRetryCounter,
  StatusDebugInfo,
  StatusActions
} from './index';

interface Props {
  children: ReactNode;
  operation?: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  allowBackground?: boolean;
}

interface State {
  hasError: boolean;
  errorId?: string;
  error?: Error;
  retryCount: number;
  isBackground: boolean;
}

export class AsyncErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0,
      isBackground: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { operation, onError } = this.props;
    
    // Report error using centralized service
    const errorId = errorReporting.report(
      `Async operation error${operation ? ` in ${operation}` : ''}: ${error.message}`,
      'sync',
      'medium',
      {
        error,
        context: {
          componentStack: errorInfo.componentStack,
          operation,
          retryCount: this.state.retryCount,
          errorBoundary: 'AsyncErrorBoundary',
        },
        userFriendlyMessage: this.getUserFriendlyMessage(operation),
        recoveryActions: this.getRecoveryActions(operation),
      }
    );

    this.setState({ errorId });
    onError?.(error, errorInfo);
  }

  private getUserFriendlyMessage(operation?: string): string {
    if (operation) {
      switch (operation.toLowerCase()) {
        case 'sync':
        case 'synchronization':
          return 'Data synchronization failed. Your changes are saved locally but may not sync to the server.';
        case 'service-worker':
        case 'serviceworker':
          return 'Background services are not working properly. Offline features may be limited.';
        case 'background-sync':
          return 'Background synchronization failed. Your data will sync when the connection improves.';
        case 'cache':
        case 'caching':
          return 'Caching failed. The app may load slower and offline features may not work.';
        default:
          return `The ${operation} operation failed. Some features may not work as expected.`;
      }
    }
    return 'A background operation failed. Some features may not work properly.';
  }

  private getRecoveryActions(operation?: string) {
    const baseActions = [
      {
        label: 'Retry',
        action: () => this.handleRetry(),
        type: 'retry' as const,
      },
    ];

    if (!operation) return baseActions;

    switch (operation.toLowerCase()) {
      case 'sync':
      case 'synchronization':
        return [
          ...baseActions,
          {
            label: 'Force Sync',
            action: () => this.forceSync(),
            type: 'custom' as const,
          },
          {
            label: 'Work Offline',
            action: () => this.continueInBackground(),
            type: 'custom' as const,
          },
        ];
      case 'service-worker':
      case 'serviceworker':
        return [
          ...baseActions,
          {
            label: 'Restart Service Worker',
            action: () => this.restartServiceWorker(),
            type: 'custom' as const,
          },
          {
            label: 'Continue Without SW',
            action: () => this.continueInBackground(),
            type: 'custom' as const,
          },
        ];
      case 'cache':
      case 'caching':
        return [
          ...baseActions,
          {
            label: 'Clear Cache',
            action: () => this.clearCache(),
            type: 'custom' as const,
          },
        ];
      default:
        return [
          ...baseActions,
          {
            label: 'Continue Anyway',
            action: () => this.continueInBackground(),
            type: 'custom' as const,
          },
        ];
    }
  }

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      errorId: undefined,
      error: undefined,
      retryCount: prevState.retryCount + 1,
      isBackground: false,
    }));
  };

  private continueInBackground = () => {
    this.setState({
      isBackground: true,
    });
  };

  private forceSync = async () => {
    try {
      // This should integrate with your sync system
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'FORCE_SYNC',
          timestamp: Date.now(),
        });
      }
      this.continueInBackground();
    } catch (error) {
      console.warn('Failed to force sync:', error);
      this.continueInBackground();
    }
  };

  private restartServiceWorker = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.unregister();
          await navigator.serviceWorker.register('/sw.js');
        }
      }
      this.continueInBackground();
    } catch (error) {
      console.warn('Failed to restart service worker:', error);
      this.continueInBackground();
    }
  };

  private clearCache = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      this.handleRetry();
    } catch (error) {
      console.warn('Failed to clear cache:', error);
      this.continueInBackground();
    }
  };

  private renderActions(operation?: string, allowBackground?: boolean) {
    const baseActions = (
      <StatusActions>
        <StatusActions.Retry onClick={this.handleRetry} />
      </StatusActions>
    );

    if (!operation) {
      return (
        <StatusActions>
          <StatusActions.Retry onClick={this.handleRetry} />
          {allowBackground && (
            <StatusActions.Custom 
              onClick={this.continueInBackground}
              variant="outline"
            >
              Continue Anyway
            </StatusActions.Custom>
          )}
        </StatusActions>
      );
    }

    switch (operation.toLowerCase()) {
      case 'sync':
      case 'synchronization':
        return (
          <StatusActions>
            <StatusActions.Retry onClick={this.handleRetry} />
            <StatusActions.Custom onClick={this.forceSync} variant="secondary">
              Force Sync
            </StatusActions.Custom>
            <StatusActions.Custom onClick={this.continueInBackground} variant="outline">
              Work Offline
            </StatusActions.Custom>
          </StatusActions>
        );
      
      case 'service-worker':
      case 'serviceworker':
        return (
          <StatusActions>
            <StatusActions.Retry onClick={this.handleRetry} />
            <StatusActions.Custom onClick={this.restartServiceWorker} variant="secondary">
              Restart Service Worker
            </StatusActions.Custom>
            <StatusActions.Custom onClick={this.continueInBackground} variant="outline">
              Continue Without SW
            </StatusActions.Custom>
          </StatusActions>
        );
      
      case 'cache':
      case 'caching':
        return (
          <StatusActions>
            <StatusActions.Retry onClick={this.handleRetry} />
            <StatusActions.Custom onClick={this.clearCache} variant="secondary">
              Clear Cache
            </StatusActions.Custom>
            {allowBackground && (
              <StatusActions.Custom onClick={this.continueInBackground} variant="outline">
                Continue Anyway
              </StatusActions.Custom>
            )}
          </StatusActions>
        );
      
      default:
        return (
          <StatusActions>
            <StatusActions.Retry onClick={this.handleRetry} />
            {allowBackground && (
              <StatusActions.Custom onClick={this.continueInBackground} variant="outline">
                Continue Anyway
              </StatusActions.Custom>
            )}
          </StatusActions>
        );
    }
  }

  render() {
    if (this.state.hasError) {
      const { allowBackground = true } = this.props;
      
      // If running in background mode, show minimal UI
      if (this.state.isBackground && allowBackground) {
        return (
          <div>
            {this.props.children}
            <div className="fixed bottom-4 right-4 z-50">
              <StatusCard variant="warning" size="sm" padding="sm" className="shadow-lg max-w-sm">
                <div className="flex items-center gap-2">
                  <AsyncIcon variant="warning" size="sm" />
                  <div className="flex-1">
                    <StatusCaption colorVariant="warning" className="font-medium">
                      {this.props.operation || 'Background operation'} failed
                    </StatusCaption>
                    <StatusCaption colorVariant="warning">
                      Running with limited functionality
                    </StatusCaption>
                  </div>
                  <StatusActions>
                    <StatusActions.Retry onClick={this.handleRetry} size="xs" />
                  </StatusActions>
                </div>
              </StatusCard>
            </div>
          </div>
        );
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { operation, showDetails = false } = this.props;
      const { error, retryCount } = this.state;

      return (
        <StatusCard variant="info" size="lg" centered>
          {/* Icon and Title */}
          <div className="mb-4">
            <AsyncIcon 
              variant="info"
              size="2xl"
              className="mb-2"
            />
            <StatusHeading colorVariant="info">
              Operation Failed
            </StatusHeading>
            {operation && (
              <StatusCaption colorVariant="info">
                {operation}
              </StatusCaption>
            )}
          </div>
          
          {/* Description */}
          <StatusDescription colorVariant="neutral" className="mb-4">
            {this.getUserFriendlyMessage(operation)}
          </StatusDescription>

          {/* Retry Counter */}
          {retryCount > 0 && (
            <StatusRetryCounter count={retryCount} />
          )}

          {/* Debug Info */}
          <StatusDebugInfo error={error} context={{ operation, retryCount }} />

          {/* Actions */}
          <div className="mt-6">
            {this.renderActions(operation, allowBackground)}
          </div>

          {/* Persistent Error Warning */}
          {retryCount >= 2 && (
            <StatusCard 
              variant="info" 
              size="sm" 
              className="mt-4"
              padding="sm"
            >
              <StatusCaption colorVariant="info">
                This operation is having persistent issues. You can continue using the app with limited functionality.
              </StatusCaption>
            </StatusCard>
          )}
        </StatusCard>
      );
    }

    return this.props.children;
  }
}