/**
 * Profile Manager Utilities - Helper functions extracted from ProfileManager
 */

import { ConfigurationError } from '../errors/configuration-error.js';
import { Result, Err } from '../errors/result.js';

/**
 * Error creation utilities for profile operations
 */
export class ProfileErrorFactory {
  /**
   * Create a profile exists error
   *
   * @param {string} profileName - The profile name that already exists
   * @returns {Result<never, ConfigurationError>} Error result
   */
  static createProfileExistsError(
    profileName: string
  ): Result<never, ConfigurationError> {
    return Err(
      new ConfigurationError(`Profile '${profileName}' already exists`, {
        profileName,
      })
    );
  }

  /**
   * Create a profile not found error
   *
   * @param {string} profileName - The profile name that was not found
   * @returns {Result<never, ConfigurationError>} Error result
   */
  static createProfileNotFoundError(
    profileName: string
  ): Result<never, ConfigurationError> {
    return Err(
      new ConfigurationError(`Profile '${profileName}' not found`, {
        profileName,
      })
    );
  }

  /**
   * Create a config validation error
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
        `Profile '${profileName}' config validation failed: ${validationError.message}`,
        { profileName, originalError: validationError }
      )
    );
  }

  /**
   * Create a generic error for profile operations
   *
   * @param {string} operation - The operation that failed
   * @param {unknown} error - The error that occurred
   * @param {string} [profileName] - Optional profile name
   * @returns {Result<never, ConfigurationError>} Error result
   */
  static createError(
    operation: string,
    error: unknown,
    profileName?: string
  ): Result<never, ConfigurationError> {
    return Err(
      new ConfigurationError(
        `Failed to ${operation}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { profileName, error }
      )
    );
  }
}

/**
 * Profile name validation utilities
 */
export class ProfileNameValidator {
  /**
   * Check if profile name length is valid
   *
   * @param {string} name - The profile name to validate
   * @param {number} minLength - Minimum name length
   * @param {number} maxLength - Maximum name length
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
   * Check if profile name contains spaces
   *
   * @param {string} name - The profile name to validate
   * @returns {boolean} True if no spaces found
   */
  static hasNoSpaces(name: string): boolean {
    return !name.includes(' ');
  }

  /**
   * Validate specific profile name errors
   *
   * @param {string} name - The profile name to validate
   * @returns {Result<never, ConfigurationError>} Error result with appropriate message
   */
  static validateSpecificErrors(
    name: string
  ): Result<never, ConfigurationError> {
    const MINIMUM_NAME_LENGTH = 2;
    const MAXIMUM_NAME_LENGTH = 50;

    const lengthError = this.validateLengthErrors(
      name,
      MINIMUM_NAME_LENGTH,
      MAXIMUM_NAME_LENGTH
    );
    if (lengthError) return lengthError;

    const characterError = this.validateCharacterErrors(name);
    if (characterError) return characterError;

    const spaceError = this.validateSpaceErrors(name);
    if (spaceError) return spaceError;

    return Err(
      new ConfigurationError('Profile validation failed: unknown error')
    );
  }

  /**
   * Validate profile name length errors
   *
   * @param {string} name - The profile name to validate
   * @param {number} minLength - Minimum allowed length
   * @param {number} maxLength - Maximum allowed length
   * @returns {Result<never, ConfigurationError>} Error result with appropriate message
   */
  private static validateLengthErrors(
    name: string,
    minLength: number,
    maxLength: number
  ): Result<never, ConfigurationError> | undefined {
    if (name.length < minLength) {
      return Err(
        new ConfigurationError(
          `Profile validation failed: name must be at least ${minLength} characters long`,
          { profileName: name }
        )
      );
    }
    if (name.length > maxLength) {
      return Err(
        new ConfigurationError(
          `Profile validation failed: name must be less than ${maxLength} characters long`,
          { profileName: name }
        )
      );
    }
    return undefined;
  }

  /**
   * Validate profile name character errors
   *
   * @param {string} name - The profile name to validate
   * @returns {Result<never, ConfigurationError>} Error result with appropriate message
   */
  private static validateCharacterErrors(
    name: string
  ): Result<never, ConfigurationError> | undefined {
    if (!ProfileNameValidator.isValidCharacters(name)) {
      return Err(
        new ConfigurationError(
          'Profile validation failed: name format is invalid. Profile name can only contain letters, numbers, hyphens, and underscores',
          { profileName: name }
        )
      );
    }
    return undefined;
  }

  /**
   * Validate profile name space errors
   *
   * @param {string} name - The profile name to validate
   * @returns {Result<never, ConfigurationError>} Error result with appropriate message
   */
  private static validateSpaceErrors(
    name: string
  ): Result<never, ConfigurationError> | undefined {
    if (!ProfileNameValidator.hasNoSpaces(name)) {
      return Err(
        new ConfigurationError(
          'Profile validation failed: name format is invalid. Profile name cannot contain spaces. Use hyphens or underscores instead.',
          { profileName: name }
        )
      );
    }
    return undefined;
  }

  /**
   * Create a profile name validation error
   *
   * @param {string} name - The profile name that failed validation
   * @returns {Result<never, ConfigurationError>} Error result with appropriate message
   */
  static createValidationError(
    name: string
  ): Result<never, ConfigurationError> {
    if (name.length === 0 || name.trim() === '') {
      return Err(
        new ConfigurationError(
          'Profile validation failed: name cannot be empty'
        )
      );
    }
    return ProfileNameValidator.validateSpecificErrors(name);
  }
}

/**
 * Profile metadata creation utilities
 */
export class ProfileMetadataFactory {
  /**
   * Create profile metadata
   *
   * @param {string} name - Profile name
   * @param {string} [description] - Optional description
   * @param {string[]} [tags] - Optional tags array
   * @returns {import('./profile-manager.js').ProfileMetadata} Profile metadata object
   */
  static createMetadata(
    name: string,
    description?: string,
    tags?: string[]
  ): import('./profile-manager.js').ProfileMetadata {
    const now = new Date().toISOString();
    return {
      name,
      description: description || '',
      tags: tags || [],
      createdAt: now,
      updatedAt: now,
      isActive: false,
    };
  }
}

/**
 * Constants for profile validation
 */
export const ProfileValidationConstants = {
  MINIMUM_NAME_LENGTH: 2,
  MAXIMUM_NAME_LENGTH: 50,
  JSON_INDENT_SIZE: 2,
} as const;

/**
 * Profile file operation utilities
 */
export class ProfileFileOperations {
  /**
   * Delete a profile file
   *
   * @param {string} profilesDir - The profiles directory
   * @param {string} profileName - The profile name to delete
   * @returns {Promise<void>}
   */
  static async deleteProfileFile(
    profilesDir: string,
    profileName: string
  ): Promise<void> {
    const { promises: fs } = await import('fs');
    const { join } = await import('path');
    const profilePath = join(profilesDir, `${profileName}.json`);
    await fs.unlink(profilePath);
  }

  /**
   * Read a profile file
   *
   * @param {string} profilePath - The path to the profile file
   * @returns {Promise<import('./profile-manager.js').ProfileData>} Parsed profile data
   */
  static async readProfileFile(
    profilePath: string
  ): Promise<import('./profile-manager.js').ProfileData> {
    const { promises: fs } = await import('fs');
    const content = await fs.readFile(profilePath, 'utf-8');
    return JSON.parse(content) as import('./profile-manager.js').ProfileData;
  }

  /**
   * Save a profile file
   *
   * @param {string} profileName - The profile name
   * @param {import('./profile-manager.js').ProfileData} profileData - The profile data to save
   * @param {string} profilesDir - The profiles directory
   * @returns {Promise<void>}
   */
  static async saveProfile(
    profileName: string,
    profileData: import('./profile-manager.js').ProfileData,
    profilesDir: string
  ): Promise<void> {
    const { promises: fs } = await import('fs');
    const { join, dirname } = await import('path');
    const profilePath = join(profilesDir, `${profileName}.json`);
    await fs.mkdir(dirname(profilePath), { recursive: true });
    await fs.writeFile(
      profilePath,
      JSON.stringify(
        profileData,
        null,
        ProfileValidationConstants.JSON_INDENT_SIZE
      ),
      'utf-8'
    );
  }

  /**
   * Check if a profile exists
   *
   * @param {string} profilesDir - The profiles directory
   * @param {string} profileName - The profile name to check
   * @returns {Promise<boolean>} True if profile exists
   */
  static async profileExists(
    profilesDir: string,
    profileName: string
  ): Promise<boolean> {
    try {
      const { promises: fs } = await import('fs');
      const { join } = await import('path');
      const profilePath = join(profilesDir, `${profileName}.json`);
      await fs.access(profilePath);
      return true;
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Check if a file is not found error
   *
   * @param {unknown} error - The error to check
   * @returns {boolean} True if it's a file not found error
   */
  static isFileNotFoundError(error: unknown): boolean {
    return error instanceof Error && 'code' in error && error.code === 'ENOENT';
  }
}
