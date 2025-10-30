/**
 * Document processing utilities for Markdown parser.
 * Handles text processing and conversion utilities.
 */

import type { Chapter } from '../types.js';

/** Estimated duration per word in seconds (rough estimate) */
export const WORD_DURATION_SECONDS = 0.4;

/** Default confidence score for paragraphs */
export const DEFAULT_PARAGRAPH_CONFIDENCE = 0.8;

/** Interface for chapter data returned by chapter extractor */
export interface ChapterData {
  title?: string;
  level?: number;
  paragraphs?: Array<{
    sentences?: unknown[];
  }>;
  estimatedDuration?: number;
}

/**
 * Convert a sentence to the proper format
 * @param {any} sentence - The sentence to convert
 * @param {any} sentIndex - The sentence position index
 * @param {any} paragraphId - The parent paragraph ID
 * @returns {object} Formatted sentence object
 */
export const convertSentenceToFormat = (
  sentence: unknown,
  sentIndex: number,
  paragraphId: string
): {
  id: string;
  text: string;
  position: number;
  wordCount: number;
  estimatedDuration: number;
  hasFormatting: boolean;
} => {
  const sentenceText =
    typeof sentence === 'string' ? sentence : String(sentence);
  const words = sentenceText.split(/\s+/).filter((word) => word.length > 0);

  return {
    id: `${paragraphId}-sentence-${sentIndex + 1}`,
    text: sentenceText,
    position: sentIndex,
    wordCount: words.length,
    estimatedDuration: words.length * WORD_DURATION_SECONDS,
    hasFormatting: false, // Could be enhanced with actual detection
  };
};

/**
 * Process sentences from a paragraph
 * @param {{sentences?: unknown[]}} para - The paragraph containing sentences with optional sentences array
 * @param {unknown[]} para.sentences - Array of sentences in the paragraph
 * @param {any} paragraphId - The paragraph ID for sentence IDs
 * @returns {Array<object>} Array of processed sentences
 */
export const processParagraphSentences = (
  para: { sentences?: unknown[] },
  paragraphId: string
): Array<ReturnType<typeof convertSentenceToFormat>> => {
  return (para.sentences || []).map((sentence, sentIndex) =>
    convertSentenceToFormat(sentence, sentIndex, paragraphId)
  );
};

/**
 * Calculate paragraph statistics
 * @param {Array<object>} sentences - Array of processed sentences
 * @returns {any} {rawText: string, wordCount: number} Object with word count and raw text
 */
export const calculateParagraphStats = (
  sentences: Array<ReturnType<typeof convertSentenceToFormat>>
): { rawText: string; wordCount: number } => {
  const rawText = sentences.map((s) => s.text).join(' ');
  const wordCount = sentences.reduce((sum, s) => sum + s.wordCount, 0);
  return { rawText, wordCount };
};

/**
 * Convert a paragraph to the proper format
 * @param {{sentences?: unknown[]}} para - The paragraph to convert
 * @param {unknown[]} para.sentences - Array of sentences in the paragraph
 * @param {any} paraIndex - The paragraph position index
 * @param {any} chapterId - The parent chapter ID
 * @returns {object} Formatted paragraph object
 */
export const convertParagraphToFormat = (
  para: { sentences?: unknown[] },
  paraIndex: number,
  chapterId: string
): {
  id: string;
  type: 'text';
  sentences: Array<ReturnType<typeof convertSentenceToFormat>>;
  position: number;
  wordCount: number;
  rawText: string;
  text: string;
  includeInAudio: boolean;
  confidence: number;
} => {
  const paragraphId = `${chapterId}-paragraph-${paraIndex + 1}`;
  const sentences = processParagraphSentences(para, paragraphId);
  const { rawText, wordCount } = calculateParagraphStats(sentences);

  return {
    id: paragraphId,
    type: 'text' as const,
    sentences,
    position: paraIndex,
    wordCount,
    rawText,
    text: rawText,
    includeInAudio: true,
    confidence: DEFAULT_PARAGRAPH_CONFIDENCE,
  };
};

/**
 * Calculate estimated duration for paragraphs
 * @param {Array<object>} paragraphs - Array of paragraphs
 * @returns {number} Total estimated duration in seconds
 */
export const calculateParagraphsDuration = (
  paragraphs: Array<{ sentences: Array<{ estimatedDuration: number }> }>
): number => {
  return paragraphs.reduce(
    (sum: number, p) =>
      sum +
      p.sentences.reduce((sSum: number, s) => sSum + s.estimatedDuration, 0),
    0
  );
};

/**
 * Convert ChapterData to Chapter format
 * @param {any} chapterData - The chapter data to convert
 * @param {any} index - The chapter position in the document
 * @returns {Chapter} Converted Chapter object
 */
export const convertChapterDataToChapter = (
  chapterData: ChapterData,
  index: number
): Chapter => {
  const id = `chapter-${index + 1}`;
  const title = chapterData.title || `Chapter ${index + 1}`;
  const level = chapterData.level || 1;

  // Convert paragraphs to proper format
  const paragraphs = (chapterData.paragraphs || []).map((para, paraIndex) =>
    convertParagraphToFormat(para, paraIndex, id)
  );

  const wordCount = paragraphs.reduce((sum, p) => sum + p.wordCount, 0);
  const estimatedDuration =
    chapterData.estimatedDuration || calculateParagraphsDuration(paragraphs);

  return {
    id,
    title,
    level,
    paragraphs,
    position: index,
    wordCount,
    estimatedDuration,
    startPosition: 0, // Could be enhanced with actual position tracking
    endPosition: 0, // Could be enhanced with actual position tracking
    startIndex: 0, // For compatibility with Chapter interface
  };
};

/**
 * Calculate document statistics from chapters
 * @param {ChapterData[]} chapters - Array of chapters to calculate statistics from
 * @returns {any} {totalParagraphs: number, totalSentences: number} Object containing total paragraphs and sentences
 */
export const calculateStatistics = (
  chapters: ChapterData[]
): { totalParagraphs: number; totalSentences: number } => {
  const totalParagraphs = chapters.reduce(
    (sum, chapter) => sum + (chapter.paragraphs?.length || 0),
    0
  );
  const totalSentences = chapters.reduce(
    (sum, chapter) =>
      sum +
      (chapter.paragraphs?.reduce(
        (paraSum: number, paragraph) =>
          paraSum + (paragraph.sentences?.length || 0),
        0
      ) || 0),
    0
  );

  return { totalParagraphs, totalSentences };
};

/**
 * Calculate document statistics from Chapter objects
 * @param {Chapter[]} chapters - Array of Chapter objects to calculate statistics from
 * @returns {any} {totalParagraphs: number, totalSentences: number} Object containing total paragraphs and sentences
 */
export const calculateStatisticsFromChapters = (
  chapters: Chapter[]
): { totalParagraphs: number; totalSentences: number } => {
  const totalParagraphs = chapters.reduce(
    (sum, chapter) => sum + chapter.paragraphs.length,
    0
  );
  const totalSentences = chapters.reduce(
    (sum, chapter) =>
      sum +
      chapter.paragraphs.reduce(
        (paraSum, paragraph) => paraSum + paragraph.sentences.length,
        0
      ),
    0
  );

  return { totalParagraphs, totalSentences };
};

/**
 * Calculate estimated total duration from chapters
 * @param {ChapterData[]} chapters - Array of chapters to calculate duration from
 * @returns {number} Total estimated duration in seconds
 */
export const calculateEstimatedDuration = (chapters: ChapterData[]): number => {
  return chapters.reduce(
    (total, chapter) => total + (chapter.estimatedDuration || 0),
    0
  );
};

/**
 * Calculate estimated total duration from Chapter objects
 * @param {Chapter[]} chapters - Array of Chapter objects to calculate duration from
 * @returns {number} Total estimated duration in seconds
 */
export const calculateEstimatedDurationFromChapters = (
  chapters: Chapter[]
): number => {
  return chapters.reduce(
    (total, chapter) => total + chapter.estimatedDuration,
    0
  );
};
