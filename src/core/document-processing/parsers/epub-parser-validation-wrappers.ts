/**
 * EPUB Parser Validation Wrappers
 * Contains wrapper functions for ValidationResult-based validation
 */

import type { Epub } from '@smoores/epub';
import { EPUBStructureError } from '../../../errors/document-parse-error.js';
import {
  createInitialValidationResult,
  validateEPUBSpine,
  validateEPUBManifest,
  validateEPUBStructure,
} from './epub-parser-validation-basic.js';
import {
  extractSpineItems,
  handleSpineValidationError,
  handleStructureValidationError,
} from './epub-parser-validation-helpers.js';
import type { ValidationResult } from './epub-parser-validation-types.js';

/**
 * Wrapper function for validating EPUB spine with ValidationResult
 * @param {any} epub - Epub object to validate
 * @returns {unknown} unknown {Validation result with detailed information}
 */
export async function validateEPUBSpineWithResult(
  epub: Epub
): Promise<ValidationResult> {
  const result = createInitialValidationResult();

  try {
    const spineItems = await epub.getSpineItems();
    const convertedSpineItems = extractSpineItems(spineItems);

    validateEPUBSpine(convertedSpineItems);
    result.metadata.spineItemCount = convertedSpineItems.length;

    return result;
  } catch (error) {
    return handleSpineValidationError(error, result);
  }
}

/**
 * Wrapper function for validating EPUB manifest with ValidationResult
 * @param {any} epub - Epub object to validate
 * @returns {unknown} unknown {Validation result with detailed information}
 */
export async function validateEPUBManifestWithResult(
  epub: Epub
): Promise<ValidationResult> {
  const result = createInitialValidationResult();

  try {
    const manifest = await epub.getManifest();
    validateEPUBManifest(manifest);

    result.metadata.manifestItemCount = Object.keys(manifest).length;

    return result;
  } catch (error) {
    result.isValid = false;
    if (error instanceof EPUBStructureError) {
      result.errors.push({
        code: 'MANIFEST_VALIDATION_ERROR',
        message: error.message,
        severity: 'critical',
        fix: 'Check EPUB manifest structure',
      });
    } else {
      result.errors.push({
        code: 'UNKNOWN_MANIFEST_ERROR',
        message: 'Unknown error validating manifest',
        severity: 'critical',
      });
    }
    return result;
  }
}

/**
 * Wrapper function for validating complete EPUB structure with ValidationResult
 * @param {any} epub - Epub object to validate
 * @returns {unknown} unknown {Validation result with detailed information}
 */
export async function validateEPUBStructureWithResult(
  epub: Epub
): Promise<ValidationResult> {
  try {
    // The core validateEPUBStructure function returns a ValidationResult directly
    return await validateEPUBStructure(epub);
  } catch (error) {
    // Fallback error handling in case something unexpected happens
    const result = createInitialValidationResult();
    return handleStructureValidationError(error, result);
  }
}
