import { BunTtsBaseError, Result } from '../errors/index';
import type { RecoveryStrategy } from './error-recovery';
import { type StrategyExecutionParams } from './strategy-execution-helpers';

/**
 * Configuration constants for retry execution
 */

// Re-export StrategyExecutionParams for convenience
export type { StrategyExecutionParams } from './strategy-execution-helpers';
export const UNKNOWN_ERROR_MSG = 'Unknown error occurred';
export const UNKNOWN_ERROR_CODE = 'UNKNOWN_ERROR';
export const VALIDATION_CONTEXT = 'validation';

/**
 * Retry iteration parameters
 */
export interface RetryIterationParams {
  params: StrategyExecutionParams;
  strategy: RecoveryStrategy;
  currentError: BunTtsBaseError;
  attempt: number;
  maxRetries: number;
}

/**
 * Retry iteration result
 */
export interface RetryIterationResult<T> {
  success: boolean;
  result?: Result<T, BunTtsBaseError>;
  error?: BunTtsBaseError;
  shouldContinue: boolean;
  finalError: BunTtsBaseError;
}

/**
 * Creates a range of numbers for retry attempts
 * @param {number} start - Starting number
 * @param {number} end - Ending number
 * @returns {number[]} Array of numbers from start to end (inclusive)
 */
export const createRetryRange = (start: number, end: number): number[] => {
  const range: number[] = [];
  for (let i = start; i <= end; i++) {
    range.push(i);
  }
  return range;
};

/**
 * Creates a default error for failed attempts
 * @param {Result<T, BunTtsBaseError>} attemptResult - The failed attempt result
 * @returns {BunTtsBaseError} Default error instance
 */
export const createDefaultError = <T>(
  attemptResult: Result<T, BunTtsBaseError>
): BunTtsBaseError => {
  return (
    attemptResult.error ??
    new BunTtsBaseError(
      UNKNOWN_ERROR_MSG,
      UNKNOWN_ERROR_CODE,
      VALIDATION_CONTEXT
    )
  );
};

/**
 * Handles failed strategy execution result
 * @param {Result<T, BunTtsBaseError>} attemptResult - The failed attempt result
 * @returns {{ result: Result<T, BunTtsBaseError>; error: BunTtsBaseError; shouldBreak: boolean }} Failure handling result
 */
export const handleFailedExecution = <T>(
  attemptResult: Result<T, BunTtsBaseError>
): {
  result: Result<T, BunTtsBaseError>;
  error: BunTtsBaseError;
  shouldBreak: boolean;
} => {
  // If the attempt failed but the result itself is successful (unlikely but possible),
  // we should break to avoid infinite loops
  if (attemptResult.success) {
    return {
      result: attemptResult,
      error: createDefaultError(attemptResult),
      shouldBreak: true,
    };
  }

  return {
    result: attemptResult,
    error: createDefaultError(attemptResult),
    shouldBreak: false,
  };
};

/**
 * Creates successful retry result
 * @param {Result<T, BunTtsBaseError>} result - The successful result
 * @param {BunTtsBaseError} finalError - The final error (if any)
 * @returns {{ success: boolean; result: Result<T, BunTtsBaseError>; finalError: BunTtsBaseError }} Success result
 */
export const createSuccessLoopResult = <T>(
  result: Result<T, BunTtsBaseError>,
  finalError: BunTtsBaseError
): {
  success: boolean;
  result: Result<T, BunTtsBaseError>;
  finalError: BunTtsBaseError;
} => ({
  success: true,
  result,
  finalError,
});

/**
 * Creates failure retry result
 * @param {BunTtsBaseError} error - The error that caused the failure
 * @returns {{ success: boolean; result: Result<T, BunTtsBaseError>; finalError: BunTtsBaseError }} Failure result
 */
export const createFailureLoopResult = <T>(
  error: BunTtsBaseError
): {
  success: boolean;
  result: Result<T, BunTtsBaseError>;
  finalError: BunTtsBaseError;
} => ({
  success: false,
  result: { success: false, error } as Result<T, BunTtsBaseError>,
  finalError: error,
});

/**
 * Creates successful iteration execution result
 * @param {Result<T, BunTtsBaseError>} result - The successful result
 * @param {BunTtsBaseError} finalError - The final error
 * @returns {RetryIterationResult<T>} Iteration result
 */
export const createSuccessIterationExecutionResult = <T>(
  result: Result<T, BunTtsBaseError>,
  finalError: BunTtsBaseError
): RetryIterationResult<T> => ({
  success: true,
  result,
  shouldContinue: false,
  finalError,
});

/**
 * Creates failure iteration execution result
 * @param {Result<T, BunTtsBaseError>} result - The failed result
 * @param {BunTtsBaseError} error - The error
 * @param {boolean} shouldContinue - Whether to continue retrying
 * @returns {RetryIterationResult<T>} Iteration result
 */
export const createFailureIterationExecutionResult = <T>(
  result: Result<T, BunTtsBaseError>,
  error: BunTtsBaseError,
  shouldContinue: boolean
): RetryIterationResult<T> => ({
  success: false,
  result,
  shouldContinue,
  finalError: error,
});

/**
 * Creates successful retry result
 * @param {Result<T, BunTtsBaseError>} result - The successful result
 * @returns {{ success: boolean; result: Result<T, BunTtsBaseError>; error: BunTtsBaseError; shouldBreak: boolean }} Success retry result
 */
export const createSuccessRetryResult = <T>(
  result: Result<T, BunTtsBaseError>
): {
  success: boolean;
  result: Result<T, BunTtsBaseError>;
  error: BunTtsBaseError;
  shouldBreak: boolean;
} => ({
  success: true,
  result,
  error:
    result.error ??
    new BunTtsBaseError(
      UNKNOWN_ERROR_MSG,
      UNKNOWN_ERROR_CODE,
      VALIDATION_CONTEXT
    ),
  shouldBreak: true,
});

/**
 * Creates failed retry result with error handling
 * @param {Result<T, BunTtsBaseError>} result - The failed result
 * @returns {{ success: boolean; result: Result<T, BunTtsBaseError>; error: BunTtsBaseError; shouldBreak: boolean }} Failed retry result
 */
export const createFailedRetryResult = <T>(
  result: Result<T, BunTtsBaseError>
): {
  success: boolean;
  result: Result<T, BunTtsBaseError>;
  error: BunTtsBaseError;
  shouldBreak: boolean;
} => ({
  success: false,
  result,
  error:
    result.error ??
    new BunTtsBaseError(
      UNKNOWN_ERROR_MSG,
      UNKNOWN_ERROR_CODE,
      VALIDATION_CONTEXT
    ),
  shouldBreak: false,
});
