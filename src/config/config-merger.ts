import type { BunTtsConfig } from '../types/config.js';

/**
 * Configuration merger utilities for bun-tts
 *
 * Provides deep merge functionality for configuration objects,
 * ensuring proper merging of nested structures while preserving
 * defaults and applying user overrides.
 */
export class ConfigMerger {
  /**
   * Merge user configuration with defaults
   *
   * Performs a deep merge of user-provided configuration with default values,
   * ensuring all required properties are present.
   *
   * @param {any} defaults - The default configuration object
   * @param {Partial<BunTtsConfig>} userConfig - The user-provided configuration object
   * @returns {BunTtsConfig} A merged BunTtsConfig object
   */
  mergeWithDefaults(
    defaults: BunTtsConfig,
    userConfig: Partial<BunTtsConfig>
  ): BunTtsConfig {
    return this.deepMerge(
      defaults as unknown as Record<string, unknown>,
      userConfig as unknown as Record<string, unknown>
    ) as unknown as BunTtsConfig;
  }

  /**
   * Deep merge two objects
   *
   * Recursively merges properties from the source object into the target object.
   * Arrays are replaced rather than merged. Objects are merged recursively.
   *
   * @param {any} target - The target object to merge into
   * @param {Partial<T>} source - The source object to merge from
   * @returns {T} A new object containing the merged properties
   */
  deepMerge<T extends Record<string, unknown>>(
    target: T,
    source: Partial<T>
  ): T {
    const result = { ...target } as T;

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key];
        const targetValue = result[key];

        if (
          sourceValue &&
          typeof sourceValue === 'object' &&
          !Array.isArray(sourceValue) &&
          targetValue &&
          typeof targetValue === 'object' &&
          !Array.isArray(targetValue)
        ) {
          // Recursively merge nested objects
          result[key] = this.deepMerge(
            targetValue as Record<string, unknown>,
            sourceValue as Partial<Record<string, unknown>>
          ) as T[Extract<keyof T, string>];
        } else if (sourceValue !== undefined) {
          // Use source value if it's defined
          result[key] = sourceValue as T[Extract<keyof T, string>];
        }
      }
    }

    return result;
  }
}
