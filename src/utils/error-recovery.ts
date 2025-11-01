import type { Result, BunTtsBaseError } from '../errors/index.js';
import type { BunTtsError } from '../types/index.js';
import { debugManager } from './debug.js';
import {
  OperationParams,
  handleSuccessfulOperation,
  handleOperationError,
  normalizeError,
  getStrategiesForError,
  tryStrategies,
  tryFallbackRecovery,
  logRecoveryFailure,
  createFinalFailureResult,
} from './error-recovery-helpers.js';
import {
  ConfigurationRecoveryStrategy,
  FileSystemRecoveryStrategy,
  NetworkRecoveryStrategy,
} from './recovery-strategies.js';

/** Default maximum number of retry attempts for recovery strategies */
const DEFAULT_MAX_RETRIES = 3;

/** Default delay between retry attempts in milliseconds */
const DEFAULT_RETRY_DELAY = 1000;

export interface RecoveryStrategy {
  canRecover: (error: BunTtsError | BunTtsBaseError) => boolean;
  recover: (
    error: BunTtsError | BunTtsBaseError,
    context?: Record<string, unknown>
  ) => Promise<Result<unknown, BunTtsError | BunTtsBaseError>>;
  maxRetries?: number;
  retryDelay?: number;
}

export interface RecoveryContext {
  operation: string;
  attempt: number;
  maxAttempts: number;
  metadata?: Record<string, unknown>;
}

/**
 * Manages error recovery strategies and attempts to recover from various types of errors
 * that occur during TTS (Text-to-Speech) operations. Provides a singleton pattern for
 * centralized error recovery management across the application.
 */
export class ErrorRecoveryManager {
  private static instance: ErrorRecoveryManager | null = null;
  private strategies: Map<string, RecoveryStrategy[]> = new Map();

  /**
   * Private constructor to enforce singleton pattern
   * Initializes the recovery manager with an empty strategy map
   */
  private constructor() {
    // Intentionally empty - singleton pattern
  }

  /**
   * Gets the singleton instance of the ErrorRecoveryManager
   * @returns {any} The singleton instance of ErrorRecoveryManager
   */
  public static getInstance(): ErrorRecoveryManager {
    if (!ErrorRecoveryManager.instance) {
      ErrorRecoveryManager.instance = new ErrorRecoveryManager();
    }
    return ErrorRecoveryManager.instance;
  }

  /**
   * Resets the singleton instance for testing purposes
   * This method should only be used in test scenarios
   */
  public static resetInstance(): void {
    ErrorRecoveryManager.instance = null;
  }

  /**
   * Registers a recovery strategy for a specific error type
   * @param {string} errorType - The type of error this strategy can handle
   * @param {RecoveryStrategy} strategy - The recovery strategy to register
   */
  public registerStrategy(errorType: string, strategy: RecoveryStrategy): void {
    if (!this.strategies.has(errorType)) {
      this.strategies.set(errorType, []);
    }
    const strategies = this.strategies.get(errorType);
    if (strategies) {
      strategies.push(strategy);
    }
  }

  /**
   * Logs recovery attempt information
   * @param {BunTtsError} error - The error to recover from
   * @param {RecoveryContext} context - Recovery context containing attempt information
   */
  private logRecoveryAttempt(
    error: BunTtsError,
    context: RecoveryContext
  ): void {
    debugManager().debug(`Attempting recovery for ${error.name}`, {
      errorCode: error.code,
      category: error.category,
      attempt: context.attempt,
      operation: context.operation,
    });
  }

  /**
   * Attempts recovery using registered strategies
   * @param {BunTtsError} error - The error to recover from
   * @param {RecoveryContext} context - Recovery context containing attempt information
   * @returns {Promise<Result<T, BunTtsError>>} Result of strategy recovery attempt
   */
  private async attemptStrategyRecovery<T>(
    error: BunTtsError,
    context: RecoveryContext
  ): Promise<Result<T, BunTtsError>> {
    const strategies = getStrategiesForError(error, this.strategies);
    return tryStrategies<T>({
      strategies,
      error,
      context,
      defaultMaxRetries: DEFAULT_MAX_RETRIES,
      defaultRetryDelay: DEFAULT_RETRY_DELAY,
      delay: this.delay,
    });
  }

  /**
   * Attempts recovery using fallback function
   * @param {(() => Promise<Result<T, BunTtsError>>) | undefined} fallback - Optional fallback recovery function
   * @param {RecoveryContext} context - Recovery context containing attempt information
   * @param {BunTtsError} error - The error to recover from
   * @returns {Promise<Result<T, BunTtsError>>} Result of fallback recovery attempt
   */
  private async attemptFallbackRecovery<T>(
    fallback: (() => Promise<Result<T, BunTtsError>>) | undefined,
    context: RecoveryContext,
    error: BunTtsError
  ): Promise<Result<T, BunTtsError>> {
    return tryFallbackRecovery<T>(fallback, context, error);
  }

  /**
   * Attempts to recover from an error using registered strategies and fallback options
   * @param {BunTtsError} error - The error to attempt recovery from
   * @param {RecoveryContext} context - Recovery context containing attempt information
   * @param {() => Promise<Result<T, BunTtsError>>} [fallback] - Optional fallback recovery function
   * @returns {Promise<Result<T, BunTtsError>>} Result of the recovery attempt
   */
  public async attemptRecovery<T>(
    error: BunTtsError,
    context: RecoveryContext,
    fallback?: () => Promise<Result<T, BunTtsError>>
  ): Promise<Result<T, BunTtsError>> {
    this.logRecoveryAttempt(error, context);

    const strategyResult = await this.attemptStrategyRecovery<T>(
      error,
      context
    );
    if (strategyResult.success) {
      return strategyResult;
    }

    const fallbackResult = await this.attemptFallbackRecovery<T>(
      fallback,
      context,
      error
    );
    if (fallbackResult.success) {
      return fallbackResult;
    }

    return logRecoveryFailure<T>(error, context);
  }

  /**
   * Executes an operation with automatic recovery attempts on failure
   * @param {() => Promise<Result<T, BunTtsError>>} operation - The operation to execute
   * @param {string} operationName - Name of the operation for logging purposes
   * @param {number} [maxAttempts] - Maximum number of attempts (default: 3)
   * @param {Record<string, unknown>} [metadata] - Optional metadata to include with error reporting
   * @returns {Promise<Result<T, BunTtsError>>} Result of the operation with recovery attempts
   */
  public async executeWithRecovery<T>(
    operation: () => Promise<Result<T, BunTtsError>>,
    operationName: string,
    maxAttempts = 3,
    metadata?: Record<string, unknown>
  ): Promise<Result<T, BunTtsError>> {
    let lastError: BunTtsError | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const result = await this.executeOperationWithRecovery<T>({
        operation,
        operationName,
        attempt,
        maxAttempts,
        metadata,
      });

      if (result.success) {
        return result;
      }

      lastError = result.error;
    }

    return createFinalFailureResult<T>(lastError, normalizeError);
  }

  /**
   * Executes an operation and attempts recovery if it fails
   * @param {OperationParams<T>} params - Operation execution parameters
   * @returns {Promise<Result<T, BunTtsError>>} Result of operation execution and recovery attempt
   */
  private async executeOperationWithRecovery<T>(
    params: OperationParams<T>
  ): Promise<Result<T, BunTtsError>> {
    const operationResult = await this.executeOperation<T>(params);

    if (operationResult.success) {
      return operationResult;
    }

    return this.attemptRecovery(operationResult.error, {
      operation: params.operationName,
      attempt: params.attempt,
      maxAttempts: params.maxAttempts,
      metadata: params.metadata,
    });
  }

  /**
   * Executes a single operation attempt with error handling
   * @param {OperationParams<T>} params - Operation execution parameters
   * @returns {Promise<Result<T, BunTtsError>>} Result of the operation execution
   */
  private async executeOperation<T>(
    params: OperationParams<T>
  ): Promise<Result<T, BunTtsError>> {
    try {
      return await handleSuccessfulOperation<T>(params);
    } catch (error) {
      return handleOperationError<T>(error, params, normalizeError);
    }
  }

  /**
   * Creates a delay for the specified number of milliseconds
   * @param {number} ms - Number of milliseconds to delay
   * @returns {Promise<void>} Promise that resolves after the delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Initialize default recovery strategies (lazy initialization)
let _recoveryManager: ErrorRecoveryManager | null = null;

/**
 * Resets the recovery manager cache (for testing purposes)
 */
export const resetRecoveryManager = (): void => {
  _recoveryManager = null;
};

/**
 * Gets the recovery manager instance with default strategies registered
 * @returns {ErrorRecoveryManager} The ErrorRecoveryManager instance with default strategies
 */
export const recoveryManager = (): ErrorRecoveryManager => {
  // Check if the singleton instance has been reset by comparing with current instance
  const currentInstance = ErrorRecoveryManager.getInstance();
  if (!_recoveryManager || _recoveryManager !== currentInstance) {
    _recoveryManager = currentInstance;
    // Register default strategies for new instance
    registerConfigurationStrategies(_recoveryManager);
    registerFileSystemStrategies(_recoveryManager);
    registerNetworkStrategies(_recoveryManager);
  }
  return _recoveryManager;
};

/**
 * Registers all configuration-related recovery strategies
 * @param {ErrorRecoveryManager} manager - The recovery manager to register strategies with
 */
const registerConfigurationStrategies = (
  manager: ErrorRecoveryManager
): void => {
  const configStrategy = new ConfigurationRecoveryStrategy();

  manager.registerStrategy('ConfigurationError', configStrategy);
  manager.registerStrategy('InvalidConfigError', configStrategy);
  manager.registerStrategy('configuration', configStrategy);
};

/**
 * Registers all file system-related recovery strategies
 * @param {ErrorRecoveryManager} manager - The recovery manager to register strategies with
 */
const registerFileSystemStrategies = (manager: ErrorRecoveryManager): void => {
  const fileStrategy = new FileSystemRecoveryStrategy();

  manager.registerStrategy('FileError', fileStrategy);
  manager.registerStrategy('FileNotFoundError', fileStrategy);
  manager.registerStrategy('FilePermissionError', fileStrategy);
  manager.registerStrategy('file', fileStrategy);
};

/**
 * Registers all network-related recovery strategies
 * @param {ErrorRecoveryManager} manager - The recovery manager to register strategies with
 */
const registerNetworkStrategies = (manager: ErrorRecoveryManager): void => {
  const networkStrategy = new NetworkRecoveryStrategy();

  manager.registerStrategy('TTSError', networkStrategy);
  manager.registerStrategy('AudioGenerationError', networkStrategy);
  manager.registerStrategy('tts', networkStrategy);
};

// Re-export recovery strategies for backward compatibility
export {
  ConfigurationRecoveryStrategy,
  FileSystemRecoveryStrategy,
  NetworkRecoveryStrategy,
} from './recovery-strategies.js';

// Convenience functions

/**
 * Convenience function to execute an operation with recovery using the default recovery manager
 * @param {() => Promise<Result<T, BunTtsError>>} operation - The operation to execute
 * @param {string} operationName - Name of the operation for logging purposes
 * @param {number} [maxAttempts] - Maximum number of attempts (optional)
 * @param {Record<string, unknown>} [metadata] - Optional metadata to include with error reporting
 * @returns {Promise<Result<T, BunTtsError>>} Result of the operation with recovery attempts
 */
export const executeWithRecovery = async <T>(
  operation: () => Promise<Result<T, BunTtsError>>,
  operationName: string,
  maxAttempts?: number,
  metadata?: Record<string, unknown>
): Promise<Result<T, BunTtsError>> =>
  recoveryManager().executeWithRecovery(
    operation,
    operationName,
    maxAttempts,
    metadata
  );

/**
 * Alias for recoveryManager function for backward compatibility
 * @returns {any} The ErrorRecoveryManager instance with default strategies
 */
export const getRecoveryManager = recoveryManager;
