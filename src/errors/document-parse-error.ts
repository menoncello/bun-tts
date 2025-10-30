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
   * @param {string} message - Human-readable error message
   * @param {string} code - Machine-readable error code (default: 'PARSE_ERROR')
   * @param {Record<string, unknown>} details - Additional error context as key-value pairs (default: {})
   * @param {boolean} recoverable - Whether the error is recoverable (default: false)
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
   * Returns string representation including error code for test compatibility
   * @returns {string} String representation of the error
   */
  public override toString(): string {
    return `${this.name}: ${this.message} (${this.code})`;
  }

  /**
   * Returns string representation with error code for logging
   * @returns {string} String representation with error code
   */
  public toStringWithCode(): string {
    return `${this.name}: ${this.message} (${this.code})`;
  }

  /**
   * Creates a formatted error message suitable for logging
   *
   * @returns {any} Formatted log message string
   */
  public toLogMessage(): string {
    return `${this.name} [${this.code}]: ${this.message} | Details: ${JSON.stringify(this.details)} | Recoverable: ${this.recoverable}`;
  }

  /**
   * Converts the error to a serializable format suitable for API responses
   *
   * @returns {any} Serializable error object
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
   * @param {string} message - Human-readable error message
   * @param {string} code - Machine-readable error code (default: 'EPUB_PARSE_ERROR')
   * @param {Record<string, unknown>} details - Additional error context as key-value pairs (default: {})
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
   * @param {string | Record<string, unknown>} messageOrDetails - Error message or details object
   * @param {Record<string, unknown>} details - Additional error context as key-value pairs (default: {})
   */
  constructor(
    messageOrDetails?: string | Record<string, unknown>,
    details: Record<string, unknown> = {}
  ) {
    let message: string;
    let finalDetails: Record<string, unknown>;

    if (typeof messageOrDetails === 'string') {
      message = messageOrDetails;
      finalDetails = details;
    } else {
      message = 'Invalid EPUB file format';
      finalDetails = messageOrDetails || {};
    }

    super(message, 'EPUB_FORMAT_ERROR', finalDetails);
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
   * @param {Record<string, unknown>} details - Additional error context as key-value pairs (default: {})
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
   * @param {Record<string, unknown>} details - Additional error context as key-value pairs (default: {})
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
   * @param {string} version - The unsupported EPUB version
   * @param {Record<string, unknown>} details - Additional error context as key-value pairs (default: {})
   */
  constructor(version: string, details: Record<string, unknown> = {}) {
    super(`Unsupported EPUB version: ${version}`, 'EPUB_VERSION_ERROR', {
      version,
      ...details,
    });
    this.name = 'EPUBVersionError';
  }
}
