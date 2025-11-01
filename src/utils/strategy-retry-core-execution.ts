import { failure, Result, BunTtsBaseError } from '../errors/index';
import type { RecoveryStrategy } from './error-recovery';
import {
  type ApplyStrategyParams,
  type StrategyExecutionParams,
  createStrategyParams,
  applyStrategy,
} from './strategy-execution-helpers';
import {
  createSuccessResult,
  createFailureResult,
} from './strategy-retry-helpers';

/**
 * Attempts a single strategy execution with given parameters
 * @param {ApplyStrategyParams} strategyParams - Parameters for strategy application
 * @returns {Promise<{ success: boolean; result: Result<T, BunTtsBaseError>; error: BunTtsBaseError }>} Single attempt result
 */
export const attemptSingleStrategyExecution = async <T>(
  strategyParams: ApplyStrategyParams
): Promise<{
  success: boolean;
  result: Result<T, BunTtsBaseError>;
  error: BunTtsBaseError;
  shouldBreak: boolean;
}> => {
  const result = await applyStrategy<T>(strategyParams);

  return result.success
    ? {
        ...createSuccessResult(result as Result<T, BunTtsBaseError>),
        shouldBreak: true,
      }
    : {
        ...createFailureResult(result as Result<T, BunTtsBaseError>),
        shouldBreak: false,
      };
};

/**
 * Handles retry attempt with given parameters
 * @param {StrategyExecutionParams} params - Strategy execution parameters
 * @param {RecoveryStrategy} strategy - Recovery strategy to use
 * @param {BunTtsBaseError} currentError - Current error to recover from
 * @param {number} attempt - Current attempt number
 * @returns {Promise<{ success: boolean; result: Result<T, BunTtsBaseError>; error: BunTtsBaseError; shouldBreak: boolean }>} Attempt result
 */
export const handleRetryAttempt = async <T>(
  params: StrategyExecutionParams,
  strategy: RecoveryStrategy,
  currentError: BunTtsBaseError,
  attempt: number
): Promise<{
  success: boolean;
  result: Result<T, BunTtsBaseError>;
  error: BunTtsBaseError;
  shouldBreak: boolean;
}> => {
  const canRecover = checkStrategyCanRecover(strategy, currentError);
  if (!canRecover) {
    return createNonRecoverableResult(currentError);
  }

  const strategyParams = createStrategyParams(
    params,
    strategy,
    currentError,
    attempt
  );
  const attemptResult = await attemptSingleStrategyExecution<T>(strategyParams);

  return formatRetryResult(attemptResult);
};

/**
 * Checks if strategy can recover from the current error
 * @param {RecoveryStrategy} strategy - Recovery strategy to check
 * @param {BunTtsBaseError} currentError - Current error to check
 * @returns {boolean} Whether the strategy can recover from the error
 */
function checkStrategyCanRecover(
  strategy: RecoveryStrategy,
  currentError: BunTtsBaseError
): boolean {
  return strategy.canRecover(currentError);
}

/**
 * Creates a non-recoverable result object
 * @param {BunTtsBaseError} currentError - Current error that cannot be recovered
 * @returns {{success: boolean, result: Result<T, BunTtsBaseError>, error: BunTtsBaseError, shouldBreak: boolean}} Non-recoverable result
 */
function createNonRecoverableResult<T>(currentError: BunTtsBaseError): {
  success: boolean;
  result: Result<T, BunTtsBaseError>;
  error: BunTtsBaseError;
  shouldBreak: boolean;
} {
  return {
    success: false,
    result: failure(currentError),
    error: currentError,
    shouldBreak: true,
  };
}

/**
 * Formats the retry result with proper error handling
 * @param {{success: boolean, result: Result<T, BunTtsBaseError>, error: BunTtsBaseError, shouldBreak: boolean}} attemptResult - Result from strategy attempt
 * @param {boolean} attemptResult.success - Whether the attempt was successful
 * @param {Result<T, BunTtsBaseError>} attemptResult.result - The result from the attempt
 * @param {BunTtsBaseError} attemptResult.error - The error from the attempt
 * @param {boolean} attemptResult.shouldBreak - Whether to break from retry loop
 * @returns {{success: boolean, result: Result<T, BunTtsBaseError>, error: BunTtsBaseError, shouldBreak: boolean}} Formatted retry result
 */
function formatRetryResult<T>(attemptResult: {
  success: boolean;
  result: Result<T, BunTtsBaseError>;
  error: BunTtsBaseError;
  shouldBreak: boolean;
}): {
  success: boolean;
  result: Result<T, BunTtsBaseError>;
  error: BunTtsBaseError;
  shouldBreak: boolean;
} {
  return {
    success: attemptResult.success,
    result: attemptResult.result,
    error:
      attemptResult.result.error ||
      new BunTtsBaseError('Unknown error', 'UNKNOWN_ERROR', 'validation'),
    shouldBreak: attemptResult.success,
  };
}
