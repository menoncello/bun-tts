import { promises as fs } from 'fs';
import { join } from 'path';
import { ConfigurationError } from '../errors/configuration-error.js';
import { Result, Ok, Err } from '../errors/result.js';
import type { Logger } from '../interfaces/logger.js';
import type { BunTtsConfig } from '../types/config.js';
import { ConfigValidator } from './config-validator.js';
import {
  JSON_INDENT_SIZE,
  DEFAULT_PROFILES_DIR,
  ACTIVE_PROFILE_FILENAME,
} from './profile-constants.js';
import { ProfileErrorFactory } from './profile-error-factory.js';
import { ProfileFileOperations } from './profile-file-operations.js';
import {
  ProfileImportExportManager,
  type ImportOptions,
} from './profile-import-export.js';
import { ProfileMetadataFactory } from './profile-metadata-factory.js';
import { ProfileValidationUtils } from './profile-validation-utils.js';

/**
 * Default mock logger for testing purposes
 */
const MOCK_LOGGER: Logger = {
  debug: () => {
    /* Debug logging disabled */
  },
  info: () => {
    /* Info logging disabled */
  },
  warn: () => {
    /* Warning logging disabled */
  },
  error: () => {
    /* Error logging disabled */
  },
  fatal: () => {
    /* Fatal logging disabled */
  },
  child: () => MOCK_LOGGER,
};

/**
 * Profile metadata interface
 */
export interface ProfileMetadata {
  name: string;
  description?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;
}

/**
 * Profile data structure
 */
export interface ProfileData {
  name: string;
  description?: string;
  tags?: string[];
  config: Record<string, unknown>;
  metadata?: ProfileMetadata;
  isActive?: boolean;
}

/**
 * Profile creation data
 */
export interface CreateProfileData {
  name: string;
  description?: string;
  tags?: string[];
  config?: Partial<BunTtsConfig>;
}

/**
 * Profile validation result interface
 */
export interface ProfileValidationResult {
  valid: boolean;
  error?: ConfigurationError;
  errors?: ConfigurationError[];
}

/**
 * Profile metadata validation result
 */
export interface MetadataValidationResult {
  valid: boolean;
  errors?: ConfigurationError[];
}

/**
 * ProfileManager - Manages user configuration profiles
 *
 * Provides functionality to create, switch, list, and delete configuration profiles.
 * Profiles allow users to save and switch between different configuration setups
 * for different types of projects.
 */
export class ProfileManager {
  private profilesDir!: string;
  private activeProfilePath!: string;
  private validator!: ConfigValidator;
  private fileOperations!: ProfileFileOperations;
  private validationUtils!: ProfileValidationUtils;
  private importExportManager!: ProfileImportExportManager;
  private logger!: Logger;

  /**
   * Create a new ProfileManager
   *
   * @param {string} profilesDir - Directory where profiles are stored
   * @param {Logger} logger - Logger instance for recording operations
   * @returns {void}
   */
  constructor(profilesDir: string, logger: Logger);
  /**
   * Create a new ProfileManager (default constructor)
   */
  constructor();
  constructor(profilesDir?: string | Logger, logger?: Logger) {
    if (typeof profilesDir === 'string') {
      this.initializeWithStringParams(profilesDir, logger as Logger);
    } else {
      this.initializeWithDefaultParams();
    }
  }

  /**
   * Initialize ProfileManager with string parameters
   *
   * @param {string} profilesDir - Directory where profiles are stored
   * @param {Logger} logger - Logger instance for recording operations
   * @private
   */
  private initializeWithStringParams(
    profilesDir: string,
    logger: Logger
  ): void {
    this.profilesDir = profilesDir;
    this.activeProfilePath = join(profilesDir, ACTIVE_PROFILE_FILENAME);
    this.validator = new ConfigValidator();
    this.fileOperations = new ProfileFileOperations(
      profilesDir,
      logger.child({ component: 'ProfileFileOperations' })
    );
    this.validationUtils = new ProfileValidationUtils(
      logger.child({ component: 'ProfileValidationUtils' })
    );
    this.importExportManager = new ProfileImportExportManager(
      profilesDir,
      logger.child({ component: 'ProfileImportExportManager' })
    );
    this.logger = logger.child({ component: 'ProfileManager' });
  }

  /**
   * Initialize ProfileManager with default parameters
   *
   * @private
   */
  private initializeWithDefaultParams(): void {
    this.profilesDir = DEFAULT_PROFILES_DIR;
    this.activeProfilePath = join(this.profilesDir, ACTIVE_PROFILE_FILENAME);
    this.validator = new ConfigValidator();
    this.fileOperations = new ProfileFileOperations(
      this.profilesDir,
      MOCK_LOGGER.child({ component: 'ProfileFileOperations' })
    );
    this.validationUtils = new ProfileValidationUtils(
      MOCK_LOGGER.child({ component: 'ProfileValidationUtils' })
    );
    this.importExportManager = new ProfileImportExportManager(
      this.profilesDir,
      MOCK_LOGGER
    );
    this.logger = MOCK_LOGGER;
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
   * Validate profile metadata
   *
   * @param {ProfileMetadata} metadata - The metadata to validate
   * @returns {MetadataValidationResult} Validation result
   */
  validateMetadata(metadata: ProfileMetadata): MetadataValidationResult {
    const errors: ConfigurationError[] =
      this.validationUtils.collectMetadataValidationErrors(metadata);

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  }

  /**
   * Validate a complete profile
   *
   * @param {ProfileData} profile - The profile to validate
   * @returns {ProfileValidationResult} Validation result
   */
  validateProfile(profile: ProfileData): ProfileValidationResult {
    const errors: ConfigurationError[] =
      this.validationUtils.collectProfileValidationErrors(profile);

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  }

  /**
   * Validate tags
   *
   * @param {string[]} tags - The tags to validate
   * @returns {ProfileValidationResult} Validation result
   */
  validateTags(tags: string[]): ProfileValidationResult {
    const result = this.validationUtils.validateTags(tags);
    const errors: ConfigurationError[] = result.success ? [] : [result.error];

    return {
      valid: result.success,
      errors: errors,
    };
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

    return {
      name: data.name,
      description: data.description,
      tags: data.tags,
      config: data.config || {},
      metadata,
    };
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
   * List all profiles
   *
   * @returns {Promise<Result<ProfileData[], ConfigurationError>>} Result containing an array of profiles or an error
   */
  async list(): Promise<Result<ProfileData[], ConfigurationError>> {
    try {
      this.logger.debug('Listing profiles');
      await fs.mkdir(this.profilesDir, { recursive: true });
      const entriesResult = await this.readProfileDirectory();
      if (!entriesResult.success) {
        return Ok([]);
      }

      const activeProfile = await this.getActiveProfileName();
      const profiles = await this.processProfileEntries(
        entriesResult.data,
        activeProfile
      );

      this.logger.debug('Profiles listed successfully', {
        count: profiles.length,
      });
      return Ok(profiles);
    } catch (error) {
      this.logger.error('Failed to list profiles', { error });
      return ProfileErrorFactory.createError('list profiles', error);
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

      if (!profileData.metadata) {
        profileData.metadata = {} as ProfileMetadata;
      }

      profileData.metadata.isActive = profileData.name === activeProfile;
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
   * Read profile directory
   *
   * @returns {Promise<Result<string[], ConfigurationError>>} Result containing directory entries or error
   */
  private async readProfileDirectory(): Promise<
    Result<string[], ConfigurationError>
  > {
    try {
      const entries = await fs.readdir(this.profilesDir);
      return Ok(entries);
    } catch (error) {
      return Err(
        new ConfigurationError(
          `Failed to read profile directory: ${
            error instanceof Error ? error.message : String(error)
          }`,
          { error }
        )
      );
    }
  }

  /**
   * Process profile directory entries
   *
   * @param {string[]} entries - Array of directory entries
   * @param {string | null} activeProfile - The currently active profile name
   * @returns {Promise<ProfileData[]>} Array of processed profiles
   */
  private async processProfileEntries(
    entries: string[],
    activeProfile: string | null
  ): Promise<ProfileData[]> {
    const profiles: ProfileData[] = [];

    for (const entry of entries) {
      if (this.isValidProfileFile(entry)) {
        const profilePath = join(this.profilesDir, entry);
        const profileData = await this.loadProfileWithActiveFlag(
          profilePath,
          entry,
          activeProfile
        );
        if (profileData) {
          profiles.push(profileData);
        }
      }
    }

    return profiles;
  }

  /**
   * Check if file is a valid profile file
   *
   * @param {string} entry - File entry name
   * @returns {boolean} True if it's a valid profile file
   */
  private isValidProfileFile(entry: string): boolean {
    return entry !== ACTIVE_PROFILE_FILENAME && entry.endsWith('.json');
  }

  /**
   * Load profile with active flag
   *
   * @param {string} profilePath - The profile file path
   * @param {string} entryName - The file entry name
   * @param {string | null} activeProfile - The currently active profile name
   * @returns {Promise<ProfileData | null>} The profile data or null if loading failed
   */
  private async loadProfileWithActiveFlag(
    profilePath: string,
    entryName: string,
    activeProfile: string | null
  ): Promise<ProfileData | null> {
    try {
      const profileData =
        await this.fileOperations.readProfileFile(profilePath);
      const profileName = entryName.replace('.json', '');

      if (!profileData.metadata) {
        profileData.metadata = {} as ProfileMetadata;
      }

      profileData.metadata.isActive = profileName === activeProfile;
      return profileData;
    } catch (error) {
      this.logger.warn('Failed to read profile', { entry: entryName, error });
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
   * @param {string} activeProfileName - The name of the profile to activate
   * @returns {Promise<Result<void, ConfigurationError>>} Result indicating success or error
   */
  private async updateActiveProfileFlags(
    activeProfileName: string
  ): Promise<Result<void, ConfigurationError>> {
    const listResult = await this.list();
    if (!listResult.success) {
      return listResult as Result<void, ConfigurationError>;
    }

    await this.updateProfileFlags(listResult.data, activeProfileName);
    return Ok(void 0);
  }

  /**
   * Update profile flags for all profiles
   *
   * @param {ProfileData[]} profiles - Array of profiles to update
   * @param {string} activeProfileName - The currently active profile name
   * @returns {Promise<void>}
   */
  private async updateProfileFlags(
    profiles: ProfileData[],
    activeProfileName: string
  ): Promise<void> {
    const updatePromises = profiles.map((profile) =>
      this.updateSingleProfileFlag(profile, activeProfileName)
    );
    await Promise.all(updatePromises);
  }

  /**
   * Update a single profile's active flag
   *
   * @param {ProfileData} profile - The profile to update
   * @param {string} activeProfileName - The currently active profile name
   * @returns {Promise<void>}
   */
  private async updateSingleProfileFlag(
    profile: ProfileData,
    activeProfileName: string
  ): Promise<void> {
    const updatedMetadata: ProfileMetadata = {
      name: profile.metadata?.name || profile.name,
      description: profile.metadata?.description || '',
      tags: profile.metadata?.tags || [],
      createdAt: profile.metadata?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: profile.metadata?.name === activeProfileName,
    };

    const updatedProfile: ProfileData = {
      ...profile,
      metadata: updatedMetadata,
    };

    await this.saveProfile(updatedMetadata.name, updatedProfile);
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
   * Export all profiles to a directory
   *
   * Delegates to ProfileImportExportManager for export functionality.
   *
   * @param {string} sourceDir - The directory containing profiles to export
   * @param {string} targetDir - The directory where profiles should be exported
   * @param {string} [format='json'] - The format to export ('json' or 'yaml')
   * @returns {Promise<Result<{ success: true }, ConfigurationError>>} A Result indicating success
   */
  async export(
    sourceDir: string,
    targetDir: string,
    format: 'json' | 'yaml' = 'json'
  ): Promise<Result<{ success: true }, ConfigurationError>> {
    return this.importExportManager.export(sourceDir, targetDir, format);
  }

  /**
   * Import profiles from a directory
   *
   * Delegates to ProfileImportExportManager for import functionality.
   *
   * @param {string} sourceDir - The directory containing profile files to import
   * @param {object} [options] - Import options
   * @param {string} [options.mergeStrategy='overwrite'] - How to handle conflicts ('overwrite', 'skip', or 'merge')
   * @returns {Promise<Result<{ importedCount: number; failedCount: number; errors?: Array<{ file: string; error: string }> }, ConfigurationError>>} A Result containing import statistics
   */
  async import(
    sourceDir: string,
    options?: ImportOptions
  ): Promise<
    Result<
      {
        importedCount: number;
        failedCount: number;
        errors?: Array<{ file: string; error: string }>;
      },
      ConfigurationError
    >
  > {
    return this.importExportManager.import(sourceDir, options);
  }
}
