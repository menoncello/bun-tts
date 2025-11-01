/**
 * Utility functions for document confidence calculation.
 * Contains helper functions for checking edge cases and content scenarios.
 */

import type { MarkdownElement } from '../types';
import {
  SINGLE_CHARACTER_CONFIDENCE,
  EXTREMELY_MINIMAL_WORD_THRESHOLD,
  EXTREMELY_MINIMAL_STRUCTURE_CONFIDENCE,
  EXTREMELY_MINIMAL_CONFIDENCE,
  NO_CLEAR_STRUCTURE_CONFIDENCE,
  MINIMAL_STRUCTURE_CONTENT_THRESHOLD,
  CONTENT_WITH_STRUCTURE_CONFIDENCE,
  CONTENT_STRUCTURE_THRESHOLD,
  CONTENT_STRUCTURE_WORD_THRESHOLD,
  REASONABLE_CONTENT_THRESHOLD,
  REASONABLE_CONTENT_CONFIDENCE,
  DEFAULT_NORMAL_CONTENT_CONFIDENCE,
  SPECIAL_ELEMENTS_CONFIDENCE_BONUS,
} from './confidence-constants';

/** Local constants for magic numbers */
const LOCAL_CONSTANTS = {
  /** Single word count for single character detection */
  SINGLE_WORD_COUNT: 1,
  /** Zero count for empty structure */
  ZERO_COUNT: 0,
  /** Single paragraph count */
  SINGLE_PARAGRAPH: 1,
  /** Single chapter count */
  SINGLE_CHAPTER: 1,
  /** Minimum element types for diversity bonus */
  MIN_DIVERSITY_TYPES: 2,
  /** Minimum elements for quantity bonus */
  MIN_ELEMENTS_FOR_BONUS: 3,
  /** Initial bonus value */
  INITIAL_BONUS: 0,
  /** Half divisor for bonus calculations */
  HALF_DIVISOR: 2,
  /** Chapter threshold increment */
  CHAPTER_THRESHOLD_INCREMENT: 1,
} as const;

/**
 * Interface for document metrics to reduce parameter count
 */
export interface DocumentMetrics {
  wordCount: number;
  chapterCount: number;
  totalParagraphs: number;
  totalSentences: number;
}

/**
 * Check for single character content
 *
 * @param {number} wordCount - Number of words in the document
 * @returns {number | null} Confidence value or null if not applicable
 */
export const checkSingleCharacterContent = (
  wordCount: number
): number | null => {
  if (wordCount === LOCAL_CONSTANTS.SINGLE_WORD_COUNT) {
    return SINGLE_CHARACTER_CONFIDENCE;
  }
  return null;
};

/**
 * Check for extremely minimal content scenarios
 *
 * @param {DocumentMetrics} metrics - Document metrics containing word count, chapter count, and paragraph count
 * @param {number} confidence - Current confidence score to be adjusted
 * @returns {number | null} Adjusted confidence value or null if not applicable
 */
export const checkExtremelyMinimalContent = (
  metrics: DocumentMetrics,
  confidence: number
): number | null => {
  const { wordCount, chapterCount, totalParagraphs } = metrics;

  if (
    wordCount <= EXTREMELY_MINIMAL_WORD_THRESHOLD &&
    chapterCount === LOCAL_CONSTANTS.ZERO_COUNT &&
    totalParagraphs === LOCAL_CONSTANTS.ZERO_COUNT
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
 *
 * @param {DocumentMetrics} metrics - Document metrics containing chapter count and paragraph count
 * @param {number} confidence - Current confidence score to be adjusted
 * @returns {number | null} Adjusted confidence value or null if not applicable
 */
export const checkNoClearStructure = (
  metrics: DocumentMetrics,
  confidence: number
): number | null => {
  const { chapterCount, totalParagraphs } = metrics;

  if (
    chapterCount === LOCAL_CONSTANTS.ZERO_COUNT &&
    totalParagraphs <= LOCAL_CONSTANTS.SINGLE_PARAGRAPH
  ) {
    return Math.max(confidence, NO_CLEAR_STRUCTURE_CONFIDENCE);
  }
  return null;
};

/**
 * Check for minimal structure and content
 *
 * @param {DocumentMetrics} metrics - Document metrics containing chapter count, paragraph count, and word count
 * @param {number} confidence - Current confidence score to be adjusted
 * @returns {number | null} Adjusted confidence value or null if not applicable
 */
export const checkMinimalStructure = (
  metrics: DocumentMetrics,
  confidence: number
): number | null => {
  const { chapterCount, totalParagraphs, wordCount } = metrics;

  if (
    chapterCount === LOCAL_CONSTANTS.SINGLE_CHAPTER &&
    totalParagraphs === LOCAL_CONSTANTS.SINGLE_PARAGRAPH &&
    wordCount < MINIMAL_STRUCTURE_CONTENT_THRESHOLD
  ) {
    return Math.max(confidence, NO_CLEAR_STRUCTURE_CONFIDENCE);
  }
  return null;
};

/**
 * Check for content with good structure
 *
 * @param {DocumentMetrics} metrics - Document metrics containing word count and chapter count
 * @param {number} confidence - Current confidence score to be adjusted
 * @returns {number | null} Adjusted confidence value or null if not applicable
 */
export const checkGoodStructure = (
  metrics: DocumentMetrics,
  confidence: number
): number | null => {
  const { wordCount, chapterCount } = metrics;

  if (
    wordCount >= CONTENT_STRUCTURE_THRESHOLD &&
    chapterCount > CONTENT_STRUCTURE_WORD_THRESHOLD
  ) {
    return Math.max(confidence, CONTENT_WITH_STRUCTURE_CONFIDENCE);
  }

  if (
    chapterCount >=
    CONTENT_STRUCTURE_WORD_THRESHOLD +
      LOCAL_CONSTANTS.CHAPTER_THRESHOLD_INCREMENT
  ) {
    return Math.max(confidence, CONTENT_WITH_STRUCTURE_CONFIDENCE);
  }

  return null;
};

/**
 * Check for reasonable content amount
 *
 * @param {number} wordCount - Total number of words in the document
 * @param {number} confidence - Current confidence score to be adjusted
 * @returns {number | null} Adjusted confidence value or null if not applicable
 */
export const checkReasonableContent = (
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
 *
 * @param {DocumentMetrics} metrics - Document metrics containing chapter count and paragraph count
 * @param {number} confidence - Current confidence score to be adjusted
 * @returns {number | null} Adjusted confidence value or null if not applicable
 */
export const checkStructureScenarios = (
  metrics: DocumentMetrics,
  confidence: number
): number | null => {
  // Check for no clear structure
  const noStructureResult = checkNoClearStructure(metrics, confidence);
  if (noStructureResult !== null) {
    return noStructureResult;
  }

  // Check for minimal structure
  const minimalStructureResult = checkMinimalStructure(metrics, confidence);
  if (minimalStructureResult !== null) {
    return minimalStructureResult;
  }

  return null;
};

/**
 * Check content quality scenarios
 *
 * @param {DocumentMetrics} metrics - Document metrics containing word count
 * @param {number} confidence - Current confidence score to be adjusted
 * @returns {number | null} Adjusted confidence value or null if not applicable
 */
export const checkContentQualityScenarios = (
  metrics: DocumentMetrics,
  confidence: number
): number | null => {
  const { wordCount } = metrics;

  // Check for good structure
  const goodStructureResult = checkGoodStructure(metrics, confidence);
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
 *
 * @param {DocumentMetrics} metrics - Document metrics containing word count, chapter count, and paragraph count
 * @param {number} confidence - Current confidence score to be adjusted
 * @returns {number | null} Adjusted confidence value or null if not applicable
 */
export const checkContentStructureScenarios = (
  metrics: DocumentMetrics,
  confidence: number
): number | null => {
  // Check structure scenarios
  const structureResult = checkStructureScenarios(metrics, confidence);
  if (structureResult !== null) {
    return structureResult;
  }

  // Check content quality scenarios
  const contentResult = checkContentQualityScenarios(metrics, confidence);
  if (contentResult !== null) {
    return contentResult;
  }

  return null;
};

/**
 * Calculate special elements confidence bonus
 *
 * @param {MarkdownElement[]} elements - Array of markdown elements to analyze
 * @returns {number} Confidence bonus value based on element diversity and quantity
 */
export const calculateSpecialElementsConfidence = (
  elements: MarkdownElement[]
): number => {
  if (elements.length === LOCAL_CONSTANTS.ZERO_COUNT) {
    return LOCAL_CONSTANTS.INITIAL_BONUS;
  }

  // Bonus for having any special elements
  let bonus = LOCAL_CONSTANTS.INITIAL_BONUS;

  // Check for different types of elements
  const elementTypes = new Set(elements.map((e) => e.type));

  // Bonus for element diversity
  if (elementTypes.size >= LOCAL_CONSTANTS.MIN_DIVERSITY_TYPES) {
    bonus += SPECIAL_ELEMENTS_CONFIDENCE_BONUS;
  } else if (elementTypes.size === LOCAL_CONSTANTS.SINGLE_CHAPTER) {
    bonus += SPECIAL_ELEMENTS_CONFIDENCE_BONUS / LOCAL_CONSTANTS.HALF_DIVISOR;
  }

  // Bonus for multiple elements of the same type
  if (elements.length >= LOCAL_CONSTANTS.MIN_ELEMENTS_FOR_BONUS) {
    bonus += SPECIAL_ELEMENTS_CONFIDENCE_BONUS / LOCAL_CONSTANTS.HALF_DIVISOR;
  }

  return bonus;
};

/**
 * Adjust confidence based on edge cases and minimal content scenarios
 *
 * @param {number} confidence - Current confidence score to be adjusted
 * @param {DocumentMetrics} metrics - Document metrics containing word count
 * @returns {number} Adjusted confidence value
 */
export const adjustConfidenceForEdgeCases = (
  confidence: number,
  metrics: DocumentMetrics
): number => {
  const { wordCount } = metrics;

  // Check for single character content
  const singleCharResult = checkSingleCharacterContent(wordCount);
  if (singleCharResult !== null) {
    return singleCharResult;
  }

  // Check for extremely minimal content
  const minimalContentResult = checkExtremelyMinimalContent(
    metrics,
    confidence
  );
  if (minimalContentResult !== null) {
    return minimalContentResult;
  }

  // Check for content structure scenarios
  const structureResult = checkContentStructureScenarios(metrics, confidence);
  if (structureResult !== null) {
    return structureResult;
  }

  // Default for normal content
  return Math.max(confidence, DEFAULT_NORMAL_CONTENT_CONFIDENCE);
};
