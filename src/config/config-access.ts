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
   * @param {string | null} _key - The configuration key to retrieve (supports dot notation)
   * @param {T} [defaultValue] - Default value to return if key is not found
   * @returns {T} The configuration value or default
   */
  get<T = unknown>(
    config: BunTtsConfig | undefined,
    _key: string | null,
    defaultValue?: T
  ): T {
    if (!config || !_key) {
      return defaultValue as T;
    }

    // Check if key is empty or contains only invalid characters
    if (!_key.trim()) {
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
   * @param {string | null} _key - The configuration key to set (supports dot notation)
   * @param {any} _value - The value to set
   * @returns {BunTtsConfig} The modified configuration object
   */
  set(
    config: BunTtsConfig | undefined,
    _key: string | null,
    _value: unknown
  ): BunTtsConfig {
    if (!_key) {
      return this.normalizeConfig(config);
    }

    const normalizedConfig = this.normalizeConfig(config);
    const keys = _key.split('.');
    const current = this.buildNestedPath(normalizedConfig, keys);
    this.setFinalValue(current, keys, _value);

    return normalizedConfig;
  }

  /**
   * Normalizes the config object, ensuring it's defined
   *
   * @param {BunTtsConfig | undefined} config - The config to normalize
   * @returns {BunTtsConfig} A valid config object
   */
  private normalizeConfig(config: BunTtsConfig | undefined): BunTtsConfig {
    return config || ({} as BunTtsConfig);
  }

  /**
   * Builds the nested path for setting a value
   *
   * @param {BunTtsConfig} config - The config object
   * @param {string[]} keys - The keys array from dot notation
   * @returns {Record<string, unknown>} The final parent object
   */
  private buildNestedPath(
    config: BunTtsConfig,
    keys: string[]
  ): Record<string, unknown> {
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

    return current;
  }

  /**
   * Sets the final value in the target object
   *
   * @param {Record<string, unknown>} current - The target object
   * @param {string[]} keys - The keys array
   * @param {unknown} value - The value to set
   */
  private setFinalValue(
    current: Record<string, unknown>,
    keys: string[],
    value: unknown
  ): void {
    const lastKey = keys[keys.length - 1];
    if (!lastKey) {
      return;
    }

    if (value === undefined) {
      delete current[lastKey];
    } else {
      current[lastKey] = value;
    }
  }

  /**
   * Check if configuration key exists
   *
   * Checks if a configuration key exists in the provided configuration object.
   * Supports dot notation for nested keys. Returns true if the key exists,
   * even if its value is undefined or null. Returns false for paths that
   * resolve to empty after filtering empty parts (e.g., ".", "..").
   *
   * @param {object} config - The configuration object to search in
   * @param {string | null} _key - The configuration key to check (supports dot notation)
   * @returns {boolean} True if the key exists, false otherwise
   */
  has(config: BunTtsConfig | undefined, _key: string | null): boolean {
    if (!config || !_key) {
      return false;
    }

    // Support dot notation for nested keys, filtering out empty parts
    const keys = _key.split('.').filter((k) => k !== '');

    // If no valid keys remain after filtering, return false
    if (keys.length === 0) {
      return false;
    }

    let current: unknown = config;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = (current as Record<string, unknown>)[k];
      } else {
        return false;
      }
    }

    // Return true if we successfully navigated to the target, even if value is undefined/null
    return true;
  }

  /**
   * Delete configuration value by key
   *
   * Deletes a configuration value using dot notation for nested keys.
   * Returns a new configuration object with the specified key removed.
   *
   * @param {BunTtsConfig} config - The configuration object to modify
   * @param {string | null} _key - The configuration key to delete (supports dot notation)
   * @returns {BunTtsConfig} The modified configuration object
   */
  delete(config: BunTtsConfig | undefined, _key: string | null): BunTtsConfig {
    if (!config) {
      return {} as BunTtsConfig;
    }

    if (!_key) {
      return config;
    }

    const newConfig = this.createConfigCopy(config);
    const keys = _key.split('.').filter((k) => k !== '');

    if (!this.canDeleteKey(newConfig, keys)) {
      return config;
    }

    this.performDelete(newConfig, keys);
    return newConfig;
  }

  /**
   * Creates a deep copy of the config object
   *
   * @param {BunTtsConfig} config - The config to copy
   * @returns {BunTtsConfig} The deep copy
   */
  private createConfigCopy(config: BunTtsConfig): BunTtsConfig {
    return JSON.parse(JSON.stringify(config));
  }

  /**
   * Checks if a key can be deleted (path exists)
   *
   * @param {BunTtsConfig} config - The config object
   * @param {string[]} keys - The keys array
   * @returns {boolean} True if the key can be deleted
   */
  private canDeleteKey(config: BunTtsConfig, keys: string[]): boolean {
    if (keys.length === 0) {
      return false;
    }

    let current: Record<string, unknown> = config as unknown as Record<
      string,
      unknown
    >;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (
        !k ||
        current[k] === undefined ||
        typeof current[k] !== 'object' ||
        current[k] === null
      ) {
        return false;
      }
      current = current[k] as Record<string, unknown>;
    }

    return true;
  }

  /**
   * Performs the actual deletion of the key
   *
   * @param {BunTtsConfig} config - The config object
   * @param {string[]} keys - The keys array
   */
  private performDelete(config: BunTtsConfig, keys: string[]): void {
    const lastKey = keys[keys.length - 1];
    if (!lastKey) {
      return;
    }

    let current: Record<string, unknown> = config as unknown as Record<
      string,
      unknown
    >;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (k) {
        current = current[k] as Record<string, unknown>;
      }
    }

    delete current[lastKey];
  }
}
