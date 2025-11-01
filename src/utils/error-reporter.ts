import packageJson from '../../package.json' with { type: 'json' };
import { PinoLoggerAdapter } from '../adapters/pino-logger-adapter.js';
import { BunTtsBaseError } from '../errors/index.js';
import type { Logger } from '../interfaces/logger.js';
import type { BunTtsError } from '../types/index.js';
import { consoleError, type ErrorReport } from './error-display-utils.js';

export interface ErrorReporterOptions {
  environment?: 'development' | 'production' | 'test';
  enableConsoleReporting?: boolean;
  enableFileReporting?: boolean;
  userId?: string;
  sessionId?: string;
}

/**
 * ErrorReporter class provides centralized error reporting and logging functionality.
 * It supports singleton pattern for easy access across the application.
 */
class ErrorReporter {
  private static instance: ErrorReporter | null = null;
  private options: Required<ErrorReporterOptions>;
  private logger: Logger;

  /**
   * Create a new ErrorReporter instance with the specified options and logger.
   * @param {ErrorReporterOptions} options - Configuration options for the error reporter
   * @param {Logger} logger - Optional custom logger instance (defaults to PinoLoggerAdapter)
   */
  private constructor(options: ErrorReporterOptions = {}, logger?: Logger) {
    this.options = {
      environment: options.environment ?? 'development',
      enableConsoleReporting: options.enableConsoleReporting ?? true,
      enableFileReporting: options.enableFileReporting ?? false,
      userId: options.userId ?? 'anonymous',
      sessionId: options.sessionId ?? this.generateSessionId(),
    };

    // Dependency injection: use provided logger or create default
    this.logger =
      logger ||
      new PinoLoggerAdapter({
        flags: { verbose: this.options.environment === 'development' },
      });
  }

  /**
   * Get the singleton instance of ErrorReporter.
   * @param {ErrorReporterOptions} options - Configuration options (only used on first call)
   * @param {Logger} logger - Optional custom logger (only used on first call)
   * @returns {ErrorReporter} The singleton ErrorReporter instance
   */
  public static getInstance(
    options?: ErrorReporterOptions,
    logger?: Logger
  ): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter(options, logger);
    }
    return ErrorReporter.instance;
  }

  // Method to create a new instance with custom logger (for testing)
  /**
   * Create a new ErrorReporter instance with custom options and logger.
   * Useful for testing when you need a fresh instance.
   * @param {ErrorReporterOptions} options - Configuration options for the error reporter
   * @param {Logger} logger - Optional custom logger instance
   * @returns {ErrorReporter} A new ErrorReporter instance
   */
  public static createInstance(
    options?: ErrorReporterOptions,
    logger?: Logger
  ): ErrorReporter {
    return new ErrorReporter(options, logger);
  }

  // Reset singleton (useful for testing)
  /**
   * Reset the singleton instance to null.
   * This is useful for testing to ensure clean state between tests.
   */
  public static resetInstance(): void {
    ErrorReporter.instance = null;
  }

  /**
   * Creates error context with system information
   * @param {Record<string, unknown>} context - Additional context information for the error report
   * @returns {Record<string, unknown>} Enhanced context with system information
   */
  private createErrorContext(
    context: Record<string, unknown>
  ): Record<string, unknown> {
    return {
      ...context,
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
    };
  }

  /**
   * Extracts user information from context or defaults
   * @param {Record<string, unknown>} context - Context information
   * @returns {string} User ID from context or default
   */
  private extractUserId(context: Record<string, unknown>): string {
    return (
      ((context as Record<string, unknown>)?.userId as string) ||
      this.options.userId
    );
  }

  /**
   * Extracts session information from context or defaults
   * @param {Record<string, unknown>} context - Context information
   * @returns {string} Session ID from context or default
   */
  private extractSessionId(context: Record<string, unknown>): string {
    return (
      ((context as Record<string, unknown>)?.sessionId as string) ||
      this.options.sessionId
    );
  }

  /**
   * Extracts environment information from context or defaults
   * @param {Record<string, unknown>} context - Context information
   * @returns {string} Environment from context, process env, or default
   */
  private extractEnvironment(context: Record<string, unknown>): string {
    return (
      ((context as Record<string, unknown>)?.environment as string) ||
      process.env.NODE_ENV ||
      this.options.environment
    );
  }

  /**
   * Creates a structured error report
   * @param {BunTtsError} error - Normalized error
   * @param {Record<string, unknown>} context - Additional context information
   * @returns {ErrorReport} Structured error report
   */
  private createErrorReport(
    error: BunTtsError,
    context: Record<string, unknown>
  ): ErrorReport {
    return {
      error,
      timestamp: new Date().toISOString(),
      context: this.createErrorContext(context),
      userId: this.extractUserId(context),
      sessionId: this.extractSessionId(context),
      environment: this.extractEnvironment(context),
      version: this.getVersion(),
    };
  }

  /**
   * Reports an error through all configured channels
   * @param {ErrorReport} report - Error report to send
   */
  private reportThroughChannels(report: ErrorReport): void {
    this.logError(report);

    if (this.options.enableConsoleReporting) {
      this.consoleError(report);
    }
  }

  /**
   * Report an error with optional context information.
   * @param {BunTtsError | Error | unknown} error - The error to report (can be Error, BunTtsError, or unknown)
   * @param {Record<string, unknown>} context - Additional context information for the error report
   * @returns {ErrorReport} A structured error report containing all error details
   */
  public reportError(
    error: BunTtsError | Error | unknown,
    context: Record<string, unknown> = {}
  ): ErrorReport {
    const normalizedError = this.normalizeError(error);
    const report = this.createErrorReport(normalizedError, context);

    this.reportThroughChannels(report);

    return report;
  }

  /**
   * Report a warning message with optional context information.
   * @param {string} message - The warning message to report
   * @param {Record<string, unknown>} context - Additional context information for the warning
   */
  public reportWarning(
    message: string,
    context: Record<string, unknown> = {}
  ): void {
    this.logger.warn(message, { context, timestamp: new Date().toISOString() });
  }

  /**
   * Report an informational message with optional context information.
   * @param {string} message - The info message to report
   * @param {Record<string, unknown>} context - Additional context information for the message
   */
  public reportInfo(
    message: string,
    context: Record<string, unknown> = {}
  ): void {
    this.logger.info(message, { context, timestamp: new Date().toISOString() });
  }

  /**
   * Normalize different error types into a standardized BunTtsError format.
   * @param {unknown} error - The error to normalize (can be any type)
   * @returns {BunTtsError} A normalized BunTtsError object
   */
  private normalizeError(error: unknown): BunTtsError {
    if (this.isBunTtsError(error)) {
      return error;
    }

    if (error instanceof Error) {
      return this.normalizeStandardError(error);
    }

    return this.normalizeUnknownError(error);
  }

  /**
   * Normalize a standard Error instance into BunTtsError format.
   * @param {Error} error - The standard Error to normalize
   * @returns {BunTtsError} A normalized BunTtsError object
   */
  private normalizeStandardError(error: Error): BunTtsError {
    const baseError = new BunTtsBaseError(
      error.message,
      'UNKNOWN_ERROR',
      'validation',
      {
        recoverable: true,
        details: this.createErrorDetails(error),
      }
    );
    baseError.name = error.name;
    return baseError;
  }

  /**
   * Create error details from a standard Error.
   * @param {Error} error - The error to extract details from
   * @returns {{ originalError: string; stack?: string }} Error details object
   */
  private createErrorDetails(error: Error): {
    originalError: string;
    stack?: string;
  } {
    return {
      originalError: error.constructor.name,
      stack: error.stack,
    };
  }

  /**
   * Normalize an unknown error type into BunTtsError format.
   * @param {unknown} error - The unknown error to normalize
   * @returns {BunTtsError} A normalized BunTtsError object
   */
  private normalizeUnknownError(error: unknown): BunTtsError {
    const baseError = new BunTtsBaseError(
      String(error),
      'UNKNOWN_ERROR',
      'validation',
      {
        recoverable: true,
        details: this.createUnknownErrorDetails(error),
      }
    );
    baseError.name = 'UnknownError';
    return baseError;
  }

  /**
   * Create error details from an unknown error type.
   * @param {unknown} error - The unknown error to extract details from
   * @returns {{ type: string; value: unknown }} Error details object
   */
  private createUnknownErrorDetails(error: unknown): {
    type: string;
    value: unknown;
  } {
    return {
      type: typeof error,
      value: error,
    };
  }

  /**
   * Type guard to check if an error is a BunTtsError.
   * @param {unknown} error - The error to check
   * @returns {boolean} True if the error is a BunTtsError, false otherwise
   */
  private isBunTtsError(error: unknown): error is BunTtsError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      'message' in error &&
      'code' in error &&
      'category' in error &&
      'recoverable' in error
    );
  }

  /**
   * Log error information using the configured logger.
   * @param {ErrorReport} report - The error report to log
   */
  private logError(report: ErrorReport): void {
    const logData = {
      error: {
        name: report.error.name,
        message: report.error.message,
        code: report.error.code,
        category: report.error.category,
        recoverable: report.error.recoverable,
        details: report.error.details,
        stack: report.error.stack,
      },
      context: report.context,
      userId: report.userId,
      sessionId: report.sessionId,
      environment: report.environment,
      version: report.version,
      timestamp: report.timestamp,
    };

    this.logger.error(`${report.error.name}: ${report.error.message}`, logData);
  }

  /**
   * Display error information to the console.
   * In development mode, shows detailed error information.
   * In production mode, shows a simplified error message.
   * @param {ErrorReport} report - The error report to display to console
   */
  private consoleError(report: ErrorReport): void {
    consoleError(report, this.options.environment, this.logger);
  }

  /**
   * Get the application version from package.json.
   * @returns {string} The version string or default if unavailable
   */
  private getVersion(): string {
    try {
      return packageJson.version || '0.1.0';
    } catch {
      return '0.1.0';
    }
  }

  /**
   * Generate a unique session ID for tracking user sessions.
   * Uses cryptographically secure UUID generation to ensure uniqueness and prevent predictability.
   * @returns {string} A unique session identifier string in UUID format
   */
  private generateSessionId(): string {
    // Using cryptographically secure random UUID generation for session IDs
    // This ensures uniqueness and prevents predictability in session tracking
    return crypto.randomUUID();
  }

  /**
   * Update the current session information.
   * @param {string} userId - Optional new user ID for the session
   */
  public updateSession(userId?: string): void {
    if (userId) {
      this.options.userId = userId;
    }
    this.options.sessionId = this.generateSessionId();
  }

  /**
   * Set the environment mode for the error reporter.
   * @param {'development' | 'production' | 'test'} environment - The environment to set ('development', 'production', or 'test')
   */
  public setEnvironment(
    environment: 'development' | 'production' | 'test'
  ): void {
    this.options.environment = environment;
  }

  /**
   * Gets the logger instance used by this ErrorReporter.
   * @returns {Logger} The logger instance
   */
  public getLogger(): Logger {
    return this.logger;
  }
}

export { ErrorReporter, type ErrorReport };

// Export singleton instance (lazy initialization)
let _errorReporter: ErrorReporter | null = null;
export const errorReporter = (): ErrorReporter => {
  if (!_errorReporter) {
    _errorReporter = ErrorReporter.getInstance();
  }
  return _errorReporter;
};

// Convenience functions
export const reportError = (
  error: unknown,
  context?: Record<string, unknown>
): ErrorReport => errorReporter().reportError(error, context);

export const reportWarning = (
  message: string,
  context?: Record<string, unknown>
): void => errorReporter().reportWarning(message, context);

export const reportInfo = (
  message: string,
  context?: Record<string, unknown>
): void => errorReporter().reportInfo(message, context);
