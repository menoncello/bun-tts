/**
 * Strategy Retry Iteration Helpers
 *
 * Helper functions for processing retry iterations in strategy execution.
 * Separated from the main retry execution file to maintain file size limits.
 */

import { TTSError, BunTtsBaseError } from '../errors/index.js';
import type {
  RecoveryStrategy,
  Result,
  StrategyExecutionParams,
  RetryIterationParams,
  RetryIterationResult,
} from './strategy-retry-helpers.js';

/**
 * Creates a successful iteration result
 * @param {Result<T, BunTtsBaseError>} result - Successful result
 * @returns {RetryIterationResult<T>} Iteration result indicating success
 */
export const createSuccessIterationResult = <T>(
  result: Result<T, BunTtsBaseError>
): RetryIterationResult<T> => ({
  success: true,
  result,
  shouldContinue: false,
  shouldBreak: true,
  finalError: new BunTtsBaseError('Success', 'SUCCESS', 'validation', {
    recoverable: false,
  }),
});

/**
 * Creates a failure iteration result
 * @param {BunTtsBaseError} error - Error that occurred
 * @returns {RetryIterationResult<T>} Iteration result indicating failure
 */
export const createFailureIterationResult = <T>(
  error: BunTtsBaseError
): RetryIterationResult<T> => ({
  success: false,
  result: undefined,
  error,
  shouldContinue: true,
  shouldBreak: false,
  finalError: error,
});

/**
 * Determines if retry should continue based on error and attempt
 * @param {BunTtsBaseError} error - Error to check
 * @param {number} attempt - Current attempt number
 * @param {number} maxRetries - Maximum allowed retries
 * @returns {boolean} Whether retry should continue
 */
export const shouldContinueRetry = (
  error: TTSError,
  attempt: number,
  maxRetries: number
): boolean => {
  if (attempt >= maxRetries) {
    return false;
  }

  if (!error.recoverable) {
    return false;
  }

  return true;
};

/**
 * Processes a retry iteration with given parameters
 * @param {RetryIterationParams} iterationParams - Parameters for this iteration
 * @param {BunTtsBaseError} currentError - Current error to handle
 * @returns {Promise<RetryIterationResult<T>>} Result of this iteration
 */
export const processRetryIteration = async <T>(
  iterationParams: RetryIterationParams,
  currentError: BunTtsBaseError
): Promise<RetryIterationResult<T>> => {
  const { params, strategy, attempt, maxRetries } = iterationParams;

  if (!shouldContinueRetry(currentError, attempt, maxRetries)) {
    return createFailureIterationResult(currentError);
  }

  return executeRetryWithHandling(params, strategy, currentError);
};

/**
 * Execute retry iteration with error handling
 * @param {StrategyExecutionParams} params - Strategy execution parameters
 * @param {RecoveryStrategy} strategy - Recovery strategy
 * @param {BunTtsBaseError} currentError - Current error
 * @returns {Promise<RetryIterationResult<T>>} Result of the iteration
 */
async function executeRetryWithHandling<T>(
  params: StrategyExecutionParams,
  strategy: RecoveryStrategy,
  currentError: BunTtsBaseError
): Promise<RetryIterationResult<T>> {
  try {
    const result = await executeRetryIteration<T>(
      params,
      strategy,
      currentError
    );
    return handleRetryExecutionResult(result, currentError);
  } catch (executionError) {
    const error = createExecutionError(executionError);
    return createFailureIterationResult(error);
  }
}

/**
 * Handle the result of retry execution
 * @param {Result<T, BunTtsBaseError>} result - Result from execution
 * @param {BunTtsBaseError} currentError - Current error to fallback on
 * @returns {RetryIterationResult<T>} Formatted iteration result
 */
function handleRetryExecutionResult<T>(
  result: Result<T, BunTtsBaseError>,
  currentError: BunTtsBaseError
): RetryIterationResult<T> {
  if (result.success) {
    return createSuccessIterationResult(result);
  }

  const updatedError = result.error ?? currentError;
  return createFailureIterationResult(updatedError);
}

/**
 * Create an error from execution failure
 * @param {unknown} executionError - The execution error
 * @returns {BunTtsBaseError} Formatted error
 */
function createExecutionError(executionError: unknown): BunTtsBaseError {
  return executionError instanceof BunTtsBaseError
    ? executionError
    : new BunTtsBaseError(
        'Retry execution failed',
        'RETRY_EXECUTION_FAILED',
        'validation',
        {
          details: { originalError: executionError },
        }
      );
}

/**
 * Executes a single retry iteration with the given strategy
 * @param {StrategyExecutionParams} params - Strategy execution parameters
 * @param {RecoveryStrategy} strategy - Recovery strategy to execute
 * @param {BunTtsBaseError} error - Error to recover from
 * @returns {Promise<Result<T, BunTtsBaseError>>} Result of the execution
 */
export const executeRetryIteration = async <T>(
  params: StrategyExecutionParams,
  strategy: RecoveryStrategy,
  error: TTSError
): Promise<Result<T, TTSError>> => {
  const strategyResult = await strategy.recover(
    error,
    params.context.metadata || {}
  );

  if (strategyResult.success) {
    return strategyResult as Result<T, TTSError>;
  }

  // For failed execution, create a new failure result with enhanced error information
  if (!strategyResult.success && strategyResult.error) {
    return {
      success: false,
      error: strategyResult.error as TTSError,
    };
  }

  // Fallback: return the original strategy result as a failure
  return {
    success: false,
    error: error,
  };
};
