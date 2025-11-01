/**
 * PDF Parse Error Actions
 *
 * This file contains action mappings for PDF parsing errors.
 * Separated from the main error class to maintain file size limits.
 */

import type { PdfParseErrorCode } from './pdf-parse-error.js';

// Define constants for common action strings to avoid duplication
const RE_SAVE_PDF = 'Re-save the PDF with a different tool';
const CHECK_PDF_VALIDITY = 'Check if the file is a valid PDF';
const USE_DIFFERENT_TOOL = 'Use a different PDF processing tool';

/**
 * Get actions for basic structural PDF errors
 * @returns {Partial<Record<PdfParseErrorCode, string[]>>} Actions for basic structural errors
 */
// Helper functions moved inline to reduce duplication and file size

/**
 * Get actions for basic invalid PDF errors
 * @returns {string[]} Actions for invalid PDF errors
 */
function getInvalidPdfActions(): string[] {
  return [
    CHECK_PDF_VALIDITY,
    "Try opening the PDF in a viewer to verify it's not corrupted",
    'Re-save the PDF if possible',
  ];
}

/**
 * Get actions for malformed structure errors
 * @returns {string[]} Actions for malformed structure errors
 */
function getMalformedStructureActions(): string[] {
  return [
    'Try repairing the PDF structure',
    RE_SAVE_PDF,
    'Convert to a different format and back to PDF',
  ];
}

/**
 * Get actions for missing objects errors
 * @returns {string[]} Actions for missing objects errors
 */
function getMissingObjectsActions(): string[] {
  return [
    'Re-create the PDF from the source document',
    'Use a different PDF creation tool',
    'Check for PDF corruption',
  ];
}

/**
 * Get actions for invalid cross-reference table errors
 * @returns {string[]} Actions for invalid XREF errors
 */
function getInvalidXrefActions(): string[] {
  return [
    'Repair the PDF cross-reference table',
    RE_SAVE_PDF,
    'Try PDF repair utilities',
  ];
}

/**
 * Get actions for unsupported version errors
 * @returns {string[]} Actions for unsupported version errors
 */
function getUnsupportedVersionActions(): string[] {
  return [
    'Convert the PDF to a more recent version',
    USE_DIFFERENT_TOOL,
    'Check for PDF format compatibility',
  ];
}

/**
 * Get actions for structural PDF errors
 * @returns {Record<PdfParseErrorCode, string[]>} Actions for structural errors
 */
export function getStructuralErrorActions(): Record<
  PdfParseErrorCode,
  string[]
> {
  return {
    INVALID_PDF: getInvalidPdfActions(),
    MALFORMED_STRUCTURE: getMalformedStructureActions(),
    MISSING_OBJECTS: getMissingObjectsActions(),
    INVALID_XREF: getInvalidXrefActions(),
    UNSUPPORTED_VERSION: getUnsupportedVersionActions(),
    PASSWORD_PROTECTED: [],
    ENCRYPTED_CONTENT: [],
    STREAM_EXTRACTION_FAILED: [],
    FONT_RENDERING_ERROR: [],
    TEXT_ENCODING_ERROR: [],
    IMAGE_EXTRACTION_FAILED: [],
    TABLE_DETECTION_FAILED: [],
    OCR_PROCESSING_FAILED: [],
    MEMORY_ERROR: [],
    FILE_TOO_LARGE: [],
    IO_ERROR: [],
    PARSE_FAILED: [],
    LOW_CONFIDENCE: [],
    INVALID_INPUT: [],
  };
}

/**
 * Get actions for password and encryption errors
 * @returns {Partial<Record<PdfParseErrorCode, string[]>>} Actions for password/encryption errors
 */
function getPasswordErrorActions(): Partial<
  Record<PdfParseErrorCode, string[]>
> {
  return {
    PASSWORD_PROTECTED: [
      'Remove password protection from the PDF',
      'Provide authentication credentials if the parser supports them',
      'Use a PDF with no password protection',
    ],
    ENCRYPTED_CONTENT: [
      'Remove content encryption from the PDF',
      'Check if you have the necessary permissions',
      'Use an unencrypted PDF if possible',
    ],
  };
}

/**
 * Get actions for font and text encoding errors
 * @returns {Partial<Record<PdfParseErrorCode, string[]>>} Actions for font/encoding errors
 */
function getFontErrorActions(): Partial<Record<PdfParseErrorCode, string[]>> {
  return {
    FONT_RENDERING_ERROR: [
      'Embed fonts in the PDF if possible',
      'Use standard fonts in the source document',
      'Try alternative text extraction methods',
    ],
    TEXT_ENCODING_ERROR: [
      'Check PDF text encoding settings',
      'Ensure proper Unicode support',
      'Try different encoding detection methods',
    ],
  };
}

/**
 * Get actions for content-related PDF errors
 * @returns {Record<PdfParseErrorCode, string[]>} Actions for content errors
 */
export function getContentErrorActions(): Record<PdfParseErrorCode, string[]> {
  const passwordActions = getPasswordErrorActions();
  const fontActions = getFontErrorActions();

  return {
    INVALID_PDF: [],
    PASSWORD_PROTECTED: passwordActions.PASSWORD_PROTECTED || [],
    ENCRYPTED_CONTENT: passwordActions.ENCRYPTED_CONTENT || [],
    UNSUPPORTED_VERSION: [],
    MALFORMED_STRUCTURE: [],
    MISSING_OBJECTS: [],
    INVALID_XREF: [],
    STREAM_EXTRACTION_FAILED: [],
    FONT_RENDERING_ERROR: fontActions.FONT_RENDERING_ERROR || [],
    TEXT_ENCODING_ERROR: fontActions.TEXT_ENCODING_ERROR || [],
    IMAGE_EXTRACTION_FAILED: [],
    TABLE_DETECTION_FAILED: [],
    OCR_PROCESSING_FAILED: [],
    MEMORY_ERROR: [],
    FILE_TOO_LARGE: [],
    IO_ERROR: [],
    PARSE_FAILED: [],
    LOW_CONFIDENCE: [],
    INVALID_INPUT: [],
  };
}

// Helper functions consolidated to reduce file size

/**
 * Get actions for stream extraction failures
 * @returns {string[]} Actions for stream extraction failures
 */
function getStreamExtractionActions(): string[] {
  return [
    'Try processing with different extraction settings',
    'Check for encrypted or compressed streams',
    'Use alternative PDF parsing methods',
  ];
}

/**
 * Get actions for image extraction failures
 * @returns {string[]} Actions for image extraction failures
 */
function getImageExtractionActions(): string[] {
  return [
    'Check if images are embedded properly',
    'Try different image extraction methods',
    'Verify image formats are supported',
  ];
}

/**
 * Get actions for table detection failures
 * @returns {string[]} Actions for table detection failures
 */
function getTableDetectionActions(): string[] {
  return [
    'Improve table structure in the PDF',
    'Use proper table formatting',
    'Try manual table extraction if available',
  ];
}

/**
 * Get actions for low confidence errors
 * @returns {string[]} Actions for low confidence errors
 */
function getLowConfidenceActions(): string[] {
  return [
    'Improve PDF quality and formatting',
    'Use higher quality source documents',
    'Try different extraction settings',
  ];
}

/**
 * Get actions for processing-related errors
 * @returns {Record<PdfParseErrorCode, string[]>} Actions for processing errors
 */
export function getProcessingErrorActions(): Record<
  PdfParseErrorCode,
  string[]
> {
  return {
    INVALID_PDF: [],
    PASSWORD_PROTECTED: [],
    ENCRYPTED_CONTENT: [],
    UNSUPPORTED_VERSION: [],
    MALFORMED_STRUCTURE: [],
    MISSING_OBJECTS: [],
    INVALID_XREF: [],
    STREAM_EXTRACTION_FAILED: getStreamExtractionActions(),
    FONT_RENDERING_ERROR: [],
    TEXT_ENCODING_ERROR: [],
    IMAGE_EXTRACTION_FAILED: getImageExtractionActions(),
    TABLE_DETECTION_FAILED: getTableDetectionActions(),
    OCR_PROCESSING_FAILED: [],
    MEMORY_ERROR: [],
    FILE_TOO_LARGE: [],
    IO_ERROR: [],
    PARSE_FAILED: [],
    LOW_CONFIDENCE: getLowConfidenceActions(),
    INVALID_INPUT: [],
  };
}

/**
 * Get actions for memory errors
 * @returns {string[]} Actions for memory errors
 */
function getMemoryErrorActions(): string[] {
  return [
    'Process the PDF in smaller chunks',
    'Close other applications to free memory',
    'Use a machine with more memory',
  ];
}

/**
 * Get actions for file size errors
 * @returns {string[]} Actions for file size errors
 */
function getFileSizeErrorActions(): string[] {
  return [
    'Split the PDF into smaller files',
    'Process individual pages instead of the entire document',
    'Use streaming mode if available',
  ];
}

/**
 * Get actions for I/O errors
 * @returns {string[]} Actions for I/O errors
 */
function getIOErrorActions(): string[] {
  return [
    'Check file permissions and disk space',
    'Verify the file path is correct',
    'Check network connectivity if processing remote files',
  ];
}

/**
 * Get actions for resource-related errors
 * @returns {Record<PdfParseErrorCode, string[]>} Actions for resource errors
 */
export function getResourceErrorActions(): Record<PdfParseErrorCode, string[]> {
  return {
    INVALID_PDF: [],
    PASSWORD_PROTECTED: [],
    ENCRYPTED_CONTENT: [],
    UNSUPPORTED_VERSION: [],
    MALFORMED_STRUCTURE: [],
    MISSING_OBJECTS: [],
    INVALID_XREF: [],
    STREAM_EXTRACTION_FAILED: [],
    FONT_RENDERING_ERROR: [],
    TEXT_ENCODING_ERROR: [],
    IMAGE_EXTRACTION_FAILED: [],
    TABLE_DETECTION_FAILED: [],
    OCR_PROCESSING_FAILED: [],
    MEMORY_ERROR: getMemoryErrorActions(),
    FILE_TOO_LARGE: getFileSizeErrorActions(),
    IO_ERROR: getIOErrorActions(),
    PARSE_FAILED: [],
    LOW_CONFIDENCE: [],
    INVALID_INPUT: [],
  };
}

/**
 * Get actions for invalid input errors
 * @returns {string[]} Actions for invalid input errors
 */
function getInvalidInputActions(): string[] {
  return [
    'Provide a valid PDF file path or buffer',
    'Check input format is supported',
    'Verify the input is not corrupted',
  ];
}

/**
 * Get actions for parse failure errors
 * @returns {string[]} Actions for parse failure errors
 */
function getParseFailedActions(): string[] {
  return [
    'Try a different PDF parsing tool',
    'Check the PDF for common issues',
    'Report the issue if it persists',
  ];
}

/**
 * Get actions for input-related errors
 * @returns {Record<PdfParseErrorCode, string[]>} Actions for input errors
 */
export function getInputErrorActions(): Record<PdfParseErrorCode, string[]> {
  return {
    INVALID_PDF: [],
    PASSWORD_PROTECTED: [],
    ENCRYPTED_CONTENT: [],
    UNSUPPORTED_VERSION: [],
    MALFORMED_STRUCTURE: [],
    MISSING_OBJECTS: [],
    INVALID_XREF: [],
    STREAM_EXTRACTION_FAILED: [],
    FONT_RENDERING_ERROR: [],
    TEXT_ENCODING_ERROR: [],
    IMAGE_EXTRACTION_FAILED: [],
    TABLE_DETECTION_FAILED: [],
    OCR_PROCESSING_FAILED: [],
    MEMORY_ERROR: [],
    FILE_TOO_LARGE: [],
    IO_ERROR: [],
    INVALID_INPUT: getInvalidInputActions(),
    PARSE_FAILED: getParseFailedActions(),
    LOW_CONFIDENCE: [],
  };
}

/**
 * Get default actions for unknown errors
 * @returns {string[]} Default actions for unknown errors
 */
export function getDefaultActions(): string[] {
  return [
    'Check the PDF file for common issues',
    'Try processing with a different tool',
    'Report the issue if it persists',
  ];
}
