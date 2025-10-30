/**
 * Helper methods for EPUB parser content validation
 * Contains extracted methods to reduce main parser file complexity
 */

import { DocumentStructure } from '../types.js';
import {
  BUFFER_INSPECTION_SIZE,
  FILE_INSPECTION_SIZE,
  MIN_STRING_LENGTH,
  MAX_STRING_LENGTH,
  SHORT_TEXT_THRESHOLD,
  ZIP_MIN_LENGTH,
  ZIP_SIGNATURE_PK,
  ZIP_SIGNATURE_KB,
  ZIP_VERSION_03,
  ZIP_VERSION_05,
  ZIP_VERSION_07,
  NON_PRINTABLE_THRESHOLD_BUFFER,
  NON_PRINTABLE_THRESHOLD_STRING,
  NON_PRINTABLE_REGEX,
  INVALID_PATTERNS,
  PATH_SEPARATORS,
} from './epub-parser-constants.js';

/**
 * Check if document structure is valid
 * @param {DocumentStructure} documentStructure - The document structure to validate
 * @returns {boolean} True if structure is valid
 */
export function hasValidStructure(
  documentStructure: DocumentStructure
): boolean {
  return !!(documentStructure && typeof documentStructure === 'object');
}

/**
 * Check if document has valid chapters
 * @param {DocumentStructure} documentStructure - The document structure to validate
 * @returns {boolean} True if chapters are valid
 */
export function hasValidChapters(
  documentStructure: DocumentStructure
): boolean {
  return !!(
    documentStructure.chapters &&
    Array.isArray(documentStructure.chapters) &&
    documentStructure.chapters.length > 0
  );
}

/**
 * Check if document has a valid title
 * @param {DocumentStructure} documentStructure - The document structure to validate
 * @returns {boolean} True if title is valid
 */
export function hasValidTitle(documentStructure: DocumentStructure): boolean {
  return !!(
    documentStructure.metadata &&
    documentStructure.metadata.title &&
    typeof documentStructure.metadata.title === 'string' &&
    documentStructure.metadata.title !== 'Unknown Title' &&
    documentStructure.metadata.title.trim().length > 0
  );
}

/**
 * Check if buffer has ZIP file signature
 * @param {Buffer} buffer - The buffer to check
 * @returns {boolean} True if buffer has ZIP signature
 */
export function isZipFile(buffer: Buffer): boolean {
  return (
    buffer.length > ZIP_MIN_LENGTH &&
    buffer[0] === ZIP_SIGNATURE_PK &&
    buffer[1] === ZIP_SIGNATURE_KB &&
    (buffer[2] === ZIP_VERSION_03 ||
      buffer[2] === ZIP_VERSION_05 ||
      buffer[2] === ZIP_VERSION_07)
  );
}

/**
 * Check if content has too many non-printable characters
 * @param {string} content - The content to check
 * @param {number} threshold - The threshold for non-printable characters
 * @returns {boolean} True if content has too many non-printable characters
 */
export function hasTooManyNonPrintableChars(
  content: string,
  threshold: number
): boolean {
  const nonPrintableCount = (content.match(NON_PRINTABLE_REGEX) || []).length;
  return nonPrintableCount > content.length * threshold;
}

/**
 * Check if input string is too short to be valid EPUB
 * @param {string} input - The input to check
 * @returns {boolean} True if input is too short
 */
export function isTooShort(input: string): boolean {
  return input.trim().length < MIN_STRING_LENGTH;
}

/**
 * Check if input is short content that doesn't look like a file path
 * @param {string} input - The input to check
 * @returns {boolean} True if input is short non-path content
 */
export function isShortNonPathContent(input: string): boolean {
  return (
    !PATH_SEPARATORS.some((separator) => input.includes(separator)) &&
    input.length < MAX_STRING_LENGTH
  );
}

/**
 * Check if content contains invalid patterns
 * @param {string} content - The content to check (lowercase)
 * @returns {boolean} True if content contains invalid patterns
 */
export function containsInvalidPatterns(content: string): boolean {
  return INVALID_PATTERNS.some((pattern) => content.includes(pattern));
}

/**
 * Check if content is short invalid text that doesn't look like a file path
 * @param {string} content - The content to check
 * @returns {boolean} True if content is short invalid text
 */
export function isShortInvalidText(content: string): boolean {
  const trimmedContent = content.trim();
  const isShortText =
    trimmedContent.length > 0 && trimmedContent.length < SHORT_TEXT_THRESHOLD;
  const isNotFilePath = !PATH_SEPARATORS.some((separator) =>
    content.includes(separator)
  );

  return isShortText && isNotFilePath;
}

/**
 * Check if buffer content is obviously invalid
 * @param {Buffer} buffer - The buffer to check
 * @returns {boolean} True if buffer content is invalid
 */
export function isInvalidBufferContent(buffer: Buffer): boolean {
  const content = buffer.toString(
    'utf8',
    0,
    Math.min(FILE_INSPECTION_SIZE, buffer.length)
  );
  return (
    !isZipFile(buffer) &&
    hasTooManyNonPrintableChars(content, NON_PRINTABLE_THRESHOLD_BUFFER)
  );
}

/**
 * Check if string content is obviously invalid
 * @param {string} input - The string to check
 * @returns {boolean} True if string content is invalid
 */
export function isInvalidStringContent(input: string): boolean {
  if (isTooShort(input)) {
    return true;
  }

  if (isShortNonPathContent(input)) {
    return hasTooManyNonPrintableChars(input, NON_PRINTABLE_THRESHOLD_STRING);
  }

  return false;
}

/**
 * Check if buffer contains invalid text content
 * @param {Buffer} buffer - The buffer to check
 * @returns {boolean} True if buffer contains invalid text
 */
export function isInvalidTextBuffer(buffer: Buffer): boolean {
  const content = buffer.toString(
    'utf8',
    0,
    Math.min(BUFFER_INSPECTION_SIZE, buffer.length)
  );
  const contentLower = content.toLowerCase();

  if (containsInvalidPatterns(contentLower)) {
    return true;
  }

  return isShortInvalidText(content);
}

/**
 * Check if string contains invalid text content
 * @param {string} input - The string to check
 * @returns {boolean} True if string contains invalid text
 */
export function isInvalidTextString(input: string): boolean {
  const contentLower = input.toLowerCase();

  if (containsInvalidPatterns(contentLower)) {
    return true;
  }

  return isShortInvalidText(input);
}
