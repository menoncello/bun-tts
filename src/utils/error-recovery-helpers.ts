import { failure, type Result } from '../errors/index.js';
import type { BunTtsError } from '../types/index.js';
import { debugManager } from './debug.js';
import type { RecoveryStrategy, RecoveryContext } from './error-recovery.js';

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
 * Handles successful operation execution with logging
 * @param params - Operation execution parameters
 * @returns Result of the operation execution
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

  logOperationFailure(params.operationName, params.attempt, result.error, params.metadata);
  return result;
};

/**
 * Handles operation execution errors with logging
 * @param error - The error that occurred
 * @param params - Operation execution parameters
 * @param normalizeError - Function to normalize errors
 * @returns Failure result with normalized error
 */
export const handleOperationError = <T>(
  error: unknown,
  params: OperationParams<T>,
  normalizeError: (error: unknown) => BunTtsError
): Result<T, BunTtsError> => {
  const normalizedError = normalizeError(error);
  debugManager().error(`Unexpected error in operation: ${params.operationName}`, {
    attempt: params.attempt,
    error: normalizedError.message,
    metadata: params.metadata,
  });

  return failure(normalizedError);
};

/**
 * Logs operation failure details
 * @param operationName - Name of the operation
 * @param attempt - Current attempt number
 * @param error - The error that occurred
 * @param metadata - Optional metadata for logging
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
 * @param error - The error to normalize
 * @returns A standardized BunTtsError object
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
 * @param error - The standard Error to normalize
 * @returns A normalized BunTtsError
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
 * @param error - The unknown error to normalize
 * @returns A normalized BunTtsError
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
 * @param error - The error to check
 * @returns True if the error is a BunTtsError
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
 * @param error - The error to find strategies for
 * @param strategies - Map of error type to strategies
 * @returns Array of recovery strategies
 */
export const getStrategiesForError = (
  error: BunTtsError,
  strategies: Map<string, RecoveryStrategy[]>
): RecoveryStrategy[] => {
  return (
    strategies.get(error.name) ||
    strategies.get(error.category) ||
    []
  );
};

/**
 * Attempts recovery using the provided strategies
 * @param params - Strategy execution parameters
 * @returns Result of strategy recovery attempt
 */
export const tryStrategies = async <T>(
  params: StrategyExecutionParams
): Promise<Result<T, BunTtsError>> => {
  for (const strategy of params.strategies) {
    if (!strategy.canRecover(params.error)) {
      continue;
    }

    const maxRetries = strategy.maxRetries ?? params.defaultMaxRetries;
    const retryDelay = strategy.retryDelay ?? params.defaultRetryDelay;

    if (params.context.attempt > maxRetries) {
      continue;
    }

    debugManager().debug(`Applying recovery strategy`, {
      strategy: strategy.constructor.name,
      attempt: params.context.attempt,
      maxRetries,
    });

    if (params.context.attempt > 1) {
      await params.delay(retryDelay * params.context.attempt);
    }

    const result = await executeStrategy<T>(strategy, params.error, params.context);
    if (result.success) {
      return result;
    }
  }

  return failure(params.error);
};

/**
 * Executes a single recovery strategy
 * @param strategy - The strategy to execute
 * @param error - The error to recover from
 * @param context - Recovery context
 * @returns Result of strategy execution
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
 * @param fallback - Optional fallback recovery function
 * @param context - Recovery context
 * @param error - The original error
 * @returns Result of fallback recovery attempt
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
 * @param error - The error that failed to recover
 * @param context - Recovery context
 * @returns Failure result
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
 * @param lastError - The last error that occurred
 * @param normalizeError - Function to normalize errors
 * @returns Final failure result
 */
export const createFinalFailureResult = <T>(
  lastError: BunTtsError | null,
  normalizeError: (error: unknown) => BunTtsError
): Result<T, BunTtsError> => {
  const finalError = lastError || normalizeError(new Error('Unknown error occurred during recovery'));
  return failure(finalError);
};

// Re-export RecoveryContext for backward compatibility
export type { RecoveryContext } from './error-recovery.js';