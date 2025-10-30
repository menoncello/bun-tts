/** EPUB Parser Metadata Validation - Metadata-specific validation logic */

import type { EpubMetadata } from './epub-parser-types.js';
import {
  MIN_LANGUAGE_LENGTH,
  MAX_LANGUAGE_LENGTH,
  MAX_AUTHOR_NAME_LENGTH,
  type ValidationResult,
} from './epub-parser-validation-types.js';

/**
 * Validate language metadata
 * @param {any} metadata - EPUB metadata array
 * @param {any} result - Validation result
 */
function validateLanguageMetadata(
  metadata: EpubMetadata,
  result: ValidationResult
): void {
  const languageEntry = metadata.find(
    (entry) => entry.type === 'language' && entry.value
  );

  if (!languageEntry?.value) {
    addMissingLanguageWarning(result);
    return;
  }

  result.metadata.language = languageEntry.value;

  // Check length first, if invalid don't check format to avoid duplicate errors
  const lengthValid = validateLanguageLength(languageEntry.value, result);
  if (lengthValid) {
    validateLanguageFormat(languageEntry.value, result);
  }
}

/**
 * Add missing language warning
 * @param {any} result - Validation result
 */
function addMissingLanguageWarning(result: ValidationResult): void {
  result.warnings.push({
    code: 'MISSING_LANGUAGE',
    message: 'language metadata not found',
    suggestion: 'Add dc:language element to OPF file',
  });
}

/**
 * Validate language length
 * @param {any} language - Language code
 * @param {any} result - Validation result
 * @returns {boolean} boolean True if length is valid
 */
function validateLanguageLength(
  language: string,
  result: ValidationResult
): boolean {
  if (
    language.length < MIN_LANGUAGE_LENGTH ||
    language.length > MAX_LANGUAGE_LENGTH
  ) {
    result.errors.push({
      code: 'INVALID_LANGUAGE_LENGTH',
      message: `Invalid language code length: ${language.length} (must be ${MIN_LANGUAGE_LENGTH}-${MAX_LANGUAGE_LENGTH})`,
      severity: 'error',
      fix: `Use standard language code (e.g., 'en', 'pt-BR')`,
    });
    return false;
  }
  return true;
}

/**
 * Validate language format
 * @param {any} language - Language code
 * @param {any} result - Validation result
 */
function validateLanguageFormat(
  language: string,
  result: ValidationResult
): void {
  const languagePattern = /^[a-z]{2}(-[A-Z]{2})?$/;
  if (!languagePattern.test(language)) {
    result.errors.push({
      code: 'INVALID_LANGUAGE_FORMAT',
      message: `Invalid language code format: ${language}`,
      severity: 'error',
      fix: `Use standard language code format (e.g., 'en', 'pt-BR')`,
    });
  }
}

/**
 * Validate author metadata
 * @param {any} metadata - EPUB metadata array
 * @param {any} result - Validation result
 */
function validateAuthorMetadata(
  metadata: EpubMetadata,
  result: ValidationResult
): void {
  const authors = metadata.filter((entry) => entry.type === 'creator');

  if (authors.length === 0) {
    result.warnings.push({
      code: 'MISSING_AUTHOR',
      message: 'Author information not found',
      suggestion: 'Add dc:creator element to OPF file',
    });
    return;
  }

  for (const [index, author] of authors.entries()) {
    if (!author.value) continue;

    if (author.value.length > MAX_AUTHOR_NAME_LENGTH) {
      result.errors.push({
        code: 'AUTHOR_NAME_TOO_LONG',
        message: `Author name ${index + 1} is too long (${author.value.length} > ${MAX_AUTHOR_NAME_LENGTH})`,
        severity: 'warning',
        fix: `Shorten author name to ${MAX_AUTHOR_NAME_LENGTH} characters or less`,
      });
    }
  }
}

/**
 * Validate date metadata
 * @param {any} metadata - EPUB metadata array
 * @param {any} result - Validation result
 */
function validateDateMetadata(
  metadata: EpubMetadata,
  result: ValidationResult
): void {
  const dates = metadata.filter((entry) => entry.type === 'date');

  if (dates.length === 0) {
    result.warnings.push({
      code: 'MISSING_DATE',
      message: 'Publication date not found',
      suggestion: 'Add dc:date element to OPF file',
    });
    return;
  }

  for (const date of dates) {
    if (!date.value) continue;

    if (!isValidDate(date.value)) {
      result.errors.push({
        code: 'INVALID_DATE_FORMAT',
        message: `Invalid date format: ${date.value}`,
        severity: 'warning',
        fix: 'Use ISO 8601 date format (e.g., 2023-12-01)',
      });
    }
  }
}

/**
 * Check if date string is valid
 * @param {any} dateString - Date string to validate
 * @returns {unknown} unknown True if date is valid
 */
function isValidDate(dateString: string): boolean {
  // Check for basic ISO 8601 format
  const iso8601Pattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!iso8601Pattern.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return !Number.isNaN(date.getTime());
}

/**
 * Standard metadata validation with comprehensive checks
 * @param {any} metadata - EPUB metadata array
 * @param {any} result - Validation result
 */
export function validateStandardMetadata(
  metadata: EpubMetadata,
  result: ValidationResult
): void {
  validateLanguageMetadata(metadata, result);
  validateAuthorMetadata(metadata, result);
  validateDateMetadata(metadata, result);
}
