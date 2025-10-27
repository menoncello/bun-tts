/**
 * EPUB Parser Basic Validation
 * Contains basic validation logic for EPUB structure
 */

import {
  DocumentParseError,
  EPUBStructureError,
} from '../../../errors/document-parse-error';
import type { EpubMetadata } from './epub-parser-types';
import {
  MSG_MISSING_METADATA,
  MSG_MISSING_SPINE,
  MSG_MISSING_MANIFEST,
  MSG_UNKNOWN_ERROR,
  MIN_TITLE_LENGTH,
  MAX_TITLE_LENGTH,
  type ValidationResult,
  type SpineItem,
  type ManifestRecord,
  type BasicStructureParams,
} from './epub-parser-validation-types';

/**
 * Create initial validation result with default values
 * @returns Initial validation result object
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
 * @param result - Validation result to update with metadata information
 * @param metadata - EPUB metadata containing title, author, and other information
 * @param spineItems - Array of EPUB spine items representing reading order
 * @param manifest - EPUB manifest containing file mappings and metadata
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
 * @param error - DocumentParseError instance
 * @param metadata - Current validation metadata
 * @returns Validation result for parse errors
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
 * @param error - Unknown error instance
 * @param metadata - Current validation metadata
 * @returns Validation result for unknown errors
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
 * Handle validation errors and return error result
 * @param error - Caught error during validation process
 * @param metadata - Current validation metadata to include in error result
 * @returns Validation result object containing error details
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
 * Validate EPUB metadata presence
 * @param metadata - EPUB metadata array to validate for required elements
 * @param result - Validation result object to update with validation findings
 */
export function validateMetadataPresence(
  metadata: EpubMetadata,
  result: ValidationResult
): void {
  if (!metadata || metadata.length === 0) {
    result.errors.push({
      code: 'MISSING_METADATA',
      message: MSG_MISSING_METADATA,
      severity: 'critical',
      fix: 'Ensure EPUB contains proper metadata with title and identifier',
    });
  } else {
    result.metadata.hasMetadata = true;
    validateBasicMetadata(metadata, result);
  }
}

/**
 * Validate EPUB spine presence
 * @param spineItems - Array of EPUB spine items to validate for reading order
 * @param result - Validation result object to update with validation findings
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
  }
}

/**
 * Validate EPUB manifest presence
 * @param manifest - EPUB manifest to validate
 * @param result - Validation result object to update
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
  }
}

/**
 * Basic structure validation (required components only)
 * @param params - Validation parameters including epub, metadata, and result
 */
export async function validateBasicStructure(
  params: BasicStructureParams
): Promise<void> {
  const { metadata, spineItems, manifest, result } = params;

  validateMetadataPresence(metadata, result);
  validateSpinePresence(spineItems, result);
  validateManifestPresence(manifest, result);
}

/**
 * Validate title metadata
 * @param metadata - EPUB metadata array to validate
 * @param result - Validation result object to update
 */
function validateTitleMetadata(
  metadata: EpubMetadata,
  result: ValidationResult
): void {
  const hasTitle = hasValidTitle(metadata);

  if (!hasTitle) {
    addMissingTitleError(result);
    return;
  }

  const titleEntry = findTitleEntry(metadata);
  processTitleEntry(titleEntry, result);
}

/**
 * Check if metadata has a valid title entry
 * @param metadata - EPUB metadata array to check
 * @returns True if valid title exists
 */
function hasValidTitle(metadata: EpubMetadata): boolean {
  return metadata.some((entry) => entry.type === 'title' && entry.value);
}

/**
 * Add missing title error to validation result
 * @param result - Validation result to update
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
 * @param metadata - EPUB metadata array to search
 * @returns Title entry if found
 */
function findTitleEntry(
  metadata: EpubMetadata
): { type: string; value?: string } | undefined {
  return metadata.find((entry) => entry.type === 'title' && entry.value);
}

/**
 * Process title entry and validate its properties
 * @param titleEntry - Title entry to process
 * @param result - Validation result to update
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
 * @param title - Title text to validate
 * @param result - Validation result to update
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
 * @param metadata - EPUB metadata array to validate
 * @param result - Validation result object to update
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
  }
}

/**
 * Validate basic metadata (title and identifier presence)
 * @param metadata - EPUB metadata array to validate for required elements
 * @param result - Validation result object to update with validation findings
 */
function validateBasicMetadata(
  metadata: EpubMetadata,
  result: ValidationResult
): void {
  validateTitleMetadata(metadata, result);
  validateIdentifierMetadata(metadata, result);
}

/**
 * Validate EPUB metadata (legacy function)
 * @param metadata - EPUB metadata to validate
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

/**
 * Validate EPUB spine (legacy function)
 * @param spineItems - EPUB spine items to validate
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
 * @param manifest - EPUB manifest to validate
 * @throws EPUBStructureError if manifest is invalid
 */
export function validateEPUBManifest(
  manifest: Record<string, { href: string; mediaType?: string }>
): void {
  if (!manifest || Object.keys(manifest).length === 0) {
    throw new EPUBStructureError({ missing: 'manifest' });
  }
}

/**
 * Determine overall validation validity based on errors
 * @param result - Validation result to evaluate
 */
export function determineValidity(result: ValidationResult): void {
  result.isValid =
    result.errors.filter(
      (e) => e.severity === 'critical' || e.severity === 'error'
    ).length === 0;
}

/**
 * Validate EPUB structure by checking required components
 * @param epub - EPUB instance to validate
 * @param epub.getMetadata - Function to get EPUB metadata
 * @param epub.getSpineItems - Function to get EPUB spine items
 * @param epub.getManifest - Function to get EPUB manifest
 * @throws EPUBStructureError if structure is invalid
 * @returns Promise that resolves when validation is complete
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
      missing: 'unknown',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
