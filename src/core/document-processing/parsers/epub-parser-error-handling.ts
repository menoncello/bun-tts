/**
 * EPUB Parser Error Handling Module
 *
 * Contains error handling and logging utilities.
 */

import { DocumentParseError } from '../../../errors/document-parse-error.js';
import { logger } from '../../../utils/logger.js';
import type { Chapter, DocumentStatistics } from '../types.js';

// Constants for error handling
const ERROR_MESSAGE_UNKNOWN = 'Unknown error';

/**
 * Log successful parsing completion
 * @param {any} parserName - Name of the parser
 * @param {Chapter[]} chapters - Array of processed chapters
 * @param {any} stats - Document statistics
 * @param {any} parseTime - Time taken to parse in milliseconds
 */
export function logSuccess(
  parserName: string,
  chapters: Chapter[],
  stats: DocumentStatistics,
  parseTime: number
): void {
  logger.info('EPUB parsing completed successfully', {
    parser: parserName,
    chapters: chapters.length,
    words: stats.totalWords,
    parseTime,
  });
}

/**
 * Log parsing error
 * @param {any} parserName - Name of the parser
 * @param {Error} error - Error that occurred during parsing
 */
export function logError(parserName: string, error: unknown): void {
  logger.error('EPUB parsing failed', {
    parser: parserName,
    error: error instanceof Error ? error.message : ERROR_MESSAGE_UNKNOWN,
  });
}

/**
 * Normalize errors to standard format
 * @param {Error} error - Error to normalize
 * @returns {DocumentParseError} Normalized DocumentParseError
 */
export function normalizeError(error: unknown): DocumentParseError {
  if (error instanceof DocumentParseError) {
    return error;
  }

  if (error instanceof Error) {
    // Check for specific EPUB-related error patterns to return appropriate error codes
    if (isEPUBFormatError(error)) {
      return new DocumentParseError(error.message, 'EPUB_FORMAT_ERROR', {
        originalError: error.message,
        stack: error.stack,
      });
    }

    // Additional check: if the error comes from EPUB library operations or empty buffer parsing
    if (isEPUBLibraryError(error)) {
      return new DocumentParseError(error.message, 'EPUB_FORMAT_ERROR', {
        originalError: error.message,
        stack: error.stack,
      });
    }

    return new DocumentParseError(error.message, 'UNKNOWN_ERROR', {
      originalError: error.message,
      stack: error.stack,
    });
  }

  return new DocumentParseError(
    'Unknown error occurred during parsing',
    'UNKNOWN_ERROR',
    {
      error: String(error),
    }
  );
}

/**
 * Check if error indicates EPUB format issues
 * @param {Error} error - Error to check
 * @returns {boolean} True if error is EPUB format related
 */
function isEPUBFormatError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Common EPUB format error patterns
  const epubFormatPatterns = [
    'invalid epub',
    'corrupted epub',
    'not a valid epub',
    'epub parsing failed',
    'failed to parse epub',
    'invalid mimetype',
    'missing container.xml',
    'invalid structure',
    'epub format',
    'zip error',
    'invalid zip',
    'end of central directory record',
    'invalid file signature',
    'not a zip file',
  ];

  return epubFormatPatterns.some((pattern) => message.includes(pattern));
}

/**
 * Check if error comes from EPUB library operations or empty buffer scenarios
 * @param {Error} error - Error to check
 * @returns {boolean} True if error is EPUB library related
 */
function isEPUBLibraryError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // EPUB library method errors and specific patterns
  const epubLibraryPatterns = [
    'epub.getmetadata', // Specific EPUB library metadata method
    'epub.getspineitems', // Specific EPUB library spine method
    'epub.getmanifest', // Specific EPUB library manifest method
    'epub.readxhtmlitemcontents', // Specific EPUB library content method
    'epub.from', // EPUB parsing initialization errors
    'not a valid epub', // EPUB format validation errors
    'invalid epub format', // EPUB format validation errors
    'epub parse error', // EPUB parsing errors
    'container.xml not found', // EPUB structure errors
    'mimetype not found', // EPUB structure errors
    'invalid zip file', // EPUB zip format errors
  ];

  return epubLibraryPatterns.some((pattern) => message.includes(pattern));
}
