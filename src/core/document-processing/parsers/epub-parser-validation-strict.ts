/**
 * EPUB Parser Strict Validation
 * Contains strict validation logic for EPUB security and performance
 */

import { Epub } from '@smoores/epub';
import type { EpubMetadata } from './epub-parser-types';
import { validateStandardStructure } from './epub-parser-validation-standard';
import {
  DEFAULT_SAMPLE_SIZE,
  LARGE_CONTENT_THRESHOLD,
  MAX_TOTAL_ITEMS,
  MIN_EPUB_VERSION,
  MSG_UNKNOWN_ERROR,
  type ValidationResult,
  type ValidationConfig,
  type SpineItem,
  type ManifestRecord,
  type StandardStructureParams,
} from './epub-parser-validation-types';

/**
 * Strict validation with security and comprehensive checks
 * @param params - Validation parameters including epub, metadata, config, and result
 */
export async function validateStrictStructure(
  params: StandardStructureParams
): Promise<void> {
  const { epub, metadata, spineItems, manifest, result, config } = params;

  // Run standard validation first
  await validateStandardStructure(params);

  // Security validation
  if (config.securityCheck !== false) {
    await validateSecurity(epub, manifest, result);
  }

  // Content integrity validation
  await validateContentIntegrity(epub, spineItems, result);

  // Performance validation
  validatePerformanceLimits(spineItems, manifest, result, config);

  // Standards compliance validation
  await validateStandardsCompliance(epub, metadata, result);
}

/**
 * Validate security aspects (for strict validation)
 * @param epub - EPUB instance to validate
 * @param manifest - EPUB manifest to validate
 * @param result - Validation result to update
 */
export async function validateSecurity(
  epub: Epub,
  manifest: ManifestRecord,
  result: ValidationResult
): Promise<void> {
  validateDangerousFileTypes(manifest, result);
  validateExternalResources(manifest, result);
}

/**
 * Check for potentially dangerous file types
 * @param manifest - EPUB manifest to validate
 * @param result - Validation result to update
 */
function validateDangerousFileTypes(
  manifest: ManifestRecord,
  result: ValidationResult
): void {
  const dangerousTypes = [
    'application/javascript',
    'application/x-javascript',
    'text/javascript',
    'application/x-executable',
    'application/x-msdownload',
  ];

  for (const [id, item] of Object.entries(manifest)) {
    if (item.mediaType && dangerousTypes.includes(item.mediaType)) {
      result.warnings.push({
        code: 'POTENTIALLY_DANGEROUS_FILE',
        message: `Manifest item "${id}" has potentially dangerous media type "${item.mediaType}"`,
        suggestion:
          'Review security implications of including executable content',
      });
    }
  }
}

/**
 * Check for external resources (potential security risk)
 * @param manifest - EPUB manifest to validate
 * @param result - Validation result to update
 */
function validateExternalResources(
  manifest: ManifestRecord,
  result: ValidationResult
): void {
  for (const [id, item] of Object.entries(manifest)) {
    if (
      item.href &&
      (item.href.startsWith('http://') || item.href.startsWith('https://'))
    ) {
      result.warnings.push({
        code: 'EXTERNAL_RESOURCE',
        message: `Manifest item "${id}" references external resource: ${item.href}`,
        suggestion:
          'External resources may affect offline functionality and security',
      });
    }
  }
}

/**
 * Validate content integrity
 * @param epub - EPUB instance to validate
 * @param spineItems - EPUB spine items to validate
 * @param result - Validation result to update
 */
export async function validateContentIntegrity(
  epub: Epub,
  spineItems: SpineItem[],
  result: ValidationResult
): Promise<void> {
  const sampleSize = Math.min(spineItems.length, DEFAULT_SAMPLE_SIZE);
  const step = Math.max(1, Math.floor(spineItems.length / sampleSize));

  for (let i = 0; i < spineItems.length; i += step) {
    const item = spineItems[i];
    if (item) {
      await validateSpineItemContent(epub, item, result);
    }
  }
}

/**
 * Validate individual spine item content
 * @param epub - EPUB instance
 * @param item - Spine item to validate
 * @param result - Validation result to update
 */
async function validateSpineItemContent(
  epub: Epub,
  item: SpineItem,
  result: ValidationResult
): Promise<void> {
  if (!item?.id) {
    return;
  }

  try {
    const content = await epub.readXhtmlItemContents(item.id, 'text');

    validateContentNotEmpty(item, content, result);
    validateContentSize(item, content, result);
  } catch (error) {
    result.errors.push({
      code: 'CONTENT_READ_ERROR',
      message: `Cannot read content from spine item "${item.id}": ${error instanceof Error ? error.message : MSG_UNKNOWN_ERROR}`,
      severity: 'error',
      location: item.id,
      fix: 'Check file format and encoding',
    });
  }
}

/**
 * Validate that content is not empty
 * @param item - Spine item
 * @param content - Content to validate
 * @param result - Validation result to update
 */
function validateContentNotEmpty(
  item: SpineItem,
  content: string,
  result: ValidationResult
): void {
  if (!content || content.trim().length === 0) {
    result.warnings.push({
      code: 'EMPTY_CONTENT_ITEM',
      message: `Spine item "${item.id}" appears to be empty`,
      location: item.id,
      suggestion: 'Ensure all content items contain meaningful content',
    });
  }
}

/**
 * Validate content size
 * @param item - Spine item
 * @param content - Content to validate
 * @param result - Validation result to update
 */
function validateContentSize(
  item: SpineItem,
  content: string,
  result: ValidationResult
): void {
  if (content.length > LARGE_CONTENT_THRESHOLD) {
    result.warnings.push({
      code: 'LARGE_CONTENT_ITEM',
      message: `Spine item "${item.id}" is very large (${content.length} characters)`,
      location: item.id,
      suggestion: 'Consider splitting large content items',
    });
  }
}

/**
 * Validate performance limits
 * @param spineItems - EPUB spine items to validate
 * @param manifest - EPUB manifest to validate
 * @param result - Validation result to update
 * @param _config - Validation configuration (unused)
 */
export function validatePerformanceLimits(
  spineItems: SpineItem[],
  manifest: ManifestRecord,
  result: ValidationResult,
  _config: ValidationConfig
): void {
  const totalItems = spineItems.length + Object.keys(manifest).length;

  if (totalItems > MAX_TOTAL_ITEMS) {
    result.warnings.push({
      code: 'LARGE_EPUB_STRUCTURE',
      message: `EPUB has ${totalItems} total items, which may impact performance`,
      suggestion: 'Consider optimizing structure for better performance',
    });
  }
}

/**
 * Extract EPUB version from metadata
 * @param metadata - EPUB metadata to search
 * @returns EPUB version string or undefined if not found
 */
function extractEpubVersion(metadata: EpubMetadata): string | undefined {
  const versionEntry = metadata.find(
    (entry) => entry.type === 'format' && entry.value?.includes('epub')
  );

  if (versionEntry?.value) {
    const versionMatch = versionEntry.value.match(/epub\s*(\d+\.\d+)/i);
    return versionMatch ? versionMatch[1] : undefined;
  }

  return undefined;
}

/**
 * Validate EPUB version compatibility
 * @param version - EPUB version number
 * @param result - Validation result to update
 */
function validateEpubVersion(version: number, result: ValidationResult): void {
  if (version < MIN_EPUB_VERSION) {
    result.warnings.push({
      code: 'OUTDATED_EPUB_VERSION',
      message: `EPUB version ${version} is outdated`,
      suggestion:
        'Consider upgrading to EPUB 2.0 or later for better compatibility',
    });
  }
}

/**
 * Validate standards compliance
 * @param epub - EPUB instance to validate
 * @param metadata - EPUB metadata to validate
 * @param result - Validation result to update
 */
export async function validateStandardsCompliance(
  epub: Epub,
  metadata: EpubMetadata,
  result: ValidationResult
): Promise<void> {
  const epubVersion = extractEpubVersion(metadata);

  if (epubVersion) {
    result.metadata.epubVersion = epubVersion;

    // Version-specific validation
    const version = Number.parseFloat(epubVersion);
    if (!Number.isNaN(version)) {
      validateEpubVersion(version, result);
    }
  }

  if (!result.metadata.epubVersion) {
    result.warnings.push({
      code: 'UNKNOWN_EPUB_VERSION',
      message: 'Could not determine EPUB version',
      suggestion: 'Specify EPUB version in metadata for better compatibility',
    });
  }
}
