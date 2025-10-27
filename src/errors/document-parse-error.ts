/**
 * Custom error class for document parsing failures
 */
export class DocumentParseError extends Error {
  public readonly code: string;
  public readonly details: Record<string, unknown>;
  public readonly recoverable: boolean;

  /**
   * Creates a new DocumentParseError instance
   *
   * @param message - Human-readable error message
   * @param code - Machine-readable error code (default: 'PARSE_ERROR')
   * @param details - Additional error context as key-value pairs (default: {})
   * @param recoverable - Whether the error is recoverable (default: false)
   */
  constructor(
    message: string,
    code = 'PARSE_ERROR',
    details: Record<string, unknown> = {},
    recoverable = false
  ) {
    super(message);
    this.name = 'DocumentParseError';
    this.code = code;
    this.details = details;
    this.recoverable = recoverable;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DocumentParseError);
    }
  }

  /**
   * Creates a formatted error message suitable for logging
   *
   * @returns Formatted log message string
   */
  public toLogMessage(): string {
    return `${this.name} [${this.code}]: ${this.message} | Details: ${JSON.stringify(this.details)} | Recoverable: ${this.recoverable}`;
  }

  /**
   * Converts the error to a serializable format suitable for API responses
   *
   * @returns Serializable error object
   */
  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      recoverable: this.recoverable,
      stack: this.stack,
    };
  }
}

/**
 * Specific error class for EPUB parsing failures
 */
export class EPUBParseError extends DocumentParseError {
  /**
   * Creates a new EPUBParseError instance
   *
   * @param message - Human-readable error message
   * @param code - Machine-readable error code (default: 'EPUB_PARSE_ERROR')
   * @param details - Additional error context as key-value pairs (default: {})
   */
  constructor(
    message: string,
    code = 'EPUB_PARSE_ERROR',
    details: Record<string, unknown> = {}
  ) {
    super(message, code, details);
    this.name = 'EPUBParseError';
  }
}

/**
 * Error thrown when EPUB file format is invalid or corrupted
 */
export class EPUBFormatError extends EPUBParseError {
  /**
   * Creates a new EPUBFormatError instance
   *
   * @param details - Additional error context as key-value pairs (default: {})
   */
  constructor(details: Record<string, unknown> = {}) {
    super('Invalid EPUB file format', 'EPUB_FORMAT_ERROR', details);
    this.name = 'EPUBFormatError';
  }
}

/**
 * Error thrown when EPUB file structure is invalid or malformed
 */
export class EPUBStructureError extends EPUBParseError {
  /**
   * Creates a new EPUBStructureError instance
   *
   * @param details - Additional error context as key-value pairs (default: {})
   */
  constructor(details: Record<string, unknown> = {}) {
    super('Invalid EPUB structure', 'EPUB_STRUCTURE_ERROR', details);
    this.name = 'EPUBStructureError';
  }
}

/**
 * Error thrown when EPUB file is encrypted and cannot be processed
 */
export class EPUBEncryptionError extends EPUBParseError {
  /**
   * Creates a new EPUBEncryptionError instance
   *
   * @param details - Additional error context as key-value pairs (default: {})
   */
  constructor(details: Record<string, unknown> = {}) {
    super('EPUB file is encrypted', 'EPUB_ENCRYPTION_ERROR', details);
    this.name = 'EPUBEncryptionError';
  }
}

/**
 * Error thrown when EPUB version is not supported
 */
export class EPUBVersionError extends EPUBParseError {
  /**
   * Creates a new EPUBVersionError instance
   *
   * @param version - The unsupported EPUB version
   * @param details - Additional error context as key-value pairs (default: {})
   */
  constructor(version: string, details: Record<string, unknown> = {}) {
    super(`Unsupported EPUB version: ${version}`, 'EPUB_VERSION_ERROR', {
      version,
      ...details,
    });
    this.name = 'EPUBVersionError';
  }
}
