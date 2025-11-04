/**
 * TTS Adapter reporting functionality - extracted to reduce main file size
 */

import type { AdapterPerformanceMetrics } from './tts-adapter-types.js';

/** Percentage multiplier for display calculations */
const PERCENTAGE_MULTIPLIER = 100;

/**
 * Handles adapter reporting and statistics
 */
export class TTSAdapterReports {
  /**
   * Creates a comprehensive performance report for all adapters.
   *
   * @param {Record<string, AdapterPerformanceMetrics>} metrics - Performance metrics by adapter name
   * @returns {object} Comprehensive performance report
   */
  static createPerformanceReport(
    metrics: Record<string, AdapterPerformanceMetrics>
  ): {
    totalAdapters: number;
    healthyAdapters: number;
    totalRequests: number;
    averageSuccessRate: number;
    mostUsedAdapter: string;
    leastUsedAdapter: string;
    adapterDetails: Record<string, AdapterPerformanceMetrics>;
  } {
    const adapterNames = Object.keys(metrics);
    const healthyAdapters = this.countHealthyAdapters(adapterNames, metrics);
    const totalRequests = this.calculateTotalRequests(adapterNames, metrics);
    const averageSuccessRate = this.calculateAverageSuccessRate(
      adapterNames,
      metrics
    );
    const mostUsedAdapter = this.findMostUsedAdapter(adapterNames, metrics);
    const leastUsedAdapter = this.findLeastUsedAdapter(adapterNames, metrics);

    return {
      totalAdapters: adapterNames.length,
      healthyAdapters,
      totalRequests,
      averageSuccessRate,
      mostUsedAdapter,
      leastUsedAdapter,
      adapterDetails: metrics,
    };
  }

  /**
   * Counts the number of healthy adapters.
   *
   * @param {string[]} adapterNames - List of adapter names
   * @param {Record<string, AdapterPerformanceMetrics>} metrics - Performance metrics
   * @returns {number} Number of healthy adapters
   */
  private static countHealthyAdapters(
    adapterNames: string[],
    metrics: Record<string, AdapterPerformanceMetrics>
  ): number {
    return adapterNames.filter((name) => {
      const adapterMetrics = metrics[name];
      return adapterMetrics?.isAvailable && adapterMetrics?.isInitialized;
    }).length;
  }

  /**
   * Calculates the total number of requests across all adapters.
   *
   * @param {string[]} adapterNames - List of adapter names
   * @param {Record<string, AdapterPerformanceMetrics>} metrics - Performance metrics
   * @returns {number} Total number of requests
   */
  private static calculateTotalRequests(
    adapterNames: string[],
    metrics: Record<string, AdapterPerformanceMetrics>
  ): number {
    return adapterNames.reduce(
      (sum, name) => sum + (metrics[name]?.totalRequests || 0),
      0
    );
  }

  /**
   * Calculates the average success rate across all adapters.
   *
   * @param {string[]} adapterNames - List of adapter names
   * @param {Record<string, AdapterPerformanceMetrics>} metrics - Performance metrics
   * @returns {number} Average success rate
   */
  private static calculateAverageSuccessRate(
    adapterNames: string[],
    metrics: Record<string, AdapterPerformanceMetrics>
  ): number {
    return adapterNames.length > 0
      ? adapterNames.reduce(
          (sum, name) => sum + (metrics[name]?.successRate || 0),
          0
        ) / adapterNames.length
      : 0;
  }

  /**
   * Finds the most used adapter.
   *
   * @param {string[]} adapterNames - List of adapter names
   * @param {Record<string, AdapterPerformanceMetrics>} metrics - Performance metrics
   * @returns {string} Name of the most used adapter
   */
  private static findMostUsedAdapter(
    adapterNames: string[],
    metrics: Record<string, AdapterPerformanceMetrics>
  ): string {
    return adapterNames.reduce((most, name) => {
      const currentMetrics = metrics[name];
      const mostMetrics = most ? metrics[most] : undefined;

      if (!currentMetrics) return most;
      if (!mostMetrics) return name;

      return currentMetrics.totalRequests > mostMetrics.totalRequests
        ? name
        : most;
    }, adapterNames[0] || '');
  }

  /**
   * Finds the least used adapter.
   *
   * @param {string[]} adapterNames - List of adapter names
   * @param {Record<string, AdapterPerformanceMetrics>} metrics - Performance metrics
   * @returns {string} Name of the least used adapter
   */
  private static findLeastUsedAdapter(
    adapterNames: string[],
    metrics: Record<string, AdapterPerformanceMetrics>
  ): string {
    return adapterNames.reduce((least, name) => {
      const currentMetrics = metrics[name];
      const leastMetrics = least ? metrics[least] : undefined;

      if (!currentMetrics) return least;
      if (!leastMetrics) return name;

      return currentMetrics.totalRequests < leastMetrics.totalRequests
        ? name
        : least;
    }, adapterNames[0] || '');
  }

  /**
   * Formats performance metrics for logging or display.
   *
   * @param {Record<string, AdapterPerformanceMetrics>} metrics - Performance metrics by adapter name
   * @returns {string} Formatted performance report string
   */
  static formatPerformanceReport(
    metrics: Record<string, AdapterPerformanceMetrics>
  ): string {
    const report = this.createPerformanceReport(metrics);

    const lines = [
      '=== TTS Adapter Performance Report ===',
      `Total Adapters: ${report.totalAdapters}`,
      `Healthy Adapters: ${report.healthyAdapters}`,
      `Total Requests: ${report.totalRequests}`,
      `Average Success Rate: ${(report.averageSuccessRate * PERCENTAGE_MULTIPLIER).toFixed(1)}%`,
      `Most Used Adapter: ${report.mostUsedAdapter}`,
      `Least Used Adapter: ${report.leastUsedAdapter}`,
      '',
      'Adapter Details:',
    ];

    for (const [name, adapterMetrics] of Object.entries(
      report.adapterDetails
    )) {
      lines.push(
        `  ${name}:`,
        `    - Initialized: ${adapterMetrics.isInitialized}`,
        `    - Available: ${adapterMetrics.isAvailable}`,
        `    - Requests: ${adapterMetrics.totalRequests}`,
        `    - Success Rate: ${(adapterMetrics.successRate * PERCENTAGE_MULTIPLIER).toFixed(1)}%`,
        `    - Last Used: ${adapterMetrics.lastUsed.toISOString()}`
      );
    }

    return lines.join('\n');
  }
}
