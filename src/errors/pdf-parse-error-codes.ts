/**
 * PDF Parse Error Codes
 *
 * This file contains error codes for different types of PDF parsing failures.
 * Separated from the main error class to maintain file size limits.
 */

/**
 * Error codes for different types of PDF parsing failures
 */
export const PDF_PARSE_ERROR_CODES = {
  /** Invalid PDF format or corrupted file */
  INVALID_PDF: 'INVALID_PDF',
  /** Password-protected PDF - This is an error code identifier, not a password */
  PASSWORD_PROTECTED: 'PASSWORD_PROTECTED' as const,
  /** Encrypted PDF content */
  ENCRYPTED_CONTENT: 'ENCRYPTED_CONTENT',
  /** Unsupported PDF version */
  UNSUPPORTED_VERSION: 'UNSUPPORTED_VERSION',
  /** Malformed PDF structure */
  MALFORMED_STRUCTURE: 'MALFORMED_STRUCTURE',
  /** Missing required PDF objects */
  MISSING_OBJECTS: 'MISSING_OBJECTS',
  /** Invalid cross-reference table */
  INVALID_XREF: 'INVALID_XREF',
  /** Stream extraction failure */
  STREAM_EXTRACTION_FAILED: 'STREAM_EXTRACTION_FAILED',
  /** Font rendering issues */
  FONT_RENDERING_ERROR: 'FONT_RENDERING_ERROR',
  /** Text encoding issues */
  TEXT_ENCODING_ERROR: 'TEXT_ENCODING_ERROR',
  /** Image extraction failure */
  IMAGE_EXTRACTION_FAILED: 'IMAGE_EXTRACTION_FAILED',
  /** Table detection failure */
  TABLE_DETECTION_FAILED: 'TABLE_DETECTION_FAILED',
  /** OCR processing failure */
  OCR_PROCESSING_FAILED: 'OCR_PROCESSING_FAILED',
  /** Memory allocation failed */
  MEMORY_ERROR: 'MEMORY_ERROR',
  /** File too large for processing */
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  /** Network or I/O errors */
  IO_ERROR: 'IO_ERROR',
  /** Generic parsing failure */
  PARSE_FAILED: 'PARSE_FAILED',
  /** Low confidence in text extraction */
  LOW_CONFIDENCE: 'LOW_CONFIDENCE',
  /** Invalid input type */
  INVALID_INPUT: 'INVALID_INPUT',
} as const;

/**
 * Type alias for PDF parse error codes
 */
export type PdfParseErrorCode =
  (typeof PDF_PARSE_ERROR_CODES)[keyof typeof PDF_PARSE_ERROR_CODES];
