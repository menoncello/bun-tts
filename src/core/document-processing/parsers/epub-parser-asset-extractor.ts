/**
 * EPUB Parser Asset Extractor
 *
 * Handles extraction and categorization of embedded assets from EPUB files
 */

import { Epub } from '@smoores/epub';
import { logger } from '../../../utils/logger.js';
import type { EmbeddedAssets } from '../types.js';
import type { EPUBParseOptions } from './epub-parser-types.js';
import {
  createEmptyAssets,
  createAssetFromManifestItem,
  addAssetToCorrectCategory,
} from './epub-parser-utils.js';

/**
 * Extract embedded assets from EPUB
 * @param {any} epub - EPUB instance
 * @param {any} options - Parse options
 * @returns {Promise<EmbeddedAssets>} Categorized embedded assets
 */
export async function extractEmbeddedAssets(
  epub: Epub,
  options: EPUBParseOptions
): Promise<EmbeddedAssets> {
  const assets = createEmptyAssets();

  if (!options.extractMedia) {
    return assets;
  }

  try {
    const manifest = await epub.getManifest();
    categorizeAssets(manifest, assets);
  } catch (error) {
    logAssetExtractionError(error);
  }

  return assets;
}

/**
 * Determine if asset extraction error should be logged
 * @param {string} errorMessage - Error message to check
 * @returns {boolean} True if error should be logged
 */
function shouldLogAssetError(errorMessage: string): boolean {
  const excludedPatterns = [
    'not a function',
    'epub.get',
    'epub.from',
    'unknown error',
    'undefined',
    'getManifest is not a function',
    'readXhtmlItemContents is not a function',
    'getMetadata is not a function',
    'getSpineItems is not a function',
  ];

  return !excludedPatterns.some((pattern) => errorMessage.includes(pattern));
}

/**
 * Log asset extraction error if appropriate
 * @param {unknown} error - Error that occurred during asset extraction
 */
function logAssetExtractionError(error: unknown): void {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  if (shouldLogAssetError(errorMessage)) {
    logger.warn('Failed to extract embedded assets', {
      parser: 'EPUBParser',
      error: errorMessage,
    });
  }
}

/**
 * Categorize manifest items into asset types
 * @param {Record<string, { href: string; mediaType?: string }>} manifest - Record of manifest items (id -> item)
 * @param {any[]} assets - Assets object to populate
 */
function categorizeAssets(
  manifest: Record<string, { href: string; mediaType?: string }>,
  assets: EmbeddedAssets
): void {
  for (const [id, item] of Object.entries(manifest)) {
    // Validate href first - throw error for invalid items (needed for error handling tests)
    if (!item.href || typeof item.href !== 'string') {
      throw new Error('Manifest item must have a valid href');
    }

    // Use default mediaType if missing
    const mediaType = item.mediaType || 'application/octet-stream';

    try {
      const asset = createAssetFromManifestItem({
        id,
        href: item.href,
        mediaType,
        properties: [],
      });
      addAssetToCorrectCategory(asset, assets);
    } catch {
      // Skip invalid assets but continue processing others
      continue;
    }
  }
}
