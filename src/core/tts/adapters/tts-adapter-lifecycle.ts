/**
 * Adapter lifecycle management for initialization, cleanup, and health checks
 */

import { TTSError, createTTSError } from './errors/index.js';
import { Logger } from './tts-adapter-logger.js';
import type { InternalAdapterMetrics } from './tts-adapter-types.js';
import type { AdapterRegistration } from './tts-adapter-voice-validation.js';
import type { HealthCheckResult } from './types.js';

/**
 * Manages adapter lifecycle operations
 */
export class AdapterLifecycleManager {
  /**
   * Creates a new adapter lifecycle manager.
   *
   * @param {Map<string, AdapterRegistration>} adapters - Map of adapter registrations
   * @param {Map<string, InternalAdapterMetrics>} metrics - Map of adapter metrics
   */
  constructor(
    private readonly adapters: Map<string, AdapterRegistration>,
    private readonly metrics: Map<string, InternalAdapterMetrics>
  ) {}

  /**
   * Validates that an adapter registration exists.
   *
   * @param {string} name - Adapter name to validate
   * @returns {AdapterRegistration} The adapter registration
   * @throws {TTSError} If adapter is not found
   */
  private validateAdapterExists(name: string): AdapterRegistration {
    const registration = this.adapters.get(name);
    if (!registration) {
      throw new TTSError(
        `Adapter '${name}' not found for initialization`,
        'ADAPTER_NOT_FOUND',
        {
          operation: 'initialize',
        }
      );
    }
    return registration;
  }

  /**
   * Performs the adapter initialization.
   *
   * @param {AdapterRegistration} registration - The adapter registration to initialize
   */
  private async performInitialization(
    registration: AdapterRegistration
  ): Promise<void> {
    await registration.adapter.initialize();
    registration.isInitialized = true;
  }

  /**
   * Performs health check after initialization and updates registration state.
   *
   * @param {string} name - Adapter name for logging
   * @param {AdapterRegistration} registration - The adapter registration
   */
  private async performPostInitializationHealthCheck(
    name: string,
    registration: AdapterRegistration
  ): Promise<void> {
    const health = await registration.adapter.healthCheck();
    registration.isAvailable = health.status === 'healthy';
    registration.lastHealthCheck = health;

    if (health.status !== 'healthy') {
      Logger.warn(
        `Adapter '${name}' initialized but health check failed: ${health.message}`
      );
    }
  }

  /**
   * Handles initialization failure by updating registration state and re-throwing error.
   *
   * @param {AdapterRegistration} registration - The adapter registration
   * @param {string} name - Adapter name
   * @param {unknown} error - The original error
   * @throws {TTSError} The enhanced TTS error
   */
  private handleInitializationFailure(
    registration: AdapterRegistration,
    name: string,
    error: unknown
  ): never {
    registration.isInitialized = false;
    registration.isAvailable = false;
    throw createTTSError(error, registration.adapter.name, 'initialize', name);
  }

  /**
   * Initializes an adapter and marks it as available.
   *
   * @param {string} name - Adapter name to initialize
   */
  async initializeAdapter(name: string): Promise<void> {
    const registration = this.validateAdapterExists(name);

    try {
      await this.performInitialization(registration);
      await this.performPostInitializationHealthCheck(name, registration);
    } catch (error) {
      this.handleInitializationFailure(registration, name, error);
    }
  }

  /**
   * Initializes all registered adapters.
   *
   * @returns {Promise<void>} Promise that resolves when all adapters are initialized
   */
  async initializeAll(): Promise<void> {
    const initPromises = Array.from(this.adapters.keys()).map((name) =>
      this.initializeAdapter(name).catch((error) => {
        Logger.error(`Failed to initialize adapter '${name}':`, error);
      })
    );

    await Promise.all(initPromises);
  }

  /**
   * Cleans up all registered adapters.
   *
   * @returns {Promise<void>} Promise that resolves when all adapters are cleaned up
   */
  async cleanupAll(): Promise<void> {
    const cleanupPromises = Array.from(this.adapters.entries()).map(
      async ([name, registration]) => {
        try {
          if (registration.isInitialized) {
            await registration.adapter.cleanup();
            registration.isInitialized = false;
            registration.isAvailable = false;
          }
        } catch (error) {
          Logger.error(`Error cleaning up adapter '${name}':`, error);
        }
      }
    );

    await Promise.all(cleanupPromises);
  }

  /**
   * Performs health checks on all registered adapters.
   *
   * @returns {Promise<HealthCheckResult[]>} Health check results for all adapters
   */
  async healthCheckAll(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];

    for (const [name, registration] of Array.from(this.adapters.entries())) {
      try {
        const health = await registration.adapter.healthCheck();
        registration.lastHealthCheck = health;
        registration.isAvailable = health.status === 'healthy';

        results.push({
          ...health,
          engine: `${health.engine} (${name})`,
        });
      } catch (error) {
        const errorHealth: HealthCheckResult = {
          engine: `${registration.adapter.name} (${name})`,
          status: 'unhealthy',
          timestamp: new Date(),
          responseTime: -1,
          message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };

        registration.isAvailable = false;
        registration.lastHealthCheck = errorHealth;
        results.push(errorHealth);
      }
    }

    return results;
  }

  /**
   * Gets all available (initialized and healthy) adapter names.
   *
   * @returns {Promise<string[]>} Array of available adapter names
   */
  async getAvailableAdapters(): Promise<string[]> {
    const available: string[] = [];

    for (const [name, registration] of Array.from(this.adapters.entries())) {
      if (registration.isInitialized) {
        // Always perform health check for initialized adapters to detect recovery
        const health = await registration.adapter.healthCheck();
        registration.lastHealthCheck = health;

        if (health.status === 'healthy') {
          available.push(name);
          registration.isAvailable = true; // Mark as available if healthy
        } else {
          registration.isAvailable = false; // Mark as unavailable if unhealthy
        }
      }
    }

    return available;
  }

  /**
   * Cleans up a specific adapter.
   *
   * @param {string} name - The adapter name to cleanup
   * @returns {Promise<boolean>} True if adapter was found and cleaned up
   */
  async cleanupAdapter(name: string): Promise<boolean> {
    const registration = this.adapters.get(name);
    if (!registration) {
      return false;
    }

    try {
      if (registration.isInitialized) {
        await registration.adapter.cleanup();
      }
    } catch (error) {
      Logger.error(`Error cleaning up adapter '${name}':`, error);
    }

    return true;
  }
}
