import { ConfigurationError } from '../errors/configuration-error.js';
import { Result, Ok, Err } from '../errors/result.js';
import type { BunTtsConfig } from '../types/config.js';

/**
 * Valid output formats
 */
const VALID_OUTPUT_FORMATS = ['mp3', 'wav', 'm4a', 'ogg'] as const;

/**
 * Valid output quality levels
 */
const VALID_OUTPUT_QUALITIES = ['low', 'medium', 'high', 'lossless'] as const;

/**
 * Output configuration validator
 *
 * Handles validation of output format and quality settings
 */
export class OutputValidator {
  /**
   * Validate output format
   *
   * @param {string} [format] - The output format to validate
   * @returns {Result<true, ConfigurationError>} Validation result
   */
  validateOutputFormat(format?: string): Result<true, ConfigurationError> {
    if (!format) {
      return Ok(true);
    }

    if (
      !VALID_OUTPUT_FORMATS.includes(
        format as (typeof VALID_OUTPUT_FORMATS)[number]
      )
    ) {
      return Err(
        new ConfigurationError(
          `Invalid output format: ${format}. Must be 'mp3', 'wav', 'm4a', or 'ogg'`
        )
      );
    }

    return Ok(true);
  }

  /**
   * Validate output quality
   *
   * @param {string} [quality] - The output quality to validate
   * @returns {Result<true, ConfigurationError>} Validation result
   */
  validateOutputQuality(quality?: string): Result<true, ConfigurationError> {
    if (!quality) {
      return Ok(true);
    }

    if (
      !VALID_OUTPUT_QUALITIES.includes(
        quality as (typeof VALID_OUTPUT_QUALITIES)[number]
      )
    ) {
      return Err(
        new ConfigurationError(
          `Invalid output quality: ${quality}. Must be 'low', 'medium', 'high', or 'lossless'`
        )
      );
    }

    return Ok(true);
  }

  /**
   * Validate output configuration
   *
   * @param {BunTtsConfig['output']} [output] - The output configuration to validate
   * @returns {Result<true, ConfigurationError>} Validation result
   */
  validateOutputConfig(
    output?: BunTtsConfig['output']
  ): Result<true, ConfigurationError> {
    if (!output) {
      return Ok(true);
    }

    const validations = [
      () => this.validateOutputFormat(output.format),
      () => this.validateOutputQuality(output.quality),
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
