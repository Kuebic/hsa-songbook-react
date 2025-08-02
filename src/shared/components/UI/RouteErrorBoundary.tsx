/**
 * @file RouteErrorBoundary.tsx
 * @description Error boundary for route-level error handling
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { errorReporting } from '../../services/errorReporting';
import { 
  StatusCardFullPage, 
  RouteIcon, 
  StatusTitle, 
  StatusDescription, 
  StatusCaption,
  StatusRetryCounter,
  StatusDebugInfo,
  StatusNavigationActions
} from './index';

interface Props {
  children: ReactNode;
  routeName?: string;
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

export class RouteErrorBoundary extends Component<Props, State> {
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
    const { routeName, onError } = this.props;
    const currentPath = window.location.pathname;
    
    // Report error using centralized service
    const errorId = errorReporting.report(
      `Route error${routeName ? ` in ${routeName}` : ''} (${currentPath}): ${error.message}`,
      'component',
      'high',
      {
        error,
        context: {
          componentStack: errorInfo.componentStack,
          routeName,
          currentPath,
          retryCount: this.state.retryCount,
          errorBoundary: 'RouteErrorBoundary',
          referrer: document.referrer,
          userAgent: navigator.userAgent,
        },
        userFriendlyMessage: this.getUserFriendlyMessage(routeName, currentPath),
        recoveryActions: this.getRecoveryActions(currentPath),
      }
    );

    this.setState({ errorId });
    onError?.(error, errorInfo);
  }

  private getUserFriendlyMessage(routeName?: string, currentPath?: string): string {
    const pageName = routeName || this.getPageNameFromPath(currentPath);
    return `The ${pageName} page encountered an error and couldn't be loaded properly.`;
  }

  private getPageNameFromPath(path?: string): string {
    if (!path) return 'current';
    
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) return 'home';
    
    const pageMap: Record<string, string> = {
      'songs': 'songs',
      'setlists': 'setlists',
      'arrangements': 'arrangements',
      'search': 'search',
      'settings': 'settings',
      'profile': 'profile',
      'offline': 'offline',
    };
    
    return pageMap[segments[0]] || segments[0];
  }

  private getRecoveryActions(currentPath?: string) {
    const actions = [
      {
        label: 'Try Again',
        action: () => this.handleRetry(),
        type: 'retry' as const,
      },
      {
        label: 'Go Home',
        action: () => this.goHome(),
        type: 'navigate' as const,
      },
    ];

    // Add context-specific actions based on the route
    if (currentPath) {
      if (currentPath.includes('/songs')) {
        actions.splice(1, 0, {
          label: 'Browse All Songs',
          action: () => window.location.href = '/songs',
          type: 'navigate' as const,
        });
      } else if (currentPath.includes('/setlists')) {
        actions.splice(1, 0, {
          label: 'View Setlists',
          action: () => window.location.href = '/setlists',
          type: 'navigate' as const,
        });
      } else if (currentPath.includes('/search')) {
        actions.splice(1, 0, {
          label: 'New Search',
          action: () => window.location.href = '/search',
          type: 'navigate' as const,
        });
      }
    }

    return actions;
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

  private refreshPage = () => {
    window.location.reload();
  };

  private getContextualActions(currentPath?: string) {
    const actions = [];

    if (currentPath?.includes('/songs')) {
      actions.push({
        label: 'Browse Songs',
        onClick: () => window.location.href = '/songs',
        variant: 'outline' as const,
      });
    }

    if (currentPath?.includes('/setlists')) {
      actions.push({
        label: 'View Setlists',
        onClick: () => window.location.href = '/setlists',
        variant: 'outline' as const,
      });
    }

    if (currentPath?.includes('/search')) {
      actions.push({
        label: 'New Search',
        onClick: () => window.location.href = '/search',
        variant: 'outline' as const,
      });
    }

    return actions;
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { routeName, showDetails = false } = this.props;
      const { error, retryCount } = this.state;
      const currentPath = window.location.pathname;
      const pageName = routeName || this.getPageNameFromPath(currentPath);

      return (
        <StatusCardFullPage variant="error">
          {/* Icon and Title */}
          <div className="mb-6">
            <RouteIcon 
              variant="error"
              size="4xl"
              className="mb-4"
            />
            <StatusTitle colorVariant="error">
              Page Error
            </StatusTitle>
            <StatusCaption colorVariant="error" className="capitalize">
              {pageName} page
            </StatusCaption>
          </div>
          
          {/* Description */}
          <div className="mb-6">
            <StatusDescription colorVariant="neutral" className="text-lg mb-2">
              {this.getUserFriendlyMessage(routeName, currentPath)}
            </StatusDescription>
            <StatusDescription colorVariant="neutral">
              Don't worry, your data is safe. Try one of the options below to continue.
            </StatusDescription>
          </div>

          {/* Retry Counter */}
          {retryCount > 0 && (
            <StatusRetryCounter count={retryCount} />
          )}

          {/* Debug Info */}
          <StatusDebugInfo 
            error={error} 
            context={{ 
              routeName, 
              currentPath, 
              retryCount,
              errorBoundary: 'RouteErrorBoundary'
            }} 
          />

          {/* Actions */}
          <div className="mb-6">
            <StatusNavigationActions
              onRetry={this.handleRetry}
              onGoBack={this.goBack}
              onGoHome={this.goHome}
              onRefresh={this.refreshPage}
              contextActions={this.getContextualActions(currentPath)}
            />
          </div>

          {/* Persistent Error Warning */}
          {retryCount >= 3 && (
            <StatusCard 
              variant="error" 
              size="md" 
              className="mt-6"
              padding="md"
            >
              <StatusHeading colorVariant="error" className="mb-2">
                Persistent Error
              </StatusHeading>
              <StatusCaption colorVariant="error">
                This page has failed to load multiple times. This might indicate a deeper issue. 
                Consider clearing your browser cache or trying a different browser.
              </StatusCaption>
            </StatusCard>
          )}
        </StatusCardFullPage>
      );
    }

    return this.props.children;
  }
}