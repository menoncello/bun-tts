/**
 * Custom error class for PDF parsing failures.
 * Extends the base BunTtsError with PDF parsing-specific details.
 */

import { BunTtsError } from './bun-tts-error.js';
import { PdfParseErrorActionHandler } from './pdf-parse-error-actions-handlers.js';
import {
  PDF_PARSE_ERROR_CODES,
  type PdfParseErrorCode,
} from './pdf-parse-error-codes.js';
import { PdfParseErrorFactory } from './pdf-parse-error-factory.js';
import type {
  ErrorLocation,
  PdfParseErrorConfig,
} from './pdf-parse-error-types.js';
import { PdfParseErrorUtils } from './pdf-parse-error-utils.js';

// Re-export the error codes and type for backward compatibility
export { PDF_PARSE_ERROR_CODES, type PdfParseErrorCode };
export type { ErrorLocation, PdfParseErrorConfig };

/**
 * Custom error class for PDF parsing failures
 */
export class PdfParseError extends BunTtsError {
  /** Error category (always 'parsing' for this class) */
  public override readonly category = 'parsing' as const;

  /** Specific error code for categorization */
  public override readonly code: PdfParseErrorCode;

  /** Location where parsing error occurred */
  public readonly location?: ErrorLocation;

  /** Confidence score that this is actually an error (0-1) */
  public readonly confidence: number;

  /** PDF stream information if relevant */
  public readonly streamInfo?: PdfParseErrorConfig['streamInfo'];

  /**
   * Creates a new PDF parse error instance
   * @param {PdfParseErrorCode} code - Error code identifying the type of error
   * @param {string} message - Human-readable error message
   * @param {PdfParseErrorConfig} [config] - Optional error configuration
   */
  constructor(
    code: PdfParseErrorCode,
    message: string,
    config?: PdfParseErrorConfig
  ) {
    const { location, confidence = 1.0, cause, streamInfo } = config || {};

    const formattedMessage = PdfParseErrorUtils.formatErrorMessage(
      message,
      location
    );

    super(formattedMessage, {
      code: PDF_PARSE_ERROR_CODES[code],
      category: 'parsing' as const,
      recoverable: false,
      details: cause ? { cause: cause.message } : undefined,
    });

    this.name = 'PdfParseError';
    this.code = code;
    this.location = location;
    this.confidence = PdfParseErrorUtils.normalizeConfidence(confidence);
    this.streamInfo = streamInfo;

    // Store cause manually for access
    if (cause) {
      (this as { cause?: Error }).cause = cause;
    }

    // Maintain proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PdfParseError);
    }
  }

  /**
   * Create error for invalid PDF format
   * @param {string} message - Error message describing the invalid format
   * @param {ErrorLocation} [location] - Location where the error occurred
   * @param {Error} [cause] - Original error that caused this issue
   * @returns {PdfParseError} New PdfParseError instance
   */
  static invalidPdf(
    message: string,
    location?: ErrorLocation,
    cause?: Error
  ): PdfParseError {
    return PdfParseErrorFactory.invalidPdf(message, location, cause);
  }

  /**
   * Create error for password-protected PDF
   * @param {ErrorLocation} [location] - Location where the error occurred
   * @returns {PdfParseError} New PdfParseError instance
   */
  static passwordProtected(location?: ErrorLocation): PdfParseError {
    return PdfParseErrorFactory.passwordProtected(location);
  }

  /**
   * Create error for encrypted content
   * @param {ErrorLocation} [location] - Location where the error occurred
   * @returns {PdfParseError} New PdfParseError instance
   */
  static encryptedContent(location?: ErrorLocation): PdfParseError {
    return PdfParseErrorFactory.encryptedContent(location);
  }

  /**
   * Create error for unsupported PDF version
   * @param {string} version - The unsupported PDF version
   * @param {ErrorLocation} [location] - Location where the error occurred
   * @returns {PdfParseError} New PdfParseError instance
   */
  static unsupportedVersion(
    version: string,
    location?: ErrorLocation
  ): PdfParseError {
    return PdfParseErrorFactory.unsupportedVersion(version, location);
  }

  /**
   * Create error for malformed PDF structure
   * @param {string} message - Error message describing the malformed structure
   * @param {ErrorLocation} [location] - Location where the error occurred
   * @param {Error} [cause] - Original error that caused this issue
   * @returns {PdfParseError} New PdfParseError instance
   */
  static malformedStructure(
    message: string,
    location?: ErrorLocation,
    cause?: Error
  ): PdfParseError {
    return PdfParseErrorFactory.malformedStructure(message, location, cause);
  }

  /**
   * Create error for missing PDF objects
   * @param {string[]} objectTypes - Array of missing object types
   * @param {ErrorLocation} [location] - Location where the error occurred
   * @returns {PdfParseError} New PdfParseError instance
   */
  static missingObjects(
    objectTypes: string[],
    location?: ErrorLocation
  ): PdfParseError {
    return PdfParseErrorFactory.missingObjects(objectTypes, location);
  }

  /**
   * Create error for invalid cross-reference table
   * @param {ErrorLocation} [location] - Location where the error occurred
   * @param {Error} [cause] - Original error that caused this issue
   * @returns {PdfParseError} New PdfParseError instance
   */
  static invalidXref(location?: ErrorLocation, cause?: Error): PdfParseError {
    return PdfParseErrorFactory.invalidXref(location, cause);
  }

  /**
   * Create error for stream extraction failure
   * @param {string} streamType - Type of stream that failed to extract
   * @param {ErrorLocation} [location] - Location where the error occurred
   * @param {PdfParseErrorConfig['streamInfo']} [streamInfo] - Stream information
   * @returns {PdfParseError} New PdfParseError instance
   */
  static streamExtractionFailed(
    streamType: string,
    location?: ErrorLocation,
    streamInfo?: PdfParseErrorConfig['streamInfo']
  ): PdfParseError {
    return PdfParseErrorFactory.streamExtractionFailed(
      streamType,
      location,
      streamInfo
    );
  }

  /**
   * Create error for font rendering issues
   * @param {string} message - Error message describing the font rendering issue
   * @param {ErrorLocation} [location] - Location where the error occurred
   * @returns {PdfParseError} New PDF parse error instance for font rendering
   */
  static fontRenderingError(
    message: string,
    location?: ErrorLocation
  ): PdfParseError {
    return PdfParseErrorFactory.fontRenderingError(message, location);
  }

  /**
   * Create error for text encoding issues
   * @param {string} message - Error message describing the encoding issue
   * @param {string} [location] - Location where the error occurred
   * @param {Error} [cause] - Original error that caused this issue
   * @returns {PdfParseError} New PDF parse error instance for text encoding
   */
  static textEncodingError(
    message: string,
    location?: ErrorLocation,
    cause?: Error
  ): PdfParseError {
    return PdfParseErrorFactory.textEncodingError(message, location, cause);
  }

  /**
   * Create error for image extraction failure
   * @param {string} message - Error message describing the image extraction failure
   * @param {ErrorLocation} [location] - Location information for the error
   * @returns {PdfParseError} New PdfParseError instance for image extraction failure
   */
  static imageExtractionFailed(
    message: string,
    location?: ErrorLocation
  ): PdfParseError {
    return PdfParseErrorFactory.imageExtractionFailed(message, location);
  }

  /**
   * Create error for table detection failure
   * @param {string} message - Error message describing the table detection failure
   * @param {ErrorLocation} [location] - Location information for the error
   * @returns {PdfParseError} New PdfParseError instance for table detection failure
   */
  static tableDetectionFailed(
    message: string,
    location?: ErrorLocation
  ): PdfParseError {
    return PdfParseErrorFactory.tableDetectionFailed(message, location);
  }

  /**
   * Create error for OCR processing failure
   * @param {string} message - Error message describing the OCR processing failure
   * @param {ErrorLocation} [location] - Location information for the error
   * @param {Error} [cause] - Original cause of the error
   * @returns {PdfParseError} New PdfParseError instance for OCR processing failure
   */
  static ocrProcessingFailed(
    message: string,
    location?: ErrorLocation,
    cause?: Error
  ): PdfParseError {
    return PdfParseErrorFactory.ocrProcessingFailed(message, location, cause);
  }

  /**
   * Create error for memory allocation failure
   * @param {string} message - Error message describing the memory allocation failure
   * @param {Error} [cause] - Original cause of the error
   * @returns {PdfParseError} New PdfParseError instance for memory allocation failure
   */
  static memoryError(message: string, cause?: Error): PdfParseError {
    return PdfParseErrorFactory.memoryError(message, cause);
  }

  /**
   * Create error for file too large
   * @param {number} size - Current file size in bytes
   * @param {number} maxSize - Maximum allowed file size in bytes
   * @returns {PdfParseError} New PdfParseError instance for file size limit
   */
  static fileTooLarge(size: number, maxSize: number): PdfParseError {
    return PdfParseErrorFactory.fileTooLarge(size, maxSize);
  }

  /**
   * Create error for I/O errors
   * @param {string} message - Error message describing the I/O failure
   * @param {Error} [cause] - Original cause of the error
   * @returns {PdfParseError} New PdfParseError instance for I/O errors
   */
  static ioError(message: string, cause?: Error): PdfParseError {
    return PdfParseErrorFactory.ioError(message, cause);
  }

  /**
   * Create generic parse failure error
   * @param {string} message - Error message describing the parse failure
   * @param {Error} [cause] - Original cause of the error
   * @returns {PdfParseError} New PdfParseError instance for generic parse failure
   */
  static parseFailed(message: string, cause?: Error): PdfParseError {
    return PdfParseErrorFactory.parseFailed(message, cause);
  }

  /**
   * Create error for low confidence in text extraction
   * @param {number} confidence - Actual confidence score (0-1)
   * @param {number} threshold - Minimum required confidence threshold
   * @param {ErrorLocation} [location] - Location information for the error
   * @returns {PdfParseError} New PdfParseError instance for low confidence
   */
  static lowConfidence(
    confidence: number,
    threshold: number,
    location?: ErrorLocation
  ): PdfParseError {
    return PdfParseErrorFactory.lowConfidence(confidence, threshold, location);
  }

  /**
   * Create error for invalid input type
   * @param {string} inputType - The actual input type received
   * @param {string} expectedType - The expected input type
   * @returns {PdfParseError} New PdfParseError instance for invalid input type
   */
  static invalidInput(inputType: string, expectedType: string): PdfParseError {
    return PdfParseErrorFactory.invalidInput(inputType, expectedType);
  }

  /**
   * Get a user-friendly description of this error
   * @returns {string} User-friendly description of the error
   */
  getUserDescription(): string {
    return PdfParseErrorActionHandler.getUserDescription(this.code);
  }

  /**
   * Get suggested actions to resolve this error
   * @returns {string[]} Array of suggested actions to resolve the error
   */
  getSuggestedActions(): string[] {
    return PdfParseErrorActionHandler.getSuggestedActions(this.code);
  }
}
