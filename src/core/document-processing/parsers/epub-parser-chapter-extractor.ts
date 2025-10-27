/**
 * EPUB Parser Chapter Extractor
 *
 * Handles extraction of chapters and content from EPUB files
 */

import { Epub } from '@smoores/epub';
import { logger } from '../../../utils/logger';
import type { Chapter, TableOfContentsItem } from '../types';
import {
  processChapterContent,
  splitIntoParagraphs,
  calculateReadingTime,
} from './epub-parser-content-processor';
import type { EPUBParseOptions } from './epub-parser-types';
import { ERROR_MESSAGE_NO_CONTENT, countWords } from './epub-parser-utils';

const UNKNOWN_ERROR = 'Unknown error';

/**
 * Extract chapters with content
 * @param epub - EPUB instance
 * @param tableOfContents - Array of TOC items
 * @param options - Parse options
 * @returns Array of extracted chapters
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
 * @param epub - EPUB instance
 * @param tocItem - Table of contents item
 * @param startIndex - Starting character index
 * @param options - Parse options
 * @returns Extracted chapter with content
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
 * @param tocItem - Table of contents item
 * @param content - Raw content
 * @param startIndex - Global starting index
 * @param options - Parse options
 * @returns Built chapter object
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
    paragraphs,
    startIndex,
    endIndex: startIndex + processedContent.length,
    wordCount,
    estimatedReadingTime,
  };
}

/**
 * Create empty chapter placeholder for failed extraction
 * @param tocItem - Table of contents item
 * @param globalIndex - Global character index
 * @returns Empty chapter object
 */
export function createEmptyChapter(
  tocItem: TableOfContentsItem,
  globalIndex: number
): Chapter {
  return {
    id: tocItem.id,
    title: tocItem.title,
    paragraphs: [],
    startIndex: globalIndex,
    endIndex: globalIndex,
    wordCount: 0,
    estimatedReadingTime: 0,
  };
}

/**
 * Parse table of contents from NCX or NAV file
 * @param epub - EPUB instance to parse TOC from
 * @returns Array of table of contents items
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
 * @param spineItems - Array of manifest spine items
 * @returns Table of contents items
 */
function createTOCFromSpineItems(
  spineItems: Array<{ id: string; href: string; mediaType?: string }>
): TableOfContentsItem[] {
  return spineItems.map((spineItem, index) => ({
    id: spineItem.id,
    title: extractChapterTitleFromManifest(spineItem, index),
    href: spineItem.id,
    level: 0,
  }));
}

/**
 * Create minimal fallback table of contents
 * @returns Minimal table of contents with default item
 */
function createFallbackTOC(): TableOfContentsItem[] {
  return [
    {
      id: 'default',
      title: 'Content',
      href: 'content',
      level: 0,
    },
  ];
}

/**
 * Extract chapter title from manifest spine item
 * @param spineItem - Manifest spine item to extract title from
 * @param spineItem.id - The ID of the spine item
 * @param spineItem.href - The href of the spine item
 * @param index - Item index for fallback title generation
 * @returns Chapter title string
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
