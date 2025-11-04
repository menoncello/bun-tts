/**
 * Performance Monitoring Service for TTS Adapter System
 * Provides real-time performance tracking, alerting, and reporting
 */

import { determineAlertCause, buildAlert } from './performance-alert-utils.js';
import type { PerformanceAssessmentResult } from './performance-assessment.js';
import {
  calculateSynthesisMetrics,
  type SynthesisRequest,
  type SynthesisMetrics,
} from './performance-calculations.js';
import {
  DEFAULT_PERFORMANCE_TARGETS,
  DEFAULT_PERFORMANCE_THRESHOLDS,
  PerformanceCalculator,
  type PerformanceTargets,
  type PerformanceThresholds,
} from './performance-targets.js';
import type {
  PerformanceAlert,
  PerformanceSnapshot,
  AlertLevel,
} from './performance-types.js';
import type { TTSResponse, HealthCheckResult } from './types.js';

// Constants
const DEFAULT_RETENTION_HOURS = 24;
const ALERT_COOLDOWN_MS = 60000; // 1 minute cooldown
const PERCENTAGE_MULTIPLIER = 100;

// Quality score constants
const DEFAULT_QUALITY_SCORE = 0.8; // Default quality score when not provided

// Performance calculation constants
const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const ERROR_RATE_UNHEALTHY = 100;

/**
 * Interface for adapter performance data
 */
interface AdapterPerformanceData {
  requestCount: number;
  successCount: number;
  totalSynthesisTime: number;
  totalWords: number;
  totalMemoryUsage: number;
  lastAlertTime: number;
}

/**
 * Performance monitoring service
 */
export class PerformanceMonitor {
  private targets: PerformanceTargets;
  private thresholds: PerformanceThresholds;
  private alerts: PerformanceAlert[] = [];
  private snapshots: PerformanceSnapshot[] = [];
  private isMonitoring = false;

  // Performance tracking data
  private performanceData = new Map<string, AdapterPerformanceData>();

  /**
   * Creates a new performance monitor instance with default targets and thresholds
   */
  constructor() {
    this.targets = DEFAULT_PERFORMANCE_TARGETS;
    this.thresholds = DEFAULT_PERFORMANCE_THRESHOLDS;
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.cleanupOldData();
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
  }

  /**
   * Record TTS synthesis performance metrics
   * @param {string} adapterName - Name of the adapter
   * @param {object} request - TTS request data
   * @param {string} request.text - The text to synthesize
   * @param {Record<string, unknown>} [request.options] - Optional synthesis parameters
   * @param {TTSResponse} response - TTS response data
   * @param {number} startTime - Start time of synthesis
   */
  recordSynthesisMetrics(
    adapterName: string,
    request: SynthesisRequest,
    response: TTSResponse,
    startTime: number
  ): void {
    const synthesisMetrics = this.calculateSynthesisMetrics(
      request,
      response,
      startTime
    );
    const currentData = this.getOrCreatePerformanceData(adapterName);
    this.updatePerformanceData(currentData, synthesisMetrics);
    this.performanceData.set(adapterName, currentData);

    this.checkPerformanceAlerts(adapterName, synthesisMetrics);
  }

  /**
   * Calculate synthesis metrics from request and response
   * @param {SynthesisRequest} request - TTS request data
   * @param {TTSResponse} response - TTS response data
   * @param {number} startTime - Start time of synthesis
   * @returns {SynthesisMetrics} Calculated metrics
   */
  private calculateSynthesisMetrics(
    request: SynthesisRequest,
    response: TTSResponse,
    startTime: number
  ): SynthesisMetrics {
    return calculateSynthesisMetrics(request, response, startTime);
  }

  /**
   * Get or create performance data entry for adapter
   * @param {string} adapterName - Name of the adapter
   * @returns {object} Performance data entry
   */
  private getOrCreatePerformanceData(adapterName: string): {
    requestCount: number;
    successCount: number;
    totalSynthesisTime: number;
    totalWords: number;
    totalMemoryUsage: number;
    lastAlertTime: number;
  } {
    return (
      this.performanceData.get(adapterName) || {
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
   * @param {object} currentData - Current performance data
   * @param {number} currentData.requestCount - Total number of requests processed
   * @param {number} currentData.successCount - Number of successful requests
   * @param {number} currentData.totalSynthesisTime - Cumulative synthesis time in milliseconds
   * @param {number} currentData.totalWords - Total words processed
   * @param {number} currentData.totalMemoryUsage - Total memory usage in MB
   * @param {number} currentData.lastAlertTime - Timestamp of last alert
   * @param {object} metrics - New synthesis metrics
   * @param {number} metrics.synthesisRate - Synthesis rate in words per second
   * @param {number} metrics.responseTimeMs - Response time in milliseconds
   * @param {number} metrics.memoryUsageMB - Memory usage in megabytes
   * @param {number} metrics.errorRate - Error rate as percentage
   * @param {number} metrics.wordCount - Number of words in this request
   * @param {number} metrics.synthesisTime - Synthesis time for this request
   * @param {boolean} metrics.success - Whether the request was successful
   */
  private updatePerformanceData(
    currentData: {
      requestCount: number;
      successCount: number;
      totalSynthesisTime: number;
      totalWords: number;
      totalMemoryUsage: number;
      lastAlertTime: number;
    },
    metrics: {
      synthesisRate: number;
      responseTimeMs: number;
      memoryUsageMB: number;
      errorRate: number;
      wordCount: number;
      synthesisTime: number;
      success: boolean;
    }
  ): void {
    currentData.requestCount++;
    if (metrics.success) {
      currentData.successCount++;
    }
    currentData.totalSynthesisTime += metrics.synthesisTime;
    currentData.totalWords += metrics.wordCount;
    currentData.totalMemoryUsage += metrics.memoryUsageMB;
  }

  /**
   * Record adapter health check results
   * @param {string} adapterName - Name of the adapter
   * @param {HealthCheckResult} healthResult - Health check result
   */
  recordHealthCheck(
    adapterName: string,
    healthResult: HealthCheckResult
  ): void {
    // Check health-related performance alerts
    if (healthResult.responseTime > 0) {
      this.checkPerformanceAlerts(adapterName, {
        synthesisRate: 0, // Not applicable for health checks
        responseTimeMs: healthResult.responseTime,
        memoryUsageMB: 0,
        errorRate:
          healthResult.status === 'unhealthy' ? ERROR_RATE_UNHEALTHY : 0,
      });
    }
  }

  /**
   * Get current performance snapshot for an adapter
   * @param {string} adapterName - Name of the adapter
   * @returns {PerformanceSnapshot | null} Performance snapshot or null if no data available
   */
  getPerformanceSnapshot(adapterName: string): PerformanceSnapshot | null {
    const data = this.performanceData.get(adapterName);
    if (!data || data.requestCount === 0) {
      return null;
    }

    const avgSynthesisTime = data.totalSynthesisTime / data.requestCount;
    const avgSynthesisRate =
      data.totalWords / (data.totalSynthesisTime / MS_PER_SECOND);
    const avgMemoryUsage = data.totalMemoryUsage / data.requestCount;
    const errorRate =
      ((data.requestCount - data.successCount) / data.requestCount) *
      PERCENTAGE_MULTIPLIER;

    const metrics = {
      synthesisRate: avgSynthesisRate,
      responseTimeMs: avgSynthesisTime,
      memoryUsageMB: avgMemoryUsage,
      errorRate,
    };

    return {
      timestamp: new Date(),
      adapter: adapterName,
      synthesisRate: avgSynthesisRate,
      responseTime: avgSynthesisTime,
      memoryUsage: avgMemoryUsage,
      errorRate,
      totalRequests: data.requestCount,
      successfulRequests: data.successCount,
      alertLevel: PerformanceCalculator.getAlertLevel(metrics, this.thresholds),
    };
  }

  /**
   * Get performance snapshots for all adapters
   * @returns {PerformanceSnapshot[]} Array of performance snapshots
   */
  getAllPerformanceSnapshots(): PerformanceSnapshot[] {
    const snapshots: PerformanceSnapshot[] = [];
    const adapterNames = Array.from(this.performanceData.keys());
    for (const adapterName of adapterNames) {
      const snapshot = this.getPerformanceSnapshot(adapterName);
      if (snapshot) {
        snapshots.push(snapshot);
      }
    }
    return snapshots;
  }

  /**
   * Get recent performance alerts
   * @param {number} [hours=24] - Number of hours to look back
   * @returns {PerformanceAlert[]} Array of recent performance alerts
   */
  getRecentAlerts(hours = DEFAULT_RETENTION_HOURS): PerformanceAlert[] {
    const cutoffTime = new Date(
      Date.now() - hours * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND
    );
    return this.alerts.filter((alert) => alert.timestamp >= cutoffTime);
  }

  /**
   * Check performance against targets
   * @param {string} adapterName - Name of the adapter
   * @param {object} metrics - Performance metrics to check
   * @param {number} metrics.wordCount - Number of words processed
   * @param {number} metrics.synthesisTimeMs - Time taken for synthesis in milliseconds
   * @param {number} [metrics.memoryUsageMB] - Memory usage in megabytes
   * @param {number} [metrics.qualityScore] - Quality score of the synthesis
   * @returns {{meetsTargets: boolean, assessment: ReturnType<typeof PerformanceCalculator.meetsPerformanceTargets>}} Performance assessment
   */
  checkPerformanceTargets(
    adapterName: string,
    metrics: {
      wordCount: number;
      synthesisTimeMs: number;
      memoryUsageMB?: number;
      qualityScore?: number;
    }
  ): {
    meetsTargets: boolean;
    assessment: PerformanceAssessmentResult;
  } {
    // Convert metrics to NormalizedMetrics format for assessment
    const normalizedMetrics = {
      wordCount: metrics.wordCount,
      synthesisTimeMs: metrics.synthesisTimeMs,
      memoryUsageMB: metrics.memoryUsageMB || 0,
      qualityScore: metrics.qualityScore || DEFAULT_QUALITY_SCORE,
      textCategory: 'medium' as const, // Default text category
    };

    const assessmentResult = PerformanceCalculator.assessPerformance(
      normalizedMetrics,
      this.targets
    );

    return {
      meetsTargets: assessmentResult.meetsAll,
      assessment: assessmentResult,
    };
  }

  /**
   * Check performance alerts
   * @param {string} adapterName - Name of the adapter
   * @param {object} metrics - Current performance metrics
   * @param {number} metrics.synthesisRate - Current synthesis rate in words per second
   * @param {number} metrics.responseTimeMs - Current response time in milliseconds
   * @param {number} metrics.memoryUsageMB - Current memory usage in megabytes
   * @param {number} metrics.errorRate - Current error rate as percentage
   */
  private checkPerformanceAlerts(
    adapterName: string,
    metrics: {
      synthesisRate: number;
      responseTimeMs: number;
      memoryUsageMB: number;
      errorRate: number;
    }
  ): void {
    const alertLevel = PerformanceCalculator.getAlertLevel(
      metrics,
      this.thresholds
    );

    if (alertLevel !== 'normal') {
      const now = Date.now();
      const lastAlertTime =
        this.performanceData.get(adapterName)?.lastAlertTime || 0;

      // Rate limit alerts (avoid spamming every check)
      if (now - lastAlertTime > ALERT_COOLDOWN_MS) {
        this.createAlert(adapterName, alertLevel, metrics);

        // Update last alert time
        const data = this.performanceData.get(adapterName);
        if (data) {
          data.lastAlertTime = now;
        }
      }
    }
  }

  /**
   * Create performance alert
   * @param {string} adapterName - Name of the adapter
   * @param {AlertLevel} level - Alert level
   * @param {object} metrics - Performance metrics
   * @param {number} metrics.synthesisRate - Current synthesis rate in words per second
   * @param {number} metrics.responseTimeMs - Current response time in milliseconds
   * @param {number} metrics.memoryUsageMB - Current memory usage in megabytes
   * @param {number} metrics.errorRate - Current error rate as percentage
   */
  private createAlert(
    adapterName: string,
    level: AlertLevel,
    metrics: {
      synthesisRate: number;
      responseTimeMs: number;
      memoryUsageMB: number;
      errorRate: number;
    }
  ): void {
    const threshold =
      level === 'critical' ? this.thresholds.critical : this.thresholds.warning;

    const alertDetails = determineAlertCause(metrics, threshold);
    const alert = buildAlert(adapterName, level, alertDetails);

    this.addAlert(alert);
    this.cleanupOldAlerts();
  }

  /**
   * Add alert to the collection
   * @param {PerformanceAlert} alert - Alert to add
   */
  private addAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);
  }

  /**
   * Clean up old alerts beyond retention period
   */
  private cleanupOldAlerts(): void {
    const cutoffTime = new Date(
      Date.now() -
        DEFAULT_RETENTION_HOURS *
          MINUTES_PER_HOUR *
          SECONDS_PER_MINUTE *
          MS_PER_SECOND
    );
    this.alerts = this.alerts.filter((alert) => alert.timestamp >= cutoffTime);
  }

  /**
   * Clean up old data
   */
  private cleanupOldData(): void {
    // Clean up old performance data and alerts
    const cutoffTime = new Date(
      Date.now() -
        DEFAULT_RETENTION_HOURS *
          MINUTES_PER_HOUR *
          SECONDS_PER_MINUTE *
          MS_PER_SECOND
    );

    this.alerts = this.alerts.filter((alert) => alert.timestamp >= cutoffTime);
    this.snapshots = this.snapshots.filter(
      (snapshot) => snapshot.timestamp >= cutoffTime
    );
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();
