/**
 * TTS Adapter Registry - handles adapter registration and basic management
 */

import { TTSConfigurationError } from './errors/index.js';
import type { TtsAdapter } from './itts-adapter.js';
import type { AdapterRegistration } from './tts-adapter-types.js';
import { validateAdapterInterface } from './tts-adapter-validator.js';
import type { HealthCheckResult } from './types.js';

/**
 * Manages adapter registration and basic operations
 */
export class TTSAdapterRegistry {
  /**
   * Creates a new adapter registry.
   *
   * @param {Map<string, AdapterRegistration>} adapters - Map of adapter registrations
   */
  constructor(private readonly adapters: Map<string, AdapterRegistration>) {}

  /**
   * Registers a TTS adapter with the manager.
   *
   * @param {string} name - Unique identifier for the adapter
   * @param {TtsAdapter} adapter - The adapter instance to register
   * @param {(name: string) => Promise<void>} initializeAdapter - Function to initialize the adapter
   * @param {(name: string) => void} initializeMetrics - Function to initialize metrics for the adapter
   * @throws {TTSConfigurationError} If adapter validation fails
   */
  async registerAdapter(
    name: string,
    adapter: TtsAdapter,
    initializeAdapter: (name: string) => Promise<void>,
    initializeMetrics: (name: string) => void
  ): Promise<void> {
    if (this.adapters.has(name)) {
      throw new TTSConfigurationError(
        `Adapter '${name}' is already registered`,
        'TTSAdapterManager',
        'name',
        name,
        'unique adapter name'
      );
    }

    // Validate adapter interface compliance
    validateAdapterInterface(adapter);

    const registration: AdapterRegistration = {
      adapter,
      registeredAt: new Date(),
      isAvailable: false,
      isInitialized: false,
    };

    this.adapters.set(name, registration);
    initializeMetrics(name);

    // Initialize the adapter
    await initializeAdapter(name);
  }

  /**
   * Unregisters an adapter from the manager.
   *
   * @param {string} name - The adapter name to unregister
   * @param {(name: string) => Promise<boolean>} cleanupAdapter - Function to cleanup the adapter
   * @param {(name: string) => void} removeMetrics - Function to remove adapter metrics
   * @returns {Promise<boolean>} True if adapter was found and removed
   */
  async unregisterAdapter(
    name: string,
    cleanupAdapter: (name: string) => Promise<boolean>,
    removeMetrics: (name: string) => void
  ): Promise<boolean> {
    const registration = this.adapters.get(name);
    if (!registration) {
      return false;
    }

    // Cleanup the adapter
    await cleanupAdapter(name);

    this.adapters.delete(name);
    removeMetrics(name);

    return true;
  }

  /**
   * Gets a registered adapter by name.
   *
   * @param {string} name - The adapter name
   * @returns {TtsAdapter | undefined} The adapter or undefined if not found
   */
  getAdapter(name: string): TtsAdapter | undefined {
    return this.adapters.get(name)?.adapter;
  }

  /**
   * Gets all registered adapter names.
   *
   * @returns {string[]} Array of registered adapter names
   */
  getRegisteredAdapters(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Updates the default adapter when current default is unavailable.
   *
   * @param {string | undefined} currentDefault - Current default adapter name
   * @param {string} nameToCheck - Name that was just removed/unregistered
   * @returns {string | undefined} New default adapter name or undefined
   */
  updateDefaultAdapter(
    currentDefault: string | undefined,
    nameToCheck: string
  ): string | undefined {
    if (currentDefault === nameToCheck) {
      const adapters = Array.from(this.adapters.keys());
      if (adapters.length > 0) {
        return adapters[0];
      }
    }
    return currentDefault;
  }

  /**
   * Gets the adapters map for internal operations.
   *
   * @returns {Map<string, AdapterRegistration>} The adapters map
   */
  getAdapters(): Map<string, AdapterRegistration> {
    return this.adapters;
  }

  /**
   * Gets registration information for all adapters.
   *
   * @returns {Record<string, { name: string; registeredAt: Date; isInitialized: boolean; isAvailable: boolean; lastHealthCheck?: HealthCheckResult }>} Registration info
   */
  getRegistrationInfo(): Record<
    string,
    {
      name: string;
      registeredAt: Date;
      isInitialized: boolean;
      isAvailable: boolean;
      lastHealthCheck?: HealthCheckResult;
    }
  > {
    const info = this.createEmptyRegistrationInfo();
    this.populateRegistrationInfo(info);
    return info;
  }

  /**
   * Creates an empty registration info object.
   *
   * @returns {Record<string, { name: string; registeredAt: Date; isInitialized: boolean; isAvailable: boolean; lastHealthCheck?: HealthCheckResult }>} Empty registration info
   */
  private createEmptyRegistrationInfo(): Record<
    string,
    {
      name: string;
      registeredAt: Date;
      isInitialized: boolean;
      isAvailable: boolean;
      lastHealthCheck?: HealthCheckResult;
    }
  > {
    return {};
  }

  /**
   * Populates the registration info with data from all adapters.
   *
   * @param {Record<string, { name: string; registeredAt: Date; isInitialized: boolean; isAvailable: boolean; lastHealthCheck?: HealthCheckResult }>} info - Info object to populate
   */
  private populateRegistrationInfo(
    info: Record<
      string,
      {
        name: string;
        registeredAt: Date;
        isInitialized: boolean;
        isAvailable: boolean;
        lastHealthCheck?: HealthCheckResult;
      }
    >
  ): void {
    for (const [name, registration] of Array.from(this.adapters.entries())) {
      info[name] = {
        name,
        registeredAt: registration.registeredAt,
        isInitialized: registration.isInitialized,
        isAvailable: registration.isAvailable,
        lastHealthCheck: registration.lastHealthCheck,
      };
    }
  }
}
