import { ConfigurationError } from '../errors/configuration-error.js';
import type { Logger } from '../interfaces/logger.js';
import { ProfileFileOperations } from './profile-file-operations.js';
import type { ProfileData } from './profile-manager.js';

/**
 * Profile validation constants
 */
const MINIMUM_NAME_LENGTH = 2;
const MAXIMUM_NAME_LENGTH = 50;
const MAXIMUM_DESCRIPTION_LENGTH = 500;

/**
 * Profile validation utility class for import/export operations
 */
export class ProfileImportValidation {
  private fileOperations: ProfileFileOperations;
  private logger: Logger;

  /**
   * Create a new ProfileImportValidation instance
   *
   * @param {ProfileFileOperations} fileOperations - File operations instance
   * @param {Logger} logger - Logger instance for recording operations
   */
  constructor(fileOperations: ProfileFileOperations, logger: Logger) {
    this.fileOperations = fileOperations;
    this.logger = logger;
  }

  /**
   * Validate profile name
   *
   * @param {string} name - The profile name to validate
   * @returns {string | null} Error message if validation fails, null if valid
   */
  validateProfileName(name: string): string | null {
    if (!name || name.trim().length === 0) {
      return 'Profile name is required and cannot be empty';
    }
    if (name.length < MINIMUM_NAME_LENGTH) {
      return `Profile name must be at least ${MINIMUM_NAME_LENGTH} characters long`;
    }
    if (name.length > MAXIMUM_NAME_LENGTH) {
      return `Profile name cannot exceed ${MAXIMUM_NAME_LENGTH} characters`;
    }
    return null;
  }

  /**
   * Validate profile description
   *
   * @param {string | undefined} description - The profile description to validate
   * @returns {string | null} Error message if validation fails, null if valid
   */
  validateProfileDescription(description: string | undefined): string | null {
    if (description && description.length > MAXIMUM_DESCRIPTION_LENGTH) {
      return `Profile description cannot exceed ${MAXIMUM_DESCRIPTION_LENGTH} characters`;
    }
    return null;
  }

  /**
   * Collect validation errors for a profile
   *
   * @param {ProfileData} profileData - The profile data to validate
   * @returns {ConfigurationError[]} Array of validation errors
   */
  collectProfileValidationErrors(
    profileData: ProfileData
  ): ConfigurationError[] {
    const errors: ConfigurationError[] = [];

    // Validate profile name
    const nameError = this.validateProfileName(profileData.name);
    if (nameError) {
      errors.push(new ConfigurationError(nameError));
    }

    // Validate description length
    const descriptionError = this.validateProfileDescription(
      profileData.description
    );
    if (descriptionError) {
      errors.push(new ConfigurationError(descriptionError));
    }

    return errors;
  }

  /**
   * Load and validate profile data
   *
   * @param {string} filePath - The file path to load from
   * @returns {Promise<ProfileData | null>} The profile data or null if validation fails
   */
  async loadAndValidateProfile(filePath: string): Promise<ProfileData | null> {
    try {
      const profileData = await this.fileOperations.readProfileFile(filePath);
      const validationErrors = this.collectProfileValidationErrors(profileData);

      if (validationErrors.length > 0) {
        return null;
      }

      return profileData;
    } catch {
      return null;
    }
  }
}
