import packageJson from '../../package.json' with { type: 'json' };
import { PinoLoggerAdapter } from '../adapters/pino-logger-adapter.js';
import type { Logger } from '../interfaces/logger.js';
import type { BunTtsError } from '../types/index.js';

// Constants for magic numbers
const CONSOLE_SEPARATOR_LENGTH = 50;

export interface ErrorReport {
  error: BunTtsError;
  timestamp: string;
  context: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  environment: string;
  version: string;
}

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
   * @param options - Configuration options for the error reporter
   * @param logger - Optional custom logger instance (defaults to PinoLoggerAdapter)
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
   * @param options - Configuration options (only used on first call)
   * @param logger - Optional custom logger (only used on first call)
   * @returns The singleton ErrorReporter instance
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
   * @param options - Configuration options for the error reporter
   * @param logger - Optional custom logger instance
   * @returns A new ErrorReporter instance
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
   * Report an error with optional context information.
   * @param error - The error to report (can be Error, BunTtsError, or unknown)
   * @param context - Additional context information for the error report
   * @returns A structured error report containing all error details
   */
  public reportError(
    error: BunTtsError | Error | unknown,
    context: Record<string, unknown> = {}
  ): ErrorReport {
    const normalizedError = this.normalizeError(error);
    const report: ErrorReport = {
      error: normalizedError,
      timestamp: new Date().toISOString(),
      context: {
        ...context,
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
      },
      userId: (context as Record<string, unknown>)?.userId as string || this.options.userId,
      sessionId: (context as Record<string, unknown>)?.sessionId as string || this.options.sessionId,
      environment:
        (context as Record<string, unknown>)?.environment as string ||
        process.env.NODE_ENV ||
        this.options.environment,
      version: this.getVersion(),
    };

    this.logError(report);

    if (this.options.enableConsoleReporting) {
      this.consoleError(report);
    }

    return report;
  }

  /**
   * Report a warning message with optional context information.
   * @param message - The warning message to report
   * @param context - Additional context information for the warning
   */
  public reportWarning(
    message: string,
    context: Record<string, unknown> = {}
  ): void {
    this.logger.warn(message, { context, timestamp: new Date().toISOString() });
  }

  /**
   * Report an informational message with optional context information.
   * @param message - The info message to report
   * @param context - Additional context information for the message
   */
  public reportInfo(
    message: string,
    context: Record<string, unknown> = {}
  ): void {
    this.logger.info(message, { context, timestamp: new Date().toISOString() });
  }

  /**
   * Normalize different error types into a standardized BunTtsError format.
   * @param error - The error to normalize (can be any type)
   * @returns A normalized BunTtsError object
   */
  private normalizeError(error: unknown): BunTtsError {
    if (this.isBunTtsError(error)) {
      return error;
    }

    if (error instanceof Error) {
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
    }

    return {
      name: 'UnknownError',
      message: String(error),
      code: 'UNKNOWN_ERROR',
      category: 'validation',
      details: {
        type: typeof error,
        value: error,
      },
      recoverable: true,
    };
  }

  /**
   * Type guard to check if an error is a BunTtsError.
   * @param error - The error to check
   * @returns True if the error is a BunTtsError, false otherwise
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
   * @param report - The error report to log
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
   * @param report - The error report to display
   */
  private consoleError(report: ErrorReport): void {
    if (this.options.environment === 'development') {
      this.displayDetailedError(report);
    } else {
      this.displaySimpleError(report);
    }
  }

  /**
   * Display detailed error information for development environment.
   * @param report - The error report to display
   */
  private displayDetailedError(report: ErrorReport): void {
    console.error(`\n🚨 ${report.error.name} [${report.error.code}]`);
    console.error(`📋 Message: ${report.error.message}`);
    console.error(`🏷️  Category: ${report.error.category}`);
    console.error(
      `🔄 Recoverable: ${report.error.recoverable ? 'Yes' : 'No'}`
    );

    this.displayErrorDetails(report.error.details);
    this.displayContext(report.context);

    console.error(`⏰ Time: ${report.timestamp}`);
    console.error(`🔧 Environment: ${report.environment}`);
    console.error(`📦 Version: ${report.version}`);

    if (report.error.stack) {
      console.error('📚 Stack trace:');
      console.error(report.error.stack);
    }

    console.error('─'.repeat(CONSOLE_SEPARATOR_LENGTH));
  }

  /**
   * Display simple error information for production environment.
   * @param report - The error report to display
   */
  private displaySimpleError(report: ErrorReport): void {
    console.error(
      `[${report.error.category.toUpperCase()}] ${report.error.message}`
    );
  }

  /**
   * Display error details if they exist.
   * @param details - The error details to display
   */
  private displayErrorDetails(details: unknown): void {
    if (
      details &&
      typeof details === 'object' &&
      details !== null &&
      Object.keys(details).length > 0
    ) {
      console.error('📊 Details:');
      for (const [key, value] of Object.entries(details)) {
        console.error(`   ${key}: ${JSON.stringify(value)}`);
      }
    }
  }

  /**
   * Display context information if it exists.
   * @param context - The context information to display
   */
  private displayContext(context: unknown): void {
    if (
      context &&
      typeof context === 'object' &&
      context !== null &&
      Object.keys(context).length > 0
    ) {
      console.error('🌍 Context:');
      for (const [key, value] of Object.entries(context)) {
        console.error(`   ${key}: ${JSON.stringify(value)}`);
      }
    }
  }

  /**
   * Get the application version from package.json.
   * @returns The version string or default if unavailable
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
   * @returns A unique session identifier string in UUID format
   */
  private generateSessionId(): string {
    // Using cryptographically secure random UUID generation for session IDs
    // This ensures uniqueness and prevents predictability in session tracking
    return crypto.randomUUID();
  }

  /**
   * Update the current session information.
   * @param userId - Optional new user ID for the session
   */
  public updateSession(userId?: string): void {
    if (userId) {
      this.options.userId = userId;
    }
    this.options.sessionId = this.generateSessionId();
  }

  /**
   * Set the environment mode for the error reporter.
   * @param environment - The environment to set ('development', 'production', or 'test')
   */
  public setEnvironment(
    environment: 'development' | 'production' | 'test'
  ): void {
    this.options.environment = environment;
  }

  /**
   * Gets the logger instance used by this ErrorReporter.
   * @returns The logger instance
   */
  public getLogger(): Logger {
    return this.logger;
  }
}

export { ErrorReporter };

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
