import { ConfigurationError } from '../errors/configuration-error.js';
import { Result, Err } from '../errors/result.js';

/**
 * Profile error factory
 */
export class ProfileErrorFactory {
  /**
   * Create profile exists error
   *
   * @param {string} profileName - The profile name that already exists
   * @returns {Result<never, ConfigurationError>} Error result
   */
  static createProfileExistsError(
    profileName: string
  ): Result<never, ConfigurationError> {
    return Err(
      new ConfigurationError(`Profile '${profileName}' already exists`, {
        code: 'PROFILE_EXISTS',
        profileName,
      })
    );
  }

  /**
   * Create profile not found error
   *
   * @param {string} profileName - The profile name that was not found
   * @returns {Result<never, ConfigurationError>} Error result
   */
  static createProfileNotFoundError(
    profileName: string
  ): Result<never, ConfigurationError> {
    return Err(
      new ConfigurationError(`Profile '${profileName}' not found`, {
        code: 'PROFILE_NOT_FOUND',
        profileName,
      })
    );
  }

  /**
   * Create configuration validation error
   *
   * @param {string} profileName - The profile name
   * @param {ConfigurationError} validationError - The validation error
   * @returns {Result<never, ConfigurationError>} Error result
   */
  static createConfigValidationError(
    profileName: string,
    validationError: ConfigurationError
  ): Result<never, ConfigurationError> {
    return Err(
      new ConfigurationError(
        `Configuration validation failed for profile '${profileName}': ${validationError.message}`,
        {
          code: 'CONFIG_VALIDATION_FAILED',
          profileName,
          originalError: validationError,
        }
      )
    );
  }

  /**
   * Create general operation error
   *
   * @param {string} operation - The operation that failed
   * @param {unknown} error - The error that occurred
   * @param {string | undefined} profileName - The profile name (if applicable)
   * @returns {Result<never, ConfigurationError>} Error result
   */
  static createError(
    operation: string,
    error: unknown,
    profileName?: string
  ): Result<never, ConfigurationError> {
    const message = error instanceof Error ? error.message : String(error);
    const details: { [key: string]: unknown } = { error };

    if (profileName) {
      details.profileName = profileName;
    }

    return Err(
      new ConfigurationError(`Failed to ${operation}: ${message}`, details)
    );
  }
}
