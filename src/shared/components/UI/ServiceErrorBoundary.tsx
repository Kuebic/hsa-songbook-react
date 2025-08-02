/**
 * @file ServiceErrorBoundary.tsx
 * @description Error boundary for service layer errors (storage, API, network)
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { errorReporting, type ErrorCategory } from '../../services/errorReporting';
import { 
  StatusCard, 
  StatusIcon, 
  StatusHeading, 
  StatusDescription, 
  StatusCaption,
  StatusRetryCounter,
  StatusDebugInfo,
  StatusStorageActions,
  useToastHelpers
} from './index';

interface Props {
  children: ReactNode;
  category: ErrorCategory;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  errorId?: string;
  error?: Error;
  retryCount: number;
}

export class ServiceErrorBoundary extends Component<Props, State> {
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
    const { category, onError } = this.props;
    
    // Report error using centralized service
    const errorId = errorReporting.report(
      error.message,
      category,
      'high',
      {
        error,
        context: {
          componentStack: errorInfo.componentStack,
          errorBoundary: 'ServiceErrorBoundary',
          category,
          retryCount: this.state.retryCount,
        },
        userFriendlyMessage: this.getUserFriendlyMessage(category),
        recoveryActions: this.getRecoveryActions(category),
      }
    );

    this.setState({ errorId });
    onError?.(error, errorInfo);
  }

  private getUserFriendlyMessage(category: ErrorCategory): string {
    switch (category) {
      case 'storage':
        return 'There was a problem saving your data. Your changes may not be permanently saved.';
      case 'network':
        return 'Unable to connect to the server. Please check your internet connection.';
      case 'service-worker':
        return 'Offline features are not working properly. Some functionality may be limited.';
      case 'sync':
        return 'Your changes could not be synchronized. They will be saved locally.';
      default:
        return 'A service error occurred. Some features may not work properly.';
    }
  }

  private getRecoveryActions(category: ErrorCategory) {
    const baseActions = [
      {
        label: 'Try Again',
        action: () => this.handleRetry(),
        type: 'retry' as const,
      },
    ];

    switch (category) {
      case 'storage':
        return [
          ...baseActions,
          {
            label: 'Check Storage',
            action: () => this.checkStorage(),
            type: 'custom' as const,
          },
        ];
      case 'network':
        return [
          ...baseActions,
          {
            label: 'Work Offline',
            action: () => this.enableOfflineMode(),
            type: 'custom' as const,
          },
        ];
      case 'service-worker':
        return [
          ...baseActions,
          {
            label: 'Clear Cache',
            action: () => this.clearCache(),
            type: 'custom' as const,
          },
        ];
      default:
        return baseActions;
    }
  }

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      errorId: undefined,
      error: undefined,
      retryCount: prevState.retryCount + 1,
    }));
  };

  private checkStorage = async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const percentUsed = estimate.usage && estimate.quota 
          ? Math.round((estimate.usage / estimate.quota) * 100)
          : 0;
        
        // We need to use toast functions directly since this is a class component
        import('./index').then(({ showInfo }) => {
          showInfo(
            'Storage Usage',
            `${percentUsed}% used (${this.formatBytes(estimate.usage || 0)} of ${this.formatBytes(estimate.quota || 0)})`
          );
        });
      } catch (error) {
        import('./index').then(({ showError }) => {
          showError('Storage Check Failed', 'Unable to check storage quota');
        });
      }
    } else {
      import('./index').then(({ showWarning }) => {
        showWarning('Storage Unavailable', 'Storage information not available in this browser');
      });
    }
  };

  private enableOfflineMode = () => {
    // This should integrate with your offline store
    import('./index').then(({ showWarning }) => {
      showWarning('Offline Mode', 'Some features may be limited while offline');
    });
    this.handleRetry();
  };

  private clearCache = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        import('./index').then(({ showSuccess }) => {
          showSuccess('Cache Cleared', 'Please refresh the page to see changes');
        });
      } catch (error) {
        import('./index').then(({ showError }) => {
          showError('Cache Clear Failed', 'Unable to clear browser cache');
        });
      }
    } else {
      import('./index').then(({ showWarning }) => {
        showWarning('Not Supported', 'Cache clearing not supported in this browser');
      });
    }
  };

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private getCategoryIcon(category: ErrorCategory): string {
    switch (category) {
      case 'storage':
        return '💾';
      case 'network':
        return '🌐';
      case 'service-worker':
        return '⚙️';
      case 'sync':
        return '🔄';
      default:
        return '⚠️';
    }
  }

  private getCategoryTitle(category: ErrorCategory): string {
    switch (category) {
      case 'storage':
        return 'Storage Error';
      case 'network':
        return 'Network Error';
      case 'service-worker':
        return 'Service Worker Error';
      case 'sync':
        return 'Sync Error';
      default:
        return 'Service Error';
    }
  }

  private getVariantForCategory(category: ErrorCategory): 'error' | 'warning' | 'info' {
    switch (category) {
      case 'storage':
      case 'network':
        return 'error';
      case 'service-worker':
      case 'sync':
        return 'warning';
      default:
        return 'error';
    }
  }

  private getIconTypeForCategory(category: ErrorCategory): 'storage' | 'network' | 'sync' | 'async' | 'error' {
    switch (category) {
      case 'storage':
        return 'storage';
      case 'network':
        return 'network';
      case 'service-worker':
        return 'async';
      case 'sync':
        return 'sync';
      default:
        return 'error';
    }
  }

  private renderActions(category: ErrorCategory): React.ReactNode {
    switch (category) {
      case 'storage':
        return (
          <StatusStorageActions
            onRetry={this.handleRetry}
            onCheckStorage={this.checkStorage}
            onWorkOffline={this.enableOfflineMode}
          />
        );
      case 'network':
        return (
          <StatusStorageActions
            onRetry={this.handleRetry}
            onWorkOffline={this.enableOfflineMode}
          />
        );
      case 'service-worker':
        return (
          <StatusStorageActions
            onRetry={this.handleRetry}
            onClearCache={this.clearCache}
          />
        );
      default:
        return (
          <StatusStorageActions
            onRetry={this.handleRetry}
          />
        );
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { category, showDetails = false } = this.props;
      const { error, retryCount } = this.state;
      const variant = this.getVariantForCategory(category);

      return (
        <StatusCard variant={variant} size="lg" centered>
          {/* Icon and Title */}
          <div className="mb-4">
            <StatusIcon 
              type={this.getIconTypeForCategory(category)} 
              variant={variant}
              size="2xl"
              className="mb-2"
            />
            <StatusHeading colorVariant={variant}>
              {this.getCategoryTitle(category)}
            </StatusHeading>
          </div>
          
          {/* Description */}
          <StatusDescription colorVariant="neutral">
            {this.getUserFriendlyMessage(category)}
          </StatusDescription>

          {/* Retry Counter */}
          {retryCount > 0 && (
            <StatusRetryCounter count={retryCount} />
          )}

          {/* Debug Info */}
          <StatusDebugInfo error={error} context={{ category, retryCount }} />

          {/* Actions */}
          <div className="mt-6">
            {this.renderActions(category)}
          </div>

          {/* Persistent Error Warning */}
          {retryCount >= 3 && (
            <StatusCard 
              variant="warning" 
              size="sm" 
              className="mt-4"
              padding="sm"
            >
              <StatusCaption colorVariant="warning">
                This error has occurred multiple times. Consider refreshing the page or checking your connection.
              </StatusCaption>
            </StatusCard>
          )}
        </StatusCard>
      );
    }

    return this.props.children;
  }
}