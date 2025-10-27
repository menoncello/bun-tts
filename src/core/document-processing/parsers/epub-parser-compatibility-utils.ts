/**
 * Utility functions for EPUB parser compatibility layer
 */

import type { Epub } from '@smoores/epub';
import { logger } from '../../../utils/logger';
import { EPUBVersion } from './epub-parser-compatibility';
import {
  STRUCTURE_ANALYSIS_SAMPLE_SIZE,
  HTML5_INDICATORS,
} from './epub-parser-constants';

/**
 * Raw EPUB metadata interface for type safety
 */
export interface RawEpubMetadata {
  version?: string | number;
  'dc:identifier'?: string;
  'dc:title'?: string;
  'dc:creator'?: string;
  'dc:language'?: string;
  identifier?: string | string[];
  modified?: string;
  source?: string;
  relation?: string | string[];
  rights?: string | string[];
  [key: string]: unknown;
}

/**
 * Spine item interface for type safety
 */
export interface EpubSpineItem {
  id: string;
  href: string;
  mediaType?: string;
}

/**
 * Extract version from OPF metadata
 * @param metadata - Raw EPUB metadata
 * @returns Detected EPUB version
 */
export function extractVersionFromMetadata(
  metadata: RawEpubMetadata
): EPUBVersion {
  // Check explicit version declaration
  if (metadata.version) {
    const versionStr = String(metadata.version).toLowerCase();

    if (versionStr.startsWith('2.')) {
      return EPUBVersion.EPUB_2_0;
    } else if (versionStr.startsWith('3.0')) {
      return EPUBVersion.EPUB_3_0;
    } else if (versionStr.startsWith('3.1')) {
      return EPUBVersion.EPUB_3_1;
    } else if (versionStr.startsWith('3.2')) {
      return EPUBVersion.EPUB_3_2;
    } else if (versionStr.startsWith('3.')) {
      return EPUBVersion.EPUB_3_0; // Default to 3.0 for other 3.x versions
    }
  }

  // Check for EPUB 2.0 indicators
  if (isEPUB2Metadata(metadata)) {
    return EPUBVersion.EPUB_2_0;
  }

  // Check for EPUB 3.0+ indicators
  if (isEPUB3Metadata(metadata)) {
    return EPUBVersion.EPUB_3_0;
  }

  return EPUBVersion.UNKNOWN;
}

/**
 * Check if metadata indicates EPUB 2.0
 * @param metadata - Raw EPUB metadata
 * @returns True if EPUB 2.0 indicators found
 */
export function isEPUB2Metadata(metadata: RawEpubMetadata): boolean {
  // EPUB 2.0 typically uses DC elements and specific identifiers
  return (
    Boolean(metadata['dc:identifier']) ||
    Boolean(metadata['dc:title']) ||
    Boolean(metadata['dc:creator']) ||
    Boolean(metadata['dc:language']) ||
    Boolean(metadata.identifier && Array.isArray(metadata.identifier))
  );
}

/**
 * Check if metadata indicates EPUB 3.0+
 * @param metadata - Raw EPUB metadata
 * @returns True if EPUB 3.0+ indicators found
 */
export function isEPUB3Metadata(metadata: RawEpubMetadata): boolean {
  // EPUB 3.0+ uses modified DC elements and additional properties
  return (
    Boolean(metadata.modified) ||
    Boolean(metadata.source) ||
    Boolean(metadata.relation && Array.isArray(metadata.relation)) ||
    Boolean(
      metadata.rights &&
        Array.isArray(metadata.rights) &&
        metadata.rights.length > 0
    )
  );
}

/**
 * Check if content has HTML5 indicators
 * @param content - XHTML content to analyze
 * @returns True if HTML5 indicators found
 */
export function hasHTML5Indicators(content: string): boolean {
  return HTML5_INDICATORS.some((tag) => content.toLowerCase().includes(tag));
}

/**
 * Check for NAV file presence (EPUB 3.0+)
 * @param epub - EPUB instance
 * @returns True if NAV items are found
 */
async function hasNavItems(epub: Epub): Promise<boolean> {
  try {
    // Check if getNavItems method exists and has valid result
    const epubWithNav = epub as unknown as {
      getNavItems?: () => Promise<unknown[]>;
    };
    const navItems = await epubWithNav.getNavItems?.();
    return Boolean(navItems && Array.isArray(navItems) && navItems.length > 0);
  } catch {
    return false;
  }
}

/**
 * Check for NCX file presence (EPUB 2.0 and 3.0)
 * @param epub - EPUB instance
 * @returns True if NCX items are found
 */
async function hasNcxItems(epub: Epub): Promise<boolean> {
  try {
    // Check if getNcxItems method exists and has valid result
    const epubWithNcx = epub as unknown as {
      getNcxItems?: () => Promise<unknown[]>;
    };
    const ncxItems = await epubWithNcx.getNcxItems?.();
    return Boolean(ncxItems && Array.isArray(ncxItems) && ncxItems.length > 0);
  } catch {
    return false;
  }
}

/**
 * Get spine items safely with type checking
 * @param epub - EPUB instance
 * @returns Array of spine items or empty array
 */
async function getSpineItems(epub: Epub): Promise<EpubSpineItem[]> {
  try {
    const spine = await epub.getSpineItems();
    return spine || [];
  } catch (error) {
    logger.warn('Failed to get spine items', {
      parser: 'EPUBParser',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}

/**
 * Read XHTML content safely
 * @param epub - EPUB instance
 * @param itemId - Item ID to read
 * @returns Content string or null
 */
async function readXhtmlContent(
  epub: Epub,
  itemId: string
): Promise<string | null> {
  try {
    return await epub.readXhtmlItemContents(itemId, 'text');
  } catch {
    return null;
  }
}

/**
 * Analyze spine items for HTML5 content
 * @param epub - EPUB instance
 * @param spineItems - Array of spine items
 * @returns True if HTML5 indicators found
 */
async function analyzeSpineForHTML5(
  epub: Epub,
  spineItems: EpubSpineItem[]
): Promise<boolean> {
  const sampleSize = Math.min(
    STRUCTURE_ANALYSIS_SAMPLE_SIZE,
    spineItems.length
  );

  for (let i = 0; i < sampleSize; i++) {
    const spineItem = spineItems[i];
    if (!spineItem) continue;

    const content = await readXhtmlContent(epub, spineItem.id);
    if (content && hasHTML5Indicators(content)) {
      return true;
    }
  }

  return false;
}

/**
 * Detect version from EPUB structure analysis
 * @param epub - EPUB instance
 * @returns Detected EPUB version
 */
export async function detectVersionFromStructure(
  epub: Epub
): Promise<EPUBVersion> {
  try {
    // Check for NAV file (EPUB 3.0+)
    if (await hasNavItems(epub)) {
      return EPUBVersion.EPUB_3_0;
    }

    // Check for NCX file (EPUB 2.0 and 3.0)
    if (await hasNcxItems(epub)) {
      const spineItems = await getSpineItems(epub);
      const hasHTML5 = await analyzeSpineForHTML5(epub, spineItems);

      return hasHTML5 ? EPUBVersion.EPUB_3_0 : EPUBVersion.EPUB_2_0;
    }

    return EPUBVersion.UNKNOWN;
  } catch (error) {
    logger.warn('Structure analysis failed', {
      parser: 'EPUBParser',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return EPUBVersion.UNKNOWN;
  }
}
