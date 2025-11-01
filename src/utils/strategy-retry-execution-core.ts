/**
 * Strategy Retry Execution Core
 *
 * Core retry execution functions with parameter optimization.
 * Separated from the main retry execution file to maintain file size limits.
 */

import { TTSError, BunTtsBaseError } from '../errors/index.js';
import type { Result } from '../errors/result.js';
import {
  type StrategyExecutionParams,
  type RetryIterationParams,
} from './strategy-retry-execution-helpers.js';
import type {
  RecoveryStrategy,
  RetryIterationResult,
} from './strategy-retry-helpers.js';
import {
  createFailureIterationResult,
  shouldContinueRetry,
  executeRetryIteration,
} from './strategy-retry-iteration-helpers.js';

/**
 * Parameters for retry execution
 */
interface RetryExecutionParams {
  params: StrategyExecutionParams;
  strategy: RecoveryStrategy;
  currentError: TTSError;
  attempt: number;
  maxRetries: number;
}

/**
 * Processes a single retry iteration with optimized parameters
 * @param {RetryExecutionParams} retryParams - Combined retry parameters
 * @returns {Promise<RetryIterationResult<T>>} Result of this iteration
 */
export const processRetryIteration = async <T>(
  retryParams: RetryExecutionParams
): Promise<RetryIterationResult<T>> => {
  const { params, strategy, currentError, attempt, maxRetries } = retryParams;

  const iterationParams = createIterationParams({
    params,
    strategy,
    currentError,
    attempt,
    maxRetries,
  });

  const shouldRetry = shouldContinueRetry(
    iterationParams.currentError,
    iterationParams.attempt,
    iterationParams.maxRetries
  );
  if (!shouldRetry) {
    return createFailureIterationResult(currentError);
  }

  return executeRetryWithCatch(iterationParams, currentError);
};

/**
 * Parameters for creating iteration parameters
 */
interface CreateIterationParamsInput {
  params: StrategyExecutionParams;
  strategy: RecoveryStrategy;
  currentError: TTSError;
  attempt: number;
  maxRetries: number;
}

/**
 * Create iteration parameters object
 * @param {CreateIterationParamsInput} input - Parameters object for iteration
 * @param {StrategyExecutionParams} input.params - Strategy execution parameters
 * @param {RecoveryStrategy} input.strategy - Recovery strategy
 * @param {TTSError} input.currentError - Current error
 * @param {number} input.attempt - Current attempt number
 * @param {number} input.maxRetries - Maximum retries
 * @returns {RetryIterationParams} Iteration parameters
 */
function createIterationParams(
  input: CreateIterationParamsInput
): RetryIterationParams {
  const { params, strategy, currentError, attempt, maxRetries } = input;
  return {
    params,
    strategy,
    currentError,
    attempt,
    maxRetries,
  };
}

/**
 * Execute retry with error handling
 * @param {RetryIterationParams} iterationParams - Iteration parameters
 * @param {TTSError} currentError - Current error to fallback on
 * @returns {Promise<RetryIterationResult<T>>} Result of the iteration
 */
async function executeRetryWithCatch<T>(
  iterationParams: RetryIterationParams,
  currentError: TTSError
): Promise<RetryIterationResult<T>> {
  try {
    const result = await executeRetryIteration<T>(
      iterationParams.params,
      iterationParams.strategy,
      iterationParams.currentError
    );

    return handleRetryResult(result, currentError);
  } catch (error) {
    return createFailureIterationResult(
      error instanceof TTSError ? error : currentError
    );
  }
}

/**
 * Handle the result of a retry iteration
 * @param {Result<T, TTSError>} result - Result from retry execution
 * @param {TTSError} currentError - Current error to fallback on
 * @returns {RetryIterationResult<T>} Formatted iteration result
 */
function handleRetryResult<T>(
  result: Result<T, TTSError>,
  currentError: TTSError
): RetryIterationResult<T> {
  if (result.success) {
    return createSuccessIterationResult(result as Result<T, TTSError>);
  }

  return createFailureIterationResult(result.error ?? currentError);
}

/**
 * Create a successful iteration result
 * @param {Result<T, TTSError>} result - Successful result
 * @returns {RetryIterationResult<T>} Success iteration result
 */
function createSuccessIterationResult<T>(
  result: Result<T, TTSError>
): RetryIterationResult<T> {
  return {
    success: true,
    result,
    shouldContinue: false,
    shouldBreak: true,
    finalError: new BunTtsBaseError('Success', 'SUCCESS', 'validation', {
      recoverable: false,
    }),
  };
}

/**
 * Legacy function for backward compatibility
 * @param {StrategyExecutionParams} params - Strategy execution parameters
 * @param {RecoveryStrategy} strategy - Recovery strategy to use
 * @param {BunTtsBaseError} currentError - Current error to recover from
 * @param {number} attempt - Current attempt number
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<RetryIterationResult<T>>} Result of this iteration
 * @deprecated Use processRetryIteration with RetryExecutionParams instead
 */

/**
 * Parameters object for legacy retry iteration
 */
interface LegacyRetryParams {
  params: StrategyExecutionParams;
  strategy: RecoveryStrategy;
  currentError: BunTtsBaseError;
  attempt: number;
  maxRetries: number;
}

/**
 * Legacy function for backward compatibility
 * @param {LegacyRetryParams} retryParams - Combined retry parameters
 * @returns {Promise<RetryIterationResult<T>>} Result of this iteration
 * @deprecated Use processRetryIteration with RetryExecutionParams instead
 */
export const processRetryIterationLegacy = async <T>(
  retryParams: LegacyRetryParams
): Promise<RetryIterationResult<T>> => {
  const { params, strategy, currentError, attempt, maxRetries } = retryParams;

  const newRetryParams: RetryExecutionParams = {
    params,
    strategy,
    currentError,
    attempt,
    maxRetries,
  };

  return processRetryIteration(newRetryParams);
};
