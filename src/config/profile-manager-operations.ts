import { promises as fs } from 'fs';
import { join } from 'path';
import { ConfigurationError } from '../errors/configuration-error.js';
import { Result, Ok, Err } from '../errors/result.js';
import type { Logger } from '../interfaces/logger.js';
import { DEFAULT_CONFIG } from '../types/config.js';
import { ConfigMerger } from './config-merger.js';
import {
  JSON_INDENT_SIZE,
  ACTIVE_PROFILE_FILENAME,
} from './profile-constants.js';
import { ProfileErrorFactory } from './profile-error-factory.js';
import { ProfileFileOperations } from './profile-file-operations.js';
import type {
  CreateProfileData,
  ProfileData,
  ProfileValidationResult,
} from './profile-manager.js';
import { ProfileMetadataFactory } from './profile-metadata-factory.js';
import { ProfileValidationUtils } from './profile-validation-utils.js';

/**
 * Profile manager operations utility class
 *
 * Handles core CRUD operations for profile management.
 */
export class ProfileManagerOperations {
  private profilesDir: string;
  private activeProfilePath: string;
  private fileOperations: ProfileFileOperations;
  private validationUtils: ProfileValidationUtils;
  private configMerger: ConfigMerger;
  private logger: Logger;

  /**
   * Create a new ProfileManagerOperations instance
   *
   * @param {string} profilesDir - Directory where profiles are stored
   * @param {Logger} logger - Logger instance for recording operations
   */
  constructor(profilesDir: string, logger: Logger) {
    this.profilesDir = profilesDir;
    this.activeProfilePath = join(profilesDir, ACTIVE_PROFILE_FILENAME);
    this.fileOperations = new ProfileFileOperations(profilesDir, logger);
    this.validationUtils = new ProfileValidationUtils(logger);
    this.configMerger = new ConfigMerger();
    this.logger = logger;
  }

  /**
   * Create a new profile
   *
   * @param {CreateProfileData} data - Profile creation data
   * @returns {Promise<Result<ProfileData, ConfigurationError>>} Result containing the created profile or an error
   */
  async create(
    data: CreateProfileData
  ): Promise<Result<ProfileData, ConfigurationError>> {
    try {
      this.logger.info('Creating profile', { name: data.name });

      const validationResult = this.validateProfileName(data.name);
      if (!validationResult.valid) {
        return Err(
          validationResult.error || new ConfigurationError('Validation failed')
        );
      }

      const existsResult = await this.profileExists(data.name);
      if (existsResult.success && existsResult.data) {
        return ProfileErrorFactory.createProfileExistsError(data.name);
      }

      const profileData = this.buildProfileData(data);
      await this.saveProfile(data.name, profileData);

      this.logger.info('Profile created successfully', { name: data.name });
      return Ok(profileData);
    } catch (error) {
      this.logger.error('Failed to create profile', { name: data.name, error });
      return ProfileErrorFactory.createError(
        'create profile',
        error,
        data.name
      );
    }
  }

  /**
   * Switch to a different profile
   *
   * @param {string} profileName - Name of the profile to switch to
   * @returns {Promise<Result<{ activeProfile: string }, ConfigurationError>>} Result containing the active profile name or an error
   */
  async switch(
    profileName: string
  ): Promise<Result<{ activeProfile: string }, ConfigurationError>> {
    try {
      this.logger.info('Switching profile', { profileName });
      const getResult = await this.get(profileName);
      if (!getResult.success) {
        return ProfileErrorFactory.createProfileNotFoundError(profileName);
      }

      const updateResult = await this.updateActiveProfileFlags(profileName);
      if (!updateResult.success) {
        return updateResult as Result<
          { activeProfile: string },
          ConfigurationError
        >;
      }

      await this.writeActiveProfile(profileName);
      this.logger.info('Profile switched successfully', { profileName });
      return Ok({ activeProfile: profileName });
    } catch (error) {
      this.logger.error('Failed to switch profile', { profileName, error });
      return ProfileErrorFactory.createError(
        'switch profile',
        error,
        profileName
      );
    }
  }

  /**
   * Delete a profile
   *
   * @param {string} profileName - Name of the profile to delete
   * @returns {Promise<Result<void, ConfigurationError>>} Result indicating success or containing an error
   */
  async delete(profileName: string): Promise<Result<void, ConfigurationError>> {
    try {
      this.logger.info('Deleting profile', { profileName });
      const getResult = await this.get(profileName);
      if (!getResult.success) {
        return ProfileErrorFactory.createProfileNotFoundError(profileName);
      }

      const validateResult = this.validateProfileDeletion(
        getResult.data,
        profileName
      );
      if (!validateResult.success) {
        return validateResult as Result<void, ConfigurationError>;
      }

      await this.fileOperations.deleteProfileFile(profileName);
      this.logger.info('Profile deleted successfully', { profileName });
      return Ok(void 0);
    } catch (error) {
      this.logger.error('Failed to delete profile', { profileName, error });
      return ProfileErrorFactory.createError(
        'delete profile',
        error,
        profileName
      );
    }
  }

  /**
   * Get a profile by name
   *
   * @param {string} profileName - Name of the profile to retrieve
   * @returns {Promise<Result<ProfileData, ConfigurationError>>} Result containing the profile or an error
   */
  async get(
    profileName: string
  ): Promise<Result<ProfileData, ConfigurationError>> {
    try {
      this.logger.debug('Getting profile', { profileName });
      const profilePath = join(this.profilesDir, `${profileName}.json`);
      const profileData =
        await this.fileOperations.readProfileFile(profilePath);
      const activeProfile = await this.getActiveProfileName();

      this.updateProfileMetadata(profileData, activeProfile);
      this.logger.debug('Profile retrieved successfully', { profileName });
      return Ok(profileData);
    } catch (error) {
      if (this.fileOperations.isFileNotFoundError(error)) {
        this.logger.debug('Profile not found', { profileName });
        return ProfileErrorFactory.createProfileNotFoundError(profileName);
      }
      this.logger.error('Failed to get profile', { profileName, error });
      return ProfileErrorFactory.createError('get profile', error, profileName);
    }
  }

  /**
   * Update profile metadata ensuring it exists and setting active flag
   *
   * @param {ProfileData} profileData - The profile data to update
   * @param {string | null} activeProfile - The currently active profile name
   * @returns {void}
   */
  private updateProfileMetadata(
    profileData: ProfileData,
    activeProfile: string | null
  ): void {
    // Ensure metadata exists
    if (profileData.metadata === undefined) {
      profileData.metadata = {
        name: profileData.name,
        description: profileData.description || '',
        tags: profileData.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: profileData.name === activeProfile,
      };
    } else {
      // Metadata exists, just update the active flag
      profileData.metadata.isActive = profileData.name === activeProfile;
    }
  }

  /**
   * Validate a profile name
   *
   * @param {string} name - The profile name to validate
   * @returns {ProfileValidationResult} Validation result
   */
  validateProfileName(name: string): ProfileValidationResult {
    const result = this.validationUtils.validateProfileName(name);
    if (result.success) {
      return { valid: true, errors: [] };
    }
    return {
      valid: false,
      error: result.error,
      errors: [result.error],
    };
  }

  /**
   * Build profile data from creation data
   *
   * @param {CreateProfileData} data - Profile creation data
   * @returns {ProfileData} The built profile data
   */
  private buildProfileData(data: CreateProfileData): ProfileData {
    const metadata = ProfileMetadataFactory.createMetadata(
      data.name,
      data.description,
      data.tags
    );

    // Merge user config with defaults
    const mergedConfig = data.config
      ? this.configMerger.mergeWithDefaults(DEFAULT_CONFIG, data.config)
      : DEFAULT_CONFIG;

    return {
      name: data.name,
      description: data.description,
      tags: data.tags,
      config: mergedConfig as unknown as Record<string, unknown>,
      metadata,
    };
  }

  /**
   * Check if a profile exists
   *
   * @param {string} profileName - The profile name to check
   * @returns {Promise<Result<boolean, ConfigurationError>>} Result indicating if profile exists
   */
  private async profileExists(
    profileName: string
  ): Promise<Result<boolean, ConfigurationError>> {
    try {
      const exists = await this.fileOperations.profileExists(profileName);
      return Ok(exists);
    } catch (error) {
      return Err(
        new ConfigurationError(
          `Failed to check profile existence: ${
            error instanceof Error ? error.message : String(error)
          }`,
          { profileName, error }
        )
      );
    }
  }

  /**
   * Write active profile to file
   *
   * @param {string} profileName - The profile name to mark as active
   * @returns {Promise<void>}
   */
  private async writeActiveProfile(profileName: string): Promise<void> {
    await fs.writeFile(
      this.activeProfilePath,
      JSON.stringify({ active: profileName }, null, JSON_INDENT_SIZE)
    );
  }

  /**
   * Get the currently active profile name
   *
   * @returns {Promise<string | null>} The active profile name or null if none
   */
  private async getActiveProfileName(): Promise<string | null> {
    try {
      const content = await fs.readFile(this.activeProfilePath, 'utf-8');
      const data = JSON.parse(content);
      return data.active || null;
    } catch {
      return null;
    }
  }

  /**
   * Validate profile deletion
   *
   * @param {ProfileData} profileData - The profile to validate
   * @param {string} profileName - The profile name
   * @returns {Result<void, ConfigurationError>} Result indicating if deletion is allowed
   */
  private validateProfileDeletion(
    profileData: ProfileData,
    profileName: string
  ): Result<void, ConfigurationError> {
    if (profileData.metadata?.isActive) {
      return Err(
        new ConfigurationError(
          `Cannot delete active profile '${profileName}'. Switch to another profile first.`,
          { profileName }
        )
      );
    }
    return Ok(void 0);
  }

  /**
   * Update active profile flags across all profiles
   *
   * @param {string} _activeProfileName - The name of the profile to activate
   * @returns {Promise<Result<void, ConfigurationError>>} Result indicating success or error
   */
  private async updateActiveProfileFlags(
    _activeProfileName: string
  ): Promise<Result<void, ConfigurationError>> {
    // This would need access to the list method, which creates circular dependency
    // For now, return success and let the main ProfileManager handle this
    return Ok(void 0);
  }

  /**
   * Save a profile to the profiles directory
   *
   * @param {string} profileName - The profile name
   * @param {ProfileData} profileData - The profile data to save
   * @returns {Promise<void>}
   */
  private async saveProfile(
    profileName: string,
    profileData: ProfileData
  ): Promise<void> {
    await this.fileOperations.saveProfile(profileName, profileData);
  }
}
