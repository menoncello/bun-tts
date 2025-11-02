import { ConfigurationError } from '../errors/configuration-error.js';
import { Result, Ok, Err } from '../errors/result.js';
import type { BunTtsConfig } from '../types/config.js';
import type { SchemaWarning } from './config-validator.js';

/**
 * Schema validation utilities
 *
 * Handles validation for import operations and unknown field checking
 */
export class SchemaValidator {
  /**
   * Validate that configuration contains only known fields
   *
   * @param {Partial<BunTtsConfig>} config - The configuration to validate
   * @param {boolean} allowUnknownFields - Whether to allow unknown fields
   * @returns {Result<true, ConfigurationError>} Validation result
   */
  validateUnknownFields(
    config: Partial<BunTtsConfig>,
    allowUnknownFields?: boolean
  ): Result<true, ConfigurationError> {
    // Check for unknown fields if not in read-only mode
    if (allowUnknownFields) {
      return Ok(true);
    }

    const validFields = [
      'logging',
      'tts',
      'processing',
      'cli',
      'output',
      'cache',
      'profiles',
    ];
    const configKeys = Object.keys(config);

    for (const key of configKeys) {
      if (!validFields.includes(key)) {
        return Err(
          new ConfigurationError(`Unknown configuration field: ${key}`, {
            code: 'UNKNOWN_FIELD',
            field: key,
          })
        );
      }
    }

    return Ok(true);
  }

  /**
   * Validate configuration for import
   *
   * @param {Partial<BunTtsConfig>} config - The configuration to validate
   * @returns {Promise<Result<{ valid: boolean; warnings?: SchemaWarning[] }, ConfigurationError>>} Validation result with warnings
   */
  async validateForImport(
    config: Partial<BunTtsConfig>
  ): Promise<
    Result<{ valid: boolean; warnings?: SchemaWarning[] }, ConfigurationError>
  > {
    // Check schema version if present
    if ('_schemaVersion' in config) {
      const schemaVersion = (config as Record<string, unknown>)._schemaVersion;
      if (typeof schemaVersion === 'string' && schemaVersion !== '1.0.0') {
        return Ok({
          valid: true,
          warnings: [
            {
              code: 'SCHEMA_VERSION',
              message: `Configuration schema version ${schemaVersion} may be outdated`,
            },
          ],
        });
      }
    }

    return Ok({ valid: true });
  }
}
