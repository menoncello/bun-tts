/**
 * Performance alert evaluation utilities
 * Extracted from performance-monitor.ts to reduce method complexity
 */

import { buildAlert } from './performance-alert-utils.js';
import type { SynthesisMetrics } from './performance-calculations.js';
import type { PerformanceThresholds } from './performance-targets.js';
import type { PerformanceAlert } from './performance-types.js';

// Constants
const DECIMAL_PLACES = 2;

/**
 * Check synthesis rate alert
 *
 * @param {string} adapterName - Name of the adapter
 * @param {SynthesisMetrics} metrics - Performance metrics
 * @param {PerformanceThresholds} thresholds - Performance thresholds
 * @returns {PerformanceAlert | undefined} Alert if threshold exceeded
 */
export function checkSynthesisRateAlert(
  adapterName: string,
  metrics: SynthesisMetrics,
  thresholds: PerformanceThresholds
): PerformanceAlert | undefined {
  if (metrics.synthesisRate < thresholds.synthesisRate.min) {
    return buildAlert(adapterName, 'warning', {
      metric: 'synthesis-rate',
      value: metrics.synthesisRate,
      thresholdValue: thresholds.synthesisRate.min,
      message: `Synthesis rate ${metrics.synthesisRate.toFixed(DECIMAL_PLACES)} wps below threshold ${thresholds.synthesisRate.min} wps`,
      recommendations: [
        'Check system resources (CPU, memory)',
        'Verify TTS engine health',
        'Consider reducing concurrent requests',
      ],
    });
  }
  return undefined;
}

/**
 * Check response time alert
 *
 * @param {string} adapterName - Name of the adapter
 * @param {SynthesisMetrics} metrics - Performance metrics
 * @param {PerformanceThresholds} thresholds - Performance thresholds
 * @returns {PerformanceAlert | undefined} Alert if threshold exceeded
 */
export function checkResponseTimeAlert(
  adapterName: string,
  metrics: SynthesisMetrics,
  thresholds: PerformanceThresholds
): PerformanceAlert | undefined {
  if (metrics.responseTimeMs > thresholds.responseTime.max) {
    return buildAlert(adapterName, 'critical', {
      metric: 'response-time',
      value: metrics.responseTimeMs,
      thresholdValue: thresholds.responseTime.max,
      message: `Response time ${metrics.responseTimeMs}ms above threshold ${thresholds.responseTime.max}ms`,
      recommendations: [
        'Check network connectivity',
        'Verify TTS engine availability',
        'Monitor system load',
      ],
    });
  }
  return undefined;
}

/**
 * Check memory usage alert
 *
 * @param {string} adapterName - Name of the adapter
 * @param {SynthesisMetrics} metrics - Performance metrics
 * @param {PerformanceThresholds} thresholds - Performance thresholds
 * @returns {PerformanceAlert | undefined} Alert if threshold exceeded
 */
export function checkMemoryUsageAlert(
  adapterName: string,
  metrics: SynthesisMetrics,
  thresholds: PerformanceThresholds
): PerformanceAlert | undefined {
  if (metrics.memoryUsageMB > thresholds.memoryUsage.max) {
    return buildAlert(adapterName, 'critical', {
      metric: 'memory-usage',
      value: metrics.memoryUsageMB,
      thresholdValue: thresholds.memoryUsage.max,
      message: `Memory usage ${metrics.memoryUsageMB}MB above threshold ${thresholds.memoryUsage.max}MB`,
      recommendations: [
        'Monitor for memory leaks',
        'Reduce concurrent request limit',
        'Check for large text processing',
      ],
    });
  }
  return undefined;
}

/**
 * Check error rate alert
 *
 * @param {string} adapterName - Name of the adapter
 * @param {SynthesisMetrics} metrics - Performance metrics
 * @param {PerformanceThresholds} thresholds - Performance thresholds
 * @returns {PerformanceAlert | undefined} Alert if threshold exceeded
 */
export function checkErrorRateAlert(
  adapterName: string,
  metrics: SynthesisMetrics,
  thresholds: PerformanceThresholds
): PerformanceAlert | undefined {
  if (metrics.errorRate > thresholds.errorRate.max) {
    return buildAlert(adapterName, 'critical', {
      metric: 'error-rate',
      value: metrics.errorRate,
      thresholdValue: thresholds.errorRate.max,
      message: `Error rate ${metrics.errorRate}% above threshold ${thresholds.errorRate.max}%`,
      recommendations: [
        'Check TTS engine status',
        'Verify input format and content',
        'Review adapter configuration',
      ],
    });
  }
  return undefined;
}

/**
 * Evaluate all metrics and return the highest priority alert
 *
 * @param {string} adapterName - Name of the adapter
 * @param {SynthesisMetrics} metrics - Performance metrics to evaluate
 * @param {PerformanceThresholds} thresholds - Performance thresholds
 * @returns {PerformanceAlert | undefined} Alert if thresholds are exceeded
 */
export function evaluateMetricsForAlerts(
  adapterName: string,
  metrics: SynthesisMetrics,
  thresholds: PerformanceThresholds
): PerformanceAlert | undefined {
  const alerts: Array<PerformanceAlert | undefined> = [
    checkSynthesisRateAlert(adapterName, metrics, thresholds),
    checkResponseTimeAlert(adapterName, metrics, thresholds),
    checkMemoryUsageAlert(adapterName, metrics, thresholds),
    checkErrorRateAlert(adapterName, metrics, thresholds),
  ];

  // Return the first non-undefined alert (highest priority)
  return alerts.find((alert) => alert !== undefined);
}
