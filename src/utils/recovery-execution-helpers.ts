import { failure, type Result, BunTtsBaseError } from '../errors/index';
import { debugManager } from './debug';
import type { RecoveryStrategy, RecoveryContext } from './error-recovery';

/**
 * Parameters for operation execution
 */
export interface OperationParams<T> {
  operation: () => Promise<Result<T, BunTtsBaseError>>;
  operationName: string;
  attempt: number;
  maxAttempts: number;
  metadata?: Record<string, unknown>;
}

/**
 * Handles successful operation execution with logging
 * @param {OperationParams<T>} params - Parameters for the operation execution
 * @returns {Promise<Result<T, BunTtsBaseError>>} Result of the operation execution
 */
export const handleSuccessfulOperation = async <T>(
  params: OperationParams<T>
): Promise<Result<T, BunTtsBaseError>> => {
  debugManager().debug(`Executing operation: ${params.operationName}`, {
    attempt: params.attempt,
    maxAttempts: params.maxAttempts,
    metadata: params.metadata,
  });

  const result = await params.operation();

  if (result.success) {
    debugManager().info(`Operation succeeded: ${params.operationName}`, {
      attempt: params.attempt,
      metadata: params.metadata,
    });
    return result;
  }

  logOperationFailure(
    params.operationName,
    params.attempt,
    result.error,
    params.metadata
  );
  return result;
};

/**
 * Handles operation execution errors with logging
 * @param {unknown} error - The error that occurred during operation execution
 * @param {OperationParams<T>} params - Parameters for the operation that failed
 * @param {(error: unknown) => BunTtsBaseError} normalizeError - Function to normalize errors
 * @returns {Result<T, BunTtsBaseError>} Failure result with normalized error
 */
export const handleOperationError = <T>(
  error: unknown,
  params: OperationParams<T>,
  normalizeError: (error: unknown) => BunTtsBaseError
): Result<T, BunTtsBaseError> => {
  const normalizedError = normalizeError(error);
  debugManager().error(
    `Unexpected error in operation: ${params.operationName}`,
    {
      attempt: params.attempt,
      error: normalizedError.message,
      metadata: params.metadata,
    }
  );

  return failure(normalizedError);
};

/**
 * Logs operation failure details
 * @param {string} operationName - Name of the operation
 * @param {number} attempt - Current attempt number
 * @param {BunTtsBaseError} error - The error that occurred
 * @param {Record<string, unknown>} metadata - Additional metadata about the operation
 */
export const logOperationFailure = (
  operationName: string,
  attempt: number,
  error: BunTtsBaseError,
  metadata?: Record<string, unknown>
): void => {
  debugManager().warn(`Operation failed: ${operationName}`, {
    attempt,
    error: error.message,
    errorCode: error.code,
    metadata,
  });
};

/**
 * Handles recovery strategy execution errors
 * @param {unknown} recoveryError - The error thrown by the strategy
 * @param {RecoveryStrategy} strategy - The strategy that failed
 * @param {BunTtsBaseError} originalError - The original error we were trying to recover from
 * @param {RecoveryContext} context - The recovery context
 * @returns {Result<T, BunTtsBaseError>} Failure result
 */
const handleStrategyError = <T>(
  recoveryError: unknown,
  strategy: RecoveryStrategy,
  originalError: BunTtsBaseError,
  context: RecoveryContext
): Result<T, BunTtsBaseError> => {
  debugManager().warn(`Recovery strategy failed`, {
    strategy: strategy.constructor.name,
    error: String(recoveryError),
    attempt: context.attempt,
  });

  // If the strategy threw an error, preserve that error message
  if (recoveryError instanceof Error) {
    return failure(
      new BunTtsBaseError(
        recoveryError.message,
        originalError.code,
        originalError.category,
        {
          recoverable: originalError.recoverable,
          details: originalError.details,
        }
      )
    );
  }

  return failure(originalError);
};

/**
 * Executes a single recovery strategy
 * @param {RecoveryStrategy} strategy - The strategy to execute
 * @param {BunTtsBaseError} error - The error to recover from
 * @param {RecoveryContext} context - The recovery context
 * @returns {Promise<Result<T, BunTtsBaseError>>} Result of strategy execution
 */
export const executeStrategy = async <T>(
  strategy: RecoveryStrategy,
  error: BunTtsBaseError,
  context: RecoveryContext
): Promise<Result<T, BunTtsBaseError>> => {
  try {
    const result = await strategy.recover(error, context.metadata);

    if (result.success) {
      debugManager().info(`Recovery successful`, {
        operation: context.operation,
        attempt: context.attempt,
      });
      return result as Result<T, BunTtsBaseError>;
    }

    // Strategy failed but didn't throw - return the strategy's error
    return result as Result<T, BunTtsBaseError>;
  } catch (recoveryError) {
    return handleStrategyError<T>(recoveryError, strategy, error, context);
  }
};

/**
 * Attempts recovery using the provided fallback function
 * @param {(() => Promise<Result<T, BunTtsBaseError>>) | undefined} fallback - Optional fallback recovery function
 * @param {RecoveryContext} context - The recovery context
 * @param {BunTtsBaseError} error - The error to recover from
 * @returns {Promise<Result<T, BunTtsBaseError>>} Result of fallback recovery attempt
 */
export const tryFallbackRecovery = async <T>(
  fallback: (() => Promise<Result<T, BunTtsBaseError>>) | undefined,
  context: RecoveryContext,
  error: BunTtsBaseError
): Promise<Result<T, BunTtsBaseError>> => {
  if (!fallback || context.attempt >= context.maxAttempts) {
    return failure(error);
  }

  debugManager().debug(`Trying fallback recovery`, {
    operation: context.operation,
    attempt: context.attempt,
  });

  try {
    return await fallback();
  } catch (fallbackError) {
    debugManager().warn(`Fallback recovery failed`, {
      error: String(fallbackError),
      attempt: context.attempt,
    });
    return failure(error);
  }
};

/**
 * Logs recovery failure and returns failure result
 * @param {BunTtsBaseError} error - The error that failed to recover
 * @param {RecoveryContext} context - The recovery context
 * @returns {Result<T, BunTtsBaseError>} Failure result
 */
export const logRecoveryFailure = <T>(
  error: BunTtsBaseError,
  context: RecoveryContext
): Result<T, BunTtsBaseError> => {
  debugManager().error(`Recovery failed for ${error.name}`, {
    errorCode: error.code,
    attempts: context.attempt,
    operation: context.operation,
  });

  return failure(error);
};

/**
 * Creates the final failure result when all attempts are exhausted
 * @param {BunTtsBaseError | null} lastError - The last error that occurred
 * @param {(error: unknown) => BunTtsBaseError} normalizeError - Function to normalize errors
 * @returns {Result<T, BunTtsBaseError>} Final failure result
 */
export const createFinalFailureResult = <T>(
  lastError: BunTtsBaseError | null,
  normalizeError: (error: unknown) => BunTtsBaseError
): Result<T, BunTtsBaseError> => {
  const finalError =
    lastError ||
    normalizeError(new Error('Unknown error occurred during recovery'));
  return failure(finalError);
};
