import { ConfigurationError } from '../errors/configuration-error.js';
import { Result, Ok, Err } from '../errors/result.js';
import type { BunTtsConfig } from '../types/config.js';

/**
 * CLI configuration validator
 *
 * Handles validation of command-line interface settings
 */
export class CliValidator {
  /**
   * Validate boolean configuration values
   *
   * @param {unknown} value - The value to validate
   * @param {string} fieldName - The field name for error messages
   * @returns {Result<true, ConfigurationError>} Validation result
   */
  private validateBooleanValue(
    value: unknown,
    fieldName: string
  ): Result<true, ConfigurationError> {
    if (value !== undefined && typeof value !== 'boolean') {
      return Err(
        new ConfigurationError(`Invalid ${fieldName} value: must be boolean`)
      );
    }
    return Ok(true);
  }

  /**
   * Validate CLI configuration
   *
   * @param {BunTtsConfig['cli']} cli - The CLI configuration to validate
   * @returns {Result<true, ConfigurationError>} Validation result
   */
  validateCliConfig(
    cli?: BunTtsConfig['cli']
  ): Result<true, ConfigurationError> {
    const validations = [
      () => this.validateBooleanValue(cli?.showProgress, 'show progress'),
      () => this.validateBooleanValue(cli?.colors, 'colors'),
      () => this.validateBooleanValue(cli?.debug, 'debug'),
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
