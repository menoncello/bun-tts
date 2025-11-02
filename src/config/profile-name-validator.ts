import { ConfigurationError } from '../errors/configuration-error.js';
import { Result, Err } from '../errors/result.js';
import {
  MINIMUM_NAME_LENGTH,
  MAXIMUM_NAME_LENGTH,
} from './profile-constants.js';

/**
 * Profile name validator utility
 */
export class ProfileNameValidator {
  /**
   * Check if profile name length is valid
   *
   * @param {string} name - The profile name to validate
   * @param {number} minLength - Minimum allowed length
   * @param {number} maxLength - Maximum allowed length
   * @returns {boolean} True if length is valid
   */
  static isValidLength(
    name: string,
    minLength: number,
    maxLength: number
  ): boolean {
    return name.length >= minLength && name.length <= maxLength;
  }

  /**
   * Check if profile name characters are valid
   *
   * @param {string} name - The profile name to validate
   * @returns {boolean} True if characters are valid
   */
  static isValidCharacters(name: string): boolean {
    return /^[\w-]+$/.test(name);
  }

  /**
   * Check if profile name contains valid spaces
   *
   * @param {string} name - The profile name to validate
   * @returns {boolean} True if spaces are valid
   */
  static hasNoSpaces(name: string): boolean {
    return !name.includes(' ');
  }

  /**
   * Create validation error for profile name
   *
   * @param {string} name - The profile name that failed validation
   * @returns {Result<never, ConfigurationError>} Error result
   */
  static createValidationError(
    name: string
  ): Result<never, ConfigurationError> {
    return Err(
      new ConfigurationError(
        'Invalid profile name. Please check the name length, characters, and spacing.',
        {
          code: 'INVALID_PROFILE_NAME',
          name,
          minLength: MINIMUM_NAME_LENGTH,
          maxLength: MAXIMUM_NAME_LENGTH,
        }
      )
    );
  }
}
