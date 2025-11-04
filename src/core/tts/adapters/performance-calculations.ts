/**
 * Performance calculation utilities for TTS adapters
 * Extracted from performance-monitor.ts to reduce method complexity
 */

import { PerformanceCalculator } from './performance-targets.js';
import type { TTSResponse } from './types.js';

// Constants
const PERCENTAGE_MULTIPLIER = 100;

/**
 * Interface for synthesis request parameters
 */
export interface SynthesisRequest {
  text: string;
  options?: Record<string, unknown>;
}

/**
 * Interface for calculated synthesis metrics
 */
export interface SynthesisMetrics {
  synthesisRate: number;
  responseTimeMs: number;
  memoryUsageMB: number;
  errorRate: number;
  wordCount: number;
  synthesisTime: number;
  success: boolean;
}

/**
 * Extracts memory usage from TTS response
 *
 * @param {TTSResponse} response - TTS response data
 * @returns {number} Memory usage in MB
 */
export function extractMemoryUsage(response: TTSResponse): number {
  if (response.metadata?.memoryUsage) {
    return Number(response.metadata.memoryUsage) || 0;
  }
  return 0;
}

/**
 * Calculates word count from text
 *
 * @param {string} text - Input text
 * @returns {number} Word count
 */
export function calculateWordCount(text: string): number {
  return text.split(' ').length;
}

/**
 * Calculates synthesis time metrics
 *
 * @param {number} startTime - Start time in milliseconds
 * @param {number} endTime - End time in milliseconds
 * @returns {object} Time-related metrics
 */
export function calculateTimeMetrics(
  startTime: number,
  endTime: number
): {
  synthesisTime: number;
  responseTimeMs: number;
} {
  const synthesisTime = endTime - startTime;
  return {
    synthesisTime,
    responseTimeMs: synthesisTime,
  };
}

/**
 * Calculates success and error metrics
 *
 * @param {boolean} success - Whether synthesis succeeded
 * @returns {object} Success-related metrics
 */
export function calculateSuccessMetrics(success: boolean): {
  errorRate: number;
  success: boolean;
} {
  return {
    errorRate: success ? 0 : PERCENTAGE_MULTIPLIER,
    success,
  };
}

/**
 * Calculates complete synthesis metrics
 *
 * @param {SynthesisRequest} request - Synthesis request
 * @param {TTSResponse} response - TTS response
 * @param {number} startTime - Start time of synthesis
 * @returns {SynthesisMetrics} Complete metrics
 */
export function calculateSynthesisMetrics(
  request: SynthesisRequest,
  response: TTSResponse,
  startTime: number
): SynthesisMetrics {
  const endTime = Date.now();
  const wordCount = calculateWordCount(request.text);
  const success = response.success;
  const memoryUsage = extractMemoryUsage(response);
  const timeMetrics = calculateTimeMetrics(startTime, endTime);
  const successMetrics = calculateSuccessMetrics(success);

  return {
    synthesisRate: PerformanceCalculator.calculateSynthesisRate(
      wordCount,
      timeMetrics.synthesisTime
    ),
    responseTimeMs: timeMetrics.responseTimeMs,
    memoryUsageMB: memoryUsage,
    errorRate: successMetrics.errorRate,
    wordCount,
    synthesisTime: timeMetrics.synthesisTime,
    success: successMetrics.success,
  };
}
