import type { BunTtsConfig } from '../types/config.js';

/**
 * Configuration access utilities for bun-tts
 *
 * Provides methods for accessing, setting, and checking configuration values
 * using dot notation for nested keys.
 */
export class ConfigAccess {
  /**
   * Get configuration value by key
   *
   * Retrieves a configuration value using dot notation for nested keys.
   * Returns the provided default value if the key is not found.
   *
   * @param {object} config - The configuration object to search in
   * @param {any} _key - The configuration key to retrieve (supports dot notation)
   * @param {T} [defaultValue] - Default value to return if key is not found
   * @returns {T} The configuration value or default
   */
  get<T = unknown>(
    config: BunTtsConfig | undefined,
    _key: string,
    defaultValue?: T
  ): T {
    if (!config) {
      return defaultValue as T;
    }

    // Support dot notation for nested keys
    const keys = _key.split('.');
    let value: unknown = config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return defaultValue as T;
      }
    }

    return value as T;
  }

  /**
   * Set configuration value by key
   *
   * Sets a configuration value using dot notation for nested keys.
   *
   * @param {object} config - The configuration object to modify
   * @param {any} _key - The configuration key to set (supports dot notation)
   * @param {any} _value - The value to set
   * @returns {BunTtsConfig} The modified configuration object
   */
  set(
    config: BunTtsConfig | undefined,
    _key: string,
    _value: unknown
  ): BunTtsConfig {
    if (!config) {
      config = {} as BunTtsConfig;
    }

    // Support dot notation for nested keys
    const keys = _key.split('.');
    let current: Record<string, unknown> = config as unknown as Record<
      string,
      unknown
    >;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (k && !(k in current)) {
        current[k] = {};
      }
      if (k) {
        current = current[k] as Record<string, unknown>;
      }
    }

    const lastKey = keys[keys.length - 1];
    if (lastKey) {
      current[lastKey] = _value;
    }

    return config;
  }

  /**
   * Check if configuration key exists
   *
   * @param {object} config - The configuration object to search in
   * @param {any} _key - The configuration key to check (supports dot notation)
   * @returns {boolean} True if the key exists, false otherwise
   */
  has(config: BunTtsConfig | undefined, _key: string): boolean {
    return this.get(config, _key) !== undefined;
  }
}
