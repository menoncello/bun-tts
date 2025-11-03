/**
 * Quality scoring functions for confidence analysis
 */

import { SCORING_CONSTANTS } from './confidence-scoring-constants';
import {
  calculateChapterCountReward,
  calculateTitleQualityReward,
  calculateChapterBalanceReward,
  calculateReasonableSentences,
  calculateSentenceDistributionReward,
  calculateContentTypeReward,
  calculateCustomMetadataReward,
  clamp,
} from './confidence-scoring-core';
import type { QualityIndicators } from './confidence-scoring-types';
import type { DocumentStructure } from './types';

/**
 * Scoring configuration
 */
export interface ScoringConfig {
  /** Minimum confidence score */
  minScore: number;
  /** Maximum confidence score */
  maxScore: number;
  /** Threshold for good confidence */
  goodThreshold: number;
  /** Threshold for acceptable confidence */
  acceptableThreshold: number;
}

/**
 * Constants for quality scoring calculations
 */
const QUALITY_CONSTANTS = {
  /** Minimum paragraphs per chapter for optimal distribution */
  MIN_PARAGRAPHS_PER_CHAPTER: 2,
  /** Maximum paragraphs per chapter for optimal distribution */
  MAX_PARAGRAPHS_PER_CHAPTER: 15,
  /** Zero value for comparisons */
  ZERO: 0,
  /** One value for comparisons */
  ONE: 1,
  /** Zero value for length checks */
  EMPTY_LENGTH: 0,
} as const;

/**
 * Default scoring configuration
 */
export const DEFAULT_CONFIG: ScoringConfig = {
  minScore: QUALITY_CONSTANTS.ZERO,
  maxScore: QUALITY_CONSTANTS.ONE,
  goodThreshold: 0.8,
  acceptableThreshold: 0.6,
};

/**
 * Create default quality indicators with minimum scores.
 *
 * @param {ScoringConfig} config - The scoring configuration containing min score value
 * @returns {QualityIndicators} Default quality indicators with minimum scores
 */
function createDefaultQualityIndicators(
  config: ScoringConfig
): QualityIndicators {
  return {
    chapterStructure: config.minScore,
    paragraphDistribution: config.minScore,
    sentenceStructure: config.minScore,
    contentQuality: config.minScore,
    metadataQuality: config.minScore,
  };
}

/**
 * Calculate quality indicators from document structure.
 *
 * Analyzes various quality aspects of the document structure including
 * chapter structure, paragraph distribution, sentence structure, content quality,
 * and metadata quality to provide comprehensive quality indicators.
 *
 * @param {DocumentStructure} structure - The document structure to analyze for quality metrics
 * @param {ScoringConfig} config - The scoring configuration containing bounds and thresholds
 * @returns {QualityIndicators} An object containing quality scores for different aspects of the document
 */
export function calculateQualityIndicators(
  structure: DocumentStructure,
  config: ScoringConfig
): QualityIndicators {
  // Handle undefined or null structure
  if (!structure) {
    return createDefaultQualityIndicators(config);
  }

  // Chapter structure quality
  const chapterStructure = calculateChapterStructureQuality(structure, config);

  // Paragraph distribution quality
  const paragraphDistribution = calculateParagraphDistributionQuality(
    structure,
    config
  );

  // Sentence structure quality
  const sentenceStructure = calculateSentenceStructureQuality(
    structure,
    config
  );

  // Content quality
  const contentQuality = calculateContentQuality(structure, config);

  // Metadata quality
  const metadataQuality = calculateMetadataQuality(structure, config);

  return {
    chapterStructure,
    paragraphDistribution,
    sentenceStructure,
    contentQuality,
    metadataQuality,
  };
}

/**
 * Calculate chapter structure quality score.
 *
 * Evaluates the quality of chapter structure by considering chapter count,
 * title quality, and balance between chapters.
 *
 * @param {DocumentStructure} structure - The document structure to analyze
 * @param {ScoringConfig} config - The scoring configuration containing min/max bounds
 * @returns {number} Quality score between 0 and 1, where higher values indicate better chapter structure
 */
function calculateChapterStructureQuality(
  structure: DocumentStructure,
  config: ScoringConfig
): number {
  // Handle missing chapters
  if (!structure.chapters || structure.chapters.length === 0) {
    return config.minScore;
  }

  const chapterCount = structure.chapters.length;

  // Calculate individual components
  const countReward = calculateChapterCountReward(chapterCount);
  const titleReward = calculateTitleQualityReward(structure, chapterCount);
  const balanceReward = calculateChapterBalanceReward(structure, chapterCount);

  // Combine scores
  let score = SCORING_CONSTANTS.BASE_SCORE;
  score += countReward;
  score += titleReward;
  score += balanceReward;

  return clamp(score, config.minScore, config.maxScore);
}

/**
 * Calculate reward for having paragraphs in the document.
 *
 * @param {number} totalParagraphs - Total number of paragraphs in the document
 * @returns {number} Score reward for having paragraphs
 */
function calculateParagraphPresenceReward(totalParagraphs: number): number {
  return totalParagraphs > QUALITY_CONSTANTS.ZERO
    ? SCORING_CONSTANTS.PARAGRAPH_DISTRIBUTION_REWARD
    : QUALITY_CONSTANTS.ZERO;
}

/**
 * Calculate reward for optimal paragraph distribution across chapters.
 *
 * @param {number} avgParagraphsPerChapter - Average paragraphs per chapter
 * @returns {number} Score reward for paragraph distribution
 */
function calculateParagraphDistributionReward(
  avgParagraphsPerChapter: number
): number {
  if (
    avgParagraphsPerChapter >= QUALITY_CONSTANTS.MIN_PARAGRAPHS_PER_CHAPTER &&
    avgParagraphsPerChapter <= QUALITY_CONSTANTS.MAX_PARAGRAPHS_PER_CHAPTER
  ) {
    return SCORING_CONSTANTS.PARAGRAPH_REWARD;
  }

  if (avgParagraphsPerChapter > QUALITY_CONSTANTS.ZERO) {
    return SCORING_CONSTANTS.PARAGRAPH_PARTIAL_REWARD;
  }

  return QUALITY_CONSTANTS.ZERO;
}

/**
 * Calculate penalty for empty chapters.
 *
 * @param {DocumentStructure['chapters']} chapters - Array of chapters to check
 * @returns {number} Penalty score for empty chapters
 */
function calculateEmptyChapterPenalty(
  chapters: DocumentStructure['chapters']
): number {
  const emptyChapters = chapters.filter(
    (ch) =>
      !ch.paragraphs || ch.paragraphs.length === QUALITY_CONSTANTS.EMPTY_LENGTH
  ).length;

  return emptyChapters > QUALITY_CONSTANTS.ZERO
    ? emptyChapters * SCORING_CONSTANTS.EMPTY_CHAPTER_PENALTY
    : QUALITY_CONSTANTS.ZERO;
}

/**
 * Calculate paragraph distribution quality score.
 *
 * Evaluates how well paragraphs are distributed across chapters,
 * penalizing empty chapters and rewarding optimal paragraph counts.
 *
 * @param {DocumentStructure} structure - The document structure to analyze
 * @param {ScoringConfig} config - The scoring configuration containing min/max bounds
 * @returns {number} Quality score between 0 and 1, where higher values indicate better paragraph distribution
 */
function calculateParagraphDistributionQuality(
  structure: DocumentStructure,
  config: ScoringConfig
): number {
  let score = SCORING_CONSTANTS.BASE_SCORE;

  // Handle missing chapters or totalParagraphs
  const chapterCount = structure.chapters?.length || 0;
  const totalParagraphs = structure.totalParagraphs || 0;

  // Reward for having paragraphs
  score += calculateParagraphPresenceReward(totalParagraphs);

  // Check paragraph distribution across chapters
  if (
    chapterCount > QUALITY_CONSTANTS.ZERO &&
    totalParagraphs > QUALITY_CONSTANTS.ZERO
  ) {
    const avgParagraphsPerChapter = totalParagraphs / chapterCount;

    // Optimal paragraphs per chapter
    score += calculateParagraphDistributionReward(avgParagraphsPerChapter);

    // Check for empty chapters (no paragraphs)
    score -= calculateEmptyChapterPenalty(structure.chapters);
  }

  return clamp(score, config.minScore, config.maxScore);
}

/**
 * Calculate sentence structure quality score.
 *
 * Evaluates sentence distribution and reasonable sentence lengths
 * throughout the document structure.
 *
 * @param {DocumentStructure} structure - The document structure to analyze
 * @param {ScoringConfig} config - The scoring configuration containing min/max bounds
 * @returns {number} Quality score between 0 and 1, where higher values indicate better sentence structure
 */
function calculateSentenceStructureQuality(
  structure: DocumentStructure,
  config: ScoringConfig
): number {
  // Handle missing data
  const totalSentences = structure.totalSentences || 0;
  const totalParagraphs = structure.totalParagraphs || 0;

  // Base score
  let score = SCORING_CONSTANTS.BASE_SCORE;

  // Reward for having sentences
  if (totalSentences > QUALITY_CONSTANTS.ZERO) {
    score += SCORING_CONSTANTS.SENTENCE_DISTRIBUTION_REWARD;
  }

  // Calculate distribution reward
  const distributionReward = calculateSentenceDistributionReward(
    totalSentences,
    totalParagraphs
  );
  score += distributionReward;

  // Check for reasonable sentence lengths only if we have chapters
  if (structure.chapters && structure.chapters.length > 0) {
    try {
      const { reasonable, total } = calculateReasonableSentences(structure);

      if (total > QUALITY_CONSTANTS.ZERO) {
        const reasonableRatio = reasonable / total;
        score += reasonableRatio * SCORING_CONSTANTS.REASONABLE_RATIO_REWARD;
      }
    } catch {
      // If sentence calculation fails, continue without additional scoring
      // This prevents crashes due to malformed data
    }
  }

  return clamp(score, config.minScore, config.maxScore);
}

/**
 * Calculate content quality score.
 *
 * Evaluates the quality of content based on word count, content type,
 * and substantial content metrics.
 *
 * @param {DocumentStructure} structure - The document structure to analyze for content quality
 * @param {ScoringConfig} config - The scoring configuration containing min/max bounds
 * @returns {number} Quality score between 0 and 1, where higher values indicate better content quality
 */
export function calculateContentQuality(
  structure: DocumentStructure,
  config: ScoringConfig
): number {
  // Handle missing metadata
  const totalWords = structure.metadata?.wordCount || 0;

  // Base score
  let score = SCORING_CONSTANTS.BASE_SCORE;

  // Reward for substantial content
  if (totalWords >= SCORING_CONSTANTS.CONTENT_WORDS_THRESHOLD) {
    score += SCORING_CONSTANTS.CONTENT_REWARD;
  } else if (totalWords > QUALITY_CONSTANTS.ZERO) {
    score +=
      (totalWords / SCORING_CONSTANTS.CONTENT_WORDS_THRESHOLD) *
      SCORING_CONSTANTS.CONTENT_REWARD_FACTOR;
  }

  // Add content type reward
  score += calculateContentTypeReward(structure);

  return clamp(score, config.minScore, config.maxScore);
}

/**
 * Calculate metadata quality score.
 *
 * Evaluates the completeness and quality of document metadata including
 * title, author, language, word count, date, and custom metadata fields.
 *
 * @param {DocumentStructure} structure - The document structure to analyze for metadata quality
 * @param {ScoringConfig} config - The scoring configuration containing min/max bounds
 * @returns {number} Quality score between 0 and 1, where higher values indicate better metadata quality
 */
export function calculateMetadataQuality(
  structure: DocumentStructure,
  config: ScoringConfig
): number {
  // Handle missing metadata
  const metadata = structure.metadata || {};

  // Base score
  let score = SCORING_CONSTANTS.MIN_SCORE;

  // Title
  if (
    metadata.title &&
    metadata.title.trim().length > QUALITY_CONSTANTS.EMPTY_LENGTH
  ) {
    score += SCORING_CONSTANTS.METADATA_TITLE_REWARD;
  }

  // Author
  if (metadata.author) {
    score += SCORING_CONSTANTS.METADATA_AUTHOR_REWARD;
  }

  // Language
  if (metadata.language) {
    score += SCORING_CONSTANTS.METADATA_LANGUAGE_REWARD;
  }

  // Word count
  if (metadata.wordCount > QUALITY_CONSTANTS.ZERO) {
    score += SCORING_CONSTANTS.METADATA_WORD_COUNT_REWARD;
  }

  // Date
  if (metadata.created || metadata.date) {
    score += SCORING_CONSTANTS.METADATA_DATE_REWARD;
  }

  // Custom metadata
  score += calculateCustomMetadataReward(metadata.customMetadata);

  return clamp(score, config.minScore, config.maxScore);
}

/**
 * Calculate overall confidence score from quality indicators.
 *
 * Combines individual quality indicator scores using weighted averages
 * to produce an overall confidence score for the document structure.
 *
 * @param {QualityIndicators} indicators - The quality indicators object containing individual quality scores
 * @returns {number} Overall confidence score between 0 and 1, where higher values indicate better overall quality
 */
export function calculateOverallConfidence(
  indicators: QualityIndicators
): number {
  const weightedSum =
    indicators.chapterStructure * SCORING_CONSTANTS.WEIGHT_CHAPTER +
    indicators.paragraphDistribution * SCORING_CONSTANTS.WEIGHT_PARAGRAPH +
    indicators.sentenceStructure * SCORING_CONSTANTS.WEIGHT_SENTENCE +
    indicators.contentQuality * SCORING_CONSTANTS.WEIGHT_CONTENT +
    indicators.metadataQuality * SCORING_CONSTANTS.WEIGHT_METADATA;

  return clamp(weightedSum, QUALITY_CONSTANTS.ZERO, QUALITY_CONSTANTS.ONE);
}
