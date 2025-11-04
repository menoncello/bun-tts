/**
 * Performance Monitoring Service for TTS Adapter System (Refactored)
 * Provides real-time performance tracking, alerting, and reporting
 * Refactored to reduce file size and improve maintainability
 */

import { evaluateMetricsForAlerts } from './performance-alert-evaluator.js';
import {
  calculateSynthesisMetrics,
  type SynthesisRequest,
  type SynthesisMetrics,
} from './performance-calculations.js';
import {
  getOrCreatePerformanceData,
  updatePerformanceData,
  calculateStatistics,
  shouldSendAlert,
  updateLastAlertTime,
  cleanupOldSnapshots,
  type AdapterPerformanceData,
  type PerformanceStatistics,
} from './performance-data-manager.js';
import {
  DEFAULT_PERFORMANCE_TARGETS,
  DEFAULT_PERFORMANCE_THRESHOLDS,
  type PerformanceTargets,
  type PerformanceThresholds,
} from './performance-targets.js';
import type {
  AlertLevel,
  PerformanceAlert,
  PerformanceSnapshot,
} from './performance-types.js';
import type { TTSResponse, HealthCheckResult } from './types.js';

// Constants
const DEFAULT_RETENTION_HOURS = 24;

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
   * Creates a new performance monitor instance with optional custom targets and thresholds
   *
   * @param {PerformanceTargets} [targets] - Custom performance targets
   * @param {PerformanceThresholds} [thresholds] - Custom performance thresholds
   */
  constructor(
    targets?: PerformanceTargets,
    thresholds?: PerformanceThresholds
  ) {
    this.targets = targets || DEFAULT_PERFORMANCE_TARGETS;
    this.thresholds = thresholds || DEFAULT_PERFORMANCE_THRESHOLDS;
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    this.isMonitoring = true;
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
  }

  /**
   * Check if monitoring is currently active
   *
   * @returns {boolean} Whether monitoring is active
   */
  isActive(): boolean {
    return this.isMonitoring;
  }

  /**
   * Record synthesis metrics for a specific adapter
   *
   * @param {string} adapterName - Name of the adapter
   * @param {SynthesisRequest} request - TTS request data
   * @param {TTSResponse} response - TTS response data
   * @param {number} startTime - Start time of synthesis
   */
  recordSynthesisMetrics(
    adapterName: string,
    request: SynthesisRequest,
    response: TTSResponse,
    startTime: number
  ): void {
    if (!this.isMonitoring) return;

    const synthesisMetrics = calculateSynthesisMetrics(
      request,
      response,
      startTime
    );
    const currentData = getOrCreatePerformanceData(
      this.performanceData,
      adapterName
    );
    const updatedData = updatePerformanceData(currentData, synthesisMetrics);
    this.performanceData.set(adapterName, updatedData);

    this.checkPerformanceAlerts(adapterName, synthesisMetrics);
  }

  /**
   * Record health check result for an adapter
   *
   * @param {string} adapterName - Name of the adapter
   * @param {HealthCheckResult} healthCheck - Health check result
   */
  recordHealthCheck(adapterName: string, healthCheck: HealthCheckResult): void {
    if (!this.isMonitoring) return;

    const snapshot = this.createHealthCheckSnapshot(adapterName, healthCheck);
    this.addSnapshot(snapshot);
  }

  /**
   * Create a performance snapshot from health check data
   *
   * @param {string} adapterName - Name of the adapter
   * @param {HealthCheckResult} healthCheck - Health check result
   * @returns {PerformanceSnapshot} Performance snapshot
   */
  private createHealthCheckSnapshot(
    adapterName: string,
    healthCheck: HealthCheckResult
  ): PerformanceSnapshot {
    return {
      timestamp: new Date(),
      adapter: adapterName,
      synthesisRate: 0, // Not available from health check
      responseTime: healthCheck.responseTime,
      memoryUsage: 0, // Not available from health check
      errorRate: this.calculateErrorRate(healthCheck.status),
      totalRequests: 0, // Not tracked in health checks
      successfulRequests: healthCheck.status === 'healthy' ? 1 : 0,
      alertLevel: this.calculateAlertLevel(healthCheck.status),
    };
  }

  /**
   * Calculate error rate based on health status
   *
   * @param {string} status - Health status
   * @returns {number} Error rate percentage
   */
  private calculateErrorRate(status: HealthCheckResult['status']): number {
    const ERROR_RATE_DEGRADED = 50;
    const ERROR_RATE_UNHEALTHY = 100;

    if (status === 'healthy') {
      return 0;
    } else if (status === 'degraded') {
      return ERROR_RATE_DEGRADED;
    }
    return ERROR_RATE_UNHEALTHY;
  }

  /**
   * Calculate alert level based on health status
   *
   * @param {string} status - Health status
   * @returns {AlertLevel} Alert level
   */
  private calculateAlertLevel(status: HealthCheckResult['status']): AlertLevel {
    if (status === 'healthy') {
      return 'normal';
    } else if (status === 'degraded') {
      return 'warning';
    }
    return 'critical';
  }

  /**
   * Add a performance snapshot and clean up old snapshots
   *
   * @param {PerformanceSnapshot} snapshot - Performance snapshot to add
   */
  private addSnapshot(snapshot: PerformanceSnapshot): void {
    this.snapshots.push(snapshot);
    this.snapshots = cleanupOldSnapshots(
      this.snapshots,
      DEFAULT_RETENTION_HOURS
    );
  }

  /**
   * Get performance statistics for a specific adapter
   *
   * @param {string} adapterName - Name of the adapter
   * @returns {PerformanceStatistics | undefined} Performance statistics
   */
  getStatistics(adapterName: string): PerformanceStatistics | undefined {
    const data = this.performanceData.get(adapterName);
    return data ? calculateStatistics(data) : undefined;
  }

  /**
   * Get performance statistics for all adapters
   *
   * @returns {Map<string, PerformanceStatistics>} Performance statistics by adapter
   */
  getAllStatistics(): Map<string, PerformanceStatistics> {
    const result = new Map<string, PerformanceStatistics>();
    for (const [adapterName, data] of this.performanceData) {
      result.set(adapterName, calculateStatistics(data));
    }
    return result;
  }

  /**
   * Get recent alerts
   *
   * @param {number} limit - Maximum number of alerts to return
   * @returns {PerformanceAlert[]} Recent alerts
   */
  getRecentAlerts(limit = 10): PerformanceAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Get recent performance snapshots
   *
   * @param {number} limit - Maximum number of snapshots to return
   * @returns {PerformanceSnapshot[]} Recent snapshots
   */
  getRecentSnapshots(limit = 100): PerformanceSnapshot[] {
    return this.snapshots.slice(-limit);
  }

  /**
   * Clear all performance data
   */
  clearData(): void {
    this.performanceData.clear();
    this.alerts = [];
    this.snapshots = [];
  }

  /**
   * Get current performance targets
   *
   * @returns {PerformanceTargets} Current performance targets
   */
  getTargets(): PerformanceTargets {
    return this.targets;
  }

  /**
   * Update performance targets
   *
   * @param {PerformanceTargets} newTargets - New performance targets
   */
  updateTargets(newTargets: PerformanceTargets): void {
    this.targets = newTargets;
  }

  /**
   * Check performance alerts for an adapter
   *
   * @param {string} adapterName - Name of the adapter
   * @param {SynthesisMetrics} metrics - Current performance metrics
   */
  private checkPerformanceAlerts(
    adapterName: string,
    metrics: SynthesisMetrics
  ): void {
    const now = new Date();
    const currentData = getOrCreatePerformanceData(
      this.performanceData,
      adapterName
    );

    // Check if we should send an alert based on cooldown
    if (!shouldSendAlert(currentData, now)) return;

    const alert = this.evaluateMetricsForAlerts(adapterName, metrics);
    if (alert) {
      this.alerts.push(alert);
      updateLastAlertTime(this.performanceData, adapterName, now);
    }
  }

  /**
   * Evaluate metrics and determine if an alert should be generated
   *
   * @param {string} adapterName - Name of the adapter
   * @param {SynthesisMetrics} metrics - Performance metrics to evaluate
   * @returns {PerformanceAlert | undefined} Alert if thresholds are exceeded
   */
  private evaluateMetricsForAlerts(
    adapterName: string,
    metrics: SynthesisMetrics
  ): PerformanceAlert | undefined {
    return evaluateMetricsForAlerts(adapterName, metrics, this.thresholds);
  }
}
