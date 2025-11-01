/**
 * PDF parser error handling utilities.
 * These utilities handle error creation and logging for PDF parsing operations.
 */

import {
  PdfParseError,
  PDF_PARSE_ERROR_CODES,
} from '../../../errors/pdf-parse-error';
import type { Result } from '../../../errors/result';
import type { Logger } from '../../../interfaces/logger';
import type { DocumentStructure } from '../types';

/**
 * Handles parsing errors and returns appropriate error result.
 *
 * @param {unknown} error - The error that occurred during parsing
 * @param {string} _filePath - File path being parsed
 * @returns {Result<never, PdfParseError>} Error result
 */
export function handleParsingError(
  error: unknown,
  _filePath: string
): Result<never, PdfParseError> {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  const pdfError = new PdfParseError(
    PDF_PARSE_ERROR_CODES.PARSE_FAILED,
    `Failed to parse PDF: ${errorMessage}`,
    { cause: error instanceof Error ? error : undefined }
  );

  return {
    success: false,
    error: pdfError,
  };
}

/**
 * Handles validation errors and returns appropriate error result.
 *
 * @param {unknown} error - The error that occurred during validation
 * @param {string} _filePath - File path being validated
 * @returns {Result<boolean, PdfParseError>} Error result
 */
export function handleValidationError(
  error: unknown,
  _filePath: string
): Result<boolean, PdfParseError> {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  const pdfError = new PdfParseError(
    PDF_PARSE_ERROR_CODES.IO_ERROR,
    `Failed to validate PDF: ${errorMessage}`,
    { cause: error instanceof Error ? error : undefined }
  );

  return {
    success: false,
    error: pdfError,
  };
}

/**
 * Logs successful parsing completion.
 *
 * @param {Logger} logger - Logger instance to use for logging
 * @param {string} filePath - File path that was parsed
 * @param {DocumentStructure} documentStructure - Document structure that was created
 */
export function logParsingSuccess(
  logger: Logger,
  filePath: string,
  documentStructure: DocumentStructure
): void {
  logger.info('PDF parsing completed successfully', {
    filePath,
    chaptersCount: documentStructure.chapters.length,
    wordCount: documentStructure.totalWordCount,
  });
}
