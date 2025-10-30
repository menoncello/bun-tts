/**
 * Logger interface for dependency injection.
 * Provides methods for logging at different levels with optional metadata.
 */
export interface Logger {
  /**
   * Log a debug message with optional metadata.
   * @param {string} message - The debug message to log
   * @param {Record<string, unknown>} metadata - Optional key-value pairs to include with the log entry
   */
  debug: (message: string, metadata?: Record<string, unknown>) => void;

  /**
   * Log an info message with optional metadata.
   * @param {string} message - The info message to log
   * @param {Record<string, unknown>} metadata - Optional key-value pairs to include with the log entry
   */
  info: (message: string, metadata?: Record<string, unknown>) => void;

  /**
   * Log a warning message with optional metadata.
   * @param {string} message - The warning message to log
   * @param {Record<string, unknown>} metadata - Optional key-value pairs to include with the log entry
   */
  warn: (message: string, metadata?: Record<string, unknown>) => void;

  /**
   * Log an error message with optional metadata.
   * @param {string} message - The error message to log
   * @param {Record<string, unknown>} metadata - Optional key-value pairs to include with the log entry
   */
  error: (message: string, metadata?: Record<string, unknown>) => void;

  /**
   * Log a fatal error message with optional metadata.
   * @param {string} message - The fatal error message to log
   * @param {Record<string, unknown>} metadata - Optional key-value pairs to include with the log entry
   */
  fatal: (message: string, metadata?: Record<string, unknown>) => void;

  /**
   * Create a child logger with additional context bindings.
   * @param {Record<string, unknown>} bindings - Key-value pairs to bind to the child logger context
   * @returns {Logger} A new logger instance with the bound context
   */
  child: (bindings: Record<string, unknown>) => Logger;

  /**
   * Write a chunk of data (for stream compatibility).
   * @param {unknown} chunk - The data chunk to write
   */
  write?: (chunk: unknown) => void;

  /**
   * The minimum log level for this logger instance.
   */
  level?: string;
}

/**
 * Mock logger implementation for testing purposes.
 * Stores log entries in memory for inspection during tests.
 */
export class MockLogger implements Logger {
  /**
   * Internal storage for log entries.
   */
  private logs: Array<{
    level: string;
    message: string;
    metadata?: Record<string, unknown>;
  }> = [];

  /**
   * Log a debug message with optional metadata.
   * @param {string} message - The debug message to log
   * @param {Record<string, unknown>} metadata - Optional key-value pairs to include with the log entry
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.logs.push({ level: 'debug', message, metadata });
  }

  /**
   * Log an info message with optional metadata.
   * @param {string} message - The info message to log
   * @param {Record<string, unknown>} metadata - Optional key-value pairs to include with the log entry
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.logs.push({ level: 'info', message, metadata });
  }

  /**
   * Log a warning message with optional metadata.
   * @param {string} message - The warning message to log
   * @param {Record<string, unknown>} metadata - Optional key-value pairs to include with the log entry
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.logs.push({ level: 'warn', message, metadata });
  }

  /**
   * Log an error message with optional metadata.
   * @param {string} message - The error message to log
   * @param {Record<string, unknown>} metadata - Optional key-value pairs to include with the log entry
   */
  error(message: string, metadata?: Record<string, unknown>): void {
    this.logs.push({ level: 'error', message, metadata });
  }

  /**
   * Log a fatal error message with optional metadata.
   * @param {string} message - The fatal error message to log
   * @param {Record<string, unknown>} metadata - Optional key-value pairs to include with the log entry
   */
  fatal(message: string, metadata?: Record<string, unknown>): void {
    this.logs.push({ level: 'fatal', message, metadata });
  }

  /**
   * Create a child logger with additional context bindings.
   * In the mock implementation, returns the same instance.
   * @param {Record<string, unknown>} _bindings - Key-value pairs to bind to the child logger context (ignored in mock)
   * @returns {Logger} The same logger instance
   */
  child(_bindings: Record<string, unknown>): Logger {
    return this;
  }

  /**
   * Get all logged entries.
   * @returns {any} A copy of all log entries stored in this mock logger
   */
  getLogs(): Array<{
    level: string;
    message: string;
    metadata?: Record<string, unknown>;
  }> {
    return [...this.logs];
  }

  /**
   * Clear all stored log entries.
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Default log level for compatibility with Pino.
   */
  level = 'info';

  /**
   * Write a chunk of data (for stream compatibility).
   * Silently ignored in the mock implementation.
   * @param {unknown} _chunk - The data chunk to write (ignored in mock)
   */
  write(_chunk: unknown): void {
    // Silently ignore writes in mock
  }
}

/**
 * Factory class for creating and managing logger instances.
 * Implements the singleton pattern to ensure a single logger instance throughout the application.
 */
export class LoggerFactory {
  /**
   * The singleton logger instance.
   */
  private static instance: Logger | null = null;

  /**
   * Get the singleton logger instance.
   * Creates a new production logger if one doesn't exist.
   * @returns {any} The logger instance
   */
  static getInstance(): Logger {
    if (!LoggerFactory.instance) {
      // In production, create real logger
      LoggerFactory.instance = this.createProductionLogger();
    }
    return LoggerFactory.instance;
  }

  /**
   * Set a custom logger instance (useful for testing).
   * @param {Logger} logger - The logger instance to set
   */
  static setInstance(logger: Logger): void {
    LoggerFactory.instance = logger;
  }

  /**
   * Reset the singleton logger instance.
   * Useful for testing or when you need to force recreation of the logger.
   */
  static reset(): void {
    LoggerFactory.instance = null;
  }

  /**
   * Create a production logger instance.
   * This will be implemented in logger.ts with the real Pino logger.
   * For now, returns a basic implementation that will be replaced.
   * @returns {any} A basic logger implementation
   */
  private static createProductionLogger(): Logger {
    // This will be implemented in logger.ts with the real Pino logger
    // For now, return a basic implementation
    return {
      debug: (_message: string, _metadata?: Record<string, unknown>) => {
        // Will be replaced by real Pino logger
      },
      info: (_message: string, _metadata?: Record<string, unknown>) => {
        // Will be replaced by real Pino logger
      },
      warn: (_message: string, _metadata?: Record<string, unknown>) => {
        // Will be replaced by real Pino logger
      },
      error: (_message: string, _metadata?: Record<string, unknown>) => {
        // Will be replaced by real Pino logger
      },
      fatal: (_message: string, _metadata?: Record<string, unknown>) => {
        // Will be replaced by real Pino logger
      },
      child: () => {
        if (!LoggerFactory.instance) {
          throw new Error('Logger instance not initialized');
        }
        return LoggerFactory.instance;
      },
      level: 'info',
      write: (_chunk: unknown) => {
        // Will be replaced by real Pino logger write implementation
      },
    };
  }
}
