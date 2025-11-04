/**
 * Performance Targets Configuration for TTS Adapter System (Optimized)
 * Defines performance thresholds and monitoring targets based on tech spec requirements
 * Optimized to meet <300 lines requirement
 */

import {
  assessPerformance,
  calculateSynthesisRate,
  type NormalizedMetrics,
  type PerformanceAssessmentResult,
} from './performance-assessment.js';
import {
  meetsPerformanceTargets,
  validatePerformance,
  type PerformanceValidationResult,
} from './performance-validation.js';

// Performance constants
const MIN_SYNTHESIS_RATE = 8,
  TARGET_SYNTHESIS_RATE = 10,
  EXCELLENT_SYNTHESIS_RATE = 15;
// Memory multipliers
const SHORT_TEXT_MEMORY_MULTIPLIER = 0.5,
  LONG_TEXT_MEMORY_MULTIPLIER = 1.5;
// Quality adjustments
const QUALITY_ADJUSTMENT = 0.1;
// Memory usage target
const MEMORY_USAGE_TARGET_MULTIPLIER = 0.8;
// Performance validation constants
const MIN_SYNTHESIS_ALLOWED = 1,
  MAX_SYNTHESIS_ALLOWED = 100;
const MIN_RESPONSE_ALLOWED = 100,
  MAX_RESPONSE_ALLOWED = 60000;
const MAX_RESPONSE_TIME_SHORT = 1500,
  MAX_RESPONSE_TIME_MEDIUM = 3000,
  MAX_RESPONSE_TIME_LONG = 10000;
const MAX_MEMORY_PER_REQUEST = 100,
  MAX_INIT_MEMORY = 200,
  MEMORY_LEAK_THRESHOLD = 50;
const MIN_CONCURRENT = 5,
  TARGET_CONCURRENT = 10,
  MAX_CONCURRENT = 50;
const AVAILABILITY_TARGET = 99.5,
  MAX_ERROR_RATE = 0.5,
  MAX_TIMEOUT_RATE = 0.1;
const MIN_OVERALL_QUALITY = 0.7,
  MIN_NATURALNESS = 0.6,
  MIN_CLARITY = 0.7;
const MAX_CPU_PER_REQUEST = 80,
  MAX_INIT_TIME = 5000,
  MAX_SHUTDOWN_TIME = 1000;
const WARNING_SYNTHESIS_RATE = 6,
  WARNING_RESPONSE_TIME = 4000,
  WARNING_MEMORY_USAGE = 150,
  WARNING_ERROR_RATE = 1.0;

// Text length categories
const TEXT_LENGTH_CATEGORIES = { short: 50, medium: 200, long: 1000 } as const;

export type TextLengthCategories = typeof TEXT_LENGTH_CATEGORIES;

// Core interfaces
export interface PerformanceTargets {
  synthesis: Record<keyof TextLengthCategories, number>;
  maxResponseTime: Record<keyof TextLengthCategories, number>;
  maxMemoryUsage: Record<keyof TextLengthCategories, number>;
  minQuality: Record<keyof TextLengthCategories, number>;
  concurrency: { min: number; target: number; max: number };
  availability: {
    target: number;
    maxErrorRate: number;
    maxTimeoutRate: number;
  };
  quality: { overall: number; naturalness: number; clarity: number };
  resources: {
    maxCpuPerRequest: number;
    maxInitMemory: number;
    memoryLeakThreshold: number;
  };
  timing: { maxInitTime: number; maxShutdownTime: number };
}

export interface PerformanceThresholds {
  synthesisRate: { min: number; target: number; warning: number };
  responseTime: { max: number; target: number; warning: number };
  memoryUsage: { max: number; target: number; warning: number };
  errorRate: { max: number; warning: number };
  availability: { min: number; warning: number };
  critical: {
    synthesisRate: number;
    responseTime: number;
    memoryUsage: number;
    errorRate: number;
  };
  warning: {
    synthesisRate: number;
    responseTime: number;
    memoryUsage: number;
    errorRate: number;
  };
}

// Default targets
export const DEFAULT_PERFORMANCE_TARGETS: PerformanceTargets = {
  synthesis: {
    short: EXCELLENT_SYNTHESIS_RATE,
    medium: TARGET_SYNTHESIS_RATE,
    long: MIN_SYNTHESIS_RATE,
  },
  maxResponseTime: {
    short: MAX_RESPONSE_TIME_SHORT,
    medium: MAX_RESPONSE_TIME_MEDIUM,
    long: MAX_RESPONSE_TIME_LONG,
  },
  maxMemoryUsage: {
    short: MAX_MEMORY_PER_REQUEST * SHORT_TEXT_MEMORY_MULTIPLIER,
    medium: MAX_MEMORY_PER_REQUEST,
    long: MAX_MEMORY_PER_REQUEST * LONG_TEXT_MEMORY_MULTIPLIER,
  },
  minQuality: {
    short: MIN_OVERALL_QUALITY + QUALITY_ADJUSTMENT,
    medium: MIN_OVERALL_QUALITY,
    long: MIN_OVERALL_QUALITY - QUALITY_ADJUSTMENT,
  },
  concurrency: {
    min: MIN_CONCURRENT,
    target: TARGET_CONCURRENT,
    max: MAX_CONCURRENT,
  },
  availability: {
    target: AVAILABILITY_TARGET,
    maxErrorRate: MAX_ERROR_RATE,
    maxTimeoutRate: MAX_TIMEOUT_RATE,
  },
  quality: {
    overall: MIN_OVERALL_QUALITY,
    naturalness: MIN_NATURALNESS,
    clarity: MIN_CLARITY,
  },
  resources: {
    maxCpuPerRequest: MAX_CPU_PER_REQUEST,
    maxInitMemory: MAX_INIT_MEMORY,
    memoryLeakThreshold: MEMORY_LEAK_THRESHOLD,
  },
  timing: { maxInitTime: MAX_INIT_TIME, maxShutdownTime: MAX_SHUTDOWN_TIME },
};

export const DEFAULT_PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  synthesisRate: {
    min: MIN_SYNTHESIS_RATE,
    target: TARGET_SYNTHESIS_RATE,
    warning: WARNING_SYNTHESIS_RATE,
  },
  responseTime: {
    max: MAX_RESPONSE_TIME_MEDIUM,
    target: MAX_RESPONSE_TIME_SHORT,
    warning: WARNING_RESPONSE_TIME,
  },
  memoryUsage: {
    max: MAX_MEMORY_PER_REQUEST,
    target: MAX_MEMORY_PER_REQUEST * MEMORY_USAGE_TARGET_MULTIPLIER,
    warning: WARNING_MEMORY_USAGE,
  },
  errorRate: { max: MAX_ERROR_RATE, warning: WARNING_ERROR_RATE },
  availability: {
    min: AVAILABILITY_TARGET,
    warning: AVAILABILITY_TARGET - 1.0,
  },
  critical: {
    synthesisRate: MIN_SYNTHESIS_RATE,
    responseTime: MAX_RESPONSE_TIME_MEDIUM,
    memoryUsage: MAX_MEMORY_PER_REQUEST,
    errorRate: MAX_ERROR_RATE,
  },
  warning: {
    synthesisRate: WARNING_SYNTHESIS_RATE,
    responseTime: WARNING_RESPONSE_TIME,
    memoryUsage: WARNING_MEMORY_USAGE,
    errorRate: WARNING_ERROR_RATE,
  },
};

/**
 * Performance calculator utility class
 */
export class PerformanceCalculator {
  /**
   * Calculate synthesis rate in words per second
   *
   * @param {number} wordCount - Number of words in the text
   * @param {number} synthesisTimeMs - Time taken for synthesis in milliseconds
   * @returns {number} Synthesis rate in words per second
   */
  static calculateSynthesisRate(
    wordCount: number,
    synthesisTimeMs: number
  ): number {
    return calculateSynthesisRate(wordCount, synthesisTimeMs);
  }

  /**
   * Get alert level based on performance metrics and thresholds
   *
   * @param {object} metrics - Performance metrics to evaluate
   * @param {number} metrics.synthesisRate - Synthesis rate in words per second
   * @param {number} metrics.responseTimeMs - Response time in milliseconds
   * @param {number} metrics.memoryUsageMB - Memory usage in megabytes
   * @param {number} metrics.errorRate - Error rate as percentage
   * @param {PerformanceThresholds} thresholds - Performance thresholds to compare against
   * @returns {AlertLevel} Alert level (normal, warning, or critical)
   */
  static getAlertLevel(
    metrics: {
      synthesisRate: number;
      responseTimeMs: number;
      memoryUsageMB: number;
      errorRate: number;
    },
    thresholds: PerformanceThresholds
  ): 'normal' | 'warning' | 'critical' {
    // Check if any metric exceeds critical thresholds
    if (
      metrics.synthesisRate < thresholds.synthesisRate.min ||
      metrics.responseTimeMs > thresholds.responseTime.max ||
      metrics.memoryUsageMB > thresholds.memoryUsage.max ||
      metrics.errorRate > thresholds.errorRate.max
    ) {
      return 'critical';
    }

    // Check if any metric exceeds warning thresholds
    if (
      metrics.synthesisRate < thresholds.synthesisRate.warning ||
      metrics.responseTimeMs > thresholds.responseTime.warning ||
      metrics.memoryUsageMB > thresholds.memoryUsage.warning ||
      metrics.errorRate > thresholds.errorRate.warning
    ) {
      return 'warning';
    }

    return 'normal';
  }

  /**
   * Assess performance metrics against targets
   *
   * @param {NormalizedMetrics} metrics - Normalized performance metrics to assess
   * @param {PerformanceTargets} targets - Performance targets to compare against
   * @returns {PerformanceAssessmentResult} Performance assessment result with detailed analysis
   */
  static assessPerformance(
    metrics: NormalizedMetrics,
    targets: PerformanceTargets
  ): PerformanceAssessmentResult {
    return assessPerformance(metrics, targets);
  }

  /**
   * Check if performance assessment meets all targets
   *
   * @param {PerformanceAssessmentResult} assessment - Performance assessment result to check
   * @returns {boolean} Whether all performance targets are met
   */
  static meetsPerformanceTargets(
    assessment: PerformanceAssessmentResult
  ): boolean {
    return meetsPerformanceTargets(assessment);
  }

  /**
   * Validate performance metrics against targets with detailed validation
   *
   * @param {NormalizedMetrics} metrics - Normalized performance metrics to validate
   * @param {PerformanceTargets} targets - Performance targets to validate against
   * @returns {PerformanceValidationResult} Detailed validation result with specific failures
   */
  static validatePerformance(
    metrics: NormalizedMetrics,
    targets: PerformanceTargets
  ): PerformanceValidationResult {
    return validatePerformance(metrics, targets);
  }
}

/**
 * Get text length category based on word count
 *
 * @param {number} wordCount - Number of words in the text
 * @returns {keyof TextLengthCategories} Text length category (short, medium, or long)
 */
export function getTextLengthCategory(
  wordCount: number
): keyof TextLengthCategories {
  if (wordCount <= TEXT_LENGTH_CATEGORIES.short) return 'short';
  if (wordCount <= TEXT_LENGTH_CATEGORIES.medium) return 'medium';
  return 'long';
}

/**
 * Check if targets are realistic and achievable
 *
 * @param {PerformanceTargets} targets - Performance targets to validate
 * @returns {boolean} Whether the targets are within acceptable ranges
 */
export function validateTargets(targets: PerformanceTargets): boolean {
  const synthesisValues = Object.values(targets.synthesis);
  const minSynthesis = Math.min(...synthesisValues);
  const maxSynthesis = Math.max(...synthesisValues);

  const responseTimeValues = Object.values(targets.maxResponseTime);
  const minResponse = Math.min(...responseTimeValues);
  const maxResponse = Math.max(...responseTimeValues);

  const qualityValues = Object.values(targets.minQuality);
  const minQuality = Math.min(...qualityValues);
  const maxQuality = Math.max(...qualityValues);

  return (
    minSynthesis >= MIN_SYNTHESIS_ALLOWED &&
    maxSynthesis <= MAX_SYNTHESIS_ALLOWED &&
    minResponse >= MIN_RESPONSE_ALLOWED &&
    maxResponse <= MAX_RESPONSE_ALLOWED &&
    minQuality >= 0 &&
    maxQuality <= 1
  );
}
