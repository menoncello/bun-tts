import { BunTtsError } from '../errors/bun-tts-error.js';
import { Logger } from './logger.js';

// Create a logger instance for error handling
const logger = new Logger();

/**
 * Global error handler for uncaught exceptions
 */
export function setupGlobalErrorHandlers(): void {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught exception occurred', {
      type: 'uncaughtException',
      error,
    });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: unknown) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logger.error('Unhandled rejection occurred', {
      type: 'unhandledRejection',
      error,
    });
    process.exit(1);
  });
}

/**
 * Handle errors in CLI context with user-friendly output and appropriate exit codes
 *
 * @param {Error} error - The error to handle, can be any Error instance
 * @returns {never} This function never returns normally - it always exits the process
 *
 * @example
 * ```typescript
 * try {
 *   await someOperation();
 * } catch (error) {
 *   handleCliError(error); // Will exit process with appropriate code
 * }
 * ```
 */
export function handleCliError(error: Error): never {
  if (error instanceof BunTtsError) {
    logger.error('BunTtsError occurred', { error });

    // User-friendly message
    logger.error(`\n❌ ${error.getUserMessage()}`);

    // Additional details if available
    if (error.details && Object.keys(error.details).length > 0) {
      logger.error('\nAdditional information:');
      for (const [key, value] of Object.entries(error.details)) {
        logger.error(`  ${key}: ${value}`);
      }
    }

    // Suggestion for common errors
    logger.error(getSuggestion(error));

    process.exit(error.getExitCode());
  } else {
    // Unknown error
    logger.error('Unexpected error occurred', { error });
    logger.error('\n❌ An unexpected error occurred');
    logger.error('Please report this issue with the error details above');
    process.exit(1);
  }
}

/**
 * Get helpful suggestion based on error type to guide users toward resolution
 *
 * @param {Error} error - The BunTtsError instance to generate suggestions for
 * @returns {string} A helpful suggestion message for the specific error type
 *
 * @example
 * ```typescript
 * const error = new ConfigurationError('Missing config file', {});
 * const suggestion = getSuggestion(error);
 * console.log(suggestion); // "💡 Suggestion: Check your configuration file..."
 * ```
 */
function getSuggestion(error: BunTtsError): string {
  switch (error.code) {
    case 'CONFIG_ERROR':
      return '\n💡 Suggestion: Check your configuration file and ensure all required fields are present';
    case 'VALIDATION_ERROR':
      return '\n💡 Suggestion: Check the input parameters and try again';
    case 'PROCESSING_ERROR':
      return '\n💡 Suggestion: Ensure the input file is valid and accessible';
    default:
      return '\n💡 Suggestion: Try running with --help for usage information';
  }
}

/**
 * Wrap async functions to handle errors consistently by converting unknown errors to BunTtsError
 *
 * @param {(...args: T) => Promise<R>} fn - The async function to wrap with error handling
 * @returns {any} (...args: T) => Promise<R> A wrapped function that converts unknown errors to BunTtsError
 *
 * @template T - Tuple type for function arguments
 * @template R - Return type of the function
 *
 * @example
 * ```typescript
 * const wrappedFunction = withErrorHandling(async (input: string) => {
 *   if (!input) throw new Error('Input required');
 *   return processInput(input);
 * });
 *
 * // Unknown errors are converted to BunTtsError
 * ```
 */
export function withErrorHandling<T extends readonly unknown[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof BunTtsError) {
        throw error;
      }

      // Convert unknown errors to BunTtsError
      throw new BunTtsError(
        error instanceof Error ? error.message : String(error),
        {
          code: 'UNKNOWN_ERROR',
          category: 'validation',
          details: { originalError: error },
        }
      );
    }
  };
}

/**
 * Performance monitoring wrapper that logs operation timing and handles errors consistently
 *
 * @param {any} operation - Descriptive name of the operation being monitored
 * @param {(...args: T) => Promise<R>} fn - The async function to monitor
 * @returns {any} (...args: T) => Promise<R> A wrapped function with performance logging
 *
 * @template T - Tuple type for function arguments
 * @template R - Return type of the function
 *
 * @example
 * ```typescript
 * const monitoredFunction = withPerformanceLogging('document-processing', async (file) => {
 *   return await processDocument(file);
 * });
 *
 * // Logs: "Starting document-processing", "Completed document-processing" with timing
 * ```
 */
export function withPerformanceLogging<T extends readonly unknown[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    logger.info(`Starting ${operation}`, { operation });

    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      logger.info(`Completed ${operation}`, { operation, duration });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Failed ${operation}`, { operation, duration, error });
      throw error;
    }
  };
}
