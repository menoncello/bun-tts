/** EPUB Parser Content Validation - Content and structure-specific validation logic */

import { Epub } from '@smoores/epub';
import {
  MAX_CHAPTER_COUNT,
  MSG_UNKNOWN_ERROR,
  type ValidationResult,
} from './epub-parser-validation-types';

/**
 * Validate chapter count
 * @param chapterCount - Number of chapters
 * @param result - Validation result
 */
function validateChapterCount(
  chapterCount: number,
  result: ValidationResult
): void {
  if (chapterCount > MAX_CHAPTER_COUNT) {
    result.errors.push({
      code: 'TOO_MANY_CHAPTERS',
      message: `Too many chapters (${chapterCount} > ${MAX_CHAPTER_COUNT})`,
      severity: 'error',
      fix: `Reduce chapter count to ${MAX_CHAPTER_COUNT} or less`,
    });
  }
}

/**
 * Check if manifest contains navigation files (NCX or NAV)
 * @param manifest - EPUB manifest record
 * @returns True if navigation files are found
 */
function checkManifestHasNavigation(manifest: Record<string, unknown>): boolean {
  if (!manifest) {
    return false;
  }

  return Object.values(manifest).some(
    (item: unknown) =>
      item &&
      typeof item === 'object' &&
      'id' in item &&
      typeof (item as { id: unknown }).id === 'string' &&
      ((item as { id: string }).id.toLowerCase().includes('ncx') ||
        (item as { id: string }).id.toLowerCase().includes('nav') ||
        ('mediaType' in item &&
          typeof (item as { mediaType: unknown }).mediaType === 'string' &&
          (item as { mediaType: string }).mediaType.includes('ncx')))
  );
}

/**
 * Validate content structure
 * @param epub - EPUB instance
 * @param result - Validation result
 */
export async function validateContentStructure(
  epub: Epub,
  result: ValidationResult
): Promise<void> {
  try {
    // Get chapter count from spine
    const spineItems = await epub.getSpineItems();
    const chapterCount = spineItems.length;
    validateChapterCount(chapterCount, result);
  } catch (error) {
    result.errors.push({
      code: 'CONTENT_VALIDATION_ERROR',
      message: error instanceof Error ? error.message : MSG_UNKNOWN_ERROR,
      severity: 'error',
      fix: 'Check EPUB content structure and navigation files',
    });
  }
}

/**
 * Validate navigation structure
 * @param epub - EPUB instance
 * @param result - Validation result
 */
export async function validateNavigation(
  epub: Epub,
  result: ValidationResult
): Promise<void> {
  try {
    // Check if manifest contains navigation files (NCX or NAV)
    const manifest = await epub.getManifest();
    const hasNavigation = checkManifestHasNavigation(manifest);

    if (!hasNavigation) {
      result.warnings.push({
        code: 'MISSING_NAVIGATION',
        message: 'Navigation document (NCX or NAV) not found',
        suggestion: 'Add navigation document to manifest and spine',
      });
    }
  } catch (error) {
    result.warnings.push({
      code: 'NAVIGATION_VALIDATION_ERROR',
      message: error instanceof Error ? error.message : MSG_UNKNOWN_ERROR,
      suggestion: 'Check navigation document structure and references',
    });
  }
}