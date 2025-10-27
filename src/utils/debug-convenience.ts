import { DebugManager } from './debug-manager.js';

// Export singleton instance (lazy initialization)
let _debugManager: DebugManager | null = null;

/**
 * Gets the singleton DebugManager instance.
 * @returns The singleton DebugManager instance
 */
export const debugManager = (): DebugManager => {
  if (!_debugManager) {
    _debugManager = DebugManager.getInstance();
  }
  return _debugManager;
};

// Convenience functions

/**
 * Starts a performance timer using the debug manager singleton.
 * @param name - Unique identifier for the timer
 * @param metadata - Optional additional data to associate with the timer
 * @returns void
 */
export const startTimer = (
  name: string,
  metadata?: Record<string, unknown>
): void => debugManager().startTimer(name, metadata);

/**
 * Ends a performance timer using the debug manager singleton.
 * @param name - The unique identifier of the timer to end
 * @param metadata - Optional additional data to associate with the timer result
 * @returns The duration in milliseconds, or 0 if timer wasn't found
 */
export const endTimer = (
  name: string,
  metadata?: Record<string, unknown>
): number => debugManager().endTimer(name, metadata);

/**
 * Measures the execution time of an async function using the debug manager singleton.
 * @param name - Unique identifier for the measurement
 * @param fn - The async function to measure
 * @param metadata - Optional additional data to associate with the measurement
 * @returns The result of the function execution
 */
export const measureAsync = <T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> => debugManager().measureAsync(name, fn, metadata);

/**
 * Measures the execution time of a synchronous function using the debug manager singleton.
 * @param name - Unique identifier for the measurement
 * @param fn - The synchronous function to measure
 * @param metadata - Optional additional data to associate with the measurement
 * @returns The result of the function execution
 */
export const measureSync = <T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, unknown>
): T => debugManager().measureSync(name, fn, metadata);

/**
 * Logs a debug message using the debug manager singleton.
 * @param message - The debug message to log
 * @param metadata - Optional additional data to include with the log
 * @returns void
 */
export const debugLog = (
  message: string,
  metadata?: Record<string, unknown>
): void => debugManager().debug(message, metadata);

/**
 * Logs a trace message using the debug manager singleton.
 * @param message - The trace message to log
 * @param metadata - Optional additional data to include with the log
 * @returns void
 */
export const traceLog = (
  message: string,
  metadata?: Record<string, unknown>
): void => debugManager().trace(message, metadata);
