/**
 * EPUB Parser Asset Extractor
 *
 * Handles extraction and categorization of embedded assets from EPUB files
 */

import { Epub } from '@smoores/epub';
import { logger } from '../../../utils/logger';
import type { EmbeddedAssets } from '../types';
import type { EPUBParseOptions } from './epub-parser-types';
import {
  createEmptyAssets,
  createAssetFromManifestItem,
  addAssetToCorrectCategory,
} from './epub-parser-utils';

/**
 * Extract embedded assets from EPUB
 * @param epub - EPUB instance
 * @param options - Parse options
 * @returns Categorized embedded assets
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
    logger.warn('Failed to extract embedded assets', {
      parser: 'EPUBParser',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  return assets;
}

/**
 * Categorize manifest items into asset types
 * @param manifest - Record of manifest items (id -> item)
 * @param assets - Assets object to populate
 */
function categorizeAssets(
  manifest: Record<string, { href: string; mediaType?: string }>,
  assets: EmbeddedAssets
): void {
  for (const item of Object.values(manifest)) {
    const asset = createAssetFromManifestItem(item);
    addAssetToCorrectCategory(asset, assets);
  }
}
