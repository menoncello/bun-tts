/**
 * Factor calculation functions for confidence scoring
 */

import { SCORING_CONSTANTS } from './confidence-scoring-constants';
import { calculateConfidenceFromFactors } from './confidence-scoring-core';
import type { QualityIndicators } from './confidence-scoring-types';
import type { DocumentStructure } from './types';

/**
 * Calculate title factor for chapter scoring
 *
 * @param {{title?: string}} chapter - Chapter object with optional title
 * @param {string} chapter.title - Chapter title (optional)
 * @returns {{name: string, score: number, weight: number}} Factor with name, score, and weight
 */
export function calculateTitleFactor(chapter: { title?: string }): {
  name: string;
  score: number;
  weight: number;
} {
  const hasTitle = chapter.title && chapter.title.trim().length > 0;

  return {
    name: 'Has Title',
    score: hasTitle ? 1 : 0,
    weight: SCORING_CONSTANTS.TITLE_WEIGHT,
  };
}

/**
 * Calculate content factor for chapter scoring
 *
 * @param {{wordCount: number}} chapter - Chapter object with word count
 * @param {number} chapter.wordCount - Number of words in the chapter
 * @returns {{name: string, score: number, weight: number}} Factor with name, score, and weight
 */
export function calculateContentFactor(chapter: { wordCount: number }): {
  name: string;
  score: number;
  weight: number;
} {
  const contentScore = Math.min(
    1,
    chapter.wordCount / SCORING_CONSTANTS.CONTENT_SCORE_CHAPTER_WORDS
  );

  return {
    name: 'Content Length',
    score: contentScore,
    weight: SCORING_CONSTANTS.CONTENT_WEIGHT,
  };
}

/**
 * Calculate paragraph factor for chapter scoring
 *
 * @param {{paragraphs: unknown[]}} chapter - Chapter object with paragraphs
 * @param {unknown[]} chapter.paragraphs - Array of paragraphs in the chapter
 * @returns {{name: string, score: number, weight: number}} Factor with name, score, and weight
 */
export function calculateParagraphFactor(chapter: { paragraphs: unknown[] }): {
  name: string;
  score: number;
  weight: number;
} {
  const paragraphScore = Math.min(
    1,
    chapter.paragraphs.length / SCORING_CONSTANTS.PARAGRAPH_SCORE_COUNT
  );

  return {
    name: 'Paragraph Count',
    score: paragraphScore,
    weight: SCORING_CONSTANTS.PARAGRAPH_WEIGHT,
  };
}

/**
 * Calculate position factor for chapter scoring
 *
 * @param {number} index - Position index of the chapter in the document
 * @returns {{name: string, score: number, weight: number}} Factor with name, score, and weight
 */
export function calculatePositionFactor(index: number): {
  name: string;
  score: number;
  weight: number;
} {
  const positionScore = Math.max(
    SCORING_CONSTANTS.POSITION_SCORE_MIN,
    1 - index * SCORING_CONSTANTS.POSITION_SCORE_FACTOR
  );

  return {
    name: 'Document Position',
    score: positionScore,
    weight: SCORING_CONSTANTS.POSITION_WEIGHT,
  };
}

/**
 * Calculate factors for a single chapter.
 *
 * @param {{title?: string, wordCount: number, paragraphs: unknown[]}} chapter - Chapter object
 * @param {string} chapter.title - Chapter title
 * @param {number} chapter.wordCount - Chapter word count
 * @param {unknown[]} chapter.paragraphs - Chapter paragraphs
 * @param {number} index - Chapter index
 * @returns {Array<{name: string, score: number, weight: number}>} Factors
 */
export function calculateChapterFactors(
  chapter: { title?: string; wordCount: number; paragraphs: unknown[] },
  index: number
): Array<{ name: string; score: number; weight: number }> {
  return [
    calculateTitleFactor(chapter),
    calculateContentFactor(chapter),
    calculateParagraphFactor(chapter),
    calculatePositionFactor(index),
  ];
}

/**
 * Create structure factor for organizational aspects
 *
 * @param {QualityIndicators} indicators - Quality indicators
 * @returns {Array<{name: string, score: number, weight: number, description: string}>} Organizational factors
 */
function createOrganizationalFactors(indicators: QualityIndicators): Array<{
  name: string;
  score: number;
  weight: number;
  description: string;
}> {
  return [
    {
      name: 'Chapter Structure',
      score: indicators.chapterStructure,
      weight: SCORING_CONSTANTS.WEIGHT_CHAPTER,
      description: 'Quality of chapter organization and hierarchy',
    },
    {
      name: 'Paragraph Distribution',
      score: indicators.paragraphDistribution,
      weight: SCORING_CONSTANTS.WEIGHT_PARAGRAPH,
      description: 'Evenness of paragraph distribution across chapters',
    },
  ];
}

/**
 * Create structure factor for content and quality
 *
 * @param {QualityIndicators} indicators - Quality indicators
 * @returns {Array<{name: string, score: number, weight: number, description: string}>} Content quality factors
 */
function createContentQualityFactors(indicators: QualityIndicators): Array<{
  name: string;
  score: number;
  weight: number;
  description: string;
}> {
  return [
    {
      name: 'Sentence Structure',
      score: indicators.sentenceStructure,
      weight: SCORING_CONSTANTS.WEIGHT_SENTENCE,
      description: 'Quality of sentence boundaries and distribution',
    },
    {
      name: 'Content Quality',
      score: indicators.contentQuality,
      weight: SCORING_CONSTANTS.WEIGHT_CONTENT,
      description: 'Amount and richness of document content',
    },
    {
      name: 'Metadata Quality',
      score: indicators.metadataQuality,
      weight: SCORING_CONSTANTS.WEIGHT_METADATA,
      description: 'Completeness of document metadata',
    },
  ];
}

/**
 * Calculate structure factors from indicators.
 *
 * @param {QualityIndicators} indicators - Quality indicators
 * @returns {Array<{name: string, score: number, weight: number, description: string}>} Structure factors
 */
export function calculateStructureFactors(
  indicators: QualityIndicators
): Array<{
  name: string;
  score: number;
  weight: number;
  description: string;
}> {
  return [
    ...createOrganizationalFactors(indicators),
    ...createContentQualityFactors(indicators),
  ];
}

/**
 * Calculate confidence scores for individual chapters.
 *
 * @param {DocumentStructure} structure - Document structure
 * @returns {Array<{id: string, title: string, confidence: number, factors: Array<{name: string, score: number, weight: number}>}>} Chapter confidence details
 */
export function calculateChapterConfidenceDetails(
  structure: DocumentStructure
): Array<{
  id: string;
  title: string;
  confidence: number;
  factors: Array<{
    name: string;
    score: number;
    weight: number;
  }>;
}> {
  return structure.chapters.map((chapter, index) => {
    const factors = calculateChapterFactors(chapter, index);
    const confidence = calculateConfidenceFromFactors(factors);

    return {
      id: chapter.id,
      title: chapter.title,
      confidence,
      factors,
    };
  });
}

/**
 * Create distribution buckets for confidence ranges
 *
 * @returns {Array<{range: string, count: number}>} Distribution buckets
 */
function createDistributionBuckets(): Array<{ range: string; count: number }> {
  return [
    { range: '0.0-0.2', count: 0 },
    { range: '0.2-0.4', count: 0 },
    { range: '0.4-0.6', count: 0 },
    { range: '0.6-0.8', count: 0 },
    { range: '0.8-1.0', count: 0 },
  ];
}

/**
 * Calculate average confidence from array
 *
 * @param {number[]} confidences - Array of confidence scores
 * @returns {number} Average confidence
 */
function calculateAverageConfidence(confidences: number[]): number {
  return confidences.length > 0
    ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
    : 0;
}

/**
 * Calculate paragraph confidence distribution.
 *
 * @param {DocumentStructure} structure - Document structure
 * @returns {{average: number, distribution: Array<{range: string, count: number}>}} Paragraph confidence statistics
 */
export function calculateParagraphConfidenceStats(
  structure: DocumentStructure
): {
  average: number;
  distribution: Array<{ range: string; count: number }>;
} {
  const confidences: number[] = [];

  for (const chapter of structure.chapters) {
    for (const paragraph of chapter.paragraphs) {
      confidences.push(paragraph.confidence);
    }
  }

  const average = calculateAverageConfidence(confidences);
  const distribution = createDistributionBuckets();

  for (const confidence of confidences) {
    const bucketIndex = Math.min(
      Math.floor(confidence * SCORING_CONSTANTS.BUCKET_COUNT),
      SCORING_CONSTANTS.BUCKET_COUNT - 1
    );
    if (distribution[bucketIndex]) {
      distribution[bucketIndex].count++;
    }
  }

  return { average, distribution };
}

/**
 * Calculate sentence confidence statistics.
 *
 * @param {DocumentStructure} structure - Document structure
 * @returns {{average: number, totalCount: number}} Sentence confidence statistics
 */
export function calculateSentenceConfidenceStats(
  structure: DocumentStructure
): {
  average: number;
  totalCount: number;
} {
  // For now, return a default confidence since individual sentence confidence
  // is not explicitly stored in the Sentence interface
  // In a real implementation, this would be calculated based on sentence features

  const totalSentences = structure.totalSentences;

  return {
    average: SCORING_CONSTANTS.DEFAULT_SENTENCE_CONFIDENCE, // Default assumption
    totalCount: totalSentences,
  };
}

/**
 * Calculate chapter breakdown.
 *
 * @param {DocumentStructure} structure - Document structure
 * @returns {Array<{chapterId: string, wordCount: number, paragraphCount: number, sentenceCount: number, confidence: number, issues: string[]}>} Chapter breakdown
 */
export function calculateChapterBreakdown(structure: DocumentStructure): Array<{
  chapterId: string;
  wordCount: number;
  paragraphCount: number;
  sentenceCount: number;
  confidence: number;
  issues: string[];
}> {
  return structure.chapters.map((chapter) => ({
    chapterId: chapter.id,
    wordCount: chapter.wordCount,
    paragraphCount: chapter.paragraphs.length,
    sentenceCount: chapter.paragraphs.reduce(
      (sum, p) => sum + p.sentences.length,
      0
    ),
    confidence: chapter.confidence || SCORING_CONSTANTS.DEFAULT_CONFIDENCE,
    issues: [],
  }));
}
