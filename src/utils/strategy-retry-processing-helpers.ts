/**
 * Strategy Retry Processing Helpers
 *
 * Helper functions for processing results in strategy retry execution.
 * Separated from the main retry execution file to maintain file size limits.
 */

import type { BunTtsBaseError } from '../errors/index.js';
import type {
  Result,
  RetryIterationResult,
  ProcessingResult,
} from './strategy-retry-helpers.js';

/**
 * Creates a successful processing result
 * @param {Result<T, BunTtsBaseError>} result - Successful result to wrap
 * @returns {ProcessingResult<T>} Processing result with success
 */
export const createSuccessProcessingResult = <T>(
  result: Result<T, BunTtsBaseError>
): ProcessingResult<T> => ({
  shouldContinue: false,
  shouldBreak: true,
  result,
  updatedError: undefined,
});

/**
 * Creates a stop processing result (final failure)
 * @param {Result<T, BunTtsBaseError>} result - Failure result to wrap
 * @returns {ProcessingResult<T>} Processing result indicating stop
 */
export const createStopProcessingResult = <T>(
  result: Result<T, BunTtsBaseError>
): ProcessingResult<T> => {
  return createSuccessProcessingResult(result);
};

/**
 * Creates a continue processing result
 * @param {BunTtsBaseError} updatedError - Updated error for next iteration
 * @returns {ProcessingResult<T>} Processing result indicating continue
 */
export const createContinueProcessingResult = <T>(
  updatedError: BunTtsBaseError
): ProcessingResult<T> => ({
  shouldContinue: true,
  shouldBreak: false,
  result: undefined,
  updatedError,
});

/**
 * Processes the result of a retry iteration
 * @param {RetryIterationResult<T>} iterationResult - Result from iteration
 * @param {BunTtsBaseError} currentError - Current error state
 * @returns {ProcessingResult<T>} Processing decision
 */
export const processIterationResult = <T>(
  iterationResult: RetryIterationResult<T>,
  currentError: BunTtsBaseError
): ProcessingResult<T> => {
  if (!iterationResult.result) {
    return createContinueProcessingResult(
      iterationResult.updatedError ?? currentError
    );
  }

  if (iterationResult.result.success) {
    return createSuccessProcessingResult(iterationResult.result);
  }

  // Handle failure case - create a proper failure result
  return createContinueProcessingResult(
    iterationResult.result.error ?? currentError
  );
};
