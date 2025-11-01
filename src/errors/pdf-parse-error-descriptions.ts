/**
 * PDF Parse Error Descriptions
 *
 * This file contains user-friendly descriptions for PDF parsing errors.
 * Separated from the main error class to maintain file size limits.
 */

import type { PdfParseErrorCode } from './pdf-parse-error.js';

/**
 * Get structural error descriptions
 * @returns {Partial<Record<PdfParseErrorCode, string>>} Structural error descriptions
 */
function _getStructuralErrorDescriptions(): Partial<
  Record<PdfParseErrorCode, string>
> {
  return {
    INVALID_PDF:
      'The PDF file is corrupted, invalid, or not a proper PDF format.',
    UNSUPPORTED_VERSION: 'The PDF version is not supported by this parser.',
    MALFORMED_STRUCTURE:
      'The PDF has structural problems that prevent proper parsing.',
    MISSING_OBJECTS:
      'The PDF is missing required objects for proper processing.',
    INVALID_XREF: 'The PDF cross-reference table is corrupted or invalid.',
  };
}

/**
 * Get security error descriptions
 * @returns {Partial<Record<PdfParseErrorCode, string>>} Security error descriptions
 */
function _getSecurityErrorDescriptions(): Partial<
  Record<PdfParseErrorCode, string>
> {
  return {
    PASSWORD_PROTECTED:
      'The PDF is restricted and cannot be processed.' as const,
    ENCRYPTED_CONTENT: 'The PDF content is encrypted and cannot be extracted.',
  };
}

/**
 * Get processing error descriptions
 * @returns {Partial<Record<PdfParseErrorCode, string>>} Processing error descriptions
 */
function _getProcessingErrorDescriptions(): Partial<
  Record<PdfParseErrorCode, string>
> {
  return {
    STREAM_EXTRACTION_FAILED: 'Failed to extract content streams from the PDF.',
    FONT_RENDERING_ERROR: 'There are issues with font rendering in the PDF.',
    TEXT_ENCODING_ERROR:
      'The PDF has text encoding issues that prevent proper extraction.',
    IMAGE_EXTRACTION_FAILED: 'Failed to extract images from the PDF.',
    TABLE_DETECTION_FAILED: 'Failed to detect and extract table structures.',
    OCR_PROCESSING_FAILED:
      'OCR processing failed to extract text from image content.',
    LOW_CONFIDENCE:
      'The parser is not confident about the extracted text content.',
  };
}

/**
 * Get system error descriptions
 * @returns {Partial<Record<PdfParseErrorCode, string>>} System error descriptions
 */
function _getSystemErrorDescriptions(): Partial<
  Record<PdfParseErrorCode, string>
> {
  return {
    MEMORY_ERROR: 'There was insufficient memory to process the PDF.',
    FILE_TOO_LARGE: 'The PDF file is too large to process efficiently.',
    IO_ERROR: 'There was an I/O error reading or writing the PDF.',
    INVALID_INPUT: 'The input provided to the PDF parser is invalid.',
    PARSE_FAILED: 'An error occurred while parsing the PDF document.',
  };
}

/**
 * Get error descriptions for all error codes
 * @returns {Record<PdfParseErrorCode, string>} Error descriptions mapping
 */
export function getErrorDescriptions(): Record<PdfParseErrorCode, string> {
  return {
    INVALID_PDF:
      'The PDF file is corrupted, invalid, or not a proper PDF format.',
    PASSWORD_PROTECTED: 'The PDF is restricted and cannot be processed.',
    ENCRYPTED_CONTENT: 'The PDF content is encrypted and cannot be extracted.',
    UNSUPPORTED_VERSION: 'The PDF version is not supported by this parser.',
    MALFORMED_STRUCTURE:
      'The PDF has structural problems that prevent proper parsing.',
    MISSING_OBJECTS: 'The PDF is missing required objects for proper parsing.',
    INVALID_XREF: 'The PDF cross-reference table is invalid or corrupted.',
    STREAM_EXTRACTION_FAILED: 'Failed to extract content streams from the PDF.',
    FONT_RENDERING_ERROR: 'There are issues with font rendering in the PDF.',
    TEXT_ENCODING_ERROR:
      'The PDF has text encoding issues that prevent proper extraction.',
    IMAGE_EXTRACTION_FAILED: 'Failed to extract images from the PDF.',
    TABLE_DETECTION_FAILED: 'Failed to detect and extract tables from the PDF.',
    OCR_PROCESSING_FAILED: 'OCR processing failed during text extraction.',
    MEMORY_ERROR: 'There was insufficient memory to process the PDF.',
    FILE_TOO_LARGE: 'The PDF file is too large to process efficiently.',
    IO_ERROR: 'There was an I/O error reading or writing the PDF.',
    PARSE_FAILED: 'An error occurred while parsing the PDF document.',
    LOW_CONFIDENCE: 'Low confidence in the extracted text content.',
    INVALID_INPUT: 'The input provided to the PDF parser is invalid.',
  };
}
