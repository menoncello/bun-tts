import { failure, type Result } from '../errors/index.js';
import type { BunTtsError } from '../types/index.js';
import { debugManager } from './debug.js';
import type { RecoveryStrategy, RecoveryContext } from './error-recovery.js';

// Constants for magic numbers
const DEFAULT_MAX_RETRIES = 3;

/**
 * Parameters for operation execution
 */
export interface OperationParams<T> {
  operation: () => Promise<Result<T, BunTtsError>>;
  operationName: string;
  attempt: number;
  maxAttempts: number;
  metadata?: Record<string, unknown>;
}

/**
 * Parameters for strategy execution
 */
export interface StrategyExecutionParams {
  strategies: RecoveryStrategy[];
  error: BunTtsError;
  context: RecoveryContext;
  defaultMaxRetries: number;
  defaultRetryDelay: number;
  delay: (ms: number) => Promise<void>;
}

/**
 * Parameters for applying a single strategy
 */
interface ApplyStrategyParams {
  strategy: RecoveryStrategy;
  error: BunTtsError;
  context: RecoveryContext;
  defaultRetryDelay: number;
  delay: (ms: number) => Promise<void>;
}

/**
 * Handles successful operation execution with logging
 * @param {OperationParams<T>} params - Operation execution parameters
 * @returns {Promise<Result<T, BunTtsError>>} Result of the operation execution
 */
export const handleSuccessfulOperation = async <T>(
  params: OperationParams<T>
): Promise<Result<T, BunTtsError>> => {
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
 * @param {unknown} error - The error that occurred
 * @param {OperationParams<T>} params - Operation execution parameters
 * @param {(error: unknown) => BunTtsError} normalizeError - Function to normalize errors
 * @returns {Result<T, BunTtsError>} Failure result with normalized error
 */
export const handleOperationError = <T>(
  error: unknown,
  params: OperationParams<T>,
  normalizeError: (error: unknown) => BunTtsError
): Result<T, BunTtsError> => {
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
 * @param {BunTtsError} error - The error that occurred
 * @param {Record<string, unknown>} [metadata] - Optional metadata for logging
 */
export const logOperationFailure = (
  operationName: string,
  attempt: number,
  error: BunTtsError,
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
 * Normalizes various error types into a standardized BunTtsError format
 * @param {unknown} error - The error to normalize
 * @returns {BunTtsError} A standardized BunTtsError object
 */
export const normalizeError = (error: unknown): BunTtsError => {
  if (isBunTtsError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return normalizeStandardError(error);
  }

  return normalizeUnknownError(error);
};

/**
 * Normalizes a standard JavaScript Error into BunTtsError format
 * @param {Error} error - The standard Error to normalize
 * @returns {BunTtsError} A normalized BunTtsError
 */
export const normalizeStandardError = (error: Error): BunTtsError => {
  return {
    name: error.name,
    message: error.message,
    code: 'UNKNOWN_ERROR',
    category: 'validation',
    details: {
      originalError: error.constructor.name,
      stack: error.stack,
    },
    recoverable: true,
    stack: error.stack,
  };
};

/**
 * Normalizes an unknown error type into BunTtsError format
 * @param {unknown} error - The unknown error to normalize
 * @returns {BunTtsError} A normalized BunTtsError
 */
export const normalizeUnknownError = (error: unknown): BunTtsError => {
  const errorMessage = String(error);
  return {
    name: 'UnknownError',
    message: errorMessage,
    code: 'UNKNOWN_ERROR',
    category: 'validation' as const,
    details: {
      type: typeof error,
      value: error,
    },
    recoverable: true,
    stack: new Error(errorMessage).stack,
  };
};

/**
 * Type guard to check if an error is a BunTtsError
 * @param {unknown} error - The error to check
 * @returns {boolean} True if the error is a BunTtsError
 */
export const isBunTtsError = (error: unknown): error is BunTtsError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    'message' in error &&
    'code' in error &&
    'category' in error &&
    'recoverable' in error
  );
};

/**
 * Gets all strategies that can handle the given error
 * @param {BunTtsError} error - The error to find strategies for
 * @param {Map<string, RecoveryStrategy[]>} strategies - Map of error type to strategies
 * @returns {RecoveryStrategy[]} Array of recovery strategies
 */
export const getStrategiesForError = (
  error: BunTtsError,
  strategies: Map<string, RecoveryStrategy[]>
): RecoveryStrategy[] => {
  return strategies.get(error.name) || strategies.get(error.category) || [];
};

/**
 * Checks if a strategy can be applied for recovery
 * @param {RecoveryStrategy} strategy - The recovery strategy to check
 * @param {BunTtsError} error - The error to recover from
 * @param {number} attempt - Current attempt number
 * @param {number} defaultMaxRetries - Default maximum retry attempts
 * @returns {boolean} True if the strategy can be applied
 */
const canApplyStrategy = (
  strategy: RecoveryStrategy,
  error: BunTtsError,
  attempt: number,
  defaultMaxRetries: number
): boolean => {
  if (!strategy.canRecover(error)) {
    return false;
  }

  const maxRetries = strategy.maxRetries ?? defaultMaxRetries;
  return attempt <= maxRetries;
};

/**
 * Prepares and applies a recovery strategy with delay and execution
 * @param {ApplyStrategyParams} params - Strategy application parameters
 * @returns {Promise<Result<T, BunTtsError>>} Result of strategy execution
 */
const applyStrategy = async <T>(
  params: ApplyStrategyParams
): Promise<Result<T, BunTtsError>> => {
  const retryDelay = params.strategy.retryDelay ?? params.defaultRetryDelay;

  debugManager().debug(`Applying recovery strategy`, {
    strategy: params.strategy.constructor.name,
    attempt: params.context.attempt,
    maxRetries: params.strategy.maxRetries ?? DEFAULT_MAX_RETRIES,
  });

  if (params.context.attempt > 1) {
    await params.delay(retryDelay * params.context.attempt);
  }

  return executeStrategy<T>(params.strategy, params.error, params.context);
};

/**
 * Attempts recovery using the provided strategies
 * @param {StrategyExecutionParams} params - Strategy execution parameters
 * @returns {Promise<Result<T, BunTtsError>>} Result of strategy recovery attempt
 */
export const tryStrategies = async <T>(
  params: StrategyExecutionParams
): Promise<Result<T, BunTtsError>> => {
  for (const strategy of params.strategies) {
    if (
      !canApplyStrategy(
        strategy,
        params.error,
        params.context.attempt,
        params.defaultMaxRetries
      )
    ) {
      continue;
    }

    const result = await applyStrategy<T>({
      strategy,
      error: params.error,
      context: params.context,
      defaultRetryDelay: params.defaultRetryDelay,
      delay: params.delay,
    });
    if (result.success) {
      return result;
    }
  }

  return failure(params.error);
};

/**
 * Executes a single recovery strategy
 * @param {RecoveryStrategy} strategy - The strategy to execute
 * @param {BunTtsError} error - The error to recover from
 * @param {RecoveryContext} context - Recovery context
 * @returns {Promise<Result<T, BunTtsError>>} Result of strategy execution
 */
export const executeStrategy = async <T>(
  strategy: RecoveryStrategy,
  error: BunTtsError,
  context: RecoveryContext
): Promise<Result<T, BunTtsError>> => {
  try {
    const result = await strategy.recover(error, context.metadata);
    if (result.success) {
      debugManager().info(`Recovery successful`, {
        operation: context.operation,
        attempt: context.attempt,
      });
      return result as Result<T, BunTtsError>;
    }
  } catch (recoveryError) {
    debugManager().warn(`Recovery strategy failed`, {
      strategy: strategy.constructor.name,
      error: String(recoveryError),
      attempt: context.attempt,
    });
  }

  return failure(error);
};

/**
 * Attempts recovery using the provided fallback function
 * @param {(() => Promise<Result<T, BunTtsError>>) | undefined} fallback - Optional fallback recovery function
 * @param {RecoveryContext} context - Recovery context
 * @param {BunTtsError} error - The original error
 * @returns {Promise<Result<T, BunTtsError>>} Result of fallback recovery attempt
 */
export const tryFallbackRecovery = async <T>(
  fallback: (() => Promise<Result<T, BunTtsError>>) | undefined,
  context: RecoveryContext,
  error: BunTtsError
): Promise<Result<T, BunTtsError>> => {
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
 * @param {BunTtsError} error - The error that failed to recover
 * @param {RecoveryContext} context - Recovery context
 * @returns {Result<T, BunTtsError>} Failure result
 */
export const logRecoveryFailure = <T>(
  error: BunTtsError,
  context: RecoveryContext
): Result<T, BunTtsError> => {
  debugManager().error(`Recovery failed for ${error.name}`, {
    errorCode: error.code,
    attempts: context.attempt,
    operation: context.operation,
  });

  return failure(error);
};

/**
 * Creates the final failure result when all attempts are exhausted
 * @param {BunTtsError | null} lastError - The last error that occurred
 * @param {(error: unknown) => BunTtsError} normalizeError - Function to normalize errors
 * @returns {Result<T, BunTtsError>} Final failure result
 */
export const createFinalFailureResult = <T>(
  lastError: BunTtsError | null,
  normalizeError: (error: unknown) => BunTtsError
): Result<T, BunTtsError> => {
  const finalError =
    lastError ||
    normalizeError(new Error('Unknown error occurred during recovery'));
  return failure(finalError);
};

// Re-export RecoveryContext for backward compatibility
export type { RecoveryContext } from './error-recovery.js';
