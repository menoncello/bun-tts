/**
 * EPUB Parser Basic Validation - Structure Validation
 *
 * EPUB structure validation functions
 */

import { EPUBStructureError } from '../../../errors/document-parse-error.js';
import type { EpubMetadata } from './epub-parser-types.js';
import { validateBasicMetadata } from './epub-parser-validation-basic-metadata.js';
import {
  MSG_MISSING_METADATA,
  MSG_MISSING_SPINE,
  MSG_MISSING_MANIFEST,
  type ValidationResult,
  type SpineItem,
  type ManifestRecord,
  type BasicStructureParams,
} from './epub-parser-validation-types.js';

/**
 * Validate metadata presence and basic content
 * @param {EpubMetadata} metadata - EPUB metadata array
 * @param {ValidationResult} result - Validation result to update
 */
export function validateMetadataPresence(
  metadata: EpubMetadata,
  result: ValidationResult
): void {
  const hasMetadata = Boolean(metadata && metadata.length > 0);

  // Update metadata presence flag
  result.metadata.hasMetadata = hasMetadata;

  if (!hasMetadata) {
    result.errors.push({
      code: 'MISSING_METADATA',
      message: MSG_MISSING_METADATA,
      severity: 'critical',
      fix: 'Ensure EPUB contains proper metadata with title and identifier',
    });
    result.isValid = false;
    return;
  }

  // If metadata exists, validate its basic content (title, identifier)
  validateBasicMetadata(metadata, result);
}

/**
 * Validate spine presence
 * @param {SpineItem[]} spineItems - EPUB spine items
 * @param {ValidationResult} result - Validation result to update
 */
export function validateSpinePresence(
  spineItems: SpineItem[],
  result: ValidationResult
): void {
  if (!spineItems || spineItems.length === 0) {
    result.errors.push({
      code: 'MISSING_SPINE',
      message: MSG_MISSING_SPINE,
      severity: 'critical',
      fix: 'Ensure EPUB contains a proper reading order',
    });
    result.isValid = false;
  }
}

/**
 * Validate manifest presence
 * @param {ManifestRecord} manifest - EPUB manifest
 * @param {ValidationResult} result - Validation result to update
 */
export function validateManifestPresence(
  manifest: ManifestRecord,
  result: ValidationResult
): void {
  if (!manifest || Object.keys(manifest).length === 0) {
    result.errors.push({
      code: 'MISSING_MANIFEST',
      message: MSG_MISSING_MANIFEST,
      severity: 'critical',
      fix: 'Ensure EPUB contains a proper file manifest',
    });
    result.isValid = false;
  }
}

/**
 * Validate structure components
 * @param {BasicStructureParams} params - Validation parameters
 * @param {ValidationResult} result - Validation result to update
 */
export function validateStructureComponents(
  params: BasicStructureParams,
  result: ValidationResult
): void {
  try {
    performComponentValidation(params, result);
    updateValidationMetadata(
      result,
      params.metadata,
      params.spineItems,
      params.manifest
    );
  } catch (error) {
    handleStructureValidationError(error, result);
  }
}

/**
 * Perform validation of individual structure components
 * @param {BasicStructureParams} params - Validation parameters
 * @param {ValidationResult} result - Validation result to update
 */
function performComponentValidation(
  params: BasicStructureParams,
  result: ValidationResult
): void {
  const { metadata, spineItems, manifest } = params;

  validateMetadataPresence(metadata, result);
  validateSpinePresence(spineItems, result);
  validateManifestPresence(manifest, result);
}

/**
 * Handle structure validation errors
 * @param {unknown} error - Error that occurred
 * @param {ValidationResult} result - Validation result to update
 */
function handleStructureValidationError(
  error: unknown,
  result: ValidationResult
): void {
  if (error instanceof EPUBStructureError) {
    addStructureError(error, result);
  } else {
    addUnknownStructureError(error, result);
  }
  result.isValid = false;
}

/**
 * Add known structure error to result
 * @param {EPUBStructureError} error - Structure error
 * @param {ValidationResult} result - Validation result to update
 */
function addStructureError(
  error: EPUBStructureError,
  result: ValidationResult
): void {
  result.errors.push({
    code: 'STRUCTURE_ERROR',
    message: error.message,
    severity: 'critical',
    fix: 'Check EPUB structure and format',
  });
}

/**
 * Add unknown structure error to result
 * @param {unknown} error - Unknown error
 * @param {ValidationResult} result - Validation result to update
 */
function addUnknownStructureError(
  error: unknown,
  result: ValidationResult
): void {
  result.errors.push({
    code: 'STRUCTURE_VALIDATION_ERROR',
    message:
      error instanceof Error
        ? error.message
        : 'Unknown structure validation error',
    severity: 'critical',
    fix: 'Check EPUB structure and format',
  });
}

/**
 * Update validation result metadata with EPUB information
 * @param {ValidationResult} result - Validation result to update
 * @param {EpubMetadata} metadata - EPUB metadata
 * @param {SpineItem[]} spineItems - EPUB spine items
 * @param {ManifestRecord} manifest - EPUB manifest
 */
function updateValidationMetadata(
  result: ValidationResult,
  metadata: EpubMetadata,
  spineItems: SpineItem[],
  manifest: ManifestRecord
): void {
  result.metadata.spineItemCount = spineItems.length;
  result.metadata.manifestItemCount = Object.keys(manifest).length;
  // Note: hasMetadata is now set in validateMetadataPresence function
}
