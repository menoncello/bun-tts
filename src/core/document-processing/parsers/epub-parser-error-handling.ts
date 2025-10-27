/**
 * EPUB Parser Error Handling Module
 *
 * Contains error handling and logging utilities.
 */

import { DocumentParseError } from '../../../errors/document-parse-error';
import { logger } from '../../../utils/logger';
import type { Chapter, DocumentStatistics } from '../types';

// Constants for error handling
const ERROR_MESSAGE_UNKNOWN = 'Unknown error';

/**
 * Log successful parsing completion
 * @param parserName - Name of the parser
 * @param chapters - Array of processed chapters
 * @param stats - Document statistics
 * @param parseTime - Time taken to parse in milliseconds
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
 * @param parserName - Name of the parser
 * @param error - Error that occurred during parsing
 */
export function logError(parserName: string, error: unknown): void {
  logger.error('EPUB parsing failed', {
    parser: parserName,
    error: error instanceof Error ? error.message : ERROR_MESSAGE_UNKNOWN,
  });
}

/**
 * Normalize errors to standard format
 * @param error - Error to normalize
 * @returns Normalized DocumentParseError
 */
export function normalizeError(error: unknown): DocumentParseError {
  if (error instanceof DocumentParseError) {
    return error;
  }

  if (error instanceof Error) {
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
