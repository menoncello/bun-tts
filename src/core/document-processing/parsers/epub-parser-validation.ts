/**
 * EPUB Parser Validation Module
 *
 * Contains enhanced validation logic for EPUB structure and components.
 * Provides comprehensive validation with detailed error reporting and
 * configurable validation levels.
 */

import { Epub } from '@smoores/epub';
import type { EpubMetadata } from './epub-parser-types.js';
import {
  createInitialValidationResult,
  updateValidationMetadata,
  handleValidationError,
  determineValidity,
  validateEPUBMetadata as validateEPUBMetadataLegacy,
  validateEPUBSpine as validateEPUBSpineLegacy,
  validateEPUBManifest as validateEPUBManifestLegacy,
} from './epub-parser-validation-basic.js';
import { validateStandardStructure } from './epub-parser-validation-standard.js';
import { validateStrictStructure } from './epub-parser-validation-strict.js';
import {
  ValidationLevel,
  type ValidationConfig,
  type ValidationResult,
  type StandardStructureParams,
  type EpubLike,
} from './epub-parser-validation-types.js';

// Re-export types for backward compatibility
export type {
  ValidationLevel,
  ValidationConfig,
  ValidationResult,
  StandardStructureParams,
} from './epub-parser-validation-types.js';

// Re-export utility functions for tests and other modules
export {
  handleValidationError,
  determineValidity,
  createInitialValidationResult,
  updateValidationMetadata,
} from './epub-parser-validation-basic.js';

/**
 * Run validation based on specified level
 * @param {any} params - Validation parameters including epub, metadata, and configuration
 */
async function runValidationByLevel(
  params: StandardStructureParams
): Promise<void> {
  switch (params.config.level) {
    case ValidationLevel.BASIC:
      const { validateBasicStructure } = await import(
        './epub-parser-validation-basic'
      );
      const basicResult = await validateBasicStructure(params.epub);
      // Merge the basic validation result into the shared result
      params.result.errors.push(...basicResult.errors);
      params.result.warnings.push(...basicResult.warnings);
      params.result.metadata = {
        ...params.result.metadata,
        ...basicResult.metadata,
      };
      params.result.isValid = basicResult.isValid;
      break;
    case ValidationLevel.STANDARD:
      await validateStandardStructure(params);
      break;
    case ValidationLevel.STRICT:
      await validateStrictStructure(params);
      break;
  }
}

/**
 * Enhanced EPUB validation with configurable validation levels
 * @param {Epub | EpubLike} epub - EPUB instance to validate
 * @param {object} config - Validation configuration options
 * @returns {ValidationResult} Detailed validation result
 */
export async function validateEPUBStructureAdvanced(
  epub: Epub | EpubLike,
  config: ValidationConfig = { level: ValidationLevel.STANDARD }
): Promise<ValidationResult> {
  const result = createInitialValidationResult();

  try {
    // Collect basic information
    const [metadata, spineItems, manifest] = await Promise.all([
      epub.getMetadata(),
      epub.getSpineItems(),
      epub.getManifest(),
    ]);

    // Update metadata
    updateValidationMetadata(result, metadata, spineItems, manifest);

    // Run validation based on level
    const params: StandardStructureParams = {
      epub,
      metadata,
      spineItems,
      manifest,
      result,
      config,
    };
    await runValidationByLevel(params);

    // Determine overall validity
    determineValidity(result);

    return result;
  } catch (error) {
    return handleValidationError(error, result.metadata);
  }
}

/**
 * Validate EPUB structure by checking required components (enhanced version)
 * @param {Epub | EpubLike} epub - EPUB instance to validate
 * @param {object} config - Validation configuration options (optional)
 * @returns {ValidationResult} Promise that resolves when validation is complete
 */
export async function validateEPUBStructure(
  epub: Epub | EpubLike,
  config: ValidationConfig = { level: ValidationLevel.STANDARD }
): Promise<ValidationResult> {
  return validateEPUBStructureAdvanced(epub, config);
}

/**
 * Validate EPUB metadata (enhanced version)
 * @param {any} metadata - EPUB metadata to validate
 * @param {object} config - Validation configuration options (optional)
 * @returns {ValidationResult} Enhanced validation result with detailed error reporting
 */
export async function validateEPUBMetadata(
  metadata: EpubMetadata,
  config: ValidationConfig = { level: ValidationLevel.STANDARD }
): Promise<ValidationResult> {
  // Create a minimal epub-like object for metadata validation
  const epubForMetadata: EpubLike = {
    getMetadata: async () => metadata,
    getSpineItems: async () => [],
    getManifest: async () => ({}),
  };

  return validateEPUBStructureAdvanced(epubForMetadata, config);
}

/**
 * Validate EPUB spine (enhanced version)
 * @param {any} spineItems - EPUB spine items to validate
 * @param {object} config - Validation configuration options (optional)
 * @returns {ValidationResult} Enhanced validation result with detailed error reporting
 */
export async function validateEPUBSpine(
  spineItems: Array<{ id: string; href: string; mediaType?: string }>,
  config: ValidationConfig = { level: ValidationLevel.STANDARD }
): Promise<ValidationResult> {
  // Create a minimal epub-like object for spine validation
  const epubForSpine: EpubLike = {
    getMetadata: async () => ({}) as EpubMetadata,
    getSpineItems: async () => spineItems,
    getManifest: async () => ({}),
  };

  return validateEPUBStructureAdvanced(epubForSpine, config);
}

/**
 * Validate EPUB manifest (enhanced version)
 * @param {any} manifest - EPUB manifest to validate
 * @param {object} config - Validation configuration options (optional)
 * @returns {ValidationResult} Enhanced validation result with detailed error reporting
 */
export async function validateEPUBManifest(
  manifest: Record<string, { href: string; mediaType?: string }>,
  config: ValidationConfig = { level: ValidationLevel.STANDARD }
): Promise<ValidationResult> {
  // Create a minimal epub-like object for manifest validation
  const epubForManifest: EpubLike = {
    getMetadata: async () => ({}) as EpubMetadata,
    getSpineItems: async () => [],
    getManifest: async () => manifest,
  };

  return validateEPUBStructureAdvanced(epubForManifest, config);
}

/**
 * Legacy validation functions for backward compatibility
 * These maintain the original synchronous API while delegating to basic validation
 */

/**
 * Validate EPUB metadata (legacy function - synchronous)
 * @param {any} metadata - EPUB metadata to validate
 * @throws EPUBStructureError if metadata is invalid
 * @returns {void} void void when validation is complete
 */
export function validateEPUBMetadataLegacySync(metadata: EpubMetadata): void {
  // For legacy compatibility, perform basic synchronous validation
  validateEPUBMetadataLegacy(metadata);
}

/**
 * Validate EPUB spine (legacy function - synchronous)
 * @param {any} spineItems - EPUB spine items to validate
 * @throws EPUBStructureError if spine is invalid
 * @returns {void} void void when validation is complete
 */
export function validateEPUBSpineLegacySync(
  spineItems: Array<{ id: string; href: string; mediaType?: string }>
): void {
  // For legacy compatibility, perform basic synchronous validation
  validateEPUBSpineLegacy(spineItems);
}

/**
 * Validate EPUB manifest (legacy function - synchronous)
 * @param {any} manifest - EPUB manifest to validate
 * @throws EPUBStructureError if manifest is invalid
 * @returns {void} void void when validation is complete
 */
export function validateEPUBManifestLegacySync(
  manifest: Record<string, { href: string; mediaType?: string }>
): void {
  // For legacy compatibility, perform basic synchronous validation
  validateEPUBManifestLegacy(manifest);
}
