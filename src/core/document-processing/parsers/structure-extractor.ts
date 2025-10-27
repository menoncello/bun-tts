/**
 * Document structure extraction utilities
 */

import type { Chapter, DocumentMetadata } from '../types.js';
import { PARSER_CONSTANTS } from './constants.js';
import type { ParsedToken } from './parser-core.js';
import { countWords } from './text-processing-utils.js';

/**
 * Extract basic metadata for streaming
 * @param content - The raw content string to extract metadata from
 * @returns Document metadata including title and word count
 */
export function extractBasicMetadata(content: string): DocumentMetadata {
  const lines = content.split('\n');
  let title = 'Untitled Document';

  // Extract title from first line if it looks like a heading
  if (lines.length > 0) {
    const firstLine = lines[0]?.trim();
    if (firstLine && firstLine.startsWith('# ')) {
      title = firstLine
        .substring(PARSER_CONSTANTS.HEADING_PREFIX_LENGTH)
        .trim();
    }
  }

  return {
    title,
    wordCount: countWords(content),
    customMetadata: {},
  };
}

/**
 * Extract document metadata
 * @param content - The raw content string to extract metadata from
 * @param tokens - Array of parsed tokens to analyze for title extraction
 * @returns Complete document metadata with title and word count
 */
export function extractMetadata(
  content: string,
  tokens: ParsedToken[]
): DocumentMetadata {
  // Try to extract title from first h1
  let title = 'Untitled Document';
  for (const token of tokens) {
    if (token.type === 'heading' && token.depth === 1 && token.text) {
      title = token.text;
      break;
    }
  }

  // Calculate word count
  const wordCount = countWords(content);

  return {
    title,
    wordCount,
    customMetadata: {},
  };
}

/**
 * Create new chapter object
 * @param chapterNumber - The sequential number of the chapter
 * @param title - The title of the chapter
 * @param level - The heading level (1-6) of the chapter
 * @param position - The position index of the chapter in the document
 * @returns A new chapter object with initialized properties
 */
export function createChapter(
  chapterNumber: number,
  title: string,
  level: number,
  position: number
): Chapter {
  return {
    id: `chapter-${chapterNumber}`,
    title,
    level,
    paragraphs: [],
    position,
    wordCount: 0,
    estimatedDuration: 0,
    startPosition: 0,
    endPosition: 0,
  };
}

/**
 * Process chapter statistics after content extraction
 * @param chapters - Array of chapters to calculate statistics for
 */
export function processChapterStatistics(chapters: Chapter[]): void {
  for (const chapter of chapters) {
    chapter.wordCount = chapter.paragraphs.reduce(
      (sum, p) => sum + p.wordCount,
      0
    );
    chapter.estimatedDuration = estimateChapterDuration(chapter);
  }
}

/**
 * Estimate chapter duration for TTS
 * @param chapter - The chapter to estimate duration for
 * @returns Estimated duration in seconds for text-to-speech processing
 */
export function estimateChapterDuration(chapter: Chapter): number {
  return chapter.paragraphs
    .filter((p) => p.includeInAudio)
    .reduce((total, paragraph) => {
      return (
        total +
        paragraph.sentences.reduce(
          (sum, sentence) => sum + sentence.estimatedDuration,
          0
        )
      );
    }, 0);
}

/**
 * Estimate total document duration for TTS
 * @param chapters - Array of chapters to calculate total duration for
 * @returns Total estimated duration in seconds for all chapters
 */
export function estimateTotalDuration(chapters: Chapter[]): number {
  return chapters.reduce(
    (total, chapter) => total + chapter.estimatedDuration,
    0
  );
}

/**
 * Calculate overall document confidence
 * @param chapters - Array of chapters to calculate confidence score for
 * @returns Overall confidence score between 0.0 and 1.0
 */
export function calculateOverallConfidence(chapters: Chapter[]): number {
  if (chapters.length === 0) return 0.0;

  const totalParagraphs = chapters.reduce(
    (sum, chapter) => sum + chapter.paragraphs.length,
    0
  );
  if (totalParagraphs === 0) return 0.0;

  const totalConfidence = chapters.reduce((chapterSum, chapter) => {
    const chapterConfidence = chapter.paragraphs.reduce(
      (paraSum, paragraph) => {
        return paraSum + paragraph.confidence;
      },
      0
    );
    return (
      chapterSum + chapterConfidence / Math.max(chapter.paragraphs.length, 1)
    );
  }, 0);

  return totalConfidence / chapters.length;
}
