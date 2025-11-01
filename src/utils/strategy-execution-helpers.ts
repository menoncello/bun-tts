import { BunTtsBaseError, type Result } from '../errors/index';
import { debugManager } from './debug';
import type { RecoveryStrategy, RecoveryContext } from './error-recovery';
import { handleStrategyExecutionError } from './strategy-error-helpers';

// Constants for magic numbers
const DEFAULT_MAX_RETRIES = 3;

/**
 * Parameters for applying a single strategy
 */
export interface ApplyStrategyParams {
  strategy: RecoveryStrategy;
  error: BunTtsBaseError;
  context: RecoveryContext;
  defaultRetryDelay: number;
  delay: (ms: number) => Promise<void>;
}

/**
 * Parameters for strategy execution
 */
export interface StrategyExecutionParams {
  strategies: RecoveryStrategy[];
  error: BunTtsBaseError;
  context: RecoveryContext;
  defaultMaxRetries: number;
  defaultRetryDelay: number;
  delay: (ms: number) => Promise<void>;
}

/**
 * Creates strategy application parameters for a specific attempt
 * @param {StrategyExecutionParams} params - Base parameters
 * @param {RecoveryStrategy} strategy - The strategy to apply
 * @param {BunTtsBaseError} error - The error to recover from
 * @param {number} attempt - The attempt number
 * @returns {ApplyStrategyParams} Strategy application parameters
 */
export const createStrategyParams = (
  params: StrategyExecutionParams,
  strategy: RecoveryStrategy,
  error: BunTtsBaseError,
  attempt: number
): ApplyStrategyParams => ({
  strategy,
  error,
  context: { ...params.context, attempt },
  defaultRetryDelay: params.defaultRetryDelay,
  delay: params.delay,
});

/**
 * Executes the strategy and handles the result
 * @param {ApplyStrategyParams} params - Parameters for applying the strategy
 * @returns {Promise<Result<T, BunTtsBaseError>>} Result of strategy execution
 */
export const executeStrategyWithHandling = async <T>(
  params: ApplyStrategyParams
): Promise<Result<T, BunTtsBaseError>> => {
  try {
    const result = await params.strategy.recover(
      params.error,
      params.context.metadata
    );

    if (result.success) {
      debugManager().info(`Recovery successful`, {
        operation: params.context.operation,
        attempt: params.context.attempt,
      });
      return result as Result<T, BunTtsBaseError>;
    }

    // Strategy failed but didn't throw - return the strategy's error
    return result as Result<T, BunTtsBaseError>;
  } catch (recoveryError) {
    return handleStrategyExecutionError<T>(
      recoveryError,
      params.strategy,
      params.error,
      params.context
    );
  }
};

/**
 * Prepares and applies a recovery strategy with delay and execution
 * @param {ApplyStrategyParams} params - Parameters for applying the strategy
 * @returns {Promise<Result<T, BunTtsBaseError>>} Result of strategy execution
 */
export const applyStrategy = async <T>(
  params: ApplyStrategyParams
): Promise<Result<T, BunTtsBaseError>> => {
  const retryDelay = params.strategy.retryDelay ?? params.defaultRetryDelay;

  debugManager().debug(`Applying recovery strategy`, {
    strategy: params.strategy.constructor.name,
    attempt: params.context.attempt,
    maxRetries: params.strategy.maxRetries ?? DEFAULT_MAX_RETRIES,
  });

  if (params.context.attempt > 1) {
    await params.delay(retryDelay * params.context.attempt);
  }

  return executeStrategyWithHandling<T>(params);
};
