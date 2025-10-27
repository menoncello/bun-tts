import type { BunTtsError } from '../types/index.js';

/**
 * Configuration interface for BunTtsBaseError constructor.
 */
interface BunTtsBaseErrorConfig {
  /** Whether the error can be recovered from */
  recoverable?: boolean;
  /** Additional context information about the error */
  details?: Record<string, unknown>;
}

/**
 * Base error class for all bun-tts specific errors.
 * Implements the BunTtsError interface and extends the native Error class.
 * Provides common functionality for error handling, categorization, and serialization.
 */
export class BunTtsBaseError extends Error implements BunTtsError {
  /** Unique error code for programmatic error handling */
  public readonly code: string;
  /** Error category for grouping similar types of errors */
  public readonly category: BunTtsError['category'];
  /** Additional details about the error context */
  public readonly details?: Record<string, unknown>;
  /** Whether the error is recoverable or should terminate execution */
  public readonly recoverable: boolean;

  /**
   * Creates a new BunTtsBaseError instance.
   *
   * @param message - Human-readable error message
   * @param code - Unique error identifier for programmatic handling
   * @param category - The category this error belongs to
   * @param config - Configuration options for the error
   */
  constructor(
    message: string,
    code: string,
    category: BunTtsError['category'],
    config?: BunTtsBaseErrorConfig
  ) {
    super(message);
    this.name = 'BunTtsBaseError';
    this.code = code;
    this.category = category;
    this.recoverable = config?.recoverable ?? true;
    this.details = config?.details;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BunTtsBaseError);
    }
  }

  /**
   * Serializes the error to a JSON object for logging or API responses.
   *
   * @returns A JSON representation of the error
   */
  toJSON(): BunTtsError {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      details: this.details,
      recoverable: this.recoverable,
      stack: this.stack,
    };
  }
}

// Configuration errors

/**
 * Base class for all configuration-related errors.
 * Extends BunTtsBaseError with configuration-specific handling.
 */
export class ConfigurationError extends BunTtsBaseError {
  /**
   * Creates a new ConfigurationError instance.
   *
   * @param message - Human-readable error message describing the configuration issue
   * @param details - Additional context information about the configuration error
   */
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFIG_ERROR', 'configuration', { recoverable: false, details });
    this.name = 'ConfigurationError';
  }
}

/**
 * Error thrown when configuration values are invalid or malformed.
 * Provides specific information about what went wrong with the configuration.
 */
export class InvalidConfigError extends ConfigurationError {
  /**
   * Creates a new InvalidConfigError instance.
   *
   * @param configPath - Path to the configuration file that contains invalid data
   * @param reason - Specific reason why the configuration is invalid
   */
  constructor(configPath: string, reason: string) {
    super(`Invalid configuration at ${configPath}: ${reason}`, {
      configPath,
      reason,
    });
    this.name = 'InvalidConfigError';
  }
}

/**
 * Error thrown when a required configuration file is missing.
 * Helps identify missing configuration dependencies.
 */
export class MissingConfigError extends ConfigurationError {
  /**
   * Creates a new MissingConfigError instance.
   *
   * @param configPath - Path to the missing configuration file
   */
  constructor(configPath: string) {
    super(`Configuration file not found: ${configPath}`, { configPath });
    this.name = 'MissingConfigError';
  }
}

// Document parsing errors

/**
 * Base class for all document parsing-related errors.
 * Extends BunTtsBaseError with document parsing-specific handling.
 */
export class DocumentParsingError extends BunTtsBaseError {
  /**
   * Creates a new DocumentParsingError instance.
   *
   * @param message - Human-readable error message describing the parsing issue
   * @param filePath - Path to the file that failed to parse
   * @param details - Additional context information about the parsing error
   */
  constructor(
    message: string,
    filePath?: string,
    details?: Record<string, unknown>
  ) {
    super(message, 'DOC_PARSE_ERROR', 'parsing', {
      recoverable: true,
      details: { filePath, ...details },
    });
    this.name = 'DocumentParsingError';
  }
}

/**
 * Error thrown when attempting to parse an unsupported document format.
 * Helps identify format compatibility issues.
 */
export class UnsupportedFormatError extends DocumentParsingError {
  /**
   * Creates a new UnsupportedFormatError instance.
   *
   * @param format - The unsupported format that was attempted
   * @param filePath - Path to the file with the unsupported format
   */
  constructor(format: string, filePath?: string) {
    super(`Unsupported document format: ${format}`, filePath, { format });
    this.name = 'UnsupportedFormatError';
  }
}

// TTS errors

/**
 * Base class for all text-to-speech (TTS) related errors.
 * Extends BunTtsBaseError with TTS-specific handling and engine information.
 */
export class TTSError extends BunTtsBaseError {
  /**
   * Creates a new TTSError instance.
   *
   * @param message - Human-readable error message describing the TTS issue
   * @param engine - The TTS engine that was being used when the error occurred
   * @param details - Additional context information about the TTS error
   */
  constructor(
    message: string,
    engine?: string,
    details?: Record<string, unknown>
  ) {
    super(message, 'TTS_ERROR', 'tts', {
      recoverable: true,
      details: { engine, ...details },
    });
    this.name = 'TTSError';
  }
}

/**
 * Error thrown when a requested voice is not found in the TTS engine.
 * Provides specific information about the missing voice and engine.
 */
export class VoiceNotFoundError extends TTSError {
  /**
   * Creates a new VoiceNotFoundError instance.
   *
   * @param voice - The name of the voice that was not found
   * @param engine - The TTS engine where the voice was searched for
   */
  constructor(voice: string, engine: string) {
    super(`Voice "${voice}" not found in ${engine} engine`, engine, { voice });
    this.name = 'VoiceNotFoundError';
  }
}

/**
 * Error thrown when audio generation fails during TTS processing.
 * Provides details about the failure and the text being processed.
 */
export class AudioGenerationError extends TTSError {
  /**
   * Creates a new AudioGenerationError instance.
   *
   * @param message - Human-readable error message describing the audio generation issue
   * @param text - The text that was being processed when the error occurred
   * @param details - Additional context information about the audio generation error
   */
  constructor(
    message: string,
    text?: string,
    details?: Record<string, unknown>
  ) {
    super(`Audio generation failed: ${message}`, undefined, {
      text,
      ...details,
    });
    this.name = 'AudioGenerationError';
  }
}

// File system errors

/**
 * Base class for all file system-related errors.
 * Extends BunTtsBaseError with file-specific handling and operation information.
 */
export class FileError extends BunTtsBaseError {
  /**
   * Creates a new FileError instance.
   *
   * @param message - Human-readable error message describing the file issue
   * @param filePath - Path to the file that caused the error
   * @param operation - The file operation that was being attempted
   */
  constructor(message: string, filePath?: string, operation?: string) {
    super(message, 'FILE_ERROR', 'file', {
      recoverable: true,
      details: { filePath, operation },
    });
    this.name = 'FileError';
  }
}

/**
 * Error thrown when a required file is not found.
 * Provides specific information about the missing file path.
 */
export class FileNotFoundError extends FileError {
  /**
   * Creates a new FileNotFoundError instance.
   *
   * @param filePath - Path to the file that was not found
   */
  constructor(filePath: string) {
    super(`File not found: ${filePath}`, filePath, 'read');
    this.name = 'FileNotFoundError';
  }
}

/**
 * Error thrown when file permissions prevent an operation.
 * Provides details about the permission issue and operation being attempted.
 */
export class FilePermissionError extends FileError {
  /**
   * Creates a new FilePermissionError instance.
   *
   * @param filePath - Path to the file with permission issues
   * @param operation - The operation that was denied due to permissions
   */
  constructor(filePath: string, operation: string) {
    super(
      `Permission denied for ${operation}: ${filePath}`,
      filePath,
      operation
    );
    this.name = 'FilePermissionError';
  }
}

// Validation errors

/**
 * Base class for all validation-related errors.
 * Extends BunTtsBaseError with validation-specific handling and field information.
 */
export class ValidationError extends BunTtsBaseError {
  /**
   * Creates a new ValidationError instance.
   *
   * @param message - Human-readable error message describing the validation issue
   * @param field - The name of the field that failed validation
   * @param value - The value that failed validation
   */
  constructor(message: string, field?: string, value?: unknown) {
    super(message, 'VALIDATION_ERROR', 'validation', {
      recoverable: false,
      details: { field, value },
    });
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when function arguments are invalid.
 * Provides specific information about the invalid argument and why it's invalid.
 */
export class InvalidArgumentError extends ValidationError {
  /**
   * Creates a new InvalidArgumentError instance.
   *
   * @param argument - The name of the invalid argument
   * @param reason - The reason why the argument is invalid
   */
  constructor(argument: string, reason: string) {
    super(`Invalid argument "${argument}": ${reason}`, argument, reason);
    this.name = 'InvalidArgumentError';
  }
}

// Result pattern for functional error handling

/**
 * Result type for functional error handling.
 * Represents either a successful operation with data or a failed operation with an error.
 * This pattern enables explicit error handling without throwing exceptions.
 *
 * @template T - The type of the success value
 * @template E - The type of the error, defaults to BunTtsError
 */
export type Result<T, E = BunTtsError> = Success<T> | Failure<E>;

/**
 * Interface representing a successful Result containing data.
 *
 * @template T - The type of the success data
 */
export interface Success<T> {
  /** Indicates that the operation was successful */
  readonly success: true;
  /** The success data */
  readonly data: T;
  /** Undefined for successful results */
  readonly error?: undefined;
}

/**
 * Interface representing a failed Result containing an error.
 *
 * @template E - The type of the error
 */
export interface Failure<E> {
  /** Indicates that the operation failed */
  readonly success: false;
  /** Undefined for failed results */
  readonly data?: undefined;
  /** The error that occurred */
  readonly error: E;
}

// Result constructors

/**
 * Creates a successful Result containing the provided data.
 *
 * @template T - The type of the data
 * @param data - The success value to wrap in a Result
 * @returns A Result representing success
 */
export const success = <T>(data: T): Success<T> => ({
  success: true,
  data,
});

/**
 * Creates a failed Result containing the provided error.
 *
 * @template E - The type of the error
 * @param error - The error to wrap in a Result
 * @returns A Result representing failure
 */
export const failure = <E>(error: E): Failure<E> => ({
  success: false,
  error,
});

// Result utility functions

/**
 * Type guard that checks if a Result is successful.
 *
 * @template T - The success data type
 * @template E - The error type
 * @param result - The Result to check
 * @returns True if the Result is successful
 */
export const isSuccess = <T, E>(result: Result<T, E>): result is Success<T> =>
  result.success;

/**
 * Type guard that checks if a Result is a failure.
 *
 * @template T - The success data type
 * @template E - The error type
 * @param result - The Result to check
 * @returns True if the Result is a failure
 */
export const isFailure = <T, E>(result: Result<T, E>): result is Failure<E> =>
  !result.success;

/**
 * Maps over a successful Result, applying a transformation function to the data.
 * If the Result is a failure, it passes through unchanged.
 *
 * @template T - The original data type
 * @template U - The transformed data type
 * @template E - The error type
 * @param result - The Result to map over
 * @param fn - The transformation function to apply to successful data
 * @returns A new Result with transformed data or the original error
 */
export const map = <T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> => (result.success ? success(fn(result.data)) : result);

/**
 * Maps over a failed Result, applying a transformation function to the error.
 * If the Result is successful, it passes through unchanged.
 *
 * @template T - The success data type
 * @template E - The original error type
 * @template F - The transformed error type
 * @param result - The Result to map over
 * @param fn - The transformation function to apply to the error
 * @returns A new Result with transformed error or the original success
 */
export const mapError = <T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> => (result.success ? result : failure(fn(result.error)));

/**
 * Chains operations on Results, allowing sequential operations that may fail.
 * If the Result is successful, applies the function that returns a new Result.
 * If the Result is a failure, it passes through unchanged.
 *
 * @template T - The original data type
 * @template U - The new data type
 * @template E - The error type
 * @param result - The Result to chain operations on
 * @param fn - A function that takes successful data and returns a new Result
 * @returns A new Result from the chained operation or the original error
 */
export const chain = <T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>
): Result<U, E> => (result.success ? fn(result.data) : result);
