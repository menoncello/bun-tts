import { type Result, BunTtsBaseError, TTSError } from '../errors/index';
import type { RecoveryStrategy } from './error-recovery';
import type { StrategyExecutionParams } from './strategy-execution-helpers';

// Re-export types that are needed by other modules
export type { RecoveryStrategy } from './error-recovery';
export { type Result } from '../errors/index';
export type { StrategyExecutionParams } from './strategy-execution-helpers';

// Define types here that are needed across modules
export interface RetryIterationParams {
  params: StrategyExecutionParams;
  strategy: RecoveryStrategy;
  currentError: TTSError;
  attempt: number;
  maxRetries: number;
}

export interface RetryIterationResult<T> {
  success: boolean;
  result?: Result<T, BunTtsBaseError>;
  error?: BunTtsBaseError;
  shouldContinue: boolean;
  shouldBreak?: boolean;
  finalError: BunTtsBaseError;
  updatedError?: BunTtsBaseError;
}

export interface ProcessingResult<T> {
  shouldContinue: boolean;
  result?: Result<T, BunTtsBaseError>;
  finalError?: BunTtsBaseError;
  shouldBreak?: boolean;
  updatedError?: BunTtsBaseError;
}

// Constants for error messages
export const UNKNOWN_ERROR_MSG = 'Unknown error';
export const UNKNOWN_ERROR_CODE = 'UNKNOWN_ERROR';
export const VALIDATION_CONTEXT = 'validation';

/**
 * Creates retry range for strategy execution
 * @param {number} start - Start of range
 * @param {number} end - End of range
 * @returns {number[]} Array of retry attempts
 */
export const createRetryRange = (start: number, end: number): number[] => {
  const range: number[] = [];
  for (let i = start; i <= end; i++) {
    range.push(i);
  }
  return range;
};

/**
 * Determines if a strategy should be retried after failure
 * @param {RecoveryStrategy} strategy - The strategy to check
 * @param {BunTtsBaseError} error - The error from the failed strategy attempt
 * @param {{ start: number; end: number }} retryRange - The retry range with start and end numbers
 * @param {number} retryRange.start - The starting number of the retry range
 * @param {number} retryRange.end - The ending number of the retry range
 * @param {number} attempt - Current attempt number
 * @returns {boolean} True if the strategy should be retried
 */
export const shouldRetryStrategy = (
  strategy: RecoveryStrategy,
  error: BunTtsBaseError,
  retryRange: { start: number; end: number },
  attempt: number
): boolean => {
  // If the strategy threw an error (marked with strategyFailed), don't retry it - move to next strategy
  if (error.details?.strategyFailed) {
    return false;
  }

  // Check if we've exceeded max retries
  if (attempt >= retryRange.end) {
    return false;
  }

  return true;
};

/**
 * Creates a success result object
 * @param {Result<T, BunTtsBaseError>} result - The successful result
 * @returns {{ success: boolean; result: Result<T, BunTtsBaseError>; error: BunTtsBaseError }} Success result object
 */
export const createSuccessResult = <T>(
  result: Result<T, BunTtsBaseError>
): {
  success: boolean;
  result: Result<T, BunTtsBaseError>;
  error: BunTtsBaseError;
} => ({
  success: true,
  result,
  error:
    result.error ??
    new BunTtsBaseError(
      `${UNKNOWN_ERROR_MSG} in successful strategy execution`,
      UNKNOWN_ERROR_CODE,
      VALIDATION_CONTEXT
    ),
});

/**
 * Creates a failure result object
 * @param {Result<T, BunTtsBaseError>} result - The failed result
 * @returns {{ success: boolean; result: Result<T, BunTtsBaseError>; error: BunTtsBaseError }} Failure result object
 */
export const createFailureResult = <T>(
  result: Result<T, BunTtsBaseError>
): {
  success: boolean;
  result: Result<T, BunTtsBaseError>;
  error: BunTtsBaseError;
} => ({
  success: false,
  result,
  error:
    result.error ??
    new BunTtsBaseError(
      `${UNKNOWN_ERROR_MSG} in failed strategy execution`,
      UNKNOWN_ERROR_CODE,
      VALIDATION_CONTEXT
    ),
});
