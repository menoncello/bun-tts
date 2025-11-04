/**
 * Performance assessment utilities
 * Extracted from performance-targets.ts to reduce method complexity
 */

import type { PerformanceTargets } from './performance-targets.js';

// Constants
const MS_PER_SECOND = 1000;
const PERCENTAGE_MULTIPLIER = 100;

/**
 * Text length categories for performance assessment
 */
export interface TextLengthCategories {
  short: number;
  medium: number;
  long: number;
}

/**
 * Interface for normalized metrics
 */
export interface NormalizedMetrics {
  wordCount: number;
  synthesisTimeMs: number;
  memoryUsageMB: number;
  qualityScore: number;
  textCategory: keyof TextLengthCategories;
}

/**
 * Interface for synthesis assessment result
 */
export interface SynthesisAssessment {
  meetsTarget: boolean;
  synthesisRate: number;
  targetRate: number;
  variance: number;
}

/**
 * Interface for response time assessment result
 */
export interface ResponseTimeAssessment {
  meetsTarget: boolean;
  responseTime: number;
  maxResponseTime: number;
  variance: number;
}

/**
 * Interface for memory assessment result
 */
export interface MemoryAssessment {
  meetsTarget: boolean;
  memoryUsage: number;
  maxMemoryUsage: number;
  variance: number;
}

/**
 * Interface for quality assessment result
 */
export interface QualityAssessment {
  meetsTarget: boolean;
  quality: number;
  minQuality: number;
  variance: number;
}

/**
 * Interface for complete performance assessment result
 */
export interface PerformanceAssessmentResult {
  meetsAll: boolean;
  synthesis: boolean;
  responseTime: boolean;
  memory: boolean;
  quality: boolean;
  synthesisRate: number;
  maxResponseTime: number;
}

/**
 * Calculate synthesis rate from word count and synthesis time
 *
 * @param {number} wordCount - Number of words synthesized
 * @param {number} synthesisTimeMs - Synthesis time in milliseconds
 * @returns {number} Synthesis rate in words per second
 */
export function calculateSynthesisRate(
  wordCount: number,
  synthesisTimeMs: number
): number {
  return synthesisTimeMs > 0
    ? (wordCount / synthesisTimeMs) * MS_PER_SECOND
    : 0;
}

/**
 * Assess synthesis performance against targets
 *
 * @param {NormalizedMetrics} metrics - Normalized performance metrics
 * @param {PerformanceTargets} targets - Performance targets
 * @returns {SynthesisAssessment} Synthesis assessment result
 */
export function assessSynthesis(
  metrics: NormalizedMetrics,
  targets: PerformanceTargets
): SynthesisAssessment {
  const synthesisRate = calculateSynthesisRate(
    metrics.wordCount,
    metrics.synthesisTimeMs
  );
  const targetRate = targets.synthesis[metrics.textCategory];
  const meetsTarget = synthesisRate >= targetRate;
  const variance =
    ((synthesisRate - targetRate) / targetRate) * PERCENTAGE_MULTIPLIER;

  return {
    meetsTarget,
    synthesisRate,
    targetRate,
    variance,
  };
}

/**
 * Assess response time performance against targets
 *
 * @param {NormalizedMetrics} metrics - Normalized performance metrics
 * @param {PerformanceTargets} targets - Performance targets
 * @returns {ResponseTimeAssessment} Response time assessment result
 */
export function assessResponseTime(
  metrics: NormalizedMetrics,
  targets: PerformanceTargets
): ResponseTimeAssessment {
  const maxResponseTime = targets.maxResponseTime[metrics.textCategory];
  const meetsTarget = metrics.synthesisTimeMs <= maxResponseTime;
  const variance =
    ((metrics.synthesisTimeMs - maxResponseTime) / maxResponseTime) *
    PERCENTAGE_MULTIPLIER;

  return {
    meetsTarget,
    responseTime: metrics.synthesisTimeMs,
    maxResponseTime,
    variance,
  };
}

/**
 * Assess memory usage performance against targets
 *
 * @param {NormalizedMetrics} metrics - Normalized performance metrics
 * @param {PerformanceTargets} targets - Performance targets
 * @returns {MemoryAssessment} Memory assessment result
 */
export function assessMemoryUsage(
  metrics: NormalizedMetrics,
  targets: PerformanceTargets
): MemoryAssessment {
  const maxMemoryUsage = targets.maxMemoryUsage[metrics.textCategory];
  const meetsTarget = metrics.memoryUsageMB <= maxMemoryUsage;
  const variance =
    ((metrics.memoryUsageMB - maxMemoryUsage) / maxMemoryUsage) *
    PERCENTAGE_MULTIPLIER;

  return {
    meetsTarget,
    memoryUsage: metrics.memoryUsageMB,
    maxMemoryUsage,
    variance,
  };
}

/**
 * Assess quality performance against targets
 *
 * @param {NormalizedMetrics} metrics - Normalized performance metrics
 * @param {PerformanceTargets} targets - Performance targets
 * @returns {QualityAssessment} Quality assessment result
 */
export function assessQuality(
  metrics: NormalizedMetrics,
  targets: PerformanceTargets
): QualityAssessment {
  const minQuality = targets.minQuality[metrics.textCategory];
  const meetsTarget = metrics.qualityScore >= minQuality;
  const variance =
    ((metrics.qualityScore - minQuality) / minQuality) * PERCENTAGE_MULTIPLIER;

  return {
    meetsTarget,
    quality: metrics.qualityScore,
    minQuality,
    variance,
  };
}

/**
 * Perform comprehensive performance assessment
 *
 * @param {NormalizedMetrics} metrics - Normalized performance metrics
 * @param {PerformanceTargets} targets - Performance targets
 * @returns {PerformanceAssessmentResult} Complete performance assessment
 */
export function assessPerformance(
  metrics: NormalizedMetrics,
  targets: PerformanceTargets
): PerformanceAssessmentResult {
  const synthesisAssessment = assessSynthesis(metrics, targets);
  const responseTimeAssessment = assessResponseTime(metrics, targets);
  const memoryAssessment = assessMemoryUsage(metrics, targets);
  const qualityAssessment = assessQuality(metrics, targets);

  return {
    meetsAll:
      synthesisAssessment.meetsTarget &&
      responseTimeAssessment.meetsTarget &&
      memoryAssessment.meetsTarget &&
      qualityAssessment.meetsTarget,
    synthesis: synthesisAssessment.meetsTarget,
    responseTime: responseTimeAssessment.meetsTarget,
    memory: memoryAssessment.meetsTarget,
    quality: qualityAssessment.meetsTarget,
    synthesisRate: synthesisAssessment.synthesisRate,
    maxResponseTime: responseTimeAssessment.maxResponseTime,
  };
}
