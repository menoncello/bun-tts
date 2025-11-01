import { failure, type Result, BunTtsBaseError } from '../errors/index';
import type { RecoveryStrategy } from './error-recovery';
import { type StrategyExecutionParams } from './strategy-execution-helpers';
import { attemptStrategyWithRetries } from './strategy-retry-execution';

// Re-export StrategyExecutionParams for external use
export type { StrategyExecutionParams } from './strategy-execution-helpers';

/**
 * Checks if strategies array is valid and has elements
 * @param {RecoveryStrategy[] | undefined} strategies - Strategies array to check
 * @returns {boolean} True if strategies are valid and have elements
 */
const _hasValidStrategies = (
  strategies: RecoveryStrategy[] | undefined
): boolean => {
  return strategies !== undefined && strategies.length > 0;
};

/**
 * Gets strategy keys for error matching in priority order
 * @param {BunTtsBaseError} error - The error to get keys for
 * @returns {string[]} Array of strategy keys
 */
const getStrategyKeys = (error: BunTtsBaseError): string[] => [
  error.name, // Exact name match
  error.code, // Error code match
  error.category, // Category match
  'Error', // Generic error type
];

/**
 * Tries to find strategies by iterating through strategy keys
 * @param {string[]} strategyKeys - Keys to try in order
 * @param {Map<string, RecoveryStrategy[]>} strategies - Map of error type to strategies
 * @returns {RecoveryStrategy[] | null} Found strategies or null
 */
const tryStrategyKeys = (
  strategyKeys: string[],
  strategies: Map<string, RecoveryStrategy[]>
): RecoveryStrategy[] | null => {
  for (const key of strategyKeys) {
    const foundStrategies = strategies.get(key);
    if (_hasValidStrategies(foundStrategies)) {
      return foundStrategies || null;
    }
  }

  return null;
};

/**
 * Tries fallback strategy for unknown error types
 * @param {BunTtsBaseError} error - The error to get fallback strategy for
 * @param {Map<string, RecoveryStrategy[]>} strategies - Map of error type to strategies
 * @returns {RecoveryStrategy[] | null} Found fallback strategies or null
 */
const tryFallbackStrategy = (
  error: BunTtsBaseError,
  strategies: Map<string, RecoveryStrategy[]>
): RecoveryStrategy[] | null => {
  // First try the error's category if it exists
  if (error.category) {
    const categoryStrategies = strategies.get(error.category);
    if (_hasValidStrategies(categoryStrategies)) {
      return categoryStrategies || null;
    }
  }

  // Then try generic 'Error' strategies
  const errorStrategies = strategies.get('Error');
  if (_hasValidStrategies(errorStrategies)) {
    return errorStrategies || null;
  }

  // Finally try wildcard strategies
  const wildcardStrategies = strategies.get('*');
  if (_hasValidStrategies(wildcardStrategies)) {
    return wildcardStrategies || null;
  }

  return null;
};

/**
 * Gets recovery strategies for a given error
 * @param {BunTtsBaseError} error - The error to get strategies for
 * @param {Map<string, RecoveryStrategy[]>} strategies - Map of error type to strategies
 * @returns {RecoveryStrategy[]} Array of applicable strategies
 */
export const getStrategiesForError = (
  error: BunTtsBaseError,
  strategies: Map<string, RecoveryStrategy[]>
): RecoveryStrategy[] => {
  const strategyKeys = getStrategyKeys(error);

  const foundStrategies = tryStrategyKeys(strategyKeys, strategies);
  if (foundStrategies) {
    return foundStrategies;
  }

  const fallbackStrategies = tryFallbackStrategy(error, strategies);
  if (fallbackStrategies) {
    return fallbackStrategies;
  }

  return [];
};

/**
 * Attempts recovery using the provided strategies
 * @param {StrategyExecutionParams} params - Parameters for strategy execution
 * @returns {Promise<Result<T, BunTtsBaseError>>} Result of strategy recovery attempt
 */
export const tryStrategies = async <T>(
  params: StrategyExecutionParams
): Promise<Result<T, BunTtsBaseError>> => {
  let lastError = params.error;

  for (const strategy of params.strategies) {
    const attemptResult = await attemptStrategyWithRetries<T>(
      params,
      strategy,
      lastError
    );

    if (attemptResult.success) {
      return attemptResult.result;
    }

    // Update lastError with the final error from this strategy attempt
    lastError = attemptResult.finalError;

    // If we've exhausted retries for this strategy, continue to the next strategy
  }

  return failure(lastError);
};
