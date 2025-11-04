/**
 * EPUB Parser Content Validation
 * Contains content validation methods for EPUB parser.
 */

import { DocumentParseError } from '../../../errors/document-parse-error.js';
import type { DocumentStructure, ParseResult } from '../types.js';
import {
  hasValidChapters,
  hasValidStructure,
  hasValidTitle,
  isInvalidTextBuffer,
  isInvalidTextString,
} from './epub-parser-content-helpers.js';

type EpubInput = string | Buffer | ArrayBuffer;

// Constants
const INVALID_EPUB_CONTENT_PREFIX = 'Invalid EPUB content:';
const INPUT_REQUIRED_MESSAGE = 'Input is required';
const FIRST_100_CHARS = 100;
const FIRST_4_BYTES = 4;
const MIN_CONTENT_LENGTH = 50;

// ZIP signature bytes used by EPUB files
const ZIP_BYTE_P = 80; // 'P'
const ZIP_BYTE_K = 75; // 'K'
const ZIP_BYTE_3 = 3; // '\x03'
const ZIP_BYTE_4 = 4; // '\x04'

// ZIP signature used by EPUB files: PK\x03\x04
const ZIP_SIGNATURE = [ZIP_BYTE_P, ZIP_BYTE_K, ZIP_BYTE_3, ZIP_BYTE_4];

/**
 * Check if parsing results contain valid content
 * @param {DocumentStructure} documentStructure - The document structure to validate
 * @returns {boolean} True if content is valid
 */
export function hasValidContent(documentStructure: DocumentStructure): boolean {
  if (!hasValidStructure(documentStructure)) {
    return false;
  }

  const hasChaptersValid = hasValidChapters(documentStructure);
  const hasValidTitleDoc = hasValidTitle(documentStructure);

  // For content to be considered valid, it needs meaningful chapters OR a valid title
  return hasChaptersValid || hasValidTitleDoc;
}

/**
 * Create error result for failed parsing
 * @param {DocumentStructure} documentStructure - The document structure to include in error details
 * @returns {ParseResult} Error result
 */
export function createParsingErrorResult(
  documentStructure: DocumentStructure
): ParseResult {
  return {
    success: false,
    error: {
      code: 'EPUB_FORMAT_ERROR',
      message: 'EPUB parsing failed: No valid content could be extracted',
      details: {
        chaptersFound: documentStructure.chapters.length,
        wordCount: documentStructure.totalWordCount,
        title: documentStructure.metadata.title,
      },
    },
  };
}

/**
 * Check if string content is obviously not an EPUB file
 * @param {string} content - The string content to check
 * @returns {boolean} True if content is obviously invalid
 */
function isObviouslyInvalidString(content: string): boolean {
  // Check if it's a text file that's clearly not EPUB
  if (isInvalidTextString(content)) {
    return true;
  }

  // Check if it's obviously not an EPUB (e.g., plain text, JSON, etc.)
  const trimmedContent = content.trim();
  const first100Chars = trimmedContent
    .substring(0, FIRST_100_CHARS)
    .toLowerCase();

  // Common non-EPUB file patterns
  const nonEpubPatterns = [
    /^<\?xml/, // XML declaration without EPUB structure
    /^{/, // JSON
    /^(title|author|chapter):/, // Plain text metadata
    /^(the |a |an )/, // Common book text start
    /^[\s!',.?A-Za-z-]+$/, // Plain text only
  ];

  return nonEpubPatterns.some((pattern) => pattern.test(first100Chars));
}

/**
 * Check if ArrayBuffer has valid ZIP signature (required for EPUB)
 * @param {ArrayBuffer} arrayBuffer - The ArrayBuffer to check
 * @returns {boolean} True if it has ZIP signature, false otherwise
 */
function hasValidZipSignature(arrayBuffer: ArrayBuffer): boolean {
  const uint8Array = new Uint8Array(arrayBuffer);
  const firstBytes = uint8Array.slice(0, FIRST_4_BYTES);
  const firstSig = Array.from(firstBytes);

  return ZIP_SIGNATURE.every((byte, index) => byte === firstSig[index]);
}

/**
 * Check if content is obviously not an EPUB file
 * @param {EpubInput} epubInput - The EPUB input to check
 * @returns {boolean} True if content is obviously invalid
 */
export function isObviouslyInvalidContent(epubInput: EpubInput): boolean {
  // Buffer checks
  if (Buffer.isBuffer(epubInput)) {
    return isInvalidTextBuffer(epubInput);
  }

  // String checks
  if (typeof epubInput === 'string') {
    return isObviouslyInvalidString(epubInput);
  }

  // ArrayBuffer checks
  if (epubInput instanceof ArrayBuffer) {
    return !hasValidZipSignature(epubInput);
  }

  return false;
}

/**
 * Check if content is obviously non-EPUB text content
 * @param {EpubInput} epubInput - The EPUB input to check
 * @returns {boolean} True if content is obviously non-EPUB text
 */
export function isObviouslyNonEpubTextContent(epubInput: EpubInput): boolean {
  if (typeof epubInput !== 'string') {
    return false;
  }

  const content = epubInput.trim();

  // If content is too short to be EPUB
  if (content.length < MIN_CONTENT_LENGTH) {
    return true;
  }

  // Check for patterns that indicate plain text rather than EPUB
  const plainTextPatterns = [
    /^(chapter|part|section)\s+\d+/i,
    /^(the|a|an)\s+/i,
    /^[\s!',.?a-z-]+$/i, // Only letters and basic punctuation
  ];

  return plainTextPatterns.some((pattern) =>
    pattern.test(content.substring(0, FIRST_100_CHARS))
  );
}

/**
 * Check if a string appears to be a file path
 * @param {string} input - The string to check
 * @returns {boolean} True if the string appears to be a file path
 */
function isFilePath(input: string): boolean {
  // Check for path separators and .epub extension
  const hasPathSeparator = input.includes('/') || input.includes('\\');
  const hasEpubExtension = input.toLowerCase().endsWith('.epub');
  return hasPathSeparator || hasEpubExtension;
}

/**
 * Perform content validation on EPUB input
 * @param {EpubInput} epubInput - The EPUB input to validate
 * @throws {Error} If content validation fails
 */
export function performContentValidation(epubInput: EpubInput): void {
  // Skip content validation for file paths - they should be validated at file system level
  if (typeof epubInput === 'string' && isFilePath(epubInput)) {
    return;
  }

  if (isObviouslyInvalidContent(epubInput)) {
    throw new Error(
      `${INVALID_EPUB_CONTENT_PREFIX} Not a valid EPUB file format`
    );
  }

  if (isObviouslyNonEpubTextContent(epubInput)) {
    throw new Error(
      `${INVALID_EPUB_CONTENT_PREFIX} Text content is not a valid EPUB format`
    );
  }

  if (typeof epubInput === 'string' && epubInput.trim().length === 0) {
    throw new DocumentParseError(INPUT_REQUIRED_MESSAGE, 'INVALID_INPUT');
  }
}
