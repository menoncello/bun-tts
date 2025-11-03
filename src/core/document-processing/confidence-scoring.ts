/**
 * Unified confidence scoring system for document structure analysis.
 * Provides comprehensive confidence metrics across chapters, paragraphs, and sentences.
 */

import { determineRiskLevel } from './confidence-scoring-core';
import {
  calculateChapterConfidenceDetails,
  calculateParagraphConfidenceStats,
  calculateSentenceConfidenceStats,
  calculateStructureFactors,
  calculateChapterBreakdown,
} from './confidence-scoring-factors';
import {
  calculateQualityIndicators,
  DEFAULT_CONFIG,
  calculateOverallConfidence,
} from './confidence-scoring-quality';
import { generateRecommendations } from './confidence-scoring-recommendations';
import type { DocumentStructure } from './types';
import type { ConfidenceReport } from './types/structure-analyzer-types';

/**
 * Calculate report metrics
 *
 * @param {number} overall - Overall confidence score
 * @returns {{isWellFormed: boolean, meetsThreshold: boolean, riskLevel: 'low' | 'medium' | 'high'}} Report metrics
 */
function calculateReportMetrics(overall: number): {
  isWellFormed: boolean;
  meetsThreshold: boolean;
  riskLevel: 'low' | 'medium' | 'high';
} {
  const meetsThreshold = overall >= DEFAULT_CONFIG.acceptableThreshold;
  const isWellFormed = overall >= DEFAULT_CONFIG.goodThreshold;
  const riskLevel = determineRiskLevel(
    overall,
    DEFAULT_CONFIG.acceptableThreshold
  );

  return {
    isWellFormed,
    meetsThreshold,
    riskLevel,
  };
}

/**
 * Generate comprehensive confidence report for document structure.
 *
 * @param {DocumentStructure} structure - Document structure to analyze
 * @param {boolean} detailed - Whether to include detailed breakdown
 * @returns {ConfidenceReport} Confidence report
 */
export function generateConfidenceReport(
  structure: DocumentStructure,
  detailed = true
): ConfidenceReport {
  const indicators = calculateQualityIndicators(structure, DEFAULT_CONFIG);
  const overall = calculateOverallConfidence(indicators);
  const chapterDetails = calculateChapterConfidenceDetails(structure);
  const paragraphStats = calculateParagraphConfidenceStats(structure);
  const sentenceStats = calculateSentenceConfidenceStats(structure);
  const metrics = calculateReportMetrics(overall);
  const report: ConfidenceReport = {
    overall,
    chapters: chapterDetails,
    paragraphs: paragraphStats,
    sentences: sentenceStats,
    structureFactors: calculateStructureFactors(indicators),
    metrics: {
      isWellFormed: metrics.isWellFormed,
      meetsThreshold: metrics.meetsThreshold,
      riskLevel: metrics.riskLevel,
      recommendations: generateRecommendations(indicators),
    },
  };
  if (detailed)
    report.detailed = {
      chapterBreakdown: calculateChapterBreakdown(structure),
      edgeCases: [],
    };
  return report;
}
