/**
 * Options for creating a BunTtsError instance.
 */
export interface BunTtsErrorOptions {
  /** Unique error identifier for programmatic handling */
  code: string;
  /** The category this error belongs to */
  category: BunTtsError['category'];
  /** Whether error can be recovered from (default: true) */
  recoverable?: boolean;
  /** Additional context information about error */
  details?: Record<string, unknown>;
}

/**
 * Base error class for all bun-tts specific errors.
 * Extends the native Error class with additional properties for error handling.
 */
export class BunTtsError extends Error {
  /** Unique error code for programmatic error handling */
  public readonly code: string;
  /** Error category for grouping similar types of errors */
  public readonly category:
    | 'configuration'
    | 'parsing'
    | 'tts'
    | 'file'
    | 'validation';
  /** Additional details about error context */
  public readonly details?: Record<string, unknown>;
  /** Whether error is recoverable or should terminate execution */
  public readonly recoverable: boolean;

  /**
   * Creates a new BunTtsError instance.
   *
   * @param message - Human-readable error message
   * @param options - Configuration options for the error
   */
  constructor(message: string, options: BunTtsErrorOptions) {
    super(message);
    this.name = 'BunTtsError';
    this.code = options.code;
    this.category = options.category;
    this.recoverable = options.recoverable ?? true;
    this.details = options.details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BunTtsError);
    }
  }

  /**
   * Gets a user-friendly error message that includes the error code.
   *
   * @returns A formatted error message with code
   */
  public getUserMessage(): string {
    return `${this.message} (Error code: ${this.code})`;
  }

  /**
   * Determines whether this error should be logged with full details.
   *
   * @returns True if the error should be logged with full details
   */
  public shouldLogDetails(): boolean {
    return true;
  }

  /**
   * Serializes the error to a JSON object for logging or API responses.
   *
   * @returns A JSON representation of the error
   */
  public toJSON(): Record<string, unknown> {
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

  /**
   * Gets the exit code for CLI applications when this error occurs.
   *
   * @returns The exit code (1 for general error)
   */
  public getExitCode(): number {
    return 1;
  }
}
