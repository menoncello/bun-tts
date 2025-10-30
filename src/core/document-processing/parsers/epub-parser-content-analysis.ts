/**
 * Content analysis utilities for EPUB parser compatibility layer
 */

import type { Epub } from '@smoores/epub';
import { logger } from '../../../utils/logger.js';
import { EPUBVersion } from './epub-parser-compatibility.js';
import { CONTENT_ANALYSIS_SAMPLE_SIZE } from './epub-parser-constants.js';

/**
 * Spine item interface for type safety
 */
export interface SpineItem {
  id: string;
  href?: string;
  mediaType?: string;
}

/**
 * Analyze content compatibility issues
 * @param {any} epub - EPUB instance
 * @param {any} detectedVersion - Detected EPUB version
 * @param {string[]} warnings - Array to add warnings to
 * @param {string[]} requiredFallbacks - Array to add required fallbacks to
 */
export async function analyzeContentCompatibility(
  epub: Epub,
  detectedVersion: EPUBVersion,
  warnings: string[],
  requiredFallbacks: string[]
): Promise<void> {
  try {
    const spine = await getSpineItemsSafe(epub);
    const sampleSize = Math.min(CONTENT_ANALYSIS_SAMPLE_SIZE, spine.length);

    const context: AnalysisContext = {
      epub,
      detectedVersion,
      warnings,
      requiredFallbacks,
    };

    for (let i = 0; i < sampleSize; i++) {
      const spineItem = spine[i];
      if (!spineItem) continue;

      await analyzeSingleItem(context, spineItem);
    }
  } catch {
    warnings.push('Failed to analyze content compatibility');
  }
}

/**
 * Get spine items safely with error handling
 * @param {any} epub - EPUB instance
 * @returns {Promise<SpineItem[]>} Array of spine items
 */
async function getSpineItemsSafe(epub: Epub): Promise<SpineItem[]> {
  try {
    const spine = await epub.getSpineItems();
    return spine || [];
  } catch (error) {
    logger.warn('Failed to get spine items for content analysis', {
      parser: 'EPUBParser',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}

/**
 * Analysis context interface to reduce parameter count
 */
interface AnalysisContext {
  epub: Epub;
  detectedVersion: EPUBVersion;
  warnings: string[];
  requiredFallbacks: string[];
}

/**
 * Analyze a single content item for compatibility issues
 * @param {any} context - Analysis context containing all necessary parameters
 * @param {any} spineItem - Spine item to analyze
 */
async function analyzeSingleItem(
  context: AnalysisContext,
  spineItem: SpineItem
): Promise<void> {
  try {
    const content = await readContentSafe(context.epub, spineItem.id);
    if (!content) return;

    if (context.detectedVersion === EPUBVersion.EPUB_2_0) {
      analyzeEPUB2Content(content, context.warnings, context.requiredFallbacks);
    }
  } catch {
    // Continue with next item on error
  }
}

/**
 * Read content safely with error handling
 * @param {any} epub - EPUB instance
 * @param {any} itemId - Item ID to read
 * @returns {Promise<string | null>} Content string or null
 */
async function readContentSafe(
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
 * Analyze EPUB 2.0 content for compatibility issues
 * @param {string} content - Content to analyze
 * @param {string[]} warnings - Array to add warnings to
 * @param {string[]} requiredFallbacks - Array to add required fallbacks to
 */
function analyzeEPUB2Content(
  content: string,
  warnings: string[],
  requiredFallbacks: string[]
): void {
  checkForMediaContent(content, warnings, requiredFallbacks);
  checkForScriptContent(content, warnings, requiredFallbacks);
}

/**
 * Check for media content that's incompatible with EPUB 2.0
 * @param {string} content - Content to check
 * @param {string[]} warnings - Array to add warnings to
 * @param {string[]} requiredFallbacks - Array to add required fallbacks to
 */
function checkForMediaContent(
  content: string,
  warnings: string[],
  requiredFallbacks: string[]
): void {
  if (content.includes('<audio') || content.includes('<video')) {
    warnings.push('Audio/Video content found in EPUB 2.0 - will be ignored');
    requiredFallbacks.push('media_content_filtering');
  }
}

/**
 * Check for script content that's incompatible with EPUB 2.0
 * @param {string} content - Content to check
 * @param {string[]} warnings - Array to add warnings to
 * @param {string[]} requiredFallbacks - Array to add required fallbacks to
 */
function checkForScriptContent(
  content: string,
  warnings: string[],
  requiredFallbacks: string[]
): void {
  if (content.includes('<script')) {
    warnings.push('JavaScript content found in EPUB 2.0 - will be stripped');
    requiredFallbacks.push('script_removal');
  }
}
