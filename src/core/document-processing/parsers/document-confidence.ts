/**
 * Document confidence calculation utilities for Markdown parser.
 * Handles confidence scoring based on document structure and content quality.
 */

import type { Chapter } from '../types.js';

// Constants for document confidence calculation
export const BASE_CONFIDENCE_SCORE = 0.7;
export const EXCELLENT_STRUCTURE_CHAPTER_THRESHOLD = 5;
export const EXCELLENT_STRUCTURE_BONUS = 0.15;
export const GOOD_STRUCTURE_CHAPTER_THRESHOLD = 3;
export const GOOD_STRUCTURE_BONUS = 0.1;
export const MINIMAL_STRUCTURE_CHAPTER_BONUS = 0.05;
export const GOOD_PARAGRAPH_DISTRIBUTION_MIN = 2;
export const GOOD_PARAGRAPH_DISTRIBUTION_MAX = 10;
export const GOOD_PARAGRAPH_DISTRIBUTION_BONUS = 0.1;
export const MINIMAL_PARAGRAPH_DISTRIBUTION_BONUS = 0.05;
export const GOOD_SENTENCE_DISTRIBUTION_MIN = 2;
export const GOOD_SENTENCE_DISTRIBUTION_MAX = 4;
export const GOOD_SENTENCE_DISTRIBUTION_BONUS = 0.1;
export const MINIMAL_SENTENCE_DISTRIBUTION_BONUS = 0.05;
export const COMPREHENSIVE_CONTENT_THRESHOLD = 500;
export const COMPREHENSIVE_CONTENT_BONUS = 0.15;
export const SUBSTANTIAL_CONTENT_THRESHOLD = 200;
export const SUBSTANTIAL_CONTENT_BONUS = 0.1;
export const MINIMAL_CONTENT_THRESHOLD = 100;
export const MINIMAL_CONTENT_BONUS = 0.05;
export const SINGLE_CHARACTER_CONFIDENCE = 0.8;
export const EXTREMELY_MINIMAL_WORD_THRESHOLD = 3;
export const EXTREMELY_MINIMAL_CONFIDENCE = 0.2;
export const EXTREMELY_MINIMAL_STRUCTURE_CONFIDENCE = 0.6;
export const NO_CLEAR_STRUCTURE_CONFIDENCE = 0.8;
export const MINIMAL_STRUCTURE_CONTENT_THRESHOLD = 20;
export const CONTENT_WITH_STRUCTURE_CONFIDENCE = 0.85;
export const REASONABLE_CONTENT_THRESHOLD = 20;
export const REASONABLE_CONTENT_CONFIDENCE = 0.8;
export const DEFAULT_NORMAL_CONTENT_CONFIDENCE = 0.75;
export const MAX_CONFIDENCE_SCORE = 1.0;
export const CONTENT_STRUCTURE_THRESHOLD = 10;
export const CONTENT_STRUCTURE_WORD_THRESHOLD = 1;

/**
 * Calculate structure confidence based on chapter count
 * @param chapterCount - Number of chapters in the document
 * @returns Structure confidence bonus
 */
export const calculateStructureConfidence = (chapterCount: number): number => {
  if (chapterCount >= EXCELLENT_STRUCTURE_CHAPTER_THRESHOLD) {
    return EXCELLENT_STRUCTURE_BONUS;
  } else if (chapterCount >= GOOD_STRUCTURE_CHAPTER_THRESHOLD) {
    return GOOD_STRUCTURE_BONUS;
  } else if (chapterCount > 1) {
    return MINIMAL_STRUCTURE_CHAPTER_BONUS;
  }
  return 0;
};

/**
 * Calculate content distribution confidence based on paragraphs and sentences
 * @param totalParagraphs - Total number of paragraphs
 * @param totalSentences - Total number of sentences
 * @param chapterCount - Number of chapters
 * @returns Content distribution confidence bonus
 */
export const calculateContentDistributionConfidence = (
  totalParagraphs: number,
  totalSentences: number,
  chapterCount: number
): number => {
  let confidenceBonus = 0;

  // Good paragraph distribution
  if (totalParagraphs > 0) {
    const avgParagraphsPerChapter = totalParagraphs / chapterCount;
    if (
      avgParagraphsPerChapter >= GOOD_PARAGRAPH_DISTRIBUTION_MIN &&
      avgParagraphsPerChapter <= GOOD_PARAGRAPH_DISTRIBUTION_MAX
    ) {
      confidenceBonus += GOOD_PARAGRAPH_DISTRIBUTION_BONUS;
    } else if (avgParagraphsPerChapter >= 1) {
      confidenceBonus += MINIMAL_PARAGRAPH_DISTRIBUTION_BONUS;
    }
  }

  // Good sentence structure
  if (totalSentences > 0) {
    const avgSentencesPerParagraph = totalSentences / totalParagraphs;
    if (
      avgSentencesPerParagraph >= GOOD_SENTENCE_DISTRIBUTION_MIN &&
      avgSentencesPerParagraph <= GOOD_SENTENCE_DISTRIBUTION_MAX
    ) {
      confidenceBonus += GOOD_SENTENCE_DISTRIBUTION_BONUS;
    } else if (avgSentencesPerParagraph >= 1) {
      confidenceBonus += MINIMAL_SENTENCE_DISTRIBUTION_BONUS;
    }
  }

  return confidenceBonus;
};

/**
 * Calculate content size confidence based on word count
 * @param wordCount - Total word count
 * @returns Content size confidence bonus
 */
export const calculateContentSizeConfidence = (wordCount: number): number => {
  if (wordCount > COMPREHENSIVE_CONTENT_THRESHOLD) {
    return COMPREHENSIVE_CONTENT_BONUS;
  } else if (wordCount > SUBSTANTIAL_CONTENT_THRESHOLD) {
    return SUBSTANTIAL_CONTENT_BONUS;
  } else if (wordCount > MINIMAL_CONTENT_THRESHOLD) {
    return MINIMAL_CONTENT_BONUS;
  }
  return 0;
};

/**
 * Check for single character content
 * @param wordCount - Total word count
 * @returns Confidence score or null if not applicable
 */
const checkSingleCharacterContent = (wordCount: number): number | null => {
  if (wordCount === 1) {
    return SINGLE_CHARACTER_CONFIDENCE;
  }
  return null;
};

/**
 * Check for extremely minimal content scenarios
 * @param wordCount - Total word count
 * @param chapterCount - Number of chapters
 * @param totalParagraphs - Total number of paragraphs
 * @param confidence - Current confidence score
 * @returns Confidence score or null if not applicable
 */
const checkExtremelyMinimalContent = (
  wordCount: number,
  chapterCount: number,
  totalParagraphs: number,
  confidence: number
): number | null => {
  if (
    wordCount <= EXTREMELY_MINIMAL_WORD_THRESHOLD &&
    chapterCount === 0 &&
    totalParagraphs === 0
  ) {
    return Math.min(confidence, EXTREMELY_MINIMAL_STRUCTURE_CONFIDENCE);
  }

  if (wordCount <= EXTREMELY_MINIMAL_WORD_THRESHOLD) {
    return EXTREMELY_MINIMAL_CONFIDENCE;
  }

  return null;
};

/**
 * Check for content with no clear structure
 * @param chapterCount - Number of chapters
 * @param totalParagraphs - Total number of paragraphs
 * @param confidence - Current confidence score
 * @returns Confidence score or null if not applicable
 */
const checkNoClearStructure = (
  chapterCount: number,
  totalParagraphs: number,
  confidence: number
): number | null => {
  if (chapterCount === 0 && totalParagraphs <= 1) {
    return Math.max(confidence, NO_CLEAR_STRUCTURE_CONFIDENCE);
  }
  return null;
};

/**
 * Check for minimal structure and content
 * @param chapterCount - Number of chapters
 * @param totalParagraphs - Total number of paragraphs
 * @param wordCount - Total word count
 * @param confidence - Current confidence score
 * @returns Confidence score or null if not applicable
 */
const checkMinimalStructure = (
  chapterCount: number,
  totalParagraphs: number,
  wordCount: number,
  confidence: number
): number | null => {
  if (
    chapterCount === 1 &&
    totalParagraphs === 1 &&
    wordCount < MINIMAL_STRUCTURE_CONTENT_THRESHOLD
  ) {
    return Math.max(confidence, NO_CLEAR_STRUCTURE_CONFIDENCE);
  }
  return null;
};

/**
 * Check for content with good structure
 * @param wordCount - Total word count
 * @param chapterCount - Number of chapters
 * @param confidence - Current confidence score
 * @returns Confidence score or null if not applicable
 */
const checkGoodStructure = (
  wordCount: number,
  chapterCount: number,
  confidence: number
): number | null => {
  if (
    wordCount >= CONTENT_STRUCTURE_THRESHOLD &&
    chapterCount > CONTENT_STRUCTURE_WORD_THRESHOLD
  ) {
    return Math.max(confidence, CONTENT_WITH_STRUCTURE_CONFIDENCE);
  }

  if (chapterCount >= CONTENT_STRUCTURE_WORD_THRESHOLD + 1) {
    return Math.max(confidence, CONTENT_WITH_STRUCTURE_CONFIDENCE);
  }

  return null;
};

/**
 * Check for reasonable content amount
 * @param wordCount - Total word count
 * @param confidence - Current confidence score
 * @returns Confidence score or null if not applicable
 */
const checkReasonableContent = (
  wordCount: number,
  confidence: number
): number | null => {
  if (wordCount >= REASONABLE_CONTENT_THRESHOLD) {
    return Math.max(confidence, REASONABLE_CONTENT_CONFIDENCE);
  }
  return null;
};

/**
 * Check structure-related scenarios
 * @param chapterCount - Number of chapters
 * @param totalParagraphs - Total number of paragraphs
 * @param wordCount - Total word count
 * @param confidence - Current confidence score
 * @returns Confidence score or null if not applicable
 */
const checkStructureScenarios = (
  chapterCount: number,
  totalParagraphs: number,
  wordCount: number,
  confidence: number
): number | null => {
  // Check for no clear structure
  const noStructureResult = checkNoClearStructure(
    chapterCount,
    totalParagraphs,
    confidence
  );
  if (noStructureResult !== null) {
    return noStructureResult;
  }

  // Check for minimal structure
  const minimalStructureResult = checkMinimalStructure(
    chapterCount,
    totalParagraphs,
    wordCount,
    confidence
  );
  if (minimalStructureResult !== null) {
    return minimalStructureResult;
  }

  return null;
};

/**
 * Check content quality scenarios
 * @param wordCount - Total word count
 * @param chapterCount - Number of chapters
 * @param confidence - Current confidence score
 * @returns Confidence score or null if not applicable
 */
const checkContentQualityScenarios = (
  wordCount: number,
  chapterCount: number,
  confidence: number
): number | null => {
  // Check for good structure
  const goodStructureResult = checkGoodStructure(
    wordCount,
    chapterCount,
    confidence
  );
  if (goodStructureResult !== null) {
    return goodStructureResult;
  }

  // Check for reasonable content
  const reasonableContentResult = checkReasonableContent(wordCount, confidence);
  if (reasonableContentResult !== null) {
    return reasonableContentResult;
  }

  return null;
};

/**
 * Check content structure scenarios
 * @param wordCount - Total word count
 * @param chapterCount - Number of chapters
 * @param totalParagraphs - Total number of paragraphs
 * @param confidence - Current confidence score
 * @returns Confidence score or null if not applicable
 */
const checkContentStructureScenarios = (
  wordCount: number,
  chapterCount: number,
  totalParagraphs: number,
  confidence: number
): number | null => {
  // Check structure scenarios
  const structureResult = checkStructureScenarios(
    chapterCount,
    totalParagraphs,
    wordCount,
    confidence
  );
  if (structureResult !== null) {
    return structureResult;
  }

  // Check content quality scenarios
  const contentResult = checkContentQualityScenarios(
    wordCount,
    chapterCount,
    confidence
  );
  if (contentResult !== null) {
    return contentResult;
  }

  return null;
};

/**
 * Adjust confidence based on edge cases and minimal content scenarios
 * @param confidence - Current confidence score
 * @param wordCount - Total word count
 * @param chapterCount - Number of chapters
 * @param totalParagraphs - Total number of paragraphs
 * @returns Adjusted confidence score
 */
export const adjustConfidenceForEdgeCases = (
  confidence: number,
  wordCount: number,
  chapterCount: number,
  totalParagraphs: number
): number => {
  // Check for single character content
  const singleCharResult = checkSingleCharacterContent(wordCount);
  if (singleCharResult !== null) {
    return singleCharResult;
  }

  // Check for extremely minimal content
  const minimalContentResult = checkExtremelyMinimalContent(
    wordCount,
    chapterCount,
    totalParagraphs,
    confidence
  );
  if (minimalContentResult !== null) {
    return minimalContentResult;
  }

  // Check for content structure scenarios
  const structureResult = checkContentStructureScenarios(
    wordCount,
    chapterCount,
    totalParagraphs,
    confidence
  );
  if (structureResult !== null) {
    return structureResult;
  }

  // Default for normal content
  return Math.max(confidence, DEFAULT_NORMAL_CONTENT_CONFIDENCE);
};

/**
 * Calculate document confidence based on structure quality
 * @param chapters - Array of chapters to analyze
 * @param totalParagraphs - Total number of paragraphs
 * @param totalSentences - Total number of sentences
 * @param wordCount - Total word count
 * @returns Confidence score between 0 and 1
 */
export const calculateDocumentConfidence = (
  chapters: Chapter[],
  totalParagraphs: number,
  totalSentences: number,
  wordCount: number
): number => {
  let confidence = BASE_CONFIDENCE_SCORE;

  // Add structure confidence
  confidence += calculateStructureConfidence(chapters.length);

  // Add content distribution confidence
  confidence += calculateContentDistributionConfidence(
    totalParagraphs,
    totalSentences,
    chapters.length
  );

  // Add content size confidence
  confidence += calculateContentSizeConfidence(wordCount);

  // Adjust for edge cases
  confidence = adjustConfidenceForEdgeCases(
    confidence,
    wordCount,
    chapters.length,
    totalParagraphs
  );

  return Math.min(confidence, MAX_CONFIDENCE_SCORE);
};
