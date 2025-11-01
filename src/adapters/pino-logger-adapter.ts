import pino from 'pino';
import { Logger } from '../interfaces/logger.js';

/**
 * Configuration interface for logger context
 */
interface LoggerContext {
  flags?: {
    verbose?: boolean;
  };
}

/**
 * Pino logger configuration object
 */
interface PinoConfig {
  level: string;
  formatters: {
    level: (label: string) => { level: string };
    log: (object: Record<string, unknown>) => Record<string, unknown>;
  };
  timestamp: boolean;
  transport?: {
    target: string;
    options: {
      colorize: boolean;
      translateTime: string;
      ignore: string;
      messageFormat: string;
      customPrettifiers: {
        time: (timestamp: string) => string;
      };
    };
  };
  base: {
    service: string;
    pid: number;
    hostname: string;
  };
}

/**
 * Pino logger adapter that implements the Logger interface.
 * Provides structured logging capabilities using the Pino logging library
 * with special handling for test environments to avoid DataCloneError issues.
 */
export class PinoLoggerAdapter implements Logger {
  private pinoLogger: pino.Logger;

  /**
   * Creates a new PinoLoggerAdapter instance.
   * Automatically detects test environments and applies appropriate configuration.
   *
   * @param {any} context - Optional context configuration for the logger
   * @param {object} context.flags - Command line flags that affect logging behavior
   * @param {boolean} context.flags.verbose - Whether to enable verbose debug logging
   */
  constructor(context?: LoggerContext) {
    this.pinoLogger = this.createPinoLogger(context);
  }

  /**
   * Creates and configures a Pino logger instance based on environment and context.
   *
   * @param {any} context - Optional context configuration
   * @returns {pino.Logger} Configured Pino logger instance
   */
  private createPinoLogger(context?: LoggerContext): pino.Logger {
    const config = this.buildPinoConfig(context);
    return pino(config);
  }

  /**
   * Builds Pino configuration object.
   *
   * @param {any} context - Optional context configuration
   * @returns {PinoConfig} Complete Pino configuration object
   */
  private buildPinoConfig(context?: LoggerContext): PinoConfig {
    const isTestEnvironment = PinoLoggerUtils.isTestEnvironment();
    const isPretty = this.isPrettyOutput();
    const level = context?.flags?.verbose ? 'debug' : 'info';

    const baseConfig = PinoLoggerUtils.createBaseConfig(level);
    this.addTransportConfig(baseConfig, isPretty, isTestEnvironment);

    return baseConfig;
  }

  /**
   * Adds transport configuration if conditions are met.
   *
   * @param {object} config - Configuration object to modify
   * @param {any} isPretty - Whether pretty output is enabled
   * @param {any} isTestEnvironment - Whether we're in test environment
   */
  private addTransportConfig(
    config: PinoConfig,
    isPretty: boolean,
    isTestEnvironment: boolean
  ): void {
    if (isPretty && !isTestEnvironment) {
      config.transport = this.createTransportConfig();
    }
  }

  /**
   * Creates transport configuration for pretty output.
   *
   * @returns {object} Transport configuration object
   */
  private createTransportConfig(): {
    target: string;
    options: {
      colorize: boolean;
      translateTime: string;
      ignore: string;
      messageFormat: string;
      customPrettifiers: {
        time: (timestamp: string) => string;
      };
    };
  } {
    return {
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
    };
  }

  /**
   * Checks if pretty output should be enabled.
   *
   * @returns {boolean} True if pretty output is available
   */
  private isPrettyOutput(): boolean {
    const isTTY = process.stdout.isTTY;

    // Handle different types of isTTY values properly
    // - Boolean values: use as-is
    // - String values: convert to boolean, treating common false strings as false
    // - Other values: treat as false
    let isTTYValid = false;

    if (typeof isTTY === 'boolean') {
      isTTYValid = isTTY;
    } else if (typeof isTTY === 'string') {
      // Handle string representations of boolean values
      const lowerIsTTY = (isTTY as string).toLowerCase();
      isTTYValid =
        lowerIsTTY !== 'false' && lowerIsTTY !== '0' && lowerIsTTY !== '';
    } else {
      // For any other type (including undefined), treat as false
      // isTTYValid already initialized to false, no assignment needed
    }

    return Boolean(isTTYValid && !process.env.NO_COLOR);
  }

  /**
   * Logs a debug message.
   *
   * @param {string} message - The message to log
   * @param {Record<string, unknown>} metadata - Optional metadata to include with the message
   * @returns {void} void
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.pinoLogger.debug(metadata, message);
  }

  /**
   * Logs an info message.
   *
   * @param {string} message - The message to log
   * @param {Record<string, unknown>} metadata - Optional metadata to include with the message
   * @returns {void} void
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.pinoLogger.info(metadata, message);
  }

  /**
   * Logs a warning message.
   *
   * @param {string} message - The message to log
   * @param {Record<string, unknown>} metadata - Optional metadata to include with the message
   * @returns {void} void
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.pinoLogger.warn(metadata, message);
  }

  /**
   * Logs an error message.
   *
   * @param {string} message - The message to log
   * @param {Record<string, unknown>} metadata - Optional metadata to include with the message
   * @returns {void} void
   */
  error(message: string, metadata?: Record<string, unknown>): void {
    this.pinoLogger.error(metadata, message);
  }

  /**
   * Logs a fatal error message.
   *
   * @param {string} message - The message to log
   * @param {Record<string, unknown>} metadata - Optional metadata to include with the message
   * @returns {void} void
   */
  fatal(message: string, metadata?: Record<string, unknown>): void {
    this.pinoLogger.fatal(metadata, message);
  }

  /**
   * Creates a child logger with additional bindings.
   *
   * @param {Record<string, unknown>} bindings - Key-value pairs to bind to the child logger
   * @returns {Logger} New child logger instance
   */
  child(bindings: Record<string, unknown>): Logger {
    const childLogger = this.pinoLogger.child(bindings);
    return new PinoLoggerAdapterFromInstance(childLogger);
  }

  /**
   * Gets the current log level.
   *
   * @returns {string} Current log level string
   */
  get level(): string {
    return this.pinoLogger.level;
  }

  /**
   * Gets access to the raw Pino logger instance.
   * Use with caution as this exposes implementation details.
   *
   * @returns {pino.Logger} Raw Pino logger instance
   */
  getRawPinoLogger(): pino.Logger {
    return this.pinoLogger;
  }

  /**
   * Writes a chunk of data (for stream compatibility).
   * Delegates to the underlying Pino logger's write method.
   *
   * @param {any} chunk - The data chunk to write
   */
  write(chunk: unknown): void {
    PinoLoggerUtils.writeToLogger(this.pinoLogger, chunk);
  }
}

/**
 * Shared utility functions for Pino logger operations
 */
class PinoLoggerUtils {
  /**
   * Checks if current environment is a test environment.
   *
   * @returns {boolean} True if running in test environment
   */
  static isTestEnvironment(): boolean {
    return process.env.NODE_ENV === 'test' || process.env.BUN_TEST === '1';
  }

  /**
   * Creates the base Pino configuration with standard formatters.
   *
   * @param {any} level - Log level to use
   * @returns {PinoConfig} Base configuration object
   */
  static createBaseConfig(level: string): PinoConfig {
    return {
      level,
      formatters: {
        level: (label: string) => ({ level: label }),
        log: (object: Record<string, unknown>) => {
          const rest = { ...object };
          // Remove timestamp if it exists to avoid conflicts
          delete rest.timestamp;
          return {
            ...rest,
            timestamp: new Date().toISOString(),
          };
        },
      },
      timestamp: false,
      base: {
        service: 'bun-tts',
        pid: process.pid,
        hostname: 'localhost',
      },
    };
  }

  /**
   * Creates a test-safe child logger without worker thread transports.
   *
   * @param {pino.Logger} parentLogger - The parent Pino logger
   * @returns {pino.Logger} Test-safe child logger instance
   */
  static createTestSafeChildLogger(parentLogger: pino.Logger): pino.Logger {
    const childLogger = pino(
      PinoLoggerUtils.createBaseConfig(parentLogger.level)
    );

    // Copy any bindings from the parent logger
    const bindings = parentLogger.bindings();
    if (bindings && Object.keys(bindings).length > 0) {
      return childLogger.child(bindings);
    }

    return childLogger;
  }

  /**
   * Writes a chunk of data (for stream compatibility).
   * Provides compatibility for the Logger interface when Pino doesn't have a direct write method.
   *
   * @param {pino.Logger} logger - The Pino logger instance
   * @param {any} chunk - The data chunk to write
   */
  static writeToLogger(logger: pino.Logger, chunk: unknown): void {
    // Pino Logger doesn't have a direct write method in all versions
    // This provides compatibility for the Logger interface
    if (!PinoLoggerUtils.isValidLogChunk(chunk)) {
      return;
    }

    try {
      const logEntry = chunk as Record<string, unknown>;
      PinoLoggerUtils.processLogEntry(logger, logEntry);
    } catch {
      // Fallback: ignore write if parsing fails
    }
  }

  /**
   * Validates if the chunk is a valid log entry object.
   *
   * @param {any} chunk - The data chunk to validate
   * @returns {boolean} True if chunk is a valid object for logging
   */
  private static isValidLogChunk(chunk: unknown): boolean {
    return Boolean(chunk && typeof chunk === 'object');
  }

  /**
   * Processes a log entry and writes it to the appropriate logger level.
   *
   * @param {pino.Logger} logger - The Pino logger instance
   * @param {Record<string, unknown>} logEntry - The log entry to process
   */
  private static processLogEntry(
    logger: pino.Logger,
    logEntry: Record<string, unknown>
  ): void {
    if (PinoLoggerUtils.isStructuredLogEntry(logEntry)) {
      PinoLoggerUtils.logWithLevel(logger, logEntry);
    } else if (PinoLoggerUtils.hasMessageField(logEntry)) {
      PinoLoggerUtils.logWithMessage(logger, logEntry);
    }
  }

  /**
   * Checks if the log entry has both level and message fields with proper types.
   *
   * @param {Record<string, unknown>} logEntry - The log entry to check
   * @returns {boolean} True if log entry has valid level and message fields
   */
  private static isStructuredLogEntry(
    logEntry: Record<string, unknown>
  ): boolean {
    return Boolean(
      logEntry.level && logEntry.msg && typeof logEntry.level === 'string'
    );
  }

  /**
   * Checks if the log entry has a message field.
   *
   * @param {Record<string, unknown>} logEntry - The log entry to check
   * @returns {boolean} True if log entry has a message field
   */
  private static hasMessageField(logEntry: Record<string, unknown>): boolean {
    return Boolean(logEntry.msg);
  }

  /**
   * Logs the entry using the specified log level.
   *
   * @param {pino.Logger} logger - The Pino logger instance
   * @param {Record<string, unknown>} logEntry - The log entry to log
   */
  private static logWithLevel(
    logger: pino.Logger,
    logEntry: Record<string, unknown>
  ): void {
    const level = (logEntry.level as string).toLowerCase();
    const msg = logEntry.msg as string;
    const logData = { ...logEntry };

    PinoLoggerUtils.writeToLoggerByLevel(logger, level, msg, logData);
  }

  /**
   * Logs the entry using info level with message and metadata.
   *
   * @param {pino.Logger} logger - The Pino logger instance
   * @param {Record<string, unknown>} logEntry - The log entry to log
   */
  private static logWithMessage(
    logger: pino.Logger,
    logEntry: Record<string, unknown>
  ): void {
    const msg = logEntry.msg as string;
    const metadata = { ...logEntry };
    delete metadata.msg;

    // Fix type error by ensuring correct argument order
    logger.info(metadata, msg);
  }

  /**
   * Writes to the appropriate logger method based on level.
   *
   * @param {pino.Logger} logger - The Pino logger instance
   * @param {any} level - The log level
   * @param {any} msg - The log message
   * @param {Record<string, unknown>} logData - Additional log data
   */
  private static writeToLoggerByLevel(
    logger: pino.Logger,
    level: string,
    msg: string,
    logData: Record<string, unknown>
  ): void {
    switch (level) {
      case 'error':
        logger.error(logData, msg);
        break;
      case 'warn':
        logger.warn(logData, msg);
        break;
      case 'info':
        logger.info(logData, msg);
        break;
      case 'debug':
        logger.debug(logData, msg);
        break;
      case 'trace':
        logger.trace(logData, msg);
        break;
      default:
        logger.info(logData, msg);
        break;
    }
  }
}

/**
 * Helper class for child loggers created from existing Pino instances.
 * Provides special handling for test environments to avoid DataCloneError issues
 * while preserving parent logger bindings and configuration.
 */
class PinoLoggerAdapterFromInstance implements Logger {
  private pinoLogger: pino.Logger;

  /**
   * Creates a new PinoLoggerAdapterFromInstance from an existing Pino logger.
   * Automatically detects test environments and creates safe child loggers.
   *
   * @param {pino.Logger} pinoLogger - The Pino logger instance to wrap
   */
  constructor(pinoLogger: pino.Logger) {
    this.pinoLogger = this.createChildLogger(pinoLogger);
  }

  /**
   * Creates a child logger that is safe for test environments.
   *
   * @param {pino.Logger} parentLogger - The parent Pino logger
   * @returns {pino.Logger} Safe child logger instance
   */
  private createChildLogger(parentLogger: pino.Logger): pino.Logger {
    const isTestEnvironment = PinoLoggerUtils.isTestEnvironment();

    if (isTestEnvironment) {
      return PinoLoggerUtils.createTestSafeChildLogger(parentLogger);
    }

    return parentLogger;
  }

  /**
   * Logs a debug message.
   *
   * @param {string} message - The message to log
   * @param {Record<string, unknown>} metadata - Optional metadata to include with the message
   * @returns {void} void
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.pinoLogger.debug(metadata, message);
  }

  /**
   * Logs an info message.
   *
   * @param {string} message - The message to log
   * @param {Record<string, unknown>} metadata - Optional metadata to include with the message
   * @returns {void} void
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.pinoLogger.info(metadata, message);
  }

  /**
   * Logs a warning message.
   *
   * @param {string} message - The message to log
   * @param {Record<string, unknown>} metadata - Optional metadata to include with the message
   * @returns {void} void
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.pinoLogger.warn(metadata, message);
  }

  /**
   * Logs an error message.
   *
   * @param {string} message - The message to log
   * @param {Record<string, unknown>} metadata - Optional metadata to include with the message
   * @returns {void} void
   */
  error(message: string, metadata?: Record<string, unknown>): void {
    this.pinoLogger.error(metadata, message);
  }

  /**
   * Logs a fatal error message.
   *
   * @param {string} message - The message to log
   * @param {Record<string, unknown>} metadata - Optional metadata to include with the message
   * @returns {void} void
   */
  fatal(message: string, metadata?: Record<string, unknown>): void {
    this.pinoLogger.fatal(metadata, message);
  }

  /**
   * Creates a child logger with additional bindings.
   *
   * @param {Record<string, unknown>} bindings - Key-value pairs to bind to the child logger
   * @returns {Logger} New child logger instance
   */
  child(bindings: Record<string, unknown>): Logger {
    const childLogger = this.pinoLogger.child(bindings);
    return new PinoLoggerAdapterFromInstance(childLogger);
  }

  /**
   * Gets the current log level.
   *
   * @returns {string} Current log level string
   */
  get level(): string {
    return this.pinoLogger.level;
  }

  /**
   * Writes a chunk of data (for stream compatibility).
   * Delegates to the underlying Pino logger's write method.
   *
   * @param {any} chunk - The data chunk to write
   */
  write(chunk: unknown): void {
    PinoLoggerUtils.writeToLogger(this.pinoLogger, chunk);
  }
}
