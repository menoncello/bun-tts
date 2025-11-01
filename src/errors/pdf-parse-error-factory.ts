/**
 * Factory methods for creating PDF parsing errors
 */

import type { ErrorLocation } from './pdf-parse-error-types.js';
import { PdfParseError } from './pdf-parse-error.js';

/**
 * Factory class for creating PdfParseError instances
 */
export class PdfParseErrorFactory {
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
    return new PdfParseError('INVALID_PDF', `Invalid PDF format: ${message}`, {
      location,
      cause,
    });
  }

  /**
   * Create error for password-protected PDF
   * @param {ErrorLocation} [location] - Location where the error occurred
   * @returns {PdfParseError} New PdfParseError instance
   */
  static passwordProtected(location?: ErrorLocation): PdfParseError {
    return new PdfParseError(
      'PASSWORD_PROTECTED',
      'PDF is password-protected and cannot be processed',
      { location }
    );
  }

  /**
   * Create error for encrypted content
   * @param {ErrorLocation} [location] - Location where the error occurred
   * @returns {PdfParseError} New PdfParseError instance
   */
  static encryptedContent(location?: ErrorLocation): PdfParseError {
    return new PdfParseError(
      'ENCRYPTED_CONTENT',
      'PDF content is encrypted and cannot be extracted',
      { location }
    );
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
    return new PdfParseError(
      'UNSUPPORTED_VERSION',
      `Unsupported PDF version: ${version}`,
      { location }
    );
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
    return new PdfParseError(
      'MALFORMED_STRUCTURE',
      `Malformed PDF structure: ${message}`,
      {
        location,
        cause,
      }
    );
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
    return new PdfParseError(
      'MISSING_OBJECTS',
      `Missing required PDF objects: ${objectTypes.join(', ')}`,
      { location }
    );
  }

  /**
   * Create error for invalid cross-reference table
   * @param {ErrorLocation} [location] - Location where the error occurred
   * @param {Error} [cause] - Original error that caused this issue
   * @returns {PdfParseError} New PdfParseError instance
   */
  static invalidXref(location?: ErrorLocation, cause?: Error): PdfParseError {
    return new PdfParseError('INVALID_XREF', 'Invalid cross-reference table', {
      location,
      cause,
    });
  }

  /**
   * Create error for stream extraction failure
   * @param {string} streamType - Type of stream that failed to extract
   * @param {ErrorLocation} [location] - Location where the error occurred
   * @param {{ streamId?: string; streamType?: string } | undefined} [streamInfo] - Stream information
   * @param {string} [streamInfo.streamId] - Unique identifier for the stream
   * @param {string} [streamInfo.streamType] - Type of stream (e.g., 'image', 'font', 'content')
   * @returns {PdfParseError} New PdfParseError instance
   */
  static streamExtractionFailed(
    streamType: string,
    location?: ErrorLocation,
    streamInfo?: { streamId?: string; streamType?: string }
  ): PdfParseError {
    return new PdfParseError(
      'STREAM_EXTRACTION_FAILED',
      `Failed to extract ${streamType} stream`,
      { location, streamInfo }
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
    return new PdfParseError(
      'FONT_RENDERING_ERROR',
      `Font rendering error: ${message}`,
      {
        location,
      }
    );
  }

  /**
   * Create error for text encoding issues
   * @param {string} message - Error message describing the encoding issue
   * @param {ErrorLocation} [location] - Location where the error occurred
   * @param {Error} [cause] - Original error that caused this issue
   * @returns {PdfParseError} New PDF parse error instance for text encoding
   */
  static textEncodingError(
    message: string,
    location?: ErrorLocation,
    cause?: Error
  ): PdfParseError {
    return new PdfParseError(
      'TEXT_ENCODING_ERROR',
      `Text encoding error: ${message}`,
      {
        location,
        cause,
      }
    );
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
    return new PdfParseError(
      'IMAGE_EXTRACTION_FAILED',
      `Image extraction failed: ${message}`,
      {
        location,
      }
    );
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
    return new PdfParseError(
      'TABLE_DETECTION_FAILED',
      `Table detection failed: ${message}`,
      {
        location,
      }
    );
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
    return new PdfParseError(
      'OCR_PROCESSING_FAILED',
      `OCR processing failed: ${message}`,
      {
        location,
        cause,
      }
    );
  }

  /**
   * Create error for memory allocation failure
   * @param {string} message - Error message describing the memory allocation failure
   * @param {Error} [cause] - Original cause of the error
   * @returns {PdfParseError} New PdfParseError instance for memory allocation failure
   */
  static memoryError(message: string, cause?: Error): PdfParseError {
    return new PdfParseError('MEMORY_ERROR', `Memory error: ${message}`, {
      cause,
    });
  }

  /**
   * Create error for file too large
   * @param {number} size - Current file size in bytes
   * @param {number} maxSize - Maximum allowed file size in bytes
   * @returns {PdfParseError} New PdfParseError instance for file size limit
   */
  static fileTooLarge(size: number, maxSize: number): PdfParseError {
    return new PdfParseError(
      'FILE_TOO_LARGE',
      `File too large: ${size} bytes (max: ${maxSize} bytes)`
    );
  }

  /**
   * Create error for I/O errors
   * @param {string} message - Error message describing the I/O failure
   * @param {Error} [cause] - Original cause of the error
   * @returns {PdfParseError} New PdfParseError instance for I/O errors
   */
  static ioError(message: string, cause?: Error): PdfParseError {
    return new PdfParseError('IO_ERROR', `I/O error: ${message}`, {
      cause,
    });
  }

  /**
   * Create generic parse failure error
   * @param {string} message - Error message describing the parse failure
   * @param {Error} [cause] - Original cause of the error
   * @returns {PdfParseError} New PdfParseError instance for generic parse failure
   */
  static parseFailed(message: string, cause?: Error): PdfParseError {
    return new PdfParseError('PARSE_FAILED', `PDF parse failed: ${message}`, {
      cause,
    });
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
    return new PdfParseError(
      'LOW_CONFIDENCE',
      `Low confidence in text extraction: ${confidence} (threshold: ${threshold})`,
      { location, confidence }
    );
  }

  /**
   * Create error for invalid input type
   * @param {string} inputType - The actual input type received
   * @param {string} expectedType - The expected input type
   * @returns {PdfParseError} New PdfParseError instance for invalid input type
   */
  static invalidInput(inputType: string, expectedType: string): PdfParseError {
    return new PdfParseError(
      'INVALID_INPUT',
      `Invalid input type: ${inputType} (expected: ${expectedType})`
    );
  }
}
