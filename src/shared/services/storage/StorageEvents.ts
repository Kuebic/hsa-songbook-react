/**
 * @file StorageEvents.ts
 * @description Event handling system for storage operations
 */

import type { 
  StorageEvent,
  StorageEventType,
  StorageEventCallback
} from '../../types/storage.types';
import { errorReporting } from '../errorReporting';

/**
 * Manages event handling for storage operations
 * Provides a centralized event system for storage-related notifications
 */
export class StorageEvents {
  private eventListeners = new Map<StorageEventType, StorageEventCallback[]>();
  private isDebugging = false;

  constructor(options: { debug?: boolean } = {}) {
    this.isDebugging = options.debug ?? process.env.NODE_ENV === 'development';
  }

  /**
   * Add event listener for a specific storage event type
   * @param eventType - The type of storage event to listen for
   * @param callback - The callback function to execute when the event is emitted
   */
  on<T = unknown>(eventType: StorageEventType, callback: StorageEventCallback<T>): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback as StorageEventCallback);

    if (this.isDebugging) {
      console.debug(`[StorageEvents] Added listener for '${eventType}' event`);
    }
  }

  /**
   * Remove event listener for a specific storage event type
   * @param eventType - The type of storage event to stop listening for
   * @param callback - The specific callback function to remove
   */
  off<T = unknown>(eventType: StorageEventType, callback: StorageEventCallback<T>): void {
    const callbacks = this.eventListeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback as StorageEventCallback);
      if (index > -1) {
        callbacks.splice(index, 1);
        
        if (this.isDebugging) {
          console.debug(`[StorageEvents] Removed listener for '${eventType}' event`);
        }
      }

      // Clean up empty event type arrays
      if (callbacks.length === 0) {
        this.eventListeners.delete(eventType);
      }
    }
  }

  /**
   * Remove all event listeners for a specific event type
   * @param eventType - The type of storage event to clear all listeners for
   */
  removeAllListeners(eventType?: StorageEventType): void {
    if (eventType) {
      this.eventListeners.delete(eventType);
      if (this.isDebugging) {
        console.debug(`[StorageEvents] Removed all listeners for '${eventType}' event`);
      }
    } else {
      this.eventListeners.clear();
      if (this.isDebugging) {
        console.debug('[StorageEvents] Removed all event listeners');
      }
    }
  }

  /**
   * Emit an event to all registered listeners
   * @param eventType - The type of storage event to emit
   * @param data - The data to pass to event listeners
   */
  emit<T = unknown>(eventType: StorageEventType, data: T): void {
    const callbacks = this.eventListeners.get(eventType);
    if (!callbacks || callbacks.length === 0) {
      if (this.isDebugging) {
        console.debug(`[StorageEvents] No listeners for '${eventType}' event`);
      }
      return;
    }

    const event: StorageEvent<T> = {
      type: eventType,
      data,
      timestamp: Date.now()
    };

    if (this.isDebugging) {
      console.debug(`[StorageEvents] Emitting '${eventType}' event with data:`, data);
    }

    // Execute all callbacks, capturing any errors to prevent one bad callback from breaking others
    callbacks.forEach((callback, index) => {
      try {
        callback(event);
      } catch (error) {
        // Use centralized error reporting instead of console.error
        errorReporting.reportStorageError(
          `Error in event callback ${index} for '${eventType}' event`,
          error instanceof Error ? error : new Error(String(error)),
          {
            service: 'StorageEvents',
            operation: 'event_callback',
            eventType,
            callbackIndex: index,
          }
        );
        
        // Emit error event for this callback failure
        this.emitCallbackError(eventType, error, index);
      }
    });
  }

  /**
   * Emit an error event specifically for callback failures
   * @param originalEventType - The event type that caused the callback error
   * @param error - The error that occurred
   * @param callbackIndex - The index of the failed callback
   */
  private emitCallbackError(originalEventType: StorageEventType, error: unknown, callbackIndex: number): void {
    // Prevent infinite recursion by not emitting callback errors for storage_error events
    if (originalEventType === 'storage_error') {
      return;
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown callback error';
    
    this.emit('storage_error', {
      error: `Callback error for '${originalEventType}' event: ${errorMessage}`,
      operation: 'event_callback',
      metadata: {
        originalEventType,
        callbackIndex,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Get the number of listeners for a specific event type
   * @param eventType - The event type to count listeners for
   * @returns The number of registered listeners
   */
  getListenerCount(eventType: StorageEventType): number {
    const callbacks = this.eventListeners.get(eventType);
    return callbacks ? callbacks.length : 0;
  }

  /**
   * Get all currently registered event types
   * @returns Array of event types that have listeners
   */
  getRegisteredEventTypes(): StorageEventType[] {
    return Array.from(this.eventListeners.keys());
  }

  /**
   * Check if there are any listeners for a specific event type
   * @param eventType - The event type to check
   * @returns True if there are listeners, false otherwise
   */
  hasListeners(eventType: StorageEventType): boolean {
    return this.getListenerCount(eventType) > 0;
  }

  /**
   * Create a one-time event listener that automatically removes itself after firing
   * @param eventType - The type of storage event to listen for
   * @param callback - The callback function to execute when the event is emitted
   */
  once<T = unknown>(eventType: StorageEventType, callback: StorageEventCallback<T>): void {
    const wrappedCallback: StorageEventCallback<T> = (event) => {
      // Remove the listener before calling the callback
      this.off(eventType, wrappedCallback);
      callback(event);
    };

    this.on(eventType, wrappedCallback);
  }

  /**
   * Create a promise that resolves when a specific event is emitted
   * @param eventType - The event type to wait for
   * @param timeout - Optional timeout in milliseconds
   * @returns Promise that resolves with the event data
   */
  waitForEvent<T = unknown>(eventType: StorageEventType, timeout?: number): Promise<T> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | undefined;

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };

      const eventCallback: StorageEventCallback<T> = (event) => {
        cleanup();
        this.off(eventType, eventCallback);
        resolve(event.data);
      };

      this.once(eventType, eventCallback);

      if (timeout && timeout > 0) {
        timeoutId = setTimeout(() => {
          this.off(eventType, eventCallback);
          reject(new Error(`Timeout waiting for '${eventType}' event after ${timeout}ms`));
        }, timeout);
      }
    });
  }

  /**
   * Emit multiple events in sequence
   * @param events - Array of event type and data pairs
   */
  emitBatch<T = unknown>(events: Array<{ type: StorageEventType; data: T }>): void {
    events.forEach(({ type, data }) => {
      this.emit(type, data);
    });
  }

  /**
   * Get debug information about the current state of event listeners
   * @returns Object containing debug information
   */
  getDebugInfo(): {
    totalEventTypes: number;
    totalListeners: number;
    eventTypes: Array<{ type: StorageEventType; listenerCount: number }>;
  } {
    const eventTypes = this.getRegisteredEventTypes();
    const totalListeners = eventTypes.reduce((total, type) => total + this.getListenerCount(type), 0);

    return {
      totalEventTypes: eventTypes.length,
      totalListeners,
      eventTypes: eventTypes.map(type => ({
        type,
        listenerCount: this.getListenerCount(type)
      }))
    };
  }

  /**
   * Enable or disable debug logging
   * @param enabled - Whether to enable debug logging
   */
  setDebugMode(enabled: boolean): void {
    this.isDebugging = enabled;
    
    if (enabled) {
      console.debug('[StorageEvents] Debug mode enabled');
    }
  }

  /**
   * Clean up all event listeners and resources
   * Call this when the storage system is being destroyed
   */
  destroy(): void {
    if (this.isDebugging) {
      console.debug('[StorageEvents] Destroying event system');
    }
    
    this.removeAllListeners();
  }
}