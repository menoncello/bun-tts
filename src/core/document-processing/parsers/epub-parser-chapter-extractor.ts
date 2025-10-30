/**
 * EPUB Parser Chapter Extractor
 *
 * Handles extraction of chapters and content from EPUB files
 */

import { Epub } from '@smoores/epub';
import { logger } from '../../../utils/logger.js';
import type { Chapter, TableOfContentsItem } from '../types.js';
import {
  POSITION_DIVISOR,
  SECONDS_PER_MINUTE,
} from './chapter-extraction-constants.js';
import {
  processChapterContent,
  splitIntoParagraphs,
  calculateReadingTime,
} from './epub-parser-content-processor.js';
import type { EPUBParseOptions } from './epub-parser-types.js';
import { ERROR_MESSAGE_NO_CONTENT, countWords } from './epub-parser-utils.js';

const UNKNOWN_ERROR = 'Unknown error';

/**
 * Extract chapters with content
 * @param {any} epub - EPUB instance
 * @param {any} tableOfContents - Array of TOC items
 * @param {any} options - Parse options
 * @returns {unknown} unknown Array of extracted chapters
 */
export async function extractChapters(
  epub: Epub,
  tableOfContents: TableOfContentsItem[],
  options: EPUBParseOptions
): Promise<Chapter[]> {
  const chapters: Chapter[] = [];
  let globalIndex = 0;

  for (const tocItem of tableOfContents) {
    try {
      const chapter = await extractChapter(epub, tocItem, globalIndex, options);
      if (chapter.paragraphs.length > 0) {
        chapters.push(chapter);
        globalIndex += chapter.paragraphs.reduce(
          (sum, p) => sum + p.text.length,
          0
        );
      }
    } catch (error) {
      logger.warn('Failed to extract chapter, skipping', {
        parser: 'EPUBParser',
        chapter: tocItem.title,
        error: error instanceof Error ? error.message : UNKNOWN_ERROR,
      });

      chapters.push(createEmptyChapter(tocItem, globalIndex));
    }
  }

  return chapters;
}

/**
 * Extract individual chapter content
 * @param {any} epub - EPUB instance
 * @param {any} tocItem - Table of contents item
 * @param {any} startIndex - Starting character index
 * @param {any} options - Parse options
 * @returns {unknown} unknown Extracted chapter with content
 */
export async function extractChapter(
  epub: Epub,
  tocItem: TableOfContentsItem,
  startIndex: number,
  options: EPUBParseOptions
): Promise<Chapter> {
  try {
    // Get content as text string for processing
    const content = await epub.readXhtmlItemContents(tocItem.href, 'text');

    if (!content) {
      throw new Error(`${ERROR_MESSAGE_NO_CONTENT} ${tocItem.title}`);
    }

    return await buildChapterFromContent(tocItem, content, startIndex, options);
  } catch (error) {
    logger.error('Chapter extraction failed', {
      parser: 'EPUBParser',
      chapter: tocItem.title,
      error: error instanceof Error ? error.message : UNKNOWN_ERROR,
    });
    throw error;
  }
}

/**
 * Build chapter object from content and options
 * @param {any} tocItem - Table of contents item
 * @param {string} content - Raw content
 * @param {any} startIndex - Global starting index
 * @param {any} options - Parse options
 * @returns {object} object Built chapter object
 */
async function buildChapterFromContent(
  tocItem: TableOfContentsItem,
  content: string,
  startIndex: number,
  options: EPUBParseOptions
): Promise<Chapter> {
  const processedContent = processChapterContent(content, options);
  const paragraphs = splitIntoParagraphs(processedContent);
  const wordCount = countWords(processedContent);
  const estimatedReadingTime = calculateReadingTime(wordCount);

  return {
    id: tocItem.id,
    title: tocItem.title,
    level: tocItem.level || 1,
    paragraphs,
    position: Math.floor(startIndex / POSITION_DIVISOR), // Rough position estimate
    wordCount,
    estimatedDuration: estimatedReadingTime * SECONDS_PER_MINUTE, // Convert minutes to seconds
    startPosition: startIndex,
    endPosition: startIndex + processedContent.length,
    startIndex,
  };
}

/**
 * Create empty chapter placeholder for failed extraction
 * @param {any} tocItem - Table of contents item
 * @param {any} globalIndex - Global character index
 * @returns {object} object Empty chapter object
 */
export function createEmptyChapter(
  tocItem: TableOfContentsItem,
  globalIndex: number
): Chapter {
  return {
    id: tocItem.id,
    title: tocItem.title,
    level: tocItem.level || 1,
    paragraphs: [],
    position: Math.floor(globalIndex / POSITION_DIVISOR), // Rough position estimate
    wordCount: 0,
    estimatedDuration: 0,
    startPosition: globalIndex,
    endPosition: globalIndex,
    startIndex: globalIndex,
  };
}

/**
 * Parse table of contents from NCX or NAV file
 * @param {any} epub - EPUB instance to parse TOC from
 * @returns {unknown} unknown Array of table of contents items
 */
export async function parseTableOfContents(
  epub: Epub
): Promise<TableOfContentsItem[]> {
  try {
    const spineItems = await epub.getSpineItems();
    return createTOCFromSpineItems(spineItems);
  } catch (error) {
    logger.warn('Failed to parse table of contents, creating fallback TOC', {
      parser: 'EPUBParser',
      error: error instanceof Error ? error.message : UNKNOWN_ERROR,
    });

    return createFallbackTOC();
  }
}

/**
 * Create table of contents from spine items
 * @param {any} spineItems - Array of manifest spine items
 * @returns {unknown} unknown Table of contents items
 */
function createTOCFromSpineItems(
  spineItems: Array<{ id: string; href: string; mediaType?: string }>
): TableOfContentsItem[] {
  return spineItems.map((spineItem, index) => ({
    id: spineItem.id,
    title: extractChapterTitleFromManifest(spineItem, index),
    href: spineItem.id,
    level: 0,
    children: [],
  }));
}

/**
 * Create minimal fallback table of contents
 * @returns {unknown} unknown Minimal table of contents with default item
 */
function createFallbackTOC(): TableOfContentsItem[] {
  return [
    {
      id: 'default',
      title: 'Content',
      href: 'content',
      level: 0,
      children: [],
    },
  ];
}

/**
 * Extract chapter title from manifest spine item
 * @param {{ id: string; href: string }} spineItem - Manifest spine item to extract title from
 * @param {string} spineItem.id - The ID of the spine item
 * @param {string} spineItem.href - The href of the spine item
 * @param {any} index - Item index for fallback title generation
 * @returns {string} Chapter title string
 */
function extractChapterTitleFromManifest(
  spineItem: { id: string; href: string },
  index: number
): string {
  // Extract title from href filename as fallback
  const href = spineItem.href;
  const filename = href.split('/').pop()?.split('.')[0] || 'content';
  return (
    filename.charAt(0).toUpperCase() + filename.slice(1) ||
    `Chapter ${index + 1}`
  );
}
