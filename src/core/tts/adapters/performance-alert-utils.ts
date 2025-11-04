/**
 * Performance Alert Utilities for TTS Adapter System
 * Provides helper functions for creating and managing performance alerts
 */

import type { PerformanceAlert, AlertLevel } from './performance-types.js';

// Type interfaces for cleaner function signatures
interface Metrics {
  synthesisRate: number;
  responseTimeMs: number;
  memoryUsageMB: number;
  errorRate: number;
}

interface Threshold {
  synthesisRate: number;
  responseTime: number;
  memoryUsage: number;
  errorRate: number;
}

interface AlertDetails {
  metric: string;
  value: number;
  thresholdValue: number;
  message: string;
  recommendations: string[];
}

/**
 * Alert recommendations for different metric types
 */
const ALERT_RECOMMENDATIONS = {
  synthesis_rate: [
    'Check system resources (CPU, memory)',
    'Verify TTS engine health',
    'Consider reducing concurrent requests',
  ],
  response_time: [
    'Check network connectivity',
    'Verify TTS engine availability',
    'Monitor system load',
  ],
  memory_usage: [
    'Monitor for memory leaks',
    'Reduce concurrent request limit',
    'Check for large text processing',
  ],
  error_rate: [
    'Check TTS engine status',
    'Verify input format and content',
    'Review adapter configuration',
  ],
} as const;

/**
 * Determine the primary metric causing the alert
 * @param {Metrics} metrics - Performance metrics
 * @param {Threshold} threshold - Performance threshold to compare against
 * @returns {AlertDetails} Alert details including metric, value, and recommendations
 */
export function determineAlertCause(
  metrics: Metrics,
  threshold: Threshold
): AlertDetails {
  if (isSynthesisRateAlert(metrics, threshold)) {
    return createSynthesisRateAlert(metrics, threshold);
  }
  if (isResponseTimeAlert(metrics, threshold)) {
    return createResponseTimeAlert(metrics, threshold);
  }
  if (isMemoryUsageAlert(metrics, threshold)) {
    return createMemoryUsageAlert(metrics, threshold);
  }
  return createErrorRateAlert(metrics, threshold);
}

/**
 * Check if synthesis rate is causing an alert
 * @param {Metrics} metrics - Performance metrics
 * @param {Threshold} threshold - Performance threshold
 * @returns {boolean} True if synthesis rate is below threshold
 */
function isSynthesisRateAlert(metrics: Metrics, threshold: Threshold): boolean {
  return metrics.synthesisRate < threshold.synthesisRate;
}

/**
 * Check if response time is causing an alert
 * @param {Metrics} metrics - Performance metrics
 * @param {Threshold} threshold - Performance threshold
 * @returns {boolean} True if response time exceeds threshold
 */
function isResponseTimeAlert(metrics: Metrics, threshold: Threshold): boolean {
  return metrics.responseTimeMs > threshold.responseTime;
}

/**
 * Check if memory usage is causing an alert
 * @param {Metrics} metrics - Performance metrics
 * @param {Threshold} threshold - Performance threshold
 * @returns {boolean} True if memory usage exceeds threshold
 */
function isMemoryUsageAlert(metrics: Metrics, threshold: Threshold): boolean {
  return metrics.memoryUsageMB > threshold.memoryUsage;
}

/**
 * Create synthesis rate alert details
 * @param {Metrics} metrics - Performance metrics
 * @param {Threshold} threshold - Performance threshold
 * @returns {AlertDetails} Alert details for synthesis rate
 */
function createSynthesisRateAlert(
  metrics: Metrics,
  threshold: Threshold
): AlertDetails {
  return {
    metric: 'synthesis_rate',
    value: metrics.synthesisRate,
    thresholdValue: threshold.synthesisRate,
    message: 'Synthesis rate below threshold',
    recommendations: [...ALERT_RECOMMENDATIONS.synthesis_rate],
  };
}

/**
 * Create response time alert details
 * @param {Metrics} metrics - Performance metrics
 * @param {Threshold} threshold - Performance threshold
 * @returns {AlertDetails} Alert details for response time
 */
function createResponseTimeAlert(
  metrics: Metrics,
  threshold: Threshold
): AlertDetails {
  return {
    metric: 'response_time',
    value: metrics.responseTimeMs,
    thresholdValue: threshold.responseTime,
    message: 'Response time exceeds threshold',
    recommendations: [...ALERT_RECOMMENDATIONS.response_time],
  };
}

/**
 * Create memory usage alert details
 * @param {Metrics} metrics - Performance metrics
 * @param {Threshold} threshold - Performance threshold
 * @returns {AlertDetails} Alert details for memory usage
 */
function createMemoryUsageAlert(
  metrics: Metrics,
  threshold: Threshold
): AlertDetails {
  return {
    metric: 'memory_usage',
    value: metrics.memoryUsageMB,
    thresholdValue: threshold.memoryUsage,
    message: 'Memory usage exceeds threshold',
    recommendations: [...ALERT_RECOMMENDATIONS.memory_usage],
  };
}

/**
 * Create error rate alert details
 * @param {Metrics} metrics - Performance metrics
 * @param {Threshold} threshold - Performance threshold
 * @returns {AlertDetails} Alert details for error rate
 */
function createErrorRateAlert(
  metrics: Metrics,
  threshold: Threshold
): AlertDetails {
  return {
    metric: 'error_rate',
    value: metrics.errorRate,
    thresholdValue: threshold.errorRate,
    message: 'Error rate exceeds threshold',
    recommendations: [...ALERT_RECOMMENDATIONS.error_rate],
  };
}

/**
 * Build alert object from details
 * @param {string} adapterName - Name of the adapter
 * @param {AlertLevel} level - Alert level
 * @param {object} alertDetails - Alert details
 * @param {string} alertDetails.metric - The metric that triggered the alert
 * @param {number} alertDetails.value - The actual value of the metric
 * @param {number} alertDetails.thresholdValue - The threshold value that was exceeded
 * @param {string} alertDetails.message - Alert message
 * @param {string[]} alertDetails.recommendations - Recommendations to fix the issue
 * @returns {PerformanceAlert} Formatted alert
 */
export function buildAlert(
  adapterName: string,
  level: AlertLevel,
  alertDetails: {
    metric: string;
    value: number;
    thresholdValue: number;
    message: string;
    recommendations: string[];
  }
): PerformanceAlert {
  return {
    id: `${adapterName}-${alertDetails.metric}-${Date.now()}`,
    timestamp: new Date(),
    level,
    metric: alertDetails.metric,
    value: alertDetails.value,
    threshold: alertDetails.thresholdValue,
    message: `${alertDetails.message} for adapter ${adapterName}`,
    adapter: adapterName,
    recommendations: alertDetails.recommendations,
  };
}
