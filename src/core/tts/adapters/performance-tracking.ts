/**
 * Performance Tracking Utilities for TTS Adapter System
 * Extracted from performance-integration.ts to reduce file size
 */

// Re-export components for backward compatibility
export { PerformanceTracker } from './performance-tracker.js';
export { BatchPerformanceCollector } from './batch-performance-collector.js';

/**
 * Performance monitoring decorator for adapter methods.
 * @param {string} adapterName - The name of the adapter being monitored.
 * @param {string} methodName - The name of the method being decorated.
 * @param {T} fn - The function to wrap with performance monitoring.
 * @returns {T} The decorated function with performance monitoring.
 * @template {T extends (...args: unknown[]) => Promise<unknown>}
 */
export function withPerformanceMonitoring<
  T extends (...args: unknown[]) => Promise<unknown>,
>(adapterName: string, methodName: string, fn: T): T {
  return (async (...args: unknown[]) => {
    const startTime = Date.now();

    try {
      const result = await fn(...args);
      logMethodPerformanceIfSignificant(startTime, adapterName, methodName);
      return result;
    } catch (error) {
      logMethodError(startTime, adapterName, methodName, error as Error);
      throw error;
    }
  }) as T;
}

/**
 * Log method performance if it exceeds the threshold.
 * @param {number} _startTime - The start timestamp.
 * @param {string} _adapterName - The adapter name.
 * @param {string} _methodName - The method name.
 */
function logMethodPerformanceIfSignificant(
  _startTime: number,
  _adapterName: string,
  _methodName: string
): void {
  const LOG_THRESHOLD_MS = 1000;
  const duration = Date.now() - _startTime;
  if (duration > LOG_THRESHOLD_MS) {
    // Performance logging can be added here if needed
    // Performance monitoring framework integration would go here
  }
}

/**
 * Log method error with performance context.
 * @param {number} _startTime - The start timestamp.
 * @param {string} _adapterName - The adapter name.
 * @param {string} _methodName - The method name.
 * @param {Error} _error - The error that occurred.
 */
function logMethodError(
  _startTime: number,
  _adapterName: string,
  _methodName: string,
  _error: Error
): void {
  // Error logging can be added here if needed
  // Error tracking framework integration would go here
}
