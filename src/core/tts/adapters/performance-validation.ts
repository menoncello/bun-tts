/**
 * Performance validation utilities
 * Extracted from performance-targets.ts to reduce method complexity
 */

import type {
  NormalizedMetrics,
  PerformanceAssessmentResult,
} from './performance-assessment.js';
import type { PerformanceTargets } from './performance-targets.js';

// Constants
const PERCENTAGE_MULTIPLIER = 100;
const MS_PER_SECOND = 1000;

/**
 * Validate synthesis rate against target
 *
 * @param {NormalizedMetrics} metrics - Performance metrics
 * @param {PerformanceTargets} targets - Performance targets
 * @returns {{meets: boolean, variance: number}} Validation result
 */
function validateSynthesisRate(
  metrics: NormalizedMetrics,
  targets: PerformanceTargets
): { meets: boolean; variance: number } {
  const synthesisRate =
    (metrics.wordCount / metrics.synthesisTimeMs) * MS_PER_SECOND;
  const synthesisTarget = targets.synthesis[metrics.textCategory];
  const variance =
    ((synthesisRate - synthesisTarget) / synthesisTarget) *
    PERCENTAGE_MULTIPLIER;

  return {
    meets: synthesisRate >= synthesisTarget,
    variance,
  };
}

/**
 * Validate response time against target
 *
 * @param {NormalizedMetrics} metrics - Performance metrics
 * @param {PerformanceTargets} targets - Performance targets
 * @returns {{meets: boolean, variance: number}} Validation result
 */
function validateResponseTime(
  metrics: NormalizedMetrics,
  targets: PerformanceTargets
): { meets: boolean; variance: number } {
  const responseTimeTarget = targets.maxResponseTime[metrics.textCategory];
  const variance =
    ((metrics.synthesisTimeMs - responseTimeTarget) / responseTimeTarget) *
    PERCENTAGE_MULTIPLIER;

  return {
    meets: metrics.synthesisTimeMs <= responseTimeTarget,
    variance,
  };
}

/**
 * Validate memory usage against target
 *
 * @param {NormalizedMetrics} metrics - Performance metrics
 * @param {PerformanceTargets} targets - Performance targets
 * @returns {{meets: boolean, variance: number}} Validation result
 */
function validateMemoryUsage(
  metrics: NormalizedMetrics,
  targets: PerformanceTargets
): { meets: boolean; variance: number } {
  const memoryTarget = targets.maxMemoryUsage[metrics.textCategory];
  const variance =
    ((metrics.memoryUsageMB - memoryTarget) / memoryTarget) *
    PERCENTAGE_MULTIPLIER;

  return {
    meets: metrics.memoryUsageMB <= memoryTarget,
    variance,
  };
}

/**
 * Validate quality score against target
 *
 * @param {NormalizedMetrics} metrics - Performance metrics
 * @param {PerformanceTargets} targets - Performance targets
 * @returns {{meets: boolean, variance: number}} Validation result
 */
function validateQualityScore(
  metrics: NormalizedMetrics,
  targets: PerformanceTargets
): { meets: boolean; variance: number } {
  const qualityTarget = targets.minQuality[metrics.textCategory];
  const variance =
    ((metrics.qualityScore - qualityTarget) / qualityTarget) *
    PERCENTAGE_MULTIPLIER;

  return {
    meets: metrics.qualityScore >= qualityTarget,
    variance,
  };
}

/**
 * Build validation result details object
 *
 * @param {NormalizedMetrics} metrics - Performance metrics
 * @param {PerformanceTargets} targets - Performance targets
 * @param {object} validations - Validation results
 * @param {{meets: boolean, variance: number}} validations.synthesis - Synthesis validation
 * @param {{meets: boolean, variance: number}} validations.responseTime - Response time validation
 * @param {{meets: boolean, variance: number}} validations.memory - Memory validation
 * @param {{meets: boolean, variance: number}} validations.quality - Quality validation
 * @returns {object} Detailed validation results
 */
/**
 * Build synthesis rate detail
 *
 * @param {NormalizedMetrics} metrics - Performance metrics
 * @param {PerformanceTargets} targets - Performance targets
 * @param {{meets: boolean, variance: number}} validation - Synthesis validation
 * @param {boolean} validation.meets - Whether synthesis meets target
 * @param {number} validation.variance - Performance variance
 * @returns {{actual: number, target: number, variance: number}} Synthesis rate detail
 */
function buildSynthesisRateDetail(
  metrics: NormalizedMetrics,
  targets: PerformanceTargets,
  validation: { meets: boolean; variance: number }
): { actual: number; target: number; variance: number } {
  const synthesisRate =
    (metrics.wordCount / metrics.synthesisTimeMs) * MS_PER_SECOND;

  return {
    actual: synthesisRate,
    target: targets.synthesis[metrics.textCategory],
    variance: validation.variance,
  };
}

/**
 * Build response time detail
 *
 * @param {NormalizedMetrics} metrics - Performance metrics
 * @param {PerformanceTargets} targets - Performance targets
 * @param {{meets: boolean, variance: number}} validation - Response time validation
 * @param {boolean} validation.meets - Whether response time meets target
 * @param {number} validation.variance - Performance variance
 * @returns {{actual: number, target: number, variance: number}} Response time detail
 */
function buildResponseTimeDetail(
  metrics: NormalizedMetrics,
  targets: PerformanceTargets,
  validation: { meets: boolean; variance: number }
): { actual: number; target: number; variance: number } {
  return {
    actual: metrics.synthesisTimeMs,
    target: targets.maxResponseTime[metrics.textCategory],
    variance: validation.variance,
  };
}

/**
 * Build memory usage detail
 *
 * @param {NormalizedMetrics} metrics - Performance metrics
 * @param {PerformanceTargets} targets - Performance targets
 * @param {{meets: boolean, variance: number}} validation - Memory validation
 * @param {boolean} validation.meets - Whether memory usage meets target
 * @param {number} validation.variance - Performance variance
 * @returns {{actual: number, target: number, variance: number}} Memory usage detail
 */
function buildMemoryUsageDetail(
  metrics: NormalizedMetrics,
  targets: PerformanceTargets,
  validation: { meets: boolean; variance: number }
): { actual: number; target: number; variance: number } {
  return {
    actual: metrics.memoryUsageMB,
    target: targets.maxMemoryUsage[metrics.textCategory],
    variance: validation.variance,
  };
}

/**
 * Build quality detail
 *
 * @param {NormalizedMetrics} metrics - Performance metrics
 * @param {PerformanceTargets} targets - Performance targets
 * @param {{meets: boolean, variance: number}} validation - Quality validation
 * @param {boolean} validation.meets - Whether quality meets target
 * @param {number} validation.variance - Performance variance
 * @returns {{actual: number, target: number, variance: number}} Quality detail
 */
function buildQualityDetail(
  metrics: NormalizedMetrics,
  targets: PerformanceTargets,
  validation: { meets: boolean; variance: number }
): { actual: number; target: number; variance: number } {
  return {
    actual: metrics.qualityScore,
    target: targets.minQuality[metrics.textCategory],
    variance: validation.variance,
  };
}

/**
 * Build validation result details object
 *
 * @param {NormalizedMetrics} metrics - Performance metrics
 * @param {PerformanceTargets} targets - Performance targets
 * @param {{synthesis: object, responseTime: object, memory: object, quality: object}} validations - Validation results
 * @param {{meets: boolean, variance: number}} validations.synthesis - Synthesis validation result
 * @param {{meets: boolean, variance: number}} validations.responseTime - Response time validation result
 * @param {{meets: boolean, variance: number}} validations.memory - Memory validation result
 * @param {{meets: boolean, variance: number}} validations.quality - Quality validation result
 * @returns {{synthesisRate: {actual: number, target: number, variance: number}, responseTime: {actual: number, target: number, variance: number}, memoryUsage: {actual: number, target: number, variance: number}, quality: {actual: number, target: number, variance: number}}} Detailed validation results
 */
function buildValidationDetails(
  metrics: NormalizedMetrics,
  targets: PerformanceTargets,
  validations: {
    synthesis: { meets: boolean; variance: number };
    responseTime: { meets: boolean; variance: number };
    memory: { meets: boolean; variance: number };
    quality: { meets: boolean; variance: number };
  }
): {
  synthesisRate: { actual: number; target: number; variance: number };
  responseTime: { actual: number; target: number; variance: number };
  memoryUsage: { actual: number; target: number; variance: number };
  quality: { actual: number; target: number; variance: number };
} {
  return {
    synthesisRate: buildSynthesisRateDetail(
      metrics,
      targets,
      validations.synthesis
    ),
    responseTime: buildResponseTimeDetail(
      metrics,
      targets,
      validations.responseTime
    ),
    memoryUsage: buildMemoryUsageDetail(metrics, targets, validations.memory),
    quality: buildQualityDetail(metrics, targets, validations.quality),
  };
}

/**
 * Interface for performance validation result
 */
export interface PerformanceValidationResult {
  meetsAll: boolean;
  synthesisRate: boolean;
  responseTime: boolean;
  memoryUsage: boolean;
  quality: boolean;
  details: {
    synthesisRate: { actual: number; target: number; variance: number };
    responseTime: { actual: number; target: number; variance: number };
    memoryUsage: { actual: number; target: number; variance: number };
    quality: { actual: number; target: number; variance: number };
  };
}

/**
 * Interface for validation recommendations
 */
export interface ValidationRecommendation {
  category: string;
  priority: 'low' | 'medium' | 'high';
  message: string;
  currentValue: number;
  targetValue: number;
  variance: number;
}

/**
 * Check if performance meets all targets
 *
 * @param {PerformanceAssessmentResult} assessment - Performance assessment result
 * @returns {boolean} Whether all targets are met
 */
export function meetsPerformanceTargets(
  assessment: PerformanceAssessmentResult
): boolean {
  return assessment.meetsAll;
}

/**
 * Validate performance against targets with detailed results
 *
 * @param {NormalizedMetrics} metrics - Normalized performance metrics
 * @param {PerformanceTargets} targets - Performance targets
 * @returns {PerformanceValidationResult} Detailed validation result
 */
export function validatePerformance(
  metrics: NormalizedMetrics,
  targets: PerformanceTargets
): PerformanceValidationResult {
  const validations = {
    synthesis: validateSynthesisRate(metrics, targets),
    responseTime: validateResponseTime(metrics, targets),
    memory: validateMemoryUsage(metrics, targets),
    quality: validateQualityScore(metrics, targets),
  };

  const meetsAll =
    validations.synthesis.meets &&
    validations.responseTime.meets &&
    validations.memory.meets &&
    validations.quality.meets;

  return {
    meetsAll,
    synthesisRate: validations.synthesis.meets,
    responseTime: validations.responseTime.meets,
    memoryUsage: validations.memory.meets,
    quality: validations.quality.meets,
    details: buildValidationDetails(metrics, targets, validations),
  };
}

/**
 * Create synthesis rate recommendation
 *
 * @param {{actual: number, target: number, variance: number}} details - Validation details
 * @param {number} details.actual - Actual synthesis rate value
 * @param {number} details.target - Target synthesis rate value
 * @param {number} details.variance - Performance variance percentage
 * @returns {ValidationRecommendation} Synthesis rate recommendation
 */
function createSynthesisRateRecommendation(details: {
  actual: number;
  target: number;
  variance: number;
}): ValidationRecommendation {
  return {
    category: 'synthesis-rate',
    priority: 'high',
    message: 'Improve synthesis rate to meet target performance',
    currentValue: details.actual,
    targetValue: details.target,
    variance: details.variance,
  };
}

/**
 * Create response time recommendation
 *
 * @param {{actual: number, target: number, variance: number}} details - Validation details
 * @param {number} details.actual - Actual response time value
 * @param {number} details.target - Target response time value
 * @param {number} details.variance - Performance variance percentage
 * @returns {ValidationRecommendation} Response time recommendation
 */
function createResponseTimeRecommendation(details: {
  actual: number;
  target: number;
  variance: number;
}): ValidationRecommendation {
  return {
    category: 'response-time',
    priority: 'high',
    message: 'Reduce response time to meet target performance',
    currentValue: details.actual,
    targetValue: details.target,
    variance: details.variance,
  };
}

/**
 * Create memory usage recommendation
 *
 * @param {{actual: number, target: number, variance: number}} details - Validation details
 * @param {number} details.actual - Actual memory usage value
 * @param {number} details.target - Target memory usage value
 * @param {number} details.variance - Performance variance percentage
 * @returns {ValidationRecommendation} Memory usage recommendation
 */
function createMemoryUsageRecommendation(details: {
  actual: number;
  target: number;
  variance: number;
}): ValidationRecommendation {
  return {
    category: 'memory-usage',
    priority: 'medium',
    message: 'Optimize memory usage to meet target performance',
    currentValue: details.actual,
    targetValue: details.target,
    variance: details.variance,
  };
}

/**
 * Create quality recommendation
 *
 * @param {{actual: number, target: number, variance: number}} details - Validation details
 * @param {number} details.actual - Actual quality score value
 * @param {number} details.target - Target quality score value
 * @param {number} details.variance - Performance variance percentage
 * @returns {ValidationRecommendation} Quality recommendation
 */
function createQualityRecommendation(details: {
  actual: number;
  target: number;
  variance: number;
}): ValidationRecommendation {
  return {
    category: 'quality',
    priority: 'medium',
    message: 'Improve audio quality to meet target performance',
    currentValue: details.actual,
    targetValue: details.target,
    variance: details.variance,
  };
}

/**
 * Generate performance improvement recommendations
 *
 * @param {PerformanceValidationResult} validation - Validation result
 * @returns {ValidationRecommendation[]} List of recommendations
 */
export function generateRecommendations(
  validation: PerformanceValidationResult
): ValidationRecommendation[] {
  const recommendations: ValidationRecommendation[] = [];

  if (!validation.synthesisRate) {
    recommendations.push(
      createSynthesisRateRecommendation(validation.details.synthesisRate)
    );
  }

  if (!validation.responseTime) {
    recommendations.push(
      createResponseTimeRecommendation(validation.details.responseTime)
    );
  }

  if (!validation.memoryUsage) {
    recommendations.push(
      createMemoryUsageRecommendation(validation.details.memoryUsage)
    );
  }

  if (!validation.quality) {
    recommendations.push(
      createQualityRecommendation(validation.details.quality)
    );
  }

  return recommendations;
}

/**
 * Calculate overall performance score
 *
 * @param {PerformanceValidationResult} validation - Validation result
 * @returns {number} Overall performance score (0-100)
 */
export function calculateOverallScore(
  validation: PerformanceValidationResult
): number {
  const scores = [
    validation.synthesisRate ? 1 : 0,
    validation.responseTime ? 1 : 0,
    validation.memoryUsage ? 1 : 0,
    validation.quality ? 1 : 0,
  ];

  const averageScore =
    scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return averageScore * PERCENTAGE_MULTIPLIER;
}
