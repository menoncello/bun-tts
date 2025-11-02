import { ConfigurationError } from '../errors/configuration-error.js';
import { Result, Ok, Err } from '../errors/result.js';
import type { BunTtsConfig } from '../types/config.js';

/**
 * Cache configuration validator
 *
 * Handles validation of cache size and TTL settings
 */
export class CacheValidator {
  /**
   * Validate cache max size
   *
   * @param {number} maxSize - The cache max size to validate
   * @returns {Result<true, ConfigurationError>} Validation result
   */
  validateCacheMaxSize(maxSize?: number): Result<true, ConfigurationError> {
    if (maxSize !== undefined && maxSize <= 0) {
      return Err(new ConfigurationError('Cache max size must be positive'));
    }
    return Ok(true);
  }

  /**
   * Validate cache TTL
   *
   * @param {number} ttl - The cache TTL to validate
   * @returns {Result<true, ConfigurationError>} Validation result
   */
  validateCacheTtl(ttl?: number): Result<true, ConfigurationError> {
    if (ttl !== undefined && ttl <= 0) {
      return Err(new ConfigurationError('Cache TTL must be positive'));
    }
    return Ok(true);
  }

  /**
   * Validate cache configuration
   *
   * @param {BunTtsConfig['cache']} cache - The cache configuration to validate
   * @returns {Result<true, ConfigurationError>} Validation result
   */
  validateCacheConfig(
    cache?: BunTtsConfig['cache']
  ): Result<true, ConfigurationError> {
    const validations = [
      () => this.validateCacheMaxSize(cache?.maxSize),
      () => this.validateCacheTtl(cache?.ttl),
    ];

    for (const validation of validations) {
      const result = validation();
      if (!result.success) {
        return result;
      }
    }

    return Ok(true);
  }
}
