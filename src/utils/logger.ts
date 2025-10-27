import pino from 'pino';
import type { CliContext } from '../types/index.js';

export interface LogContext {
  operation?: string;
  file?: string;
  duration?: number;
  [key: string]: unknown;
}

/**
 * Logger implementation using Pino for structured logging.
 * Provides both direct logging methods and performance tracking capabilities.
 */
export class Logger {
  private readonly logger: ReturnType<typeof pino>;

  /**
   * Creates a new Logger instance with the specified verbosity level.
   *
   * @param verbose - Whether to enable debug level logging
   */
  constructor(verbose = false) {
    const isTestEnvironment =
      process.env.NODE_ENV === 'test' || process.env.BUN_TEST === '1';
    this.logger = isTestEnvironment
      ? this.createTestLogger()
      : this.createProductionLogger(verbose);
  }

  /**
   * Creates a minimal logger configuration for test environments.
   *
   * @returns A basic Pino logger instance for testing
   */
  private createTestLogger(): ReturnType<typeof pino> {
    return pino({
      level: 'info', // Force info level in tests for consistency
      base: {
        service: 'bun-tts',
      },
      // NO formatters, NO timestamp, NO transport in test environment
      // Just the most basic pino configuration possible
    });
  }

  /**
   * Creates a full-featured logger configuration for production environments.
   *
   * @param verbose - Whether to enable debug level logging
   * @returns A configured Pino logger instance for production
   */
  private createProductionLogger(verbose: boolean): ReturnType<typeof pino> {
    const isPretty = process.stdout.isTTY && !process.env.NO_COLOR;
    const level = verbose ? 'debug' : 'info';

    return pino({
      level,
      formatters: {
        level: (label: string) => ({ level: label }),
        log: (object: Record<string, unknown>) => {
          const logObject = object;
          const result: Record<string, unknown> = {};

          // Copy all properties except timestamp
          for (const key in logObject) {
            if (key !== 'timestamp') {
              result[key] = logObject[key];
            }
          }

          // Add our own timestamp
          result.timestamp = new Date().toISOString();

          return result;
        },
      },
      timestamp: false,
      // Only use transport (worker threads) in non-test environments
      ...(isPretty ? this.createPrettyTransportConfig() : {}),
      base: {
        service: 'bun-tts',
        pid: process.pid,
      },
    });
  }

  /**
   * Creates the pretty transport configuration for non-test environments.
   *
   * @returns Transport configuration object for pretty printing
   */
  private createPrettyTransportConfig(): Record<string, unknown> {
    return {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          messageFormat: '{service} [{operation}] {msg}',
          customPrettifiers: {
            time: (timestamp: string) => timestamp,
          },
        },
      },
    };
  }

  // Direct logger methods
  /**
   * Log an info message with optional context.
   *
   * @param message - The info message to log
   * @param context - Optional context data to include with the log entry
   */
  public info(message: string, context?: LogContext): void {
    if (context) {
      this.logger.info(context, message);
    } else {
      this.logger.info(message);
    }
  }

  /**
   * Log a debug message with optional context.
   *
   * @param message - The debug message to log
   * @param context - Optional context data to include with the log entry
   */
  public debug(message: string, context?: LogContext): void {
    if (context) {
      this.logger.debug(context, message);
    } else {
      this.logger.debug(message);
    }
  }

  /**
   * Log a warning message with optional context.
   *
   * @param message - The warning message to log
   * @param context - Optional context data to include with the log entry
   */
  public warn(message: string, context?: LogContext): void {
    if (context) {
      this.logger.warn(context, message);
    } else {
      this.logger.warn(message);
    }
  }

  /**
   * Log an error message with optional error or context.
   *
   * @param message - The error message to log
   * @param error - Optional error object or context data to include with the log entry
   */
  public error(message: string, error?: Error | LogContext): void {
    if (error instanceof Error) {
      this.logger.error(
        {
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
        },
        message
      );
    } else if (error) {
      this.logger.error(error, message);
    } else {
      this.logger.error(message);
    }
  }

  // Context-based methods
  /**
   * Creates a child logger with additional context bindings.
   *
   * @param context - Context data to bind to the child logger
   * @returns A new logger instance with the bound context
   */
  public child(context: LogContext): Logger {
    const childLogger = new Logger(this.logger.level === 'debug');
    // Create a new Logger instance with the child logger
    Object.assign(childLogger, { logger: this.logger.child(context) });
    return childLogger;
  }

  /**
   * Creates a logger with additional context bindings.
   *
   * @param context - Context data to bind to the logger
   * @returns A new logger instance with the bound context
   */
  public withContext(context: LogContext): Logger {
    return this.child(context);
  }

  // Performance and operation logging
  /**
   * Logs an operation with timing and error handling.
   *
   * @param operation - The name of the operation being logged
   * @param fn - The async function to execute and log
   * @param context - Optional additional context for the operation
   * @returns A promise that resolves to the result of the function
   */
  public logOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const operationLogger = context
      ? this.withContext({ operation, ...context })
      : this.withContext({ operation });

    operationLogger.debug(`Starting ${operation}`);
    const startTime = Date.now();

    return fn()
      .then((result) => {
        const duration = Date.now() - startTime;
        operationLogger.debug(`Completed ${operation}`, {
          duration,
          success: true,
        });
        return result;
      })
      .catch((error) => {
        const duration = Date.now() - startTime;
        operationLogger.error(`Failed ${operation}: ${error.message}`, {
          duration,
          success: false,
          error: error.message,
          stack: error.stack,
        });
        throw error;
      });
  }

  /**
   * Logs performance metrics for a completed operation.
   *
   * @param operation - The name of the operation that completed
   * @param startTime - The start timestamp of the operation
   * @param context - Optional additional context for the performance log
   */
  public logPerformance(
    operation: string,
    startTime: number,
    context?: LogContext
  ): void {
    const duration = Date.now() - startTime;

    const perfLogger = context
      ? this.withContext({ operation, duration, ...context })
      : this.withContext({ operation, duration });

    perfLogger.debug(`Performance: ${operation} completed in ${duration}ms`);
  }

  // Get the underlying pino logger for advanced usage
  /**
   * Gets the underlying Pino logger instance.
   *
   * @returns The Pino logger instance used by this logger
   */
  public getPinoLogger(): ReturnType<typeof pino> {
    return this.logger;
  }
}

// Legacy function exports for backward compatibility during migration
/**
 * Creates a new Logger instance from CLI context.
 *
 * @param context - The CLI context containing configuration options
 * @returns A new Logger instance
 */
export const createLogger = (context: CliContext): Logger => {
  return new Logger(context.flags.verbose);
};

/**
 * Gets the singleton logger instance.
 * @deprecated This function is deprecated. Use dependency injection instead.
 * @throws Always throws an error indicating the function is deprecated
 */
export const getLogger = (): Logger => {
  // This will be replaced by DI resolution
  throw new Error(
    'getLogger() is deprecated. Use dependency injection instead.'
  );
};

/**
 * Creates a child logger with additional context bindings.
 *
 * @param logger - The parent Pino logger instance
 * @param context - Context data to bind to the child logger
 * @returns A child logger with the bound context
 */
export const withContext = (
  logger: ReturnType<typeof pino>,
  context: LogContext
): ReturnType<typeof pino> => logger.child(context);

// Convenience functions (deprecated - use Logger class methods instead)
/**
 * Logs an operation with timing and error handling.
 * @deprecated Use Logger.logOperation() instead
 * @param _operation - The name of the operation being logged
 * @param _fn - The async function to execute and log
 * @param _context - Optional additional context for the operation
 * @throws Always throws an error as this function is deprecated
 */
export const logOperation = <T>(
  _operation: string,
  _fn: () => Promise<T>,
  _context?: LogContext
): Promise<T> => {
  // This function is deprecated - use Logger.logOperation() instead
  throw new Error(
    'logOperation() is deprecated. Use Logger.logOperation() instead.'
  );
};

/**
 * Logs performance metrics for a completed operation.
 * @deprecated Use Logger.logPerformance() instead
 * @param _operation - The name of the operation that completed
 * @param _startTime - The start timestamp of the operation
 * @param _context - Optional additional context for the performance log
 * @throws Always throws an error as this function is deprecated
 */
export const logPerformance = (
  _operation: string,
  _startTime: number,
  _context?: LogContext
): void => {
  // This function is deprecated - use Logger.logPerformance() instead
  throw new Error(
    'logPerformance() is deprecated. Use Logger.logPerformance() instead.'
  );
};
