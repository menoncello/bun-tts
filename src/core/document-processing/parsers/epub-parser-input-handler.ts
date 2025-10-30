/**
 * EPUB Parser Input Handler Module
 *
 * Contains input validation and normalization logic.
 */

import { Epub } from '@smoores/epub';
import {
  DocumentParseError,
  EPUBFormatError,
} from '../../../errors/document-parse-error.js';
import { LoggerFactory } from '../../../interfaces/logger.js';
import type { EPUBParseOptions } from './epub-parser-types.js';
import {
  MAX_EPUB_FILE_SIZE,
  MAX_EPUB_SIZE_WARNING,
  MEGABYTE,
} from './epub-parser-validation-types.js';

// Type alias for better readability
type EpubInput = string | Buffer | ArrayBuffer;

// Logger instance
const logger = LoggerFactory.getInstance();

/**
 * Type guard to check if input is a valid EpubInput
 * @param {unknown} input - Input to check
 * @returns {input is EpubInput} True if input is valid EpubInput
 */
export function isValidEpubInput(input: unknown): input is EpubInput {
  return (
    typeof input === 'string' ||
    Buffer.isBuffer(input) ||
    input instanceof ArrayBuffer
  );
}

/**
 * Type guard to check if input is valid EPUB parse options
 * @param {unknown} options - Options to check
 * @returns {options is EPUBParseOptions} True if options is valid
 */
export function isValidEpubOptions(
  options: unknown
): options is EPUBParseOptions {
  return (
    options !== null && options !== undefined && typeof options === 'object'
  );
}

// Constants for error handling
const ERROR_MESSAGE_UNKNOWN = 'Unknown error';
const ERROR_MESSAGE_INVALID_INPUT = 'Invalid input type for EPUB parsing';
const ERROR_CODE_INVALID_INPUT_TYPE = 'INVALID_INPUT_TYPE';
const CUSTOM_INPUT_TYPE_STRING = 'string';
const CUSTOM_INPUT_TYPE_BUFFER = 'buffer';
const CUSTOM_INPUT_TYPE_ARRAYBUFFER = 'arraybuffer';

// Constants for file size calculations
const BYTES_PER_MEGABYTE = MEGABYTE * MEGABYTE;

/**
 * Validate file size to prevent resource exhaustion attacks
 * @param {EpubInput} input - Input to validate
 * @throws {DocumentParseError} if file is too large
 */
export function validateFileSize(input: EpubInput): void {
  let fileSize: number;

  if (typeof input === 'string') {
    // For file paths, we can't easily determine file size without async fs
    // This will be handled during file reading in createEPUBInstance
    return;
  } else if (Buffer.isBuffer(input)) {
    fileSize = input.length;
  } else if (input instanceof ArrayBuffer) {
    fileSize = input.byteLength;
  } else {
    return; // Should not reach here due to type guards
  }

  // Check if file exceeds maximum size limit
  if (fileSize > MAX_EPUB_FILE_SIZE) {
    throw new DocumentParseError(
      `EPUB file size (${Math.round(fileSize / BYTES_PER_MEGABYTE)}MB) exceeds maximum allowed size (${Math.round(MAX_EPUB_FILE_SIZE / BYTES_PER_MEGABYTE)}MB)`,
      'FILE_TOO_LARGE'
    );
  }

  // Log warning for large files
  if (fileSize > MAX_EPUB_SIZE_WARNING) {
    logger.warn(
      `Large EPUB file detected (${Math.round(fileSize / BYTES_PER_MEGABYTE)}MB). Processing may take additional time and memory.`,
      { fileSize, warningThreshold: MAX_EPUB_SIZE_WARNING }
    );
  }
}

/**
 * Validate input parameter
 * @param {EpubInput} input - Input to validate
 * @throws {DocumentParseError} if input is invalid
 */
export function validateInput(input: EpubInput): void {
  // Only check for null/undefined input - empty buffers/strings are valid for EPUB format validation
  if (input === null || input === undefined) {
    throw new DocumentParseError('Input is required', 'INVALID_INPUT');
  }

  // Check for empty strings specifically, but allow empty buffers (they should be EPUB_FORMAT_ERROR)
  if (typeof input === 'string' && input.trim().length === 0) {
    throw new DocumentParseError('Input is required', 'INVALID_INPUT');
  }

  // Allow empty buffers - they should be handled as EPUB_FORMAT_ERROR by the EPUB library
  if (Buffer.isBuffer(input) && input.length === 0) {
    // Empty buffer is valid input - let EPUB parsing determine if it's a valid EPUB
  }
}

/**
 * Validate and normalize custom string input
 * @param {string} data - String data to validate
 * @returns {string} Validated string input
 */
function validateCustomStringInput(data: unknown): string {
  if (typeof data !== 'string') {
    throw new DocumentParseError(
      ERROR_MESSAGE_INVALID_INPUT,
      ERROR_CODE_INVALID_INPUT_TYPE
    );
  }
  return data;
}

/**
 * Validate and normalize custom buffer input
 * @param {unknown} data - Buffer data to validate
 * @returns {Uint8Array} Validated buffer input as Uint8Array
 */
function validateCustomBufferInput(data: unknown): Uint8Array {
  if (!Buffer.isBuffer(data)) {
    throw new DocumentParseError(
      ERROR_MESSAGE_INVALID_INPUT,
      ERROR_CODE_INVALID_INPUT_TYPE
    );
  }
  return new Uint8Array(data);
}

/**
 * Validate and normalize custom ArrayBuffer input
 * @param {unknown} data - ArrayBuffer data to validate
 * @returns {Uint8Array} Validated ArrayBuffer input as Uint8Array
 */
function validateCustomArrayBufferInput(data: unknown): Uint8Array {
  if (!(data instanceof ArrayBuffer)) {
    throw new DocumentParseError(
      ERROR_MESSAGE_INVALID_INPUT,
      ERROR_CODE_INVALID_INPUT_TYPE
    );
  }
  return new Uint8Array(data);
}

/**
 * Process custom input types
 * @param {{type: string; data: unknown}} customInput - Custom input object
 * @param {string} customInput.type - Type of the custom input
 * @param {unknown} customInput.data - Data of the custom input
 * @returns {string | Uint8Array} Normalized input
 */
function processCustomInput(customInput: {
  type: string;
  data: unknown;
}): string | Uint8Array {
  switch (customInput.type) {
    case CUSTOM_INPUT_TYPE_STRING:
      return validateCustomStringInput(customInput.data);
    case CUSTOM_INPUT_TYPE_BUFFER:
      return validateCustomBufferInput(customInput.data);
    case CUSTOM_INPUT_TYPE_ARRAYBUFFER:
      return validateCustomArrayBufferInput(customInput.data);
    default:
      throw new DocumentParseError(
        ERROR_MESSAGE_INVALID_INPUT,
        ERROR_CODE_INVALID_INPUT_TYPE
      );
  }
}

/**
 * Normalize input to the format expected by Epub.from()
 * @param {EpubInput} input - Original input
 * @returns {string | Uint8Array} Normalized input for Epub.from()
 */
export function normalizeInputForEpub(input: EpubInput): string | Uint8Array {
  // Handle string input (file path)
  if (typeof input === 'string') {
    return input;
  }

  // Handle ArrayBuffer and Buffer
  if (input instanceof ArrayBuffer || Buffer.isBuffer(input)) {
    return new Uint8Array(input);
  }

  // Handle custom input types
  if (isCustomEpubInput(input)) {
    return processCustomInput(input as { type: string; data: unknown });
  }

  // Invalid input type
  throw new DocumentParseError(
    ERROR_MESSAGE_INVALID_INPUT,
    ERROR_CODE_INVALID_INPUT_TYPE
  );
}

/**
 * Type guard to check if input has the custom EpubInput interface structure
 * @param {unknown} input - Input to check
 * @returns {boolean} True if input has type and data properties
 */
function isCustomEpubInput(
  input: unknown
): input is { type: string; data: string | Buffer | ArrayBuffer } {
  return (
    input !== null &&
    typeof input === 'object' &&
    'type' in input &&
    'data' in input
  );
}

/**
 * Check if file exists and return its size
 * @param {string} filePath - Path to the EPUB file
 * @returns {number} File size in bytes
 * @throws {DocumentParseError} if file doesn't exist
 */
function getFileSize(filePath: string): number {
  const file = Bun.file(filePath);
  const fileSize = file.size;

  if (fileSize === null) {
    throw new DocumentParseError(
      `EPUB file not found or is not accessible: ${filePath}`,
      'FILE_NOT_FOUND'
    );
  }

  return fileSize;
}

/**
 * Validate file size against limits and log warnings
 * @param {number} fileSize - File size in bytes
 * @param {string} filePath - Path to the EPUB file
 * @throws {DocumentParseError} if file is too large
 */
function validateFileSizeLimits(fileSize: number, filePath: string): void {
  // Check if file exceeds maximum size limit
  if (fileSize > MAX_EPUB_FILE_SIZE) {
    throw new DocumentParseError(
      `EPUB file size (${Math.round(fileSize / BYTES_PER_MEGABYTE)}MB) exceeds maximum allowed size (${Math.round(MAX_EPUB_FILE_SIZE / BYTES_PER_MEGABYTE)}MB)`,
      'FILE_TOO_LARGE'
    );
  }

  // Log warning for large files
  if (fileSize > MAX_EPUB_SIZE_WARNING) {
    logger.warn(
      `Large EPUB file detected (${Math.round(fileSize / BYTES_PER_MEGABYTE)}MB). Processing may take additional time and memory.`,
      { filePath, fileSize, warningThreshold: MAX_EPUB_SIZE_WARNING }
    );
  }
}

/**
 * Handle file system errors
 * @param {unknown} error - The error to handle
 * @param {string} filePath - Path to the EPUB file
 * @throws {DocumentParseError} Always throws a DocumentParseError
 */
function handleFileAccessError(error: unknown, filePath: string): never {
  if (error instanceof DocumentParseError) {
    throw error;
  }

  throw new DocumentParseError(
    `Failed to access EPUB file: ${filePath}. ${error instanceof Error ? error.message : 'Unknown error'}`,
    'FILE_ACCESS_ERROR'
  );
}

/**
 * Validate file path size to prevent resource exhaustion attacks
 * @param {string} filePath - Path to the EPUB file
 * @throws {DocumentParseError} if file is too large or doesn't exist
 */
async function validateFilePathSize(filePath: string): Promise<void> {
  try {
    const fileSize = getFileSize(filePath);
    validateFileSizeLimits(fileSize, filePath);
  } catch (error) {
    handleFileAccessError(error, filePath);
  }
}

/**
 * Create and configure EPUB instance
 * @param {EpubInput} input - File path, buffer, or array buffer
 * @returns {Promise<Epub>} Configured EPUB instance
 * @throws {EPUBFormatError} if EPUB creation fails
 */
export async function createEPUBInstance(input: EpubInput): Promise<Epub> {
  try {
    // Validate file size first
    validateFileSize(input);

    // For file paths, do additional file size check
    if (typeof input === 'string') {
      await validateFilePathSize(input);
    }

    // Convert input to the format expected by Epub.from()
    const normalizedInput = normalizeInputForEpub(input);
    // Use Epub.from() to read existing EPUB files
    return await Epub.from(normalizedInput);
  } catch (error) {
    if (error instanceof DocumentParseError) {
      throw error;
    }

    const errorMessage =
      error instanceof Error ? error.message : ERROR_MESSAGE_UNKNOWN;
    throw new EPUBFormatError(errorMessage, {
      originalError: errorMessage,
    });
  }
}
