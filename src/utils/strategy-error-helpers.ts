import { failure, type Result, BunTtsBaseError } from '../errors/index';
import { debugManager } from './debug';
import type { RecoveryStrategy, RecoveryContext } from './error-recovery';

/**
 * Logs strategy execution failure details
 * @param {unknown} recoveryError - The error thrown by the strategy
 * @param {RecoveryStrategy} strategy - The strategy that failed
 * @param {RecoveryContext} context - The recovery context
 */
export const logStrategyFailure = (
  recoveryError: unknown,
  strategy: RecoveryStrategy,
  context: RecoveryContext
): void => {
  debugManager().warn(`Recovery strategy failed`, {
    strategy: strategy.constructor.name,
    error: String(recoveryError),
    attempt: context.attempt,
  });
};

/**
 * Extracts error message from unknown error type
 * @param {unknown} recoveryError - The error to extract message from
 * @returns {string} Error message string
 */
export const extractStrategyErrorMessage = (recoveryError: unknown): string => {
  return recoveryError instanceof Error
    ? recoveryError.message
    : String(recoveryError);
};

/**
 * Determines the final error message based on strategy error content
 * @param {string} originalMessage - The original error message
 * @param {string} strategyError - The strategy error message
 * @returns {string} The final error message to use
 */
export const determineFinalErrorMessage = (
  originalMessage: string,
  strategyError: string
): string => {
  // If the strategy error contains "threw", it's likely a meaningful error that should be preserved
  if (strategyError.includes('threw')) {
    return strategyError;
  }
  return originalMessage;
};

/**
 * Creates a new error with strategy failure details
 * @param {string} finalMessage - The final error message
 * @param {BunTtsBaseError} originalError - The original error
 * @param {string} strategyError - The strategy error message
 * @param {RecoveryStrategy} strategy - The failed strategy
 * @returns {BunTtsBaseError} New error with strategy failure details
 */
export const createStrategyFailureError = (
  finalMessage: string,
  originalError: BunTtsBaseError,
  strategyError: string,
  strategy: RecoveryStrategy
): BunTtsBaseError => {
  return new BunTtsBaseError(
    finalMessage,
    originalError.code,
    originalError.category,
    {
      recoverable: originalError.recoverable,
      details: {
        ...originalError.details,
        strategyFailed: true,
        originalError: originalError.message,
        strategyError: strategyError,
        strategyName: strategy.constructor.name,
      },
    }
  );
};

/**
 * Handles strategy execution errors
 * @param {unknown} recoveryError - The error thrown by the strategy
 * @param {RecoveryStrategy} strategy - The strategy that failed
 * @param {BunTtsBaseError} originalError - The original error we were trying to recover from
 * @param {RecoveryContext} context - The recovery context
 * @returns {Result<T, BunTtsBaseError>} Failure result
 */
export const handleStrategyExecutionError = <T>(
  recoveryError: unknown,
  strategy: RecoveryStrategy,
  originalError: BunTtsBaseError,
  context: RecoveryContext
): Result<T, BunTtsBaseError> => {
  logStrategyFailure(recoveryError, strategy, context);

  const strategyError = extractStrategyErrorMessage(recoveryError);
  const finalMessage = determineFinalErrorMessage(
    originalError.message,
    strategyError
  );
  const error = createStrategyFailureError(
    finalMessage,
    originalError,
    strategyError,
    strategy
  );

  return failure(error);
};
