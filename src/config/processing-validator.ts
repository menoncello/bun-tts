import { ConfigurationError } from '../errors/configuration-error.js';
import { Result, Ok, Err } from '../errors/result.js';
import type { BunTtsConfig } from '../types/config.js';
import { MIN_WORKERS, MAX_WORKERS } from './config-validator-constants.js';

/**
 * Processing configuration validator
 *
 * Handles validation of file processing and worker configuration
 */
export class ProcessingValidator {
  /**
   * Validate max file size
   *
   * @param {number} maxFileSize - The max file size to validate
   * @returns {Result<true, ConfigurationError>} Validation result
   */
  validateMaxFileSize(maxFileSize?: number): Result<true, ConfigurationError> {
    if (maxFileSize !== undefined && maxFileSize <= 0) {
      return Err(new ConfigurationError('Max file size must be positive'));
    }
    return Ok(true);
  }

  /**
   * Validate max workers
   *
   * @param {number} maxWorkers - The max workers to validate
   * @returns {Result<true, ConfigurationError>} Validation result
   */
  validateMaxWorkers(maxWorkers?: number): Result<true, ConfigurationError> {
    if (
      maxWorkers !== undefined &&
      (maxWorkers < MIN_WORKERS || maxWorkers > MAX_WORKERS)
    ) {
      return Err(
        new ConfigurationError(
          `Max workers must be between ${MIN_WORKERS} and ${MAX_WORKERS}`
        )
      );
    }
    return Ok(true);
  }

  /**
   * Validate processing configuration
   *
   * @param {BunTtsConfig['processing']} processing - The processing configuration to validate
   * @returns {Result<true, ConfigurationError>} Validation result
   */
  validateProcessingConfig(
    processing?: BunTtsConfig['processing']
  ): Result<true, ConfigurationError> {
    const validations = [
      () => this.validateMaxFileSize(processing?.maxFileSize),
      () => this.validateMaxWorkers(processing?.maxWorkers),
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
