/**
 * Document validation utilities for Markdown parser.
 * Handles input validation and error handling.
 */

import type { Result } from '../../../errors/result';
import type { Logger } from '../../../interfaces/logger';
import type { MarkdownParserConfig } from '../config/markdown-parser-config';
import { MarkdownParseError } from '../errors/markdown-parse-error';
import type { DocumentStructure } from '../types';
import { validateInput, checkFileSize } from './parser-config';

/**
 * Log message for parsing failures
 */
const PARSING_FAILED_LOG_MESSAGE = 'Markdown parsing failed';

/**
 * Create and log a parsing error
 *
 * @param {string} message - Error message
 * @param {unknown} cause - Original cause of the error
 * @param {Date} startTime - Start time for duration calculation
 * @param {Logger} logger - Logger instance
 * @returns {Result<DocumentStructure, MarkdownParseError>} Result with error
 */
function createAndLogParsingError(
  message: string,
  cause: unknown,
  startTime: Date,
  logger: Logger
): Result<DocumentStructure, MarkdownParseError> {
  const parseError = MarkdownParseError.parseFailed(message, cause);

  logger.error(PARSING_FAILED_LOG_MESSAGE, {
    error: parseError.message,
    duration: Date.now() - startTime.getTime(),
  });

  return { success: false, error: parseError };
}

/**
 * Handle null/undefined errors
 *
 * @param {unknown} error - Error that occurred
 * @param {Date} startTime - Start time for duration calculation
 * @param {Logger} logger - Logger instance
 * @returns {Result<DocumentStructure, MarkdownParseError> | null} Result with error or null if not handled
 */
function handleNullUndefinedError(
  error: unknown,
  startTime: Date,
  logger: Logger
): Result<DocumentStructure, MarkdownParseError> | null {
  if (error === null || error === undefined) {
    return createAndLogParsingError('Unknown error', error, startTime, logger);
  }
  return null;
}

/**
 * Handle Error and string errors
 *
 * @param {unknown} error - Error that occurred
 * @param {Date} startTime - Start time for duration calculation
 * @param {Logger} logger - Logger instance
 * @returns {Result<DocumentStructure, MarkdownParseError> | null} Result with error or null if not handled
 */
function handleErrorAndStringErrors(
  error: unknown,
  startTime: Date,
  logger: Logger
): Result<DocumentStructure, MarkdownParseError> | null {
  if (error instanceof MarkdownParseError) {
    // Handle MarkdownParseError instances specially
    return createAndLogParsingError(error.message, error, startTime, logger);
  }

  if (error instanceof Error || typeof error === 'string') {
    const originalMessage = error instanceof Error ? error.message : error;
    return createAndLogParsingError(originalMessage, error, startTime, logger);
  }
  return null;
}

/**
 * Handle all other error types
 *
 * @param {unknown} error - Error that occurred
 * @param {Date} startTime - Start time for duration calculation
 * @param {Logger} logger - Logger instance
 * @returns {Result<DocumentStructure, MarkdownParseError>} Result with error
 */
function handleOtherErrorTypes(
  error: unknown,
  startTime: Date,
  logger: Logger
): Result<DocumentStructure, MarkdownParseError> {
  return createAndLogParsingError('Unknown error', error, startTime, logger);
}

/**
 * Validate and prepare input content
 *
 * @param {string | Buffer} input - Input content to validate and prepare
 * @param {MarkdownParserConfig} config - Parser configuration object
 * @returns {string | MarkdownParseError} Validated string content or MarkdownParseError
 */
export function validateAndPrepareInput(
  input: string | Buffer,
  config: MarkdownParserConfig
): string | MarkdownParseError {
  const content = validateInput(input);
  if (content instanceof MarkdownParseError) {
    return content;
  }

  const sizeCheck = checkFileSize(content, config);
  if (sizeCheck instanceof MarkdownParseError) {
    return sizeCheck;
  }

  return content;
}

/**
 * Handle parsing errors
 *
 * @param {unknown} error - Error that occurred during parsing
 * @param {Date} startTime - Start time of the parsing operation for duration calculation
 * @param {Logger} logger - Logger instance for error reporting
 * @returns {Result<DocumentStructure, MarkdownParseError>} Result with error details
 */
export function handleParsingError(
  error: unknown,
  startTime: Date,
  logger: Logger
): Result<DocumentStructure, MarkdownParseError> {
  // Try to handle null/undefined errors first
  const nullResult = handleNullUndefinedError(error, startTime, logger);
  if (nullResult) {
    return nullResult;
  }

  // Try to handle Error and string errors
  const errorResult = handleErrorAndStringErrors(error, startTime, logger);
  if (errorResult) {
    return errorResult;
  }

  // Handle all other error types
  return handleOtherErrorTypes(error, startTime, logger);
}
