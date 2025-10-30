/**
 * EPUB Parser Validation Helper Functions
 * Contains helper functions for validation operations
 */

import {
  DocumentParseError,
  EPUBStructureError,
} from '../../../errors/document-parse-error.js';
import type { EpubMetadata } from './epub-parser-types.js';
import {
  MSG_UNKNOWN_ERROR,
  type ValidationResult,
  type SpineItem,
  type ManifestRecord,
} from './epub-parser-validation-types.js';

/**
 * Create parse error validation result
 * @param {Error} error - DocumentParseError instance
 * @param {any} metadata - Current validation metadata
 * @returns {unknown} unknown {Validation result for parse errors}
 */
function createParseErrorResult(
  error: DocumentParseError,
  metadata: ValidationResult['metadata']
): ValidationResult {
  return {
    isValid: false,
    errors: [
      {
        code: 'PARSE_ERROR',
        message: error.message,
        severity: 'critical',
        fix: 'Check EPUB file format and integrity',
      },
    ],
    warnings: [],
    metadata,
  };
}

/**
 * Create unknown error validation result
 * @param {Error} error - Unknown error instance
 * @param {any} metadata - Current validation metadata
 * @returns {unknown} unknown {Validation result for unknown errors}
 */
function createUnknownErrorResult(
  error: unknown,
  metadata: ValidationResult['metadata']
): ValidationResult {
  return {
    isValid: false,
    errors: [
      {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : MSG_UNKNOWN_ERROR,
        severity: 'critical',
      },
    ],
    warnings: [],
    metadata,
  };
}

/**
 * Creates missing EPUB error result
 * @param {any} result - Validation result to update
 * @returns {unknown} unknown {Updated validation result}
 */
export function createMissingEpubResult(
  result: ValidationResult
): ValidationResult {
  result.isValid = false;
  result.errors.push({
    code: 'MISSING_EPUB',
    message: 'EPUB object is null or undefined',
    severity: 'critical',
    fix: 'Provide a valid EPUB object',
  });
  return result;
}

/**
 * Extracts spine items from EPUB with proper typing
 * @param {any} spineItems - Raw spine items from EPUB
 * @returns {object} object {Processed spine items with proper structure}
 */
export function extractSpineItems(spineItems: unknown[]): SpineItem[] {
  return spineItems.map((item: unknown, index: number) => {
    const spineItem = item as Record<string, unknown>;
    return {
      id: (spineItem.idref as string) || `spine-item-${index}`,
      href: (spineItem.href as string) || '',
      linear: spineItem.linear as string,
      mediaType: spineItem.mediaType as string,
    };
  });
}

/**
 * Handle validation errors
 * @param {Error} error - Error that occurred during validation
 * @param {any} result - Validation result to update
 * @returns {unknown} unknown {Updated validation result with error information}
 */
function _handleValidationError(
  error: unknown,
  result: ValidationResult
): ValidationResult {
  if (error instanceof DocumentParseError) {
    return createParseErrorResult(error, result.metadata);
  }
  return createUnknownErrorResult(error, result.metadata);
}

/**
 * Handle validation errors and re-throw as EPUBStructureError (legacy function)
 * @param {Error} error - Caught error during validation
 * @throws EPUBStructureError with appropriate details
 */
export function handleValidationErrorAsStructureError(error: unknown): never {
  if (error instanceof EPUBStructureError) {
    throw error;
  }
  throw new EPUBStructureError({
    missing: 'unknown',
    details: error instanceof Error ? error.message : 'Unknown error',
  });
}

/**
 * Handle spine validation errors
 * @param {Error} error - Error that occurred during validation
 * @param {any} result - Validation result to update
 * @returns {unknown} unknown {Updated validation result}
 */
export function handleSpineValidationError(
  error: unknown,
  result: ValidationResult
): ValidationResult {
  result.isValid = false;
  if (error instanceof EPUBStructureError) {
    result.errors.push({
      code: 'SPINE_VALIDATION_ERROR',
      message: error.message,
      severity: 'critical',
      fix: 'Check EPUB spine structure',
    });
  } else {
    result.errors.push({
      code: 'UNKNOWN_SPINE_ERROR',
      message: 'Unknown error validating spine',
      severity: 'critical',
    });
  }
  return result;
}

/**
 * Update result metadata with EPUB structure information
 * @param {any} result - Validation result to update
 * @param {any} metadata - EPUB metadata
 * @param {any} spineItems - EPUB spine items
 * @param {any} manifest - EPUB manifest
 */
export function updateStructureMetadata(
  result: ValidationResult,
  metadata: EpubMetadata,
  spineItems: unknown[],
  manifest: ManifestRecord
): void {
  result.metadata.hasMetadata = metadata.length > 0;
  result.metadata.spineItemCount = spineItems.length;
  result.metadata.manifestItemCount = Object.keys(manifest).length;
}

/**
 * Handle structure validation errors
 * @param {Error} error - Error that occurred during validation
 * @param {any} result - Validation result to update
 * @returns {unknown} unknown {Updated validation result}
 */
export function handleStructureValidationError(
  error: unknown,
  result: ValidationResult
): ValidationResult {
  result.isValid = false;
  if (error instanceof EPUBStructureError) {
    result.errors.push({
      code: 'STRUCTURE_VALIDATION_ERROR',
      message: error.message,
      severity: 'critical',
      fix: 'Check EPUB structure',
    });
  } else {
    result.errors.push({
      code: 'UNKNOWN_STRUCTURE_ERROR',
      message: 'Unknown error validating structure',
      severity: 'critical',
    });
  }
  return result;
}
