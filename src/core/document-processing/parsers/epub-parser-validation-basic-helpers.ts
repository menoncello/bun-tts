/**
 * EPUB Parser Basic Validation - Helper Functions
 *
 * Helper utility functions for validation
 */

import { EPUBStructureError } from '../../../errors/document-parse-error.js';
import type { EpubMetadata } from './epub-parser-types.js';
import { validateEPUBMetadata } from './epub-parser-validation-basic-metadata.js';
import type {
  ValidationResult,
  SpineItem,
  ManifestRecord,
} from './epub-parser-validation-types.js';

/**
 * Determine overall validation validity based on errors
 * @param {ValidationResult} result - Validation result to evaluate
 */
export function determineValidity(result: ValidationResult): void {
  result.isValid =
    result.errors.filter(
      (e) => e.severity === 'critical' || e.severity === 'error'
    ).length === 0;
}

/**
 * Validate EPUB spine (legacy function)
 * @param {Array<{ id: string; href: string; mediaType?: string }>} spineItems - EPUB spine items to validate
 * @throws EPUBStructureError if spine is invalid
 */
export function validateEPUBSpine(
  spineItems: Array<{ id: string; href: string; mediaType?: string }>
): void {
  if (!spineItems || spineItems.length === 0) {
    throw new EPUBStructureError({ missing: 'spine' });
  }
}

/**
 * Validate EPUB manifest (legacy function)
 * @param {ManifestRecord} manifest - EPUB manifest to validate
 * @throws EPUBStructureError if manifest is invalid
 */
export function validateEPUBManifest(manifest: ManifestRecord): void {
  if (!manifest || Object.keys(manifest).length === 0) {
    throw new EPUBStructureError({ missing: 'manifest' });
  }
}

/**
 * Validate EPUB structure by checking required components (legacy function)
 * @param {{ getMetadata: () => Promise<EpubMetadata>; getSpineItems: () => Promise<SpineItem[]>; getManifest: () => Promise<ManifestRecord> }} epub - EPUB instance to validate
 * @param {() => Promise<EpubMetadata>} epub.getMetadata - Function to get EPUB metadata
 * @param {() => Promise<SpineItem[]>} epub.getSpineItems - Function to get EPUB spine items
 * @param {() => Promise<ManifestRecord>} epub.getManifest - Function to get EPUB manifest
 * @throws EPUBStructureError if structure is invalid
 * @returns {Promise<void>} Promise that resolves when validation is complete
 */
export async function validateEPUBStructure(epub: {
  getMetadata: () => Promise<EpubMetadata>;
  getSpineItems: () => Promise<SpineItem[]>;
  getManifest: () => Promise<ManifestRecord>;
}): Promise<void> {
  try {
    // Get basic EPUB components
    const [metadata, spineItems, manifest] = await Promise.all([
      epub.getMetadata(),
      epub.getSpineItems(),
      epub.getManifest(),
    ]);

    // Validate metadata
    validateEPUBMetadata(metadata);

    // Validate spine
    validateEPUBSpine(spineItems);

    // Validate manifest
    validateEPUBManifest(manifest);
  } catch (error) {
    if (error instanceof EPUBStructureError) {
      throw error;
    }
    throw new EPUBStructureError({
      message:
        error instanceof Error ? error.message : 'Unknown validation error',
    });
  }
}
