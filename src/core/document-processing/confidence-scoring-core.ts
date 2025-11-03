/**
 * Core utility functions for confidence scoring
 */

import { SCORING_CONSTANTS } from './confidence-scoring-constants';
import type { DocumentStructure } from './types';

/**
 * Calculate reward based on chapter count.
 *
 * @param {number} chapterCount - Number of chapters
 * @returns {number} Reward score
 */
export function calculateChapterCountReward(chapterCount: number): number {
  let reward = 0;

  // Reward for having chapters
  if (chapterCount >= 1) {
    reward += SCORING_CONSTANTS.CHAPTER_REWARD;
  }

  // Optimal chapter count is 3-20
  if (
    chapterCount >= SCORING_CONSTANTS.CHAPTER_OPTIMAL_COUNT_MIN &&
    chapterCount <= SCORING_CONSTANTS.CHAPTER_OPTIMAL_COUNT_MAX
  ) {
    reward += SCORING_CONSTANTS.CHAPTER_COUNT_REWARD;
  } else if (chapterCount > 1) {
    reward += SCORING_CONSTANTS.CHAPTER_COUNT_PARTIAL_REWARD;
  }

  return reward;
}

/**
 * Calculate title quality reward.
 *
 * @param {DocumentStructure} structure - Document structure
 * @param {number} chapterCount - Number of chapters
 * @returns {number} Title quality reward
 */
export function calculateTitleQualityReward(
  structure: DocumentStructure,
  chapterCount: number
): number {
  if (chapterCount === 0 || !structure.chapters) {
    return 0;
  }

  const chaptersWithTitles = structure.chapters.filter(
    (ch) => ch.title && ch.title.trim().length > 0
  ).length;

  const titleRatio = chaptersWithTitles / chapterCount;

  return titleRatio * SCORING_CONSTANTS.TITLE_RATIO_REWARD;
}

/**
 * Calculate chapter balance reward.
 *
 * @param {DocumentStructure} structure - Document structure
 * @param {number} chapterCount - Number of chapters
 * @returns {number} Balance reward
 */
export function calculateChapterBalanceReward(
  structure: DocumentStructure,
  chapterCount: number
): number {
  if (chapterCount <= 1 || !structure.chapters) {
    return 0;
  }

  const wordCounts = structure.chapters.map((ch) => ch.wordCount || 0);
  const avgWordCount =
    wordCounts.reduce((sum, count) => sum + count, 0) / chapterCount;

  if (avgWordCount === 0) {
    return 0;
  }

  const variance =
    wordCounts.reduce(
      (sum, count) =>
        sum +
        Math.pow(count - avgWordCount, SCORING_CONSTANTS.VARIANCE_EXPONENT),
      0
    ) / chapterCount;

  const stdDev = Math.sqrt(variance);
  const cv = stdDev / avgWordCount;

  // Lower coefficient of variation is better
  if (cv < SCORING_CONSTANTS.CV_THRESHOLD_LOW) {
    return SCORING_CONSTANTS.CV_REWARD_HIGH;
  }

  if (cv < SCORING_CONSTANTS.CV_THRESHOLD_MEDIUM) {
    return SCORING_CONSTANTS.CV_REWARD_MEDIUM;
  }

  return 0;
}

/**
 * Check if sentence word count is reasonable
 *
 * @param {{wordCount: number}} sentence - Sentence object with word count
 * @param {number} sentence.wordCount - Number of words in the sentence
 * @returns {boolean} True if word count is reasonable (between 5 and 30 words)
 */
export function isSentenceReasonable(sentence: { wordCount: number }): boolean {
  return (
    sentence.wordCount >= SCORING_CONSTANTS.SENTENCE_WORD_COUNT_MIN &&
    sentence.wordCount <= SCORING_CONSTANTS.SENTENCE_WORD_COUNT_MAX
  );
}

/**
 * Count reasonable sentences in paragraph
 *
 * @param {{sentences: Array<{wordCount: number}>}} paragraph - Paragraph object with sentences
 * @param {Array<{wordCount: number}>} paragraph.sentences - Array of sentence objects
 * @returns {{reasonable: number, total: number}} Object with reasonable and total sentence counts
 */
export function countReasonableSentencesInParagraph(paragraph: {
  sentences: Array<{ wordCount: number }>;
}): { reasonable: number; total: number } {
  let reasonable = 0;
  let total = 0;

  for (const sentence of paragraph.sentences) {
    total++;
    if (isSentenceReasonable(sentence)) {
      reasonable++;
    }
  }

  return { reasonable, total };
}

/**
 * Calculate reasonable sentence count from structure.
 *
 * @param {DocumentStructure} structure - Document structure
 * @returns {{reasonable: number, total: number}} Reasonable and total counts
 */
export function calculateReasonableSentences(structure: DocumentStructure): {
  reasonable: number;
  total: number;
} {
  // Handle missing structure or chapters
  if (!structure.chapters || structure.chapters.length === 0) {
    return { reasonable: 0, total: 0 };
  }

  let reasonableSentences = 0;
  let totalSentencesChecked = 0;

  for (const chapter of structure.chapters) {
    // Handle missing paragraphs
    if (!chapter.paragraphs || chapter.paragraphs.length === 0) {
      continue;
    }

    for (const paragraph of chapter.paragraphs) {
      // Handle missing sentences
      if (!paragraph.sentences || paragraph.sentences.length === 0) {
        continue;
      }

      const { reasonable, total } =
        countReasonableSentencesInParagraph(paragraph);
      reasonableSentences += reasonable;
      totalSentencesChecked += total;
    }
  }

  return { reasonable: reasonableSentences, total: totalSentencesChecked };
}

/**
 * Calculate sentence distribution reward.
 *
 * @param {number} totalSentences - Total sentences
 * @param {number} totalParagraphs - Total paragraphs
 * @returns {number} Distribution reward
 */
export function calculateSentenceDistributionReward(
  totalSentences: number,
  totalParagraphs: number
): number {
  if (totalParagraphs === 0 || totalSentences === 0) {
    return 0;
  }

  const avgSentencesPerParagraph = totalSentences / totalParagraphs;

  // Optimal is 2-5 sentences per paragraph
  if (
    avgSentencesPerParagraph >= SCORING_CONSTANTS.SENTENCE_OPTIMAL_MIN &&
    avgSentencesPerParagraph <= SCORING_CONSTANTS.SENTENCE_OPTIMAL_MAX
  ) {
    return SCORING_CONSTANTS.SENTENCE_REWARD;
  }

  return SCORING_CONSTANTS.SENTENCE_PARTIAL_REWARD;
}

/**
 * Calculate content type reward.
 *
 * @param {DocumentStructure} structure - Document structure
 * @returns {number} Content type reward
 */
export function calculateContentTypeReward(
  structure: DocumentStructure
): number {
  // Handle missing chapters
  if (!structure.chapters || structure.chapters.length === 0) {
    return 0;
  }

  let reward = 0;

  for (const chapter of structure.chapters) {
    if (chapter.codeBlocks && chapter.codeBlocks.length > 0) {
      reward += SCORING_CONSTANTS.CODE_BLOCK_REWARD;
    }
    if (chapter.lists && chapter.lists.length > 0) {
      reward += SCORING_CONSTANTS.LISTS_REWARD;
    }
    if (chapter.tables && chapter.tables.length > 0) {
      reward += SCORING_CONSTANTS.TABLES_REWARD;
    }
  }

  return reward;
}

/**
 * Calculate custom metadata reward.
 *
 * @param {unknown} customMetadata - Custom metadata object
 * @returns {number} Custom metadata reward
 */
export function calculateCustomMetadataReward(
  customMetadata: Record<string, unknown> | undefined
): number {
  if (!customMetadata) {
    return 0;
  }

  const customMetadataCount = Object.keys(customMetadata).length;

  if (customMetadataCount === 0) {
    return 0;
  }

  return Math.min(
    SCORING_CONSTANTS.CUSTOM_METADATA_REWARD_MAX,
    customMetadataCount * SCORING_CONSTANTS.CUSTOM_METADATA_REWARD_FACTOR
  );
}

/**
 * Calculate confidence from factors.
 *
 * @param {Array<{name: string, score: number, weight: number}>} factors - Factors
 * @returns {number} Confidence score
 */
export function calculateConfidenceFromFactors(
  factors: Array<{ score: number; weight: number }>
): number {
  const weightedSum = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);

  return weightedSum / totalWeight;
}

/**
 * Determine risk level based on confidence scores.
 *
 * @param {number} overallConfidence - Overall confidence score
 * @param {number} threshold - Quality threshold
 * @returns {'low' | 'medium' | 'high'} Risk level
 */
export function determineRiskLevel(
  overallConfidence: number,
  threshold: number
): 'low' | 'medium' | 'high' {
  if (overallConfidence >= threshold * SCORING_CONSTANTS.RISK_MULTIPLIER_HIGH) {
    return 'low';
  }

  if (
    overallConfidence >=
    threshold * SCORING_CONSTANTS.RISK_MULTIPLIER_MEDIUM
  ) {
    return 'medium';
  }

  return 'high';
}

/**
 * Clamp a value between min and max.
 *
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
