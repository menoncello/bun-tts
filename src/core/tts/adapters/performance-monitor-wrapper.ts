/**
 * Extended Performance Monitor Wrapper
 * Provides both monitoring and assessment functionality
 */

import {
  assessPerformance,
  type NormalizedMetrics,
  type PerformanceAssessmentResult,
} from './performance-assessment.js';
import type { SynthesisRequest } from './performance-calculations.js';
import { PerformanceMonitor } from './performance-monitor.js';
import {
  DEFAULT_PERFORMANCE_TARGETS,
  type PerformanceTargets,
} from './performance-targets.js';
import type { TTSResponse } from './types.js';

// Constants
const DECIMAL_PLACES_PRECISION = 2;
const MS_PER_SECOND = 1000;
const SHORT_TEXT_THRESHOLD = 50;
const MEDIUM_TEXT_THRESHOLD = 200;

// Create a performance monitor instance that combines monitoring and assessment functionality
const performanceMonitor = new PerformanceMonitor();

/**
 * Determine text category based on word count
 * @param {number} wordCount - Number of words in the text
 * @returns {'short' | 'medium' | 'long'} Text category
 */
function determineTextCategory(wordCount: number): 'short' | 'medium' | 'long' {
  if (wordCount <= SHORT_TEXT_THRESHOLD) {
    return 'short';
  }
  if (wordCount <= MEDIUM_TEXT_THRESHOLD) {
    return 'medium';
  }
  return 'long';
}

/**
 * Create normalized metrics with text category
 * @param {object} metrics - Original performance metrics
 * @param {number} metrics.wordCount - Number of words
 * @param {number} metrics.synthesisTimeMs - Synthesis time in milliseconds
 * @param {number} metrics.memoryUsageMB - Memory usage in megabytes
 * @param {number} metrics.qualityScore - Quality score
 * @param {'short' | 'medium' | 'long'} textCategory - Text category
 * @returns {NormalizedMetrics} Normalized metrics with category
 */
function createNormalizedMetrics(
  metrics: {
    wordCount: number;
    synthesisTimeMs: number;
    memoryUsageMB: number;
    qualityScore: number;
  },
  textCategory: 'short' | 'medium' | 'long'
): NormalizedMetrics {
  return {
    ...metrics,
    textCategory,
  };
}

/**
 * Create performance assessment result with formatted details
 * @param {PerformanceAssessmentResult} assessment - Raw assessment from assessPerformance
 * @param {object} metrics - Original performance metrics
 * @param {number} metrics.memoryUsageMB - Memory usage in megabytes
 * @param {number} metrics.qualityScore - Quality score
 * @returns {object} Formatted performance assessment result
 */
function createPerformanceAssessmentResult(
  assessment: PerformanceAssessmentResult,
  metrics: {
    memoryUsageMB: number;
    qualityScore: number;
  }
): {
  meetsTargets: boolean;
  assessment: PerformanceAssessment;
} {
  return {
    meetsTargets: assessment.meetsAll,
    assessment: {
      meetsAll: assessment.meetsAll,
      synthesis: assessment.synthesis,
      responseTime: assessment.responseTime,
      memory: assessment.memory,
      quality: assessment.quality,
      synthesisRate: assessment.synthesisRate,
      maxResponseTime: assessment.maxResponseTime,
      details: [
        `Synthesis rate: ${assessment.synthesisRate.toFixed(DECIMAL_PLACES_PRECISION)} words/sec (target: varies by text length)`,
        `Response time: ${(assessment.synthesisRate / MS_PER_SECOND).toFixed(DECIMAL_PLACES_PRECISION)}s (max: ${assessment.maxResponseTime}ms)`,
        `Memory usage: ${metrics.memoryUsageMB.toFixed(DECIMAL_PLACES_PRECISION)}MB`,
        `Quality score: ${metrics.qualityScore.toFixed(DECIMAL_PLACES_PRECISION)}`,
      ],
    },
  };
}

// Helper interfaces for better type safety
interface PerformanceAssessment {
  meetsAll: boolean;
  synthesis: boolean;
  responseTime: boolean;
  memory: boolean;
  quality: boolean;
  synthesisRate: number;
  maxResponseTime: number;
  details: string[];
}

// Create an extended performance monitor wrapper that provides both monitoring and assessment functionality
const extendedPerformanceMonitor = {
  /**
   * Record synthesis metrics (delegates to PerformanceMonitor)
   * @param {string} adapterName - The name of the adapter being monitored
   * @param {SynthesisRequest} request - The synthesis request data
   * @param {TTSResponse} response - The TTS response data
   * @param {number} startTime - The start timestamp of the synthesis
   */
  recordSynthesisMetrics: (
    adapterName: string,
    request: SynthesisRequest,
    response: TTSResponse,
    startTime: number
  ): void => {
    performanceMonitor.recordSynthesisMetrics(
      adapterName,
      request,
      response,
      startTime
    );
  },

  /**
   * Check performance targets for a given adapter and metrics
   * @param {string} adapterName - The name of the adapter
   * @param {object} metrics - Performance metrics object
   * @param {number} metrics.wordCount - Number of words in the text
   * @param {number} metrics.synthesisTimeMs - Synthesis time in milliseconds
   * @param {number} metrics.memoryUsageMB - Memory usage in megabytes
   * @param {number} metrics.qualityScore - Quality score from 0 to 1
   * @returns {{meetsTargets: boolean, assessment: PerformanceAssessmentResult}} Performance assessment result
   */
  checkPerformanceTargets(
    adapterName: string,
    metrics: {
      wordCount: number;
      synthesisTimeMs: number;
      memoryUsageMB: number;
      qualityScore: number;
    }
  ): {
    meetsTargets: boolean;
    assessment: PerformanceAssessment;
  } {
    const textCategory = determineTextCategory(metrics.wordCount);
    const normalizedMetrics = createNormalizedMetrics(metrics, textCategory);
    const assessment = assessPerformance(
      normalizedMetrics,
      DEFAULT_PERFORMANCE_TARGETS
    );

    return createPerformanceAssessmentResult(assessment, metrics);
  },

  /**
   * Get performance statistics for a specific adapter
   * @param {string} adapterName - The name of the adapter
   * @returns {object | undefined} Performance statistics for the adapter
   */
  getStatistics: (adapterName: string): object | undefined =>
    performanceMonitor.getStatistics(adapterName),

  /**
   * Get performance statistics for all adapters
   * @returns {object} Performance statistics for all adapters
   */
  getAllStatistics: (): object => performanceMonitor.getAllStatistics(),

  /**
   * Get recent performance alerts
   * @param {number} [limit] - Maximum number of alerts to return
   * @returns {object[]} Array of recent performance alerts
   */
  getRecentAlerts: (limit?: number): object[] =>
    performanceMonitor.getRecentAlerts(limit),

  /**
   * Get recent performance snapshots
   * @param {number} [limit] - Maximum number of snapshots to return
   * @returns {object[]} Array of recent performance snapshots
   */
  getRecentSnapshots: (limit?: number): object[] =>
    performanceMonitor.getRecentSnapshots(limit),

  /**
   * Start performance monitoring
   * @returns {void}
   */
  startMonitoring: (): void => performanceMonitor.startMonitoring(),

  /**
   * Stop performance monitoring
   * @returns {void}
   */
  stopMonitoring: (): void => performanceMonitor.stopMonitoring(),

  /**
   * Check if monitoring is currently active
   * @returns {boolean} Whether monitoring is active
   */
  isActive: (): boolean => performanceMonitor.isActive(),

  /**
   * Clear all performance monitoring data
   * @returns {void}
   */
  clearData: (): void => performanceMonitor.clearData(),

  /**
   * Get current performance targets
   * @returns {PerformanceTargets} Current performance targets
   */
  getTargets: (): PerformanceTargets => performanceMonitor.getTargets(),

  /**
   * Update performance targets
   * @param {PerformanceTargets} newTargets - New performance targets to set
   * @returns {void}
   */
  updateTargets: (newTargets: PerformanceTargets): void =>
    performanceMonitor.updateTargets(newTargets),
};

export { performanceMonitor, extendedPerformanceMonitor };
