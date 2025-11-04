/**
 * EPUB Parser Input Validation
 * Contains validation methods for EPUB parser inputs and options.
 */

import type { ParseResult } from '../types.js';
import {
  isValidEpubInput,
  isValidEpubOptions,
} from './epub-parser-input-handler.js';
import type { EPUBParseOptions } from './epub-parser-types.js';

type EpubInput = string | Buffer | ArrayBuffer;

// Constants
const INPUT_REQUIRED_MESSAGE = 'Input is required';

/**
 * Validate undefined input
 * @param {unknown} input - The input to validate
 * @returns {ParseResult | null} Error result if invalid, null if valid
 */
export function validateUndefinedInput(input: unknown): ParseResult | null {
  if (input === undefined) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: INPUT_REQUIRED_MESSAGE,
        details: { receivedType: 'undefined' },
      },
    };
  }
  return null;
}

/**
 * Validate input type
 * @param {unknown} input - The input to validate
 * @returns {ParseResult | null} Error result if invalid, null if valid
 */
export function validateInputType(input: unknown): ParseResult | null {
  if (!isValidEpubInput(input)) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT_TYPE',
        message:
          'Invalid input type for EPUB parsing. Expected string, Buffer, or ArrayBuffer.',
        details: { receivedType: typeof input },
      },
    };
  }
  return null;
}

/**
 * Validate options type
 * @param {unknown} options - The options to validate
 * @returns {ParseResult | null} Error result if invalid, null if valid
 */
export function validateOptionsType(options: unknown): ParseResult | null {
  if (options !== undefined && !isValidEpubOptions(options)) {
    return {
      success: false,
      error: {
        code: 'INVALID_OPTIONS_TYPE',
        message: 'Invalid options type. Expected object or undefined.',
        details: { receivedType: typeof options },
      },
    };
  }
  return null;
}

/**
 * Validate empty string input
 * @param {unknown} input - The input to validate
 * @returns {ParseResult | null} Error result if empty string, null if valid
 */
export function validateEmptyString(input: unknown): ParseResult | null {
  if (typeof input === 'string' && input.trim().length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: INPUT_REQUIRED_MESSAGE,
        details: { receivedType: 'empty_string' },
      },
    };
  }
  return null;
}

/**
 * Validate empty buffer input
 * @param {unknown} input - The input to validate
 * @returns {ParseResult | null} Error result if empty buffer, null if valid
 */
export function validateEmptyBuffer(input: unknown): ParseResult | null {
  if (Buffer.isBuffer(input) && input.length === 0) {
    return {
      success: false,
      error: {
        code: 'EPUB_FORMAT_ERROR',
        message: 'EPUB parsing failed: Empty buffer is not a valid EPUB file',
        details: { receivedType: 'empty_buffer' },
      },
    };
  }
  return null;
}

/**
 * Validate and normalize parse inputs
 * @param {unknown} input - The input to validate
 * @param {unknown} options - The options to validate
 * @returns {{epubInput: EpubInput, epubOptions: EPUBParseOptions | undefined} | ParseResult} Validated inputs or error result
 */
export function validateParseInputs(
  input: unknown,
  options: unknown
):
  | { epubInput: EpubInput; epubOptions: EPUBParseOptions | undefined }
  | ParseResult {
  const typeError = validateInputType(input);
  if (typeError) return typeError;

  const undefinedError = validateUndefinedInput(input);
  if (undefinedError) return undefinedError;

  const emptyStringError = validateEmptyString(input);
  if (emptyStringError) return emptyStringError;

  const emptyBufferError = validateEmptyBuffer(input);
  if (emptyBufferError) return emptyBufferError;

  const optionsError = validateOptionsType(options);
  if (optionsError) return optionsError;

  // Now we can safely use the types
  return {
    epubInput: input as EpubInput,
    epubOptions: options as EPUBParseOptions | undefined,
  } as { epubInput: EpubInput; epubOptions: EPUBParseOptions | undefined };
}
