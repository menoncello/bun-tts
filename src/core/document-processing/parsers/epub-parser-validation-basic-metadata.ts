/**
 * EPUB Parser Basic Validation - Metadata Validation
 *
 * EPUB metadata validation functions
 */

import { EPUBStructureError } from '../../../errors/document-parse-error.js';
import type { EpubMetadata } from './epub-parser-types.js';
import {
  MIN_TITLE_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_LANGUAGE_LENGTH,
  MAX_LANGUAGE_LENGTH,
  type ValidationResult,
} from './epub-parser-validation-types.js';

/**
 * Validate title metadata
 * @param {EpubMetadata} metadata - EPUB metadata array to validate
 * @param {ValidationResult} result - Validation result object to update
 */
export function validateTitleMetadata(
  metadata: EpubMetadata,
  result: ValidationResult
): void {
  const hasTitle = hasValidTitle(metadata);

  if (!hasTitle) {
    addMissingTitleError(result);
    result.isValid = false; // CRITICAL: Set isValid to false when title is missing
    return;
  }

  const titleEntry = findTitleEntry(metadata);
  processTitleEntry(titleEntry, result);
}

/**
 * Check if metadata has a valid title entry
 * @param {EpubMetadata} metadata - EPUB metadata array to check
 * @returns {boolean} True if valid title exists
 */
function hasValidTitle(metadata: EpubMetadata): boolean {
  return metadata.some((entry) => entry.type === 'title' && entry.value);
}

/**
 * Add missing title error to validation result
 * @param {ValidationResult} result - Validation result to update
 */
function addMissingTitleError(result: ValidationResult): void {
  result.errors.push({
    code: 'MISSING_TITLE',
    message: 'EPUB metadata is missing title',
    severity: 'critical',
    fix: 'Add a title element to the EPUB metadata',
  });
}

/**
 * Find the title entry in metadata
 * @param {EpubMetadata} metadata - EPUB metadata array to search
 * @returns {{ type: string; value?: string } | undefined} Title entry if found
 */
function findTitleEntry(
  metadata: EpubMetadata
): { type: string; value?: string } | undefined {
  return metadata.find((entry) => entry.type === 'title' && entry.value);
}

/**
 * Process title entry and validate its properties
 * @param {{ type: string; value?: string } | undefined} titleEntry - Title entry to process
 * @param {ValidationResult} result - Validation result to update
 */
function processTitleEntry(
  titleEntry: { type: string; value?: string } | undefined,
  result: ValidationResult
): void {
  if (titleEntry?.value) {
    result.metadata.title = titleEntry.value;
    validateTitleLength(titleEntry.value, result);
  }
}

/**
 * Validate title length constraints
 * @param {string} title - Title text to validate
 * @param {ValidationResult} result - Validation result to update
 */
function validateTitleLength(title: string, result: ValidationResult): void {
  if (title.length < MIN_TITLE_LENGTH || title.length > MAX_TITLE_LENGTH) {
    result.errors.push({
      code: 'INVALID_TITLE_LENGTH',
      message: `Title length must be between ${MIN_TITLE_LENGTH} and ${MAX_TITLE_LENGTH} characters`,
      severity: 'error',
      fix: 'Update title to meet length requirements',
    });
  }
}

/**
 * Validate identifier metadata
 * @param {EpubMetadata} metadata - EPUB metadata array to validate
 * @param {ValidationResult} result - Validation result object to update
 */
function validateIdentifierMetadata(
  metadata: EpubMetadata,
  result: ValidationResult
): void {
  const hasIdentifier = metadata.some(
    (entry) => entry.type === 'identifier' && entry.value
  );

  if (!hasIdentifier) {
    result.errors.push({
      code: 'MISSING_IDENTIFIER',
      message: 'EPUB metadata is missing identifier',
      severity: 'error',
      fix: 'Add a unique identifier to the EPUB metadata',
    });
    result.isValid = false; // CRITICAL: Set isValid to false when identifier is missing
  }
}

/**
 * Validate language metadata
 * @param {EpubMetadata} metadata - EPUB metadata array to validate
 * @param {ValidationResult} result - Validation result object to update
 */
function validateLanguageMetadata(
  metadata: EpubMetadata,
  result: ValidationResult
): void {
  const languageEntry = findLanguageEntry(metadata);

  if (!languageEntry) {
    addMissingLanguageError(result);
    return;
  }

  validateLanguageCodeFormat(languageEntry.value, result);
}

/**
 * Find language entry in metadata
 * @param {EpubMetadata} metadata - EPUB metadata array to search
 * @returns {{ type: string; value?: string } | undefined} Language entry if found
 */
function findLanguageEntry(
  metadata: EpubMetadata
): { type: string; value?: string } | undefined {
  return metadata.find((entry) => entry.type === 'language' && entry.value);
}

/**
 * Add missing language error to validation result
 * @param {ValidationResult} result - Validation result to update
 */
function addMissingLanguageError(result: ValidationResult): void {
  result.errors.push({
    code: 'MISSING_LANGUAGE',
    message: 'EPUB metadata is missing language',
    severity: 'error',
    fix: 'Add a language element to the EPUB metadata',
  });
  result.isValid = false; // CRITICAL: Set isValid to false when language is missing
}

/**
 * Validate language code format
 * @param {string | undefined} languageValue - Language code to validate
 * @param {ValidationResult} result - Validation result to update
 */
function validateLanguageCodeFormat(
  languageValue: string | undefined,
  result: ValidationResult
): void {
  if (!languageValue) {
    return;
  }

  if (
    languageValue.length < MIN_LANGUAGE_LENGTH ||
    languageValue.length > MAX_LANGUAGE_LENGTH ||
    !/^[a-z]{2}(-[A-Z]{2})?$/.test(languageValue)
  ) {
    result.errors.push({
      code: 'INVALID_LANGUAGE_CODE',
      message: `EPUB metadata contains invalid language code: ${languageValue}`,
      severity: 'error',
      fix: 'Update language code to follow ISO 639-1 format (e.g., "en", "en-US")',
    });
    result.isValid = false; // CRITICAL: Set isValid to false when language code is invalid
  } else {
    result.metadata.language = languageValue;
  }
}

/**
 * Validate basic metadata (title, identifier, and language presence)
 * @param {EpubMetadata} metadata - EPUB metadata array to validate for required elements
 * @param {ValidationResult} result - Validation result object to update with validation findings
 */
export function validateBasicMetadata(
  metadata: EpubMetadata,
  result: ValidationResult
): void {
  validateTitleMetadata(metadata, result);
  validateIdentifierMetadata(metadata, result);
  validateLanguageMetadata(metadata, result);
}

/**
 * Validate EPUB metadata (legacy function)
 * @param {EpubMetadata} metadata - EPUB metadata to validate
 * @throws EPUBStructureError if metadata is invalid
 */
export function validateEPUBMetadata(metadata: EpubMetadata): void {
  if (!metadata || metadata.length === 0) {
    throw new EPUBStructureError({ missing: 'metadata' });
  }

  // Check if there's a title entry in metadata
  const hasTitle = metadata.some(
    (entry) => entry.type === 'title' && entry.value
  );
  if (!hasTitle) {
    throw new EPUBStructureError({ missing: 'title' });
  }
}
