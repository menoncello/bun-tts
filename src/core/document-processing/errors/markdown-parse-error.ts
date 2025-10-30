/**
 * Custom error class for Markdown parsing failures.
 * Extends the base BunTtsError with parsing-specific details.
 */

import { BunTtsError } from '../../../errors/bun-tts-error.js';

/**
 * Error codes for different types of Markdown parsing failures
 */
export const MARKDOWN_PARSE_ERROR_CODES = {
  /** Invalid Markdown syntax */
  INVALID_SYNTAX: 'INVALID_SYNTAX',
  /** Malformed header structure */
  MALFORMED_HEADER: 'MALFORMED_HEADER',
  /** Unclosed code block */
  UNCLOSED_CODE_BLOCK: 'UNCLOSED_CODE_BLOCK',
  /** Invalid table format */
  INVALID_TABLE: 'INVALID_TABLE',
  /** Malformed list structure */
  MALFORMED_LIST: 'MALFORMED_LIST',
  /** Nested structure too deep */
  NESTING_TOO_DEEP: 'NESTING_TOO_DEEP',
  /** File too large for processing */
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  /** Encoding issues */
  ENCODING_ERROR: 'ENCODING_ERROR',
  /** Memory allocation failed */
  MEMORY_ERROR: 'MEMORY_ERROR',
  /** Generic parsing failure */
  PARSE_FAILED: 'PARSE_FAILED',
  /** Low confidence in structure detection */
  LOW_CONFIDENCE: 'LOW_CONFIDENCE',
  /** Invalid input type */
  INVALID_INPUT: 'INVALID_INPUT',
} as const;

/**
 * Markdown parse error codes type
 */
export type MarkdownParseErrorCode = keyof typeof MARKDOWN_PARSE_ERROR_CODES;

/**
 * Location where parsing error occurred
 */
export interface ErrorLocation {
  /** Line number where error occurred */
  line: number;
  /** Column number where error occurred */
  column: number;
  /** Optional context information about the error */
  context?: string;
}

/**
 * Configuration for MarkdownParseError
 */
export interface MarkdownParseErrorConfig {
  /** Location where error occurred */
  location?: ErrorLocation;
  /** Confidence score (0-1) */
  confidence?: number;
  /** Original error that caused this failure */
  cause?: Error;
}

/**
 * Custom error class for Markdown parsing failures
 */
export class MarkdownParseError extends BunTtsError {
  /** Error category (always 'parsing' for this class) */
  public override readonly category: 'parsing';

  /** Specific error code for categorization */
  public override readonly code: MarkdownParseErrorCode;

  /** Location where parsing error occurred */
  public readonly location?: ErrorLocation;

  /** Confidence score that this is actually an error (0-1) */
  public readonly confidence: number;

  /**
   * Create a new MarkdownParseError
   *
   * @param {any} code - Error code from MARKDOWN_PARSE_ERROR_CODES
   * @param {string} message - Human-readable error message
   * @param {object} config - Error configuration options
   * @returns {MarkdownParseError} A new MarkdownParseError instance
   */
  constructor(
    code: MarkdownParseErrorCode,
    message: string,
    config?: MarkdownParseErrorConfig
  ) {
    const { location, confidence = 1.0, cause } = config || {};
    const formattedMessage = location
      ? `${message} (Line ${location.line}, Column ${location.column})`
      : message;

    super(formattedMessage, {
      code: MARKDOWN_PARSE_ERROR_CODES[code],
      category: 'parsing',
      recoverable: false,
      details: cause ? { cause: cause.message } : undefined,
    });

    this.name = 'MarkdownParseError';
    this.category = 'parsing';
    this.code = code;
    this.location = location;
    this.confidence = Math.max(0, Math.min(1, confidence));

    // Store cause manually for access
    if (cause) {
      (this as { cause?: Error }).cause = cause;
    }

    // Maintain proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MarkdownParseError);
    }
  }

  /**
   * Create error for invalid syntax
   *
   * @param {string} message - Description of syntax issue
   * @param {ErrorLocation} location - Location of syntax error
   * @param {any} _confidence - Confidence score
   * @returns {MarkdownParseError} A new MarkdownParseError instance
   */
  static invalidSyntax(
    message: string,
    location?: ErrorLocation,
    _confidence = 1.0
  ): MarkdownParseError {
    return new MarkdownParseError(
      'INVALID_SYNTAX',
      `Invalid Markdown syntax: ${message}`,
      { location, confidence: _confidence }
    );
  }

  /**
   * Create error for malformed header
   *
   * @param {string} message - Description of header issue
   * @param {ErrorLocation} location - Location of header error
   * @returns {MarkdownParseError} A new MarkdownParseError instance
   */
  static malformedHeader(
    message: string,
    location?: ErrorLocation
  ): MarkdownParseError {
    return new MarkdownParseError(
      'MALFORMED_HEADER',
      `Malformed header: ${message}`,
      { location }
    );
  }

  /**
   * Create error for unclosed code block
   *
   * @param {ErrorLocation} location - Location where code block starts
   * @returns {MarkdownParseError} A new MarkdownParseError instance
   */
  static unclosedCodeBlock(location?: ErrorLocation): MarkdownParseError {
    return new MarkdownParseError(
      'UNCLOSED_CODE_BLOCK',
      'Unclosed code block detected',
      { location }
    );
  }

  /**
   * Create error for invalid table format
   *
   * @param {string} message - Description of table issue
   * @param {ErrorLocation} location - Location of table error
   * @returns {MarkdownParseError} A new MarkdownParseError instance
   */
  static invalidTable(
    message: string,
    location?: ErrorLocation
  ): MarkdownParseError {
    return new MarkdownParseError(
      'INVALID_TABLE',
      `Invalid table format: ${message}`,
      { location }
    );
  }

  /**
   * Create error for malformed list
   *
   * @param {string} message - Description of list issue
   * @param {ErrorLocation} location - Location of list error
   * @returns {MarkdownParseError} A new MarkdownParseError instance
   */
  static malformedList(
    message: string,
    location?: ErrorLocation
  ): MarkdownParseError {
    return new MarkdownParseError(
      'MALFORMED_LIST',
      `Malformed list: ${message}`,
      { location }
    );
  }

  /**
   * Create error for structure nesting too deep
   *
   * @param {string} message - Description of nesting issue
   * @param {ErrorLocation} location - Location of nesting error
   * @returns {MarkdownParseError} A new MarkdownParseError instance
   */
  static nestingTooDeep(
    message: string,
    location?: ErrorLocation
  ): MarkdownParseError {
    return new MarkdownParseError(
      'NESTING_TOO_DEEP',
      `Structure nesting too deep: ${message}`,
      { location }
    );
  }

  /**
   * Create error for file too large
   *
   * @param {number} size - File size in bytes
   * @param {number} maxSize - Maximum allowed size
   * @returns {MarkdownParseError} A new MarkdownParseError instance
   */
  static fileTooLarge(size: number, maxSize: number): MarkdownParseError {
    return new MarkdownParseError(
      'FILE_TOO_LARGE',
      `File too large: ${size} bytes (max: ${maxSize} bytes)`
    );
  }

  /**
   * Create error for encoding issues
   *
   * @param {string} message - Description of encoding issue
   * @param {Error} cause - Original encoding error
   * @returns {MarkdownParseError} A new MarkdownParseError instance
   */
  static encodingError(message: string, cause?: Error): MarkdownParseError {
    return new MarkdownParseError(
      'ENCODING_ERROR',
      `Encoding error: ${message}`,
      { cause }
    );
  }

  /**
   * Create error for memory allocation failure
   *
   * @param {string} message - Description of memory issue
   * @param {Error} cause - Original memory error
   * @returns {MarkdownParseError} A new MarkdownParseError instance
   */
  static memoryError(message: string, cause?: Error): MarkdownParseError {
    return new MarkdownParseError('MEMORY_ERROR', `Memory error: ${message}`, {
      cause,
    });
  }

  /**
   * Create generic parse failure error
   *
   * @param {string} message - Description of failure
   * @param {Error} cause - Original error
   * @returns {MarkdownParseError} A new MarkdownParseError instance
   */
  static parseFailed(message: string, cause?: Error): MarkdownParseError {
    return new MarkdownParseError('PARSE_FAILED', `Parse failed: ${message}`, {
      cause,
    });
  }

  /**
   * Create error for low confidence in structure detection
   *
   * @param {number} confidence - Actual confidence score
   * @param {number} threshold - Required threshold
   * @param {ErrorLocation} location - Location where low confidence detected
   * @returns {MarkdownParseError} A new MarkdownParseError instance
   */
  static lowConfidence(
    confidence: number,
    threshold: number,
    location?: ErrorLocation
  ): MarkdownParseError {
    return new MarkdownParseError(
      'LOW_CONFIDENCE',
      `Low confidence in structure detection: ${confidence} (threshold: ${threshold})`,
      { location, confidence }
    );
  }

  /**
   * Create error for invalid input type
   *
   * @param {any} inputType - The invalid input type received
   * @param {any} expectedType - Expected input type
   * @returns {MarkdownParseError} A new MarkdownParseError instance
   */
  static invalidInput(
    inputType: string,
    expectedType: string
  ): MarkdownParseError {
    return new MarkdownParseError(
      'INVALID_INPUT',
      `Invalid input type: ${inputType} (expected: ${expectedType})`
    );
  }

  /**
   * Get a user-friendly description of this error
   *
   * @returns {string} User-friendly error description
   */
  getUserDescription(): string {
    const descriptions: Record<MarkdownParseErrorCode, string> = {
      INVALID_SYNTAX:
        'The Markdown file contains invalid syntax that cannot be parsed.',
      MALFORMED_HEADER:
        'A chapter header is malformed and cannot be recognized.',
      UNCLOSED_CODE_BLOCK: 'A code block was opened but never properly closed.',
      INVALID_TABLE:
        'A table has formatting errors that prevent proper parsing.',
      MALFORMED_LIST:
        'A list has formatting errors that prevent proper parsing.',
      NESTING_TOO_DEEP:
        'The document has too many nested levels to process safely.',
      FILE_TOO_LARGE: 'The file is too large to process efficiently.',
      ENCODING_ERROR:
        'The file has encoding issues that prevent proper reading.',
      MEMORY_ERROR: 'There was insufficient memory to process the document.',
      LOW_CONFIDENCE:
        'The parser is not confident about the document structure.',
      INVALID_INPUT: 'The input provided to the parser is invalid.',
      PARSE_FAILED: 'An error occurred while parsing the Markdown document.',
    };

    return descriptions[this.code] || descriptions.PARSE_FAILED;
  }

  /**
   * Get suggested actions to resolve this error
   *
   * @returns {string[]} Array of suggested actions to resolve the error
   */
  getSuggestedActions(): string[] {
    const actionMap = this.getActionMap();
    return actionMap[this.code] || actionMap.default;
  }

  /**
   * Get the complete action mapping for all error codes
   *
   * @returns {Record<MarkdownParseErrorCode | 'default', string[]>} Record mapping error codes to their suggested actions
   */
  private getActionMap(): Record<MarkdownParseErrorCode | 'default', string[]> {
    const syntaxActions = this.getSyntaxActions();
    const actionMap: Record<string, string[]> = {
      INVALID_SYNTAX: syntaxActions,
      MALFORMED_HEADER: syntaxActions,
      INVALID_TABLE: syntaxActions,
      MALFORMED_LIST: syntaxActions,
      default: this.getDefaultActions(),
    };

    // Add specialized actions for specific error codes
    actionMap.UNCLOSED_CODE_BLOCK = this.getCodeBlockActions();
    actionMap.NESTING_TOO_DEEP = this.getNestingActions();
    actionMap.FILE_TOO_LARGE = this.getFileActions();
    actionMap.LOW_CONFIDENCE = this.getConfidenceActions();
    actionMap.ENCODING_ERROR = this.getEncodingActions();
    actionMap.MEMORY_ERROR = this.getDefaultActions();
    actionMap.PARSE_FAILED = this.getDefaultActions();
    actionMap.INVALID_INPUT = this.getDefaultActions();

    return actionMap as Record<MarkdownParseErrorCode | 'default', string[]>;
  }

  /**
   * Get syntax-related error actions
   *
   * @returns {string[]} Array of syntax-related actions
   */
  private getSyntaxActions(): string[] {
    return [
      'Check the Markdown syntax at the specified location',
      'Validate the file with a Markdown linter',
      'Fix any formatting issues manually',
    ];
  }

  /**
   * Get code block error actions
   *
   * @returns {string[]} Array of code block-related actions
   */
  private getCodeBlockActions(): string[] {
    return [
      'Add proper closing code block markers (```)',
      'Check for missing backticks',
      'Ensure code blocks are properly nested',
    ];
  }

  /**
   * Get nesting error actions
   *
   * @returns {string[]} Array of nesting-related actions
   */
  private getNestingActions(): string[] {
    return [
      'Simplify the document structure',
      'Reduce nesting levels',
      'Break into smaller documents',
    ];
  }

  /**
   * Get file-related error actions
   *
   * @returns {string[]} Array of file-related actions
   */
  private getFileActions(): string[] {
    return [
      'Split the document into smaller files',
      'Enable streaming mode if available',
      'Reduce file size by removing unnecessary content',
    ];
  }

  /**
   * Get confidence error actions
   *
   * @returns {string[]} Array of confidence-related actions
   */
  private getConfidenceActions(): string[] {
    return [
      'Improve document structure and formatting',
      'Add clear chapter headers',
      'Use consistent Markdown formatting',
    ];
  }

  /**
   * Get encoding error actions
   *
   * @returns {string[]} Array of encoding-related actions
   */
  private getEncodingActions(): string[] {
    return [
      'Check file encoding (should be UTF-8)',
      'Convert file to proper encoding',
      'Remove special characters if necessary',
    ];
  }

  /**
   * Get default error actions
   *
   * @returns {string[]} Array of default actions
   */
  private getDefaultActions(): string[] {
    return [
      'Check the input file format',
      'Try with a simpler document',
      'Report the issue if it persists',
    ];
  }
}
