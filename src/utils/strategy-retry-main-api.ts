import { BunTtsBaseError, type Result } from '../errors/index';
import type { RecoveryStrategy } from './error-recovery';
import type { StrategyExecutionParams } from './strategy-execution-helpers';
import { handleRetryAttempt } from './strategy-retry-core-execution';
import { createRetryRange } from './strategy-retry-helpers';
import {
  createSuccessIterationResult,
  createFailureIterationResult,
  shouldContinueRetry,
} from './strategy-retry-iteration-results';

/**
 * Attempts strategy execution with retries
 * @param {StrategyExecutionParams} params - Strategy execution parameters
 * @param {RecoveryStrategy} strategy - The strategy to attempt
 * @param {BunTtsBaseError} currentError - The current error to recover from
 * @returns {Promise<{ success: boolean; result: Result<T, BunTtsBaseError>; finalError: BunTtsBaseError }>} Attempt result
 */
export const attemptStrategyWithRetries = async <T>(
  params: StrategyExecutionParams,
  strategy: RecoveryStrategy,
  currentError: BunTtsBaseError
): Promise<{
  success: boolean;
  result: Result<T, BunTtsBaseError>;
  finalError: BunTtsBaseError;
}> =>
  executeRetryLoop<T>(
    params,
    strategy,
    currentError,
    strategy.maxRetries ?? params.defaultMaxRetries
  );

/**
 * Executes retry loop for strategy with given parameters
 * @param {StrategyExecutionParams} params - Strategy execution parameters
 * @param {RecoveryStrategy} strategy - Recovery strategy to use
 * @param {BunTtsBaseError} currentError - Current error to recover from
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<{ success: boolean; result: Result<T, BunTtsBaseError>; finalError: BunTtsBaseError }>} Retry loop result
 */
const executeRetryLoop = async <T>(
  params: StrategyExecutionParams,
  strategy: RecoveryStrategy,
  currentError: BunTtsBaseError,
  maxRetries: number
): Promise<{
  success: boolean;
  result: Result<T, BunTtsBaseError>;
  finalError: BunTtsBaseError;
}> => {
  const retryResult = await executeRetryAttempts<T>(
    params,
    strategy,
    currentError,
    maxRetries
  );
  return (
    retryResult ?? {
      success: false,
      result: { success: false, error: currentError },
      finalError: currentError,
    }
  );
};

/**
 * Executes retry attempts for strategy
 * @param {StrategyExecutionParams} params - Strategy execution parameters
 * @param {RecoveryStrategy} strategy - Recovery strategy to use
 * @param {BunTtsBaseError} currentError - Current error to recover from
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<{ success: boolean; result: Result<T, BunTtsBaseError>; finalError: BunTtsBaseError } | null>} Retry result or null if should continue
 */
const executeRetryAttempts = async <T>(
  params: StrategyExecutionParams,
  strategy: RecoveryStrategy,
  currentError: BunTtsBaseError,
  maxRetries: number
): Promise<{
  success: boolean;
  result: Result<T, BunTtsBaseError>;
  finalError: BunTtsBaseError;
} | null> => {
  return processRetryLoop<T>(params, strategy, currentError, maxRetries);
};

/**
 * Processes the retry loop for strategy execution
 * @param {StrategyExecutionParams} params - Strategy execution parameters
 * @param {RecoveryStrategy} strategy - Recovery strategy to use
 * @param {BunTtsBaseError} currentError - Current error to recover from
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<{ success: boolean; result: Result<T, BunTtsBaseError>; finalError: BunTtsBaseError } | null>} Retry result or null if should continue
 */
async function processRetryLoop<T>(
  params: StrategyExecutionParams,
  strategy: RecoveryStrategy,
  currentError: BunTtsBaseError,
  maxRetries: number
): Promise<{
  success: boolean;
  result: Result<T, BunTtsBaseError>;
  finalError: BunTtsBaseError;
} | null> {
  let latestError = currentError;

  for (const attempt of createRetryRange(1, maxRetries)) {
    const iterationResult = await processRetryIterationSafe<T>({
      params,
      strategy,
      latestError,
      currentError: latestError,
      attempt,
      maxRetries,
    });

    if (iterationResult.shouldStop) {
      return iterationResult.result ?? null;
    }

    if (iterationResult.latestError) {
      latestError = iterationResult.latestError;
    }
  }

  return null;
}

/**
 * Parameters for retry iteration processing
 */
interface RetryIterationParams {
  params: StrategyExecutionParams;
  strategy: RecoveryStrategy;
  latestError: BunTtsBaseError;
  currentError: BunTtsBaseError;
  attempt: number;
  maxRetries: number;
}

/**
 * Processes a single retry iteration safely
 * @param {RetryIterationParams} iterationParams - All parameters for retry iteration
 * @returns {Promise<{ shouldStop: boolean; result?: any; latestError: BunTtsBaseError }>} Iteration result
 */
async function processRetryIterationSafe<T>(
  iterationParams: RetryIterationParams
): Promise<{
  shouldStop: boolean;
  result?: {
    success: boolean;
    result: Result<T, BunTtsBaseError>;
    finalError: BunTtsBaseError;
  };
  latestError?: BunTtsBaseError;
}> {
  const iterationResult = await processRetryIteration<T>({
    params: iterationParams.params,
    strategy: iterationParams.strategy,
    latestError: iterationParams.latestError,
    currentError: iterationParams.currentError,
    attempt: iterationParams.attempt,
    maxRetries: iterationParams.maxRetries,
  });

  const shouldBreak = handleIterationResult(iterationResult);
  if (shouldBreak.shouldStop) {
    if (!shouldBreak.result) {
      throw new Error('Expected result to be defined when shouldStop is true');
    }
    return { shouldStop: true, result: shouldBreak.result };
  }

  return { shouldStop: false, latestError: iterationResult.error };
}

/**
 * Processes retry iteration with given parameters
 * @param {RetryIterationParams} retryParams - Retry attempt parameters
 * @returns {Promise<{ success: boolean; result: Result<T, BunTtsBaseError>; error: BunTtsBaseError; shouldContinue: boolean }>} Iteration result
 */
async function processRetryIteration<T>(
  retryParams: RetryIterationParams
): Promise<{
  success: boolean;
  result: Result<T, BunTtsBaseError>;
  error: BunTtsBaseError;
  shouldContinue: boolean;
}> {
  const { params, strategy, currentError, attempt, maxRetries } = retryParams;

  const attemptResult = await handleRetryAttempt<T>(
    params,
    strategy,
    currentError,
    attempt
  );

  if (attemptResult.success) {
    return createSuccessIterationResult(
      attemptResult.result,
      attemptResult.error
    );
  }

  const shouldContinue = shouldContinueRetry(
    strategy,
    attemptResult.error,
    attempt,
    maxRetries
  );

  return createFailureIterationResult(attemptResult.error, shouldContinue);
}

/**
 * Handle the result of a retry iteration
 * @param {{ success: boolean; result: Result<T, BunTtsBaseError>; error: BunTtsBaseError; shouldContinue: boolean }} iterationResult - Result from iteration
 * @param {boolean} iterationResult.success - Whether the iteration was successful
 * @param {Result<T, BunTtsBaseError>} iterationResult.result - The result from the iteration
 * @param {BunTtsBaseError} iterationResult.error - The error from the iteration
 * @param {boolean} iterationResult.shouldContinue - Whether to continue with more iterations
 * @returns {{ shouldStop: boolean; result?: { success: boolean; result: Result<T, BunTtsBaseError>; finalError: BunTtsBaseError } }} Whether to stop and optional result
 */
function handleIterationResult<T>(iterationResult: {
  success: boolean;
  result: Result<T, BunTtsBaseError>;
  error: BunTtsBaseError;
  shouldContinue: boolean;
}): {
  shouldStop: boolean;
  result?: {
    success: boolean;
    result: Result<T, BunTtsBaseError>;
    finalError: BunTtsBaseError;
  };
} {
  if (!iterationResult.shouldContinue) {
    return {
      shouldStop: true,
      result: {
        success: false,
        result: iterationResult.result,
        finalError: iterationResult.error,
      },
    };
  }

  return { shouldStop: false };
}
