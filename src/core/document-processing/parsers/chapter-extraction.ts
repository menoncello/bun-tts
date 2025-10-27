/**
 * Chapter extraction logic for Markdown parser
 */

import type { MarkdownParserConfig } from '../config/markdown-parser-config.js';
import type { Chapter } from '../types.js';
import { type ParsedToken } from './parser-core.js';
import { extractParagraphFromToken } from './token-processors.js';

/**
 * Extract chapters from tokens
 *
 * @param tokens - Parsed tokens
 * @param config - Parser configuration
 * @param isChapterHeader - Function to check if token is a chapter header
 * @returns Array of chapters
 */
export async function extractChaptersFromTokens(
  tokens: ParsedToken[],
  config: MarkdownParserConfig,
  isChapterHeader: (token: ParsedToken) => boolean
): Promise<Chapter[]> {
  const chapters: Chapter[] = [];
  let currentChapter: Chapter | null = null;
  let chapterPosition = 0;
  let paragraphPosition = 0;

  for (const token of tokens) {
    if (isChapterHeader(token)) {
      currentChapter = handleNewChapterSync(
        chapters,
        currentChapter,
        token,
        chapterPosition++
      );
    } else if (currentChapter) {
      processChapterContent(currentChapter, token, paragraphPosition++, config);
    }
  }

  // Add last chapter
  if (currentChapter) {
    chapters.push(currentChapter);
  }

  // Calculate chapter statistics synchronously
  const { processChapterStatistics } = await import('./structure-extractor.js');
  processChapterStatistics(chapters);

  return chapters;
}

/**
 * Handle new chapter creation (synchronous version)
 *
 * @param chapters - Existing chapters array
 * @param currentChapter - Current chapter being processed
 * @param token - Header token
 * @param chapterPosition - Position of chapter
 * @returns New chapter object
 */
function handleNewChapterSync(
  chapters: Chapter[],
  currentChapter: Chapter | null,
  token: ParsedToken,
  chapterPosition: number
): Chapter {
  // Save previous chapter if exists
  if (currentChapter) {
    chapters.push(currentChapter);
  }

  // Start new chapter synchronously using a simple chapter creation
  return {
    id: `chapter-${chapters.length + 1}`,
    title: token.text || `Chapter ${chapters.length + 1}`,
    level: token.depth || 1,
    paragraphs: [],
    position: chapterPosition,
    wordCount: 0,
    estimatedDuration: 0,
    startPosition: 0,
    endPosition: 0,
  };
}

/**
 * Process content within chapter
 *
 * @param currentChapter - Current chapter
 * @param token - Token to process
 * @param paragraphPosition - Position in chapter
 * @param config - Parser configuration
 */
function processChapterContent(
  currentChapter: Chapter,
  token: ParsedToken,
  paragraphPosition: number,
  config: MarkdownParserConfig
): void {
  const paragraph = extractParagraphFromToken(token, paragraphPosition, config);
  if (paragraph) {
    currentChapter.paragraphs.push(paragraph);
  }
}
