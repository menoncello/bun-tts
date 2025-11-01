import { failure, Result, BunTtsBaseError } from '../errors/index';
import type { RecoveryStrategy } from './error-recovery';
import { shouldRetryStrategy } from './strategy-retry-helpers';

/**
 * Creates successful iteration result
 * @param {Result<T, BunTtsBaseError>} result - The successful result
 * @param {BunTtsBaseError} error - The error (if any)
 * @returns {{ success: boolean; result: Result<T, BunTtsBaseError>; error: BunTtsBaseError; shouldContinue: boolean }} Success result
 */
export const createSuccessIterationResult = <T>(
  result: Result<T, BunTtsBaseError>,
  error: BunTtsBaseError
): {
  success: true;
  result: Result<T, BunTtsBaseError>;
  error: BunTtsBaseError;
  shouldContinue: false;
} => ({
  success: true as const,
  result,
  error,
  shouldContinue: false as const,
});

/**
 * Creates failure iteration result
 * @param {BunTtsBaseError} error - The error that occurred
 * @param {boolean} shouldContinue - Whether to continue retrying
 * @returns {{ success: boolean; result: Result<T, BunTtsBaseError>; error: BunTtsBaseError; shouldContinue: boolean }} Failure result
 */
export const createFailureIterationResult = <T>(
  error: BunTtsBaseError,
  shouldContinue: boolean
): {
  success: false;
  result: Result<T, BunTtsBaseError>;
  error: BunTtsBaseError;
  shouldContinue: boolean;
} => ({
  success: false as const,
  result: failure(error),
  error,
  shouldContinue,
});

/**
 * Determines if retry should continue after failed attempt
 * @param {RecoveryStrategy} strategy - Recovery strategy to use
 * @param {BunTtsBaseError} error - Error that occurred
 * @param {number} attempt - Current attempt number
 * @param {number} maxRetries - Maximum number of retries
 * @returns {boolean} Whether to continue retrying
 */
export const shouldContinueRetry = (
  strategy: RecoveryStrategy,
  error: BunTtsBaseError,
  attempt: number,
  maxRetries: number
): boolean => {
  const retryRange = { start: attempt, end: maxRetries };
  return shouldRetryStrategy(strategy, error, retryRange, attempt);
};
