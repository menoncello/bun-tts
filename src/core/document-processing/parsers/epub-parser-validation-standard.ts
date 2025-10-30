/** EPUB Parser Standard Validation - Standard validation logic for EPUB structure and content */

import { validateBasicStructure } from './epub-parser-validation-basic.js';
import {
  validateContentStructure,
  validateNavigation,
} from './epub-parser-validation-content.js';
import { validateStandardMetadata } from './epub-parser-validation-metadata.js';
import {
  MAX_SPINE_ITEMS,
  MAX_MANIFEST_ITEMS,
  SPINE_LOCATION_PREFIX,
  MANIFEST_LOCATION_PREFIX,
  type ValidationResult,
  type ValidationConfig,
  type SpineItem,
  type ManifestRecord,
  type StandardStructureParams,
} from './epub-parser-validation-types.js';

/**
 * Standard validation with content and structure checks
 * @param {any} params - Validation parameters
 * @param {any} params.epub - EPUB instance
 * @param {any} params.metadata - EPUB metadata
 * @param {any} params.spineItems - Spine items array
 * @param {any} params.manifest - Manifest record
 * @param {any} params.result - Validation result
 * @param {any} params.config - Validation configuration
 */
export async function validateStandardStructure(
  params: StandardStructureParams
): Promise<void> {
  const { epub, metadata, spineItems, manifest, result, config } = params;

  // Run basic validation first
  await validateBasicStructure(epub);

  // Enhanced metadata validation
  validateStandardMetadata(metadata, result);

  // Spine validation
  validateStandardSpine(spineItems, result, config);

  // Manifest validation
  validateStandardManifest(manifest, result, config);

  // Content structure validation
  await validateContentStructure(epub, result);

  // Navigation validation
  await validateNavigation(epub, result);
}

/**
 * Validate standard spine with comprehensive checks
 * @param {any} spineItems - Array of EPUB spine items to validate for reading order
 * @param {any} result - Validation result object to update with validation findings
 * @param {object} config - Validation configuration options
 */
export function validateStandardSpine(
  spineItems: SpineItem[],
  result: ValidationResult,
  config: ValidationConfig
): void {
  validateSpineItemCount(spineItems, result, config);
  validateSpineItems(spineItems, result);
}

/**
 * Validate spine item count
 * @param {any} spineItems - Array of spine items
 * @param {any} result - Validation result
 * @param {object} config - Validation configuration
 */
function validateSpineItemCount(
  spineItems: SpineItem[],
  result: ValidationResult,
  config: ValidationConfig
): void {
  const maxSpineItems = config.maxSpineItems || MAX_SPINE_ITEMS;
  if (spineItems.length > maxSpineItems) {
    result.errors.push({
      code: 'TOO_MANY_SPINE_ITEMS',
      message: `Spine has too many items (${spineItems.length} > ${maxSpineItems})`,
      severity: 'error',
      fix: `Reduce spine item count to ${maxSpineItems} or less`,
    });
  }
}

/**
 * Validate spine items
 * @param {any} spineItems - Array of spine items
 * @param {any} result - Validation result
 */
function validateSpineItems(
  spineItems: SpineItem[],
  result: ValidationResult
): void {
  for (const [index, item] of spineItems.entries()) {
    validateSpineItemStructure(index, item, result);
    validateSpineItemId(index, item, result);
    validateSpineItemHref(index, item, result);
  }
}

/**
 * Validate spine item structure
 * @param {any} index - Item index
 * @param {any} item - Spine item to validate
 * @param {any} result - Validation result
 */
function validateSpineItemStructure(
  index: number,
  item: SpineItem,
  result: ValidationResult
): void {
  if (!item.id) {
    result.errors.push({
      code: 'MISSING_SPINE_ITEM_ID',
      message: `Spine item ${index} is missing ID attribute`,
      severity: 'warning',
      fix: 'Add idref attribute to itemref element',
    });
  }

  if (!item.href) {
    result.errors.push({
      code: 'MISSING_SPINE_ITEM_HREF',
      message: `Spine item ${index} is missing href in manifest`,
      severity: 'warning',
      fix: 'Ensure item references valid manifest entry',
    });
  }
}

/**
 * Validate spine item ID
 * @param {any} index - Item index
 * @param {any} item - Spine item to validate
 * @param {any} result - Validation result
 */
function validateSpineItemId(
  index: number,
  item: SpineItem,
  result: ValidationResult
): void {
  if (item.id && !item.id.startsWith(SPINE_LOCATION_PREFIX)) {
    result.warnings.push({
      code: 'INVALID_SPINE_ITEM_ID',
      message: `Spine item ${index} ID "${item.id}" doesn't follow convention`,
      suggestion: `Use ID starting with "${SPINE_LOCATION_PREFIX}"`,
    });
  }
}

/**
 * Validate spine item href
 * @param {any} index - Item index
 * @param {any} item - Spine item to validate
 * @param {any} result - Validation result
 */
function validateSpineItemHref(
  index: number,
  item: SpineItem,
  result: ValidationResult
): void {
  if (
    item.href &&
    !item.href.endsWith('.xhtml') &&
    !item.href.endsWith('.html')
  ) {
    result.warnings.push({
      code: 'UNEXPECTED_SPINE_ITEM_TYPE',
      message: `Spine item ${index} href "${item.href}" may not be XHTML`,
      suggestion: 'Use XHTML files for content documents',
    });
  }
}

/**
 * Validate standard manifest with comprehensive checks
 * @param {any} manifest - Manifest record to validate for resource references
 * @param {any} result - Validation result object to update with validation findings
 * @param {object} config - Validation configuration options
 */
export function validateStandardManifest(
  manifest: ManifestRecord,
  result: ValidationResult,
  config: ValidationConfig
): void {
  validateManifestItemCount(manifest, result, config);
  validateManifestItems(manifest, result);
}

/**
 * Validate manifest item count
 * @param {any} manifest - Manifest record
 * @param {any} result - Validation result
 * @param {object} config - Validation configuration
 */
function validateManifestItemCount(
  manifest: ManifestRecord,
  result: ValidationResult,
  config: ValidationConfig
): void {
  const maxManifestItems = config.maxManifestItems || MAX_MANIFEST_ITEMS;
  if (Object.keys(manifest).length > maxManifestItems) {
    result.errors.push({
      code: 'TOO_MANY_MANIFEST_ITEMS',
      message: `Manifest has too many items (${Object.keys(manifest).length} > ${maxManifestItems})`,
      severity: 'error',
      fix: `Reduce manifest item count to ${maxManifestItems} or less`,
    });
  }
}

/**
 * Validate manifest items
 * @param {any} manifest - Manifest record
 * @param {any} result - Validation result
 */
function validateManifestItems(
  manifest: ManifestRecord,
  result: ValidationResult
): void {
  for (const [id, item] of Object.entries(manifest)) {
    validateManifestItemHref(id, item, result);
    validateManifestItemMediaType(id, item, result);
  }
}

/**
 * Validate manifest item href
 * @param {any} id - Item ID
 * @param {any} item - Manifest item
 * @param {any} result - Validation result
 */
function validateManifestItemHref(
  id: string,
  item: ManifestRecord[string],
  result: ValidationResult
): void {
  if (!item.href) {
    result.errors.push({
      code: 'MISSING_MANIFEST_ITEM_HREF',
      message: `Manifest item "${id}" is missing href attribute`,
      severity: 'warning',
      fix: 'Add href attribute to item element',
    });
  }

  if (item.href && !item.href.startsWith(MANIFEST_LOCATION_PREFIX)) {
    result.warnings.push({
      code: 'INVALID_MANIFEST_ITEM_HREF',
      message: `Manifest item "${id}" href "${item.href}" doesn't follow convention`,
      suggestion: `Use href starting with "${MANIFEST_LOCATION_PREFIX}"`,
    });
  }
}

/**
 * Validate manifest item media type
 * @param {any} id - Item ID
 * @param {any} item - Manifest item
 * @param {any} result - Validation result
 */
function validateManifestItemMediaType(
  id: string,
  item: ManifestRecord[string],
  result: ValidationResult
): void {
  if (!item.mediaType) {
    result.errors.push({
      code: 'MISSING_MANIFEST_ITEM_MEDIA_TYPE',
      message: `Manifest item "${id}" is missing media-type attribute`,
      severity: 'warning',
      fix: 'Add media-type attribute to item element',
    });
  }
}
