/**
 * EPUB Parser Basic Validation - Core Functions
 *
 * Core validation logic and result handling
 */

import type { Epub } from '@smoores/epub';
import { DocumentParseError } from '../../../errors/document-parse-error.js';
import type { EpubMetadata } from './epub-parser-types.js';
import { determineValidity } from './epub-parser-validation-basic-helpers.js';
import { validateStructureComponents } from './epub-parser-validation-basic-structure.js';
import type {
  EpubLike,
  ValidationResult,
  SpineItem,
  ManifestRecord,
  BasicStructureParams,
} from './epub-parser-validation-types.js';

/**
 * Create initial validation result with default values
 * @returns {object} object Initial validation result object
 */
export function createInitialValidationResult(): ValidationResult {
  return {
    isValid: true,
    errors: [],
    warnings: [],
    metadata: {
      fileSize: 0,
      spineItemCount: 0,
      manifestItemCount: 0,
      hasNavigation: false,
      hasMetadata: false,
    },
  };
}

/**
 * Update validation result metadata with EPUB information
 * @param {ValidationResult} result - Validation result to update with metadata information
 * @param {EpubMetadata} metadata - EPUB metadata containing title, author, and other information
 * @param {SpineItem[]} spineItems - Array of EPUB spine items representing reading order
 * @param {ManifestRecord} manifest - EPUB manifest containing file mappings and metadata
 */
export function updateValidationMetadata(
  result: ValidationResult,
  metadata: EpubMetadata,
  spineItems: SpineItem[],
  manifest: ManifestRecord
): void {
  result.metadata.spineItemCount = spineItems.length;
  result.metadata.manifestItemCount = Object.keys(manifest).length;
  result.metadata.hasMetadata = metadata.length > 0;
}

/**
 * Create parse error validation result
 * @param {DocumentParseError} error - DocumentParseError instance
 * @param {ValidationResult['metadata']} metadata - Current validation metadata
 * @returns {ValidationResult} Validation result for parse errors
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
 * @param {unknown} error - Unknown error instance
 * @param {ValidationResult['metadata']} metadata - Current validation metadata
 * @returns {ValidationResult} Validation result for unknown errors
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
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
        severity: 'critical',
        fix: 'Check EPUB file format and integrity',
      },
    ],
    warnings: [],
    metadata,
  };
}

/**
 * Handle validation error and create appropriate result
 * @param {unknown} error - Error that occurred during validation
 * @param {ValidationResult['metadata']} metadata - Current validation metadata
 * @returns {ValidationResult} Validation result with error information
 */
export function handleValidationError(
  error: unknown,
  metadata: ValidationResult['metadata']
): ValidationResult {
  if (error instanceof DocumentParseError) {
    return createParseErrorResult(error, metadata);
  }
  return createUnknownErrorResult(error, metadata);
}

/**
 * Validate EPUB object and its methods
 * @param {Epub} epub - EPUB object to validate
 * @returns {boolean} boolean True if EPUB object is valid
 */
function validateEpubObject(epub: Epub | EpubLike): boolean {
  return epub !== null && epub !== undefined && typeof epub === 'object';
}

/**
 * Validate EPUB methods availability
 * @param {Epub} epub - EPUB object to check
 * @param {ValidationResult} result - Validation result to update
 * @returns {boolean} boolean True if all required methods are available
 */
function validateEpubMethods(
  epub: Epub | EpubLike,
  result: ValidationResult
): boolean {
  const requiredMethods = [
    'getMetadata',
    'getSpineItems',
    'getManifest',
    'close',
  ];
  let allMethodsAvailable = true;

  for (const method of requiredMethods) {
    if (
      !(method in epub) ||
      typeof (epub as unknown as Record<string, () => unknown>)[method] !==
        'function'
    ) {
      result.errors.push({
        code: 'MISSING_METHOD',
        message: `Required EPUB method '${method}' is not available`,
        severity: 'critical',
        fix: 'Ensure EPUB library is properly initialized',
      });
      allMethodsAvailable = false;
    }
  }

  return allMethodsAvailable;
}

/**
 * Check if result has critical errors
 * @param {ValidationResult} result - Validation result to check
 * @returns {boolean} boolean True if critical errors are present
 */
function hasCriticalErrors(result: ValidationResult): boolean {
  return result.errors.some((error) => error.severity === 'critical');
}

/**
 * Validate basic EPUB structure with comprehensive error handling
 * @param {BasicStructureParams} params - Validation parameters
 * @returns {Promise<ValidationResult>} Promise that resolves to validation result
 */
export async function validateBasicEpubStructure(
  params: BasicStructureParams
): Promise<ValidationResult> {
  const result = params.result || createInitialValidationResult();

  try {
    if (!performInitialValidation(params.epub, result)) {
      return result;
    }

    validateStructureComponents(params, result);

    return finalizeValidation(result);
  } catch (error) {
    return handleValidationError(error, result.metadata);
  }
}

/**
 * Perform initial validation of EPUB object and methods
 * @param {Epub} epub - EPUB object to validate
 * @param {ValidationResult} result - Validation result to update
 * @returns {boolean} True if validation should continue
 */
function performInitialValidation(
  epub: Epub | EpubLike,
  result: ValidationResult
): boolean {
  if (!validateEpubObject(epub)) {
    addInvalidEpubObjectError(result);
    return false;
  }

  const methodsValid = validateEpubMethods(epub, result);
  if (!methodsValid) {
    result.isValid = false;
  }

  return methodsValid;
}

/**
 * Add invalid EPUB object error to result
 * @param {ValidationResult} result - Validation result to update
 */
function addInvalidEpubObjectError(result: ValidationResult): void {
  result.errors.push({
    code: 'INVALID_EPUB_OBJECT',
    message: 'Invalid EPUB object provided',
    severity: 'critical',
    fix: 'Ensure proper EPUB object is provided',
  });
  result.isValid = false;
}

/**
 * Finalize validation by checking for errors and determining validity
 * @param {ValidationResult} result - Validation result to finalize
 * @returns {ValidationResult} Finalized validation result
 */
function finalizeValidation(result: ValidationResult): ValidationResult {
  if (hasCriticalErrors(result)) {
    result.isValid = false;
    return result;
  }

  // Only run determineValidity if we haven't already set isValid to false
  if (result.isValid) {
    determineValidity(result);
  }
  return result;
}

/**
 * Validate basic structure with error handling
 * @param {Epub} epub - EPUB object to validate
 * @returns {Promise<ValidationResult>} Promise that resolves to validation result
 */
export async function validateBasicStructure(
  epub: Epub | EpubLike
): Promise<ValidationResult> {
  try {
    const result = createInitialValidationResult();
    return await validateBasicEpubStructure({
      epub,
      metadata: await epub.getMetadata(),
      spineItems: await epub.getSpineItems(),
      manifest: await epub.getManifest(),
      result,
    });
  } catch (error) {
    return handleValidationError(
      error,
      createInitialValidationResult().metadata
    );
  }
}

/**
 * Comprehensive EPUB structure validation
 * @param {Epub} epub - EPUB object to validate
 * @param {boolean} _verbose - Enable verbose logging
 * @returns {Promise<ValidationResult>} Promise that resolves to validation result
 */
export async function validateEPUBStructure(
  epub: Epub,
  _verbose = false
): Promise<ValidationResult> {
  try {
    const result = createInitialValidationResult();

    // Verbose logging would go here if a logger was provided
    // For now, we'll avoid console statements to meet ESLint standards

    return await validateBasicEpubStructure({
      epub,
      metadata: await epub.getMetadata(),
      spineItems: await epub.getSpineItems(),
      manifest: await epub.getManifest(),
      result,
    });
  } catch (error) {
    const result = createInitialValidationResult();
    return handleValidationError(error, result.metadata);
  }
}
