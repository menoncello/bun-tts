/**
 * EPUB Parser Validation Module
 *
 * Contains enhanced validation logic for EPUB structure and components.
 * Provides comprehensive validation with detailed error reporting and
 * configurable validation levels.
 */

import { Epub } from '@smoores/epub';
import type { EpubMetadata } from './epub-parser-types';
import {
  createInitialValidationResult,
  updateValidationMetadata,
  handleValidationError,
  determineValidity,
  validateEPUBStructure as validateEPUBStructureLegacy,
  validateEPUBMetadata as validateEPUBMetadataLegacy,
  validateEPUBSpine as validateEPUBSpineLegacy,
  validateEPUBManifest as validateEPUBManifestLegacy,
} from './epub-parser-validation-basic';
import { validateStandardStructure } from './epub-parser-validation-standard';
import { validateStrictStructure } from './epub-parser-validation-strict';
import {
  ValidationLevel,
  type ValidationConfig,
  type ValidationResult,
  type StandardStructureParams,
} from './epub-parser-validation-types';

// Re-export types for backward compatibility
export type {
  ValidationLevel,
  ValidationConfig,
  ValidationResult,
  StandardStructureParams,
} from './epub-parser-validation-types';

/**
 * Run validation based on specified level
 * @param params - Validation parameters including epub, metadata, and configuration
 */
async function runValidationByLevel(
  params: StandardStructureParams
): Promise<void> {
  switch (params.config.level) {
    case ValidationLevel.BASIC:
      const { validateBasicStructure } = await import(
        './epub-parser-validation-basic'
      );
      await validateBasicStructure(params);
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
 * @param epub - EPUB instance to validate
 * @param config - Validation configuration options
 * @returns Detailed validation result
 */
export async function validateEPUBStructureAdvanced(
  epub: Epub,
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
 * Validate EPUB structure by checking required components (legacy function)
 * @param epub - EPUB instance to validate
 * @throws EPUBStructureError if structure is invalid
 * @returns Promise that resolves when validation is complete
 */
export async function validateEPUBStructure(epub: Epub): Promise<void> {
  return validateEPUBStructureLegacy(epub);
}

/**
 * Validate EPUB metadata (legacy function)
 * @param metadata - EPUB metadata to validate
 * @throws EPUBStructureError if metadata is invalid
 * @returns void when validation is complete
 */
export function validateEPUBMetadata(metadata: EpubMetadata): void {
  return validateEPUBMetadataLegacy(metadata);
}

/**
 * Validate EPUB spine (legacy function)
 * @param spineItems - EPUB spine items to validate
 * @throws EPUBStructureError if spine is invalid
 * @returns void when validation is complete
 */
export function validateEPUBSpine(
  spineItems: Array<{ id: string; href: string; mediaType?: string }>
): void {
  return validateEPUBSpineLegacy(spineItems);
}

/**
 * Validate EPUB manifest (legacy function)
 * @param manifest - EPUB manifest to validate
 * @throws EPUBStructureError if manifest is invalid
 * @returns void when validation is complete
 */
export function validateEPUBManifest(
  manifest: Record<string, { href: string; mediaType?: string }>
): void {
  return validateEPUBManifestLegacy(manifest);
}
