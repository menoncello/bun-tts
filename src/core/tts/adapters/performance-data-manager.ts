/**
 * Performance data management utilities
 * Extracted from performance-monitor.ts to reduce file size and improve organization
 */

import type { SynthesisMetrics } from './performance-calculations.js';
import type { PerformanceSnapshot } from './performance-types.js';

// Constants
const DEFAULT_RETENTION_HOURS = 24;
const ALERT_COOLDOWN_MS = 60000; // 1 minute cooldown
const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const PERCENTAGE_MULTIPLIER = 100;
const ERROR_RATE_UNHEALTHY = 100;

/**
 * Interface for adapter performance data
 */
export interface AdapterPerformanceData {
  requestCount: number;
  successCount: number;
  totalSynthesisTime: number;
  totalWords: number;
  totalMemoryUsage: number;
  lastAlertTime: number;
}

/**
 * Interface for performance statistics
 */
export interface PerformanceStatistics {
  averageSynthesisRate: number;
  averageResponseTime: number;
  averageMemoryUsage: number;
  errorRate: number;
  totalRequests: number;
  successRate: number;
}

/**
 * Get or create performance data entry for adapter
 *
 * @param {Map<string, AdapterPerformanceData>} performanceData - Performance data map
 * @param {string} adapterName - Name of the adapter
 * @returns {AdapterPerformanceData} Performance data entry
 */
export function getOrCreatePerformanceData(
  performanceData: Map<string, AdapterPerformanceData>,
  adapterName: string
): AdapterPerformanceData {
  return (
    performanceData.get(adapterName) || {
      requestCount: 0,
      successCount: 0,
      totalSynthesisTime: 0,
      totalWords: 0,
      totalMemoryUsage: 0,
      lastAlertTime: 0,
    }
  );
}

/**
 * Update performance data with new metrics
 *
 * @param {AdapterPerformanceData} currentData - Current performance data
 * @param {SynthesisMetrics} metrics - New synthesis metrics
 * @returns {AdapterPerformanceData} Updated performance data
 */
export function updatePerformanceData(
  currentData: AdapterPerformanceData,
  metrics: SynthesisMetrics
): AdapterPerformanceData {
  return {
    ...currentData,
    requestCount: currentData.requestCount + 1,
    successCount: currentData.successCount + (metrics.success ? 1 : 0),
    totalSynthesisTime: currentData.totalSynthesisTime + metrics.synthesisTime,
    totalWords: currentData.totalWords + metrics.wordCount,
    totalMemoryUsage: currentData.totalMemoryUsage + metrics.memoryUsageMB,
  };
}

/**
 * Calculate performance statistics from accumulated data
 *
 * @param {AdapterPerformanceData} data - Performance data
 * @returns {PerformanceStatistics} Calculated statistics
 */
export function calculateStatistics(
  data: AdapterPerformanceData
): PerformanceStatistics {
  const averageSynthesisRate =
    data.totalSynthesisTime > 0
      ? (data.totalWords / data.totalSynthesisTime) * MS_PER_SECOND
      : 0;
  const averageResponseTime =
    data.requestCount > 0 ? data.totalSynthesisTime / data.requestCount : 0;
  const averageMemoryUsage =
    data.requestCount > 0 ? data.totalMemoryUsage / data.requestCount : 0;
  const errorRate =
    data.requestCount > 0
      ? ((data.requestCount - data.successCount) / data.requestCount) *
        PERCENTAGE_MULTIPLIER
      : 0;
  const successRate =
    data.requestCount > 0
      ? (data.successCount / data.requestCount) * PERCENTAGE_MULTIPLIER
      : 0;

  return {
    averageSynthesisRate,
    averageResponseTime,
    averageMemoryUsage,
    errorRate,
    totalRequests: data.requestCount,
    successRate,
  };
}

/**
 * Check if alert should be sent based on cooldown
 *
 * @param {AdapterPerformanceData} currentData - Current performance data
 * @param {Date} now - Current timestamp
 * @returns {boolean} Whether alert should be sent
 */
export function shouldSendAlert(
  currentData: AdapterPerformanceData,
  now: Date
): boolean {
  return now.getTime() - currentData.lastAlertTime > ALERT_COOLDOWN_MS;
}

/**
 * Update last alert time for adapter
 *
 * @param {Map<string, AdapterPerformanceData>} performanceData - Performance data map
 * @param {string} adapterName - Name of the adapter
 * @param {Date} now - Current timestamp
 */
export function updateLastAlertTime(
  performanceData: Map<string, AdapterPerformanceData>,
  adapterName: string,
  now: Date
): void {
  const currentData = performanceData.get(adapterName);
  if (currentData) {
    currentData.lastAlertTime = now.getTime();
    performanceData.set(adapterName, currentData);
  }
}

/**
 * Clean up old snapshots based on retention policy
 *
 * @param {PerformanceSnapshot[]} snapshots - Array of snapshots
 * @param {number} retentionHours - Hours to retain snapshots
 * @returns {PerformanceSnapshot[]} Cleaned snapshots
 */
export function cleanupOldSnapshots(
  snapshots: PerformanceSnapshot[],
  retentionHours: number = DEFAULT_RETENTION_HOURS
): PerformanceSnapshot[] {
  const cutoffTime =
    Date.now() -
    retentionHours * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND;
  return snapshots.filter(
    (snapshot) => snapshot.timestamp.getTime() > cutoffTime
  );
}

/**
 * Check if performance is healthy based on error rate
 *
 * @param {number} errorRate - Current error rate
 * @returns {boolean} Whether performance is healthy
 */
export function isPerformanceHealthy(errorRate: number): boolean {
  return errorRate < ERROR_RATE_UNHEALTHY;
}
