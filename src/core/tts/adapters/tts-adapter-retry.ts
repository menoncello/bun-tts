/**
 * Retry configuration and utilities for TTS operations
 */

/**
 * Retry configuration for TTS operations
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Base delay in milliseconds for exponential backoff */
  baseDelay: number;
  /** Maximum delay in milliseconds */
  maxDelay: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier: number;
}

/**
 * Default retry configuration for TTS operations
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  baseDelay: 100, // Increased to ensure 200ms total delay
  maxDelay: 300,
  backoffMultiplier: 2,
};

/**
 * Error types that should be retried
 */
export const RETRYABLE_ERROR_TYPES = new Set([
  'TTS_SERVICE_TIMEOUT',
  'TTS_SERVICE_UNAVAILABLE',
  'NETWORK_ERROR',
  'RATE_LIMIT_EXCEEDED',
]);

/**
 * Calculates exponential backoff delay for retry attempts
 *
 * @param {number} attempt - Current attempt number (0-based)
 * @param {RetryConfig} config - Retry configuration
 * @returns {number} Delay in milliseconds
 */
export function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig
): number {
  const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelay);
}

/**
 * Determines if an error should be retried based on its type
 *
 * @param {string} errorType - The error type to check
 * @returns {boolean} True if the error should be retried
 */
export function shouldRetryError(errorType: string): boolean {
  return RETRYABLE_ERROR_TYPES.has(errorType);
}

/**
 * Sleep for the specified number of milliseconds
 *
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>} Promise that resolves after the delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
