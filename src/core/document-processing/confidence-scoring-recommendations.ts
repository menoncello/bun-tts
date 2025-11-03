/**
 * Recommendation utilities for confidence scoring
 */

import { SCORING_CONSTANTS } from './confidence-scoring-constants';
import type { QualityIndicators } from './confidence-scoring-types';

/**
 * Adds a recommendation to the provided array if the condition is true.
 *
 * This is a utility function that conditionally adds a recommendation message
 * to an array of recommendations based on a boolean condition.
 *
 * @param {boolean} condition - The boolean condition to evaluate
 * @param {string} message - The recommendation message to add if condition is true
 * @param {string[]} recommendations - The array to push the recommendation into
 *
 * @returns {void} This function does not return a value
 */
export function addRecommendation(
  condition: boolean,
  message: string,
  recommendations: string[]
): void {
  if (condition) {
    recommendations.push(message);
  }
}

/**
 * Adds structural recommendations based on document quality indicators.
 *
 * This function analyzes the structural aspects of a document (chapters, paragraphs,
 * and sentences) and adds recommendations for improvement when quality indicators
 * fall below the specified threshold.
 *
 * @param {QualityIndicators} indicators - The quality indicators for document structure
 * @param {number} threshold - The minimum threshold for acceptable quality
 * @param {string[]} recommendations - The array to add recommendations to
 *
 * @returns {void} This function does not return a value
 */
function addStructuralRecommendations(
  indicators: QualityIndicators,
  threshold: number,
  recommendations: string[]
): void {
  addRecommendation(
    indicators.chapterStructure < threshold,
    'Consider adding or improving chapter headers for better structure.',
    recommendations
  );
  addRecommendation(
    indicators.paragraphDistribution < threshold,
    'Paragraph distribution is uneven. Consider breaking up or merging paragraphs.',
    recommendations
  );
  addRecommendation(
    indicators.sentenceStructure < threshold,
    'Some sentences may be too long or too short. Review sentence boundaries.',
    recommendations
  );
}

/**
 * Adds content quality recommendations based on document indicators.
 *
 * This function evaluates the content-related aspects of a document including
 * the substance of content and metadata completeness, providing recommendations
 * for improvement when quality indicators are below the threshold.
 *
 * @param {QualityIndicators} indicators - The quality indicators for document content
 * @param {number} threshold - The minimum threshold for acceptable content quality
 * @param {string[]} recommendations - The array to add recommendations to
 *
 * @returns {void} This function does not return a value
 */
function addContentRecommendations(
  indicators: QualityIndicators,
  threshold: number,
  recommendations: string[]
): void {
  addRecommendation(
    indicators.contentQuality < threshold,
    'Content appears sparse. Consider adding more substantial content.',
    recommendations
  );
  addRecommendation(
    indicators.metadataQuality < threshold,
    'Document metadata is incomplete. Add title, author, and other metadata.',
    recommendations
  );
}

/**
 * Generates recommendations based on document confidence analysis.
 *
 * This function analyzes various quality indicators of a document and generates
 * actionable recommendations for improvement. It evaluates structural aspects,
 * content quality, and metadata completeness against defined thresholds.
 *
 * @param {QualityIndicators} indicators - The quality indicators from document analysis
 *
 * @returns {string[]} An array of recommendation strings for document improvement
 */
export function generateRecommendations(
  indicators: QualityIndicators
): string[] {
  const recommendations: string[] = [];
  const threshold = SCORING_CONSTANTS.RECOMMENDATION_THRESHOLD;

  addStructuralRecommendations(indicators, threshold, recommendations);
  addContentRecommendations(indicators, threshold, recommendations);

  if (recommendations.length === 0) {
    recommendations.push('Document structure looks good!');
  }

  return recommendations;
}
