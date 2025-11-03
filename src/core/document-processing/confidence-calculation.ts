/**
 * Confidence calculation utilities
 */

import type { Chapter } from './types/document-structure-types';
import { VALIDATION_THRESHOLDS } from './validation-constants';

/**
 * Calculate total confidence from chapters
 *
 * Calculates the sum of confidence scores across all chapters in a document structure.
 * Each chapter may have an optional confidence value that contributes to the total.
 *
 * @param {Array<{ confidence?: number }>} chapters - Array of chapter objects containing optional confidence scores
 * @returns {number} Sum of chapter confidences, returns 0 if no chapters have confidence values
 */
export const calculateChapterConfidence = (
  chapters: Array<{ confidence?: number }>
): number => {
  let sum = 0;
  for (const chapter of chapters) {
    if (chapter.confidence !== undefined) {
      sum += chapter.confidence;
    }
  }
  return sum;
};

/**
 * Calculate total confidence from paragraphs
 *
 * Sums up confidence scores from all paragraphs across all chapters in the document.
 * This provides a comprehensive view of paragraph-level confidence throughout the structure.
 *
 * @param {Array<{ paragraphs: Array<{ confidence: number }> }>} chapters - Array of chapter objects containing paragraphs with confidence scores
 * @returns {{ total: number; count: number }} Object containing total confidence sum and paragraph count
 */
export const calculateParagraphConfidence = (
  chapters: Array<{ paragraphs: Array<{ confidence: number }> }>
): { total: number; count: number } => {
  let total = 0;
  let count = 0;

  for (const chapter of chapters) {
    for (const paragraph of chapter.paragraphs) {
      total += paragraph.confidence;
      count++;
    }
  }

  return { total, count };
};

/**
 * Calculate total confidence from sentences (with sampling)
 *
 * Calculates sentence-level confidence using a sampling approach for performance optimization.
 * Instead of processing every sentence, it samples sentences at a configurable rate to
 * provide an efficient estimate of overall sentence confidence.
 *
 * @param {Chapter[]} chapters - Array of chapter objects containing paragraphs with sentences and word counts
 * @returns {{ total: number; count: number }} Object containing total confidence sum and processed sentence count
 */
export const calculateSentenceConfidence = (
  chapters: Chapter[]
): { total: number; count: number } => {
  let total = 0;
  let count = 0;
  let sentenceSampleCount = 0;

  for (const chapter of chapters) {
    const { chapterTotal, chapterCount } = processChapterSentences(
      chapter,
      sentenceSampleCount
    );
    total += chapterTotal;
    count += chapterCount;
    sentenceSampleCount += chapterCount;
  }

  return { total, count };
};

/**
 * Process sentences in a single chapter
 *
 * Helper function that processes all paragraphs within a chapter to calculate sentence confidence.
 * It maintains the sampling count across chapters to ensure consistent sampling throughout the document.
 *
 * @param {Chapter} chapter - Chapter object containing paragraphs with sentences and word counts
 * @param {number} startingSampleCount - The current sample count before processing this chapter
 * @returns {{ chapterTotal: number; chapterCount: number }} Object containing chapter's total confidence and sentence count
 */
const processChapterSentences = (
  chapter: Chapter,
  startingSampleCount: number
): { chapterTotal: number; chapterCount: number } => {
  let chapterTotal = 0;
  let chapterCount = 0;

  for (const paragraph of chapter.paragraphs) {
    const { paragraphTotal, paragraphCount } = processParagraphSentences(
      paragraph,
      startingSampleCount + chapterCount
    );
    chapterTotal += paragraphTotal;
    chapterCount += paragraphCount;
  }

  return { chapterTotal, chapterCount };
};

/**
 * Process sentences in a single paragraph
 *
 * Low-level function that implements sentence sampling within a paragraph.
 * Uses the configured sampling rate to select sentences for confidence calculation,
 * applying default confidence values to sampled sentences.
 *
 * @param {object} paragraph - Paragraph object containing sentences with word counts
 * @param {Array<object>} paragraph.sentences - Array of sentences with word counts
 * @param {number} startingSampleCount - The current sample count before processing this paragraph
 * @returns {{ paragraphTotal: number; paragraphCount: number }} Object containing paragraph's total confidence and sentence count
 */
const processParagraphSentences = (
  paragraph: { sentences: Array<{ wordCount: number }> },
  startingSampleCount: number
): { paragraphTotal: number; paragraphCount: number } => {
  let paragraphTotal = 0;
  const sentenceCount = paragraph.sentences.length;

  for (let i = 0; i < sentenceCount; i++) {
    // Sample every Nth sentence for performance
    if (
      (startingSampleCount + i) %
        VALIDATION_THRESHOLDS.SENTENCE_SAMPLING_RATE ===
      0
    ) {
      paragraphTotal += VALIDATION_THRESHOLDS.DEFAULT_SENTENCE_CONFIDENCE;
    }
  }

  return { paragraphTotal, paragraphCount: sentenceCount };
};
