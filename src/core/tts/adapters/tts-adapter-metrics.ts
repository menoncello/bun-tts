/**
 * Adapter performance metrics management
 */

import type {
  AdapterPerformanceMetrics,
  InternalAdapterMetrics,
} from './tts-adapter-types.js';
import type { AdapterRegistration } from './tts-adapter-voice-validation.js';

/**
 * Manages performance metrics for TTS adapters
 */
export class AdapterMetricsManager {
  private readonly metrics: Map<string, InternalAdapterMetrics> = new Map();

  /**
   * Initializes metrics for a new adapter.
   *
   * @param {string} name - Adapter name
   */
  initializeAdapterMetrics(name: string): void {
    this.metrics.set(name, {
      totalRequests: 0,
      successfulRequests: 0,
      averageResponseTime: 0,
      lastUsed: new Date(),
    });
  }

  /**
   * Updates performance metrics for an adapter.
   *
   * @param {string} name - Adapter name
   * @param {string} type - Type of update ('request', 'success', 'failure')
   * @param {number} responseTime - Optional response time in milliseconds
   */
  updateAdapterMetrics(
    name: string,
    type: 'request' | 'success' | 'failure',
    responseTime?: number
  ): void {
    const metrics = this.metrics.get(name);
    if (!metrics) {
      return;
    }

    metrics.lastUsed = new Date();

    if (type === 'request') {
      metrics.totalRequests++;
    } else if (type === 'success') {
      metrics.successfulRequests++;

      // Update average response time if provided
      if (responseTime !== undefined) {
        // Calculate rolling average: new_avg = (old_avg * (n-1) + new_value) / n
        const successfulRequests = metrics.successfulRequests;
        metrics.averageResponseTime =
          successfulRequests === 1
            ? responseTime // First successful request
            : (metrics.averageResponseTime * (successfulRequests - 1) +
                responseTime) /
              successfulRequests; // Rolling average calculation
      }
    }
  }

  /**
   * Gets performance metrics for all adapters.
   *
   * @param {Map<string, AdapterRegistration>} adapters - Adapter registrations
   * @returns {Record<string, AdapterPerformanceMetrics>} Performance metrics by adapter name
   */
  getPerformanceMetrics(
    adapters: Map<string, AdapterRegistration>
  ): Record<string, AdapterPerformanceMetrics> {
    const metrics: Record<string, AdapterPerformanceMetrics> = {};

    for (const [name, adapterMetrics] of Array.from(this.metrics.entries())) {
      const registration = adapters.get(name);
      metrics[name] = {
        ...adapterMetrics,
        isInitialized: registration?.isInitialized || false,
        isAvailable: registration?.isAvailable || false,
        lastHealthCheck: registration?.lastHealthCheck,
        registeredAt: registration?.registeredAt || new Date(),
        successRate:
          adapterMetrics.totalRequests > 0
            ? adapterMetrics.successfulRequests / adapterMetrics.totalRequests
            : 0,
      };
    }

    return metrics;
  }

  /**
   * Gets internal metrics for an adapter.
   *
   * @param {string} name - Adapter name
   * @returns {InternalAdapterMetrics | undefined} Internal metrics or undefined
   */
  getInternalMetrics(name: string): InternalAdapterMetrics | undefined {
    return this.metrics.get(name);
  }

  /**
   * Removes metrics for an adapter.
   *
   * @param {string} name - Adapter name
   */
  removeAdapterMetrics(name: string): void {
    this.metrics.delete(name);
  }

  /**
   * Gets all metrics for internal use.
   *
   * @returns {Map<string, InternalAdapterMetrics>} All internal metrics
   */
  getAllMetrics(): Map<string, InternalAdapterMetrics> {
    return new Map(this.metrics);
  }
}
