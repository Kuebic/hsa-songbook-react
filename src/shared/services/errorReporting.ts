/**
 * @file errorReporting.ts
 * @description Centralized error reporting and handling service
 */

import { showError, showWarning, showSuccess, showInfo } from '../components/UI/StatusToast';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory = 'storage' | 'network' | 'component' | 'service-worker' | 'sync' | 'user-input' | 'system';

export interface ErrorReport {
  id: string;
  timestamp: number;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  error?: Error;
  context?: Record<string, unknown>;
  userId?: string;
  userAgent?: string;
  url?: string;
  userFriendlyMessage?: string;
  recoveryActions?: RecoveryAction[];
}

export interface RecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  type: 'retry' | 'refresh' | 'navigate' | 'custom';
}

export interface ErrorReportingConfig {
  enableConsoleLogging: boolean;
  enableRemoteReporting: boolean;
  enableUserNotifications: boolean;
  maxReportsInMemory: number;
  reportEndpoint?: string;
}

class ErrorReportingService {
  private config: ErrorReportingConfig;
  private reports: ErrorReport[] = [];
  private listeners: ((report: ErrorReport) => void)[] = [];

  constructor(config: Partial<ErrorReportingConfig> = {}) {
    this.config = {
      enableConsoleLogging: process.env.NODE_ENV === 'development',
      enableRemoteReporting: process.env.NODE_ENV === 'production',
      enableUserNotifications: true,
      maxReportsInMemory: 100,
      ...config,
    };
  }

  /**
   * Report an error
   */
  report(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity = 'medium',
    options: {
      error?: Error;
      context?: Record<string, unknown>;
      userFriendlyMessage?: string;
      recoveryActions?: RecoveryAction[];
    } = {}
  ): string {
    const report: ErrorReport = {
      id: this.generateId(),
      timestamp: Date.now(),
      message,
      category,
      severity,
      error: options.error,
      context: options.context,
      userId: this.getCurrentUserId(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userFriendlyMessage: options.userFriendlyMessage || this.generateUserFriendlyMessage(message, category),
      recoveryActions: options.recoveryActions || this.generateDefaultRecoveryActions(category),
    };

    this.addReport(report);
    this.processReport(report);

    return report.id;
  }

  /**
   * Report a storage error
   */
  reportStorageError(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): string {
    return this.report(message, 'storage', 'high', {
      error,
      context,
      userFriendlyMessage: 'There was a problem saving your data. Your changes may not be saved.',
      recoveryActions: [
        {
          label: 'Retry',
          action: () => window.location.reload(),
          type: 'retry',
        },
        {
          label: 'Check Storage',
          action: () => this.checkStorageQuota(),
          type: 'custom',
        },
      ],
    });
  }

  /**
   * Report a service worker error
   */
  reportServiceWorkerError(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): string {
    return this.report(message, 'service-worker', 'medium', {
      error,
      context,
      userFriendlyMessage: 'Offline features may not work properly. Try refreshing the page.',
      recoveryActions: [
        {
          label: 'Refresh Page',
          action: () => window.location.reload(),
          type: 'refresh',
        },
        {
          label: 'Clear Cache',
          action: () => this.clearServiceWorkerCache(),
          type: 'custom',
        },
      ],
    });
  }

  /**
   * Report a component error
   */
  reportComponentError(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): string {
    return this.report(message, 'component', 'medium', {
      error,
      context,
      userFriendlyMessage: 'Something went wrong with this part of the page.',
      recoveryActions: [
        {
          label: 'Try Again',
          action: () => window.location.reload(),
          type: 'retry',
        },
        {
          label: 'Go Home',
          action: () => window.location.href = '/',
          type: 'navigate',
        },
      ],
    });
  }

  /**
   * Report a network error
   */
  reportNetworkError(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): string {
    return this.report(message, 'network', 'high', {
      error,
      context,
      userFriendlyMessage: 'Unable to connect to the server. Check your internet connection.',
      recoveryActions: [
        {
          label: 'Retry',
          action: () => window.location.reload(),
          type: 'retry',
        },
        {
          label: 'Work Offline',
          action: () => this.enableOfflineMode(),
          type: 'custom',
        },
      ],
    });
  }

  /**
   * Report a sync error
   */
  reportSyncError(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): string {
    return this.report(message, 'sync', 'medium', {
      error,
      context,
      userFriendlyMessage: 'Your changes may not be synced to the server.',
      recoveryActions: [
        {
          label: 'Retry Sync',
          action: () => this.retrySync(),
          type: 'retry',
        },
      ],
    });
  }

  /**
   * Get all error reports
   */
  getReports(category?: ErrorCategory, severity?: ErrorSeverity): ErrorReport[] {
    let filtered = this.reports;
    
    if (category) {
      filtered = filtered.filter(report => report.category === category);
    }
    
    if (severity) {
      filtered = filtered.filter(report => report.severity === severity);
    }
    
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get a specific error report
   */
  getReport(id: string): ErrorReport | undefined {
    return this.reports.find(report => report.id === id);
  }

  /**
   * Clear all reports
   */
  clearReports(): void {
    this.reports = [];
  }

  /**
   * Add error listener
   */
  addListener(listener: (report: ErrorReport) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ErrorReportingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Private methods

  private addReport(report: ErrorReport): void {
    this.reports.unshift(report);
    
    // Limit reports in memory
    if (this.reports.length > this.config.maxReportsInMemory) {
      this.reports = this.reports.slice(0, this.config.maxReportsInMemory);
    }
  }

  private processReport(report: ErrorReport): void {
    // Console logging
    if (this.config.enableConsoleLogging) {
      const logLevel = this.getConsoleLogLevel(report.severity);
      console[logLevel](`[ErrorReporting] ${report.category}:`, report.message, report.error);
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(report);
      } catch (error) {
        console.error('[ErrorReporting] Error in listener:', error);
      }
    });

    // Remote reporting (in production)
    if (this.config.enableRemoteReporting && this.config.reportEndpoint) {
      this.sendRemoteReport(report).catch(error => {
        console.error('[ErrorReporting] Failed to send remote report:', error);
      });
    }
  }

  private getConsoleLogLevel(severity: ErrorSeverity): 'log' | 'warn' | 'error' {
    switch (severity) {
      case 'low':
        return 'log';
      case 'medium':
        return 'warn';
      case 'high':
      case 'critical':
        return 'error';
      default:
        return 'warn';
    }
  }

  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUserId(): string | undefined {
    // This should be implemented based on your auth system
    return undefined;
  }

  private generateUserFriendlyMessage(message: string, category: ErrorCategory): string {
    const friendlyMessages: Record<ErrorCategory, string> = {
      storage: 'There was a problem saving your data.',
      network: 'Unable to connect to the server.',
      component: 'Something went wrong with this feature.',
      'service-worker': 'Offline features may not work properly.',
      sync: 'Your changes may not be synced.',
      'user-input': 'Please check your input and try again.',
      system: 'A system error occurred.',
    };

    return friendlyMessages[category] || 'An unexpected error occurred.';
  }

  private generateDefaultRecoveryActions(category: ErrorCategory): RecoveryAction[] {
    switch (category) {
      case 'storage':
      case 'network':
      case 'sync':
        return [
          {
            label: 'Try Again',
            action: () => window.location.reload(),
            type: 'retry',
          },
        ];
      case 'component':
        return [
          {
            label: 'Refresh Page',
            action: () => window.location.reload(),
            type: 'refresh',
          },
          {
            label: 'Go Home',
            action: () => window.location.href = '/',
            type: 'navigate',
          },
        ];
      default:
        return [
          {
            label: 'Refresh Page',
            action: () => window.location.reload(),
            type: 'refresh',
          },
        ];
    }
  }

  private async sendRemoteReport(report: ErrorReport): Promise<void> {
    if (!this.config.reportEndpoint) return;

    const payload = {
      ...report,
      error: report.error ? {
        name: report.error.name,
        message: report.error.message,
        stack: report.error.stack,
      } : undefined,
    };

    await fetch(this.config.reportEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  // Recovery action helpers

  private async checkStorageQuota(): Promise<void> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const percentUsed = estimate.usage && estimate.quota 
        ? Math.round((estimate.usage / estimate.quota) * 100)
        : 0;
      
      showInfo(
        'Storage Usage',
        `${percentUsed}% used (${this.formatBytes(estimate.usage || 0)} of ${this.formatBytes(estimate.quota || 0)})`
      );
    }
  }

  private async clearServiceWorkerCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      showSuccess(
        'Cache Cleared',
        'Please refresh the page to see the changes.'
      );
    }
  }

  private enableOfflineMode(): void {
    // This should integrate with your offline store
    showWarning(
      'Offline Mode Enabled',
      'Some features may be limited while working offline.'
    );
  }

  private retrySync(): void {
    // This should integrate with your sync system
    showInfo(
      'Sync Started',
      'Attempting to synchronize your changes with the server.'
    );
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Global error reporting service instance
export const errorReporting = new ErrorReportingService();

// Global error handler
window.addEventListener('error', (event) => {
  errorReporting.report(
    event.message,
    'system',
    'high',
    {
      error: event.error,
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    }
  );
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  errorReporting.report(
    `Unhandled promise rejection: ${event.reason}`,
    'system',
    'high',
    {
      error: event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      context: {
        type: 'unhandledrejection',
      },
    }
  );
});