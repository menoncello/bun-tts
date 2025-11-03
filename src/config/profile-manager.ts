import { ConfigurationError } from '../errors/configuration-error.js';
import { Result } from '../errors/result.js';
import type { Logger } from '../interfaces/logger.js';
import { DEFAULT_PROFILES_DIR } from './profile-constants.js';
import { ProfileImportExportManager } from './profile-import-export.js';
import type { ImportOptions } from './profile-import-types.js';
import { ProfileManagerListing } from './profile-manager-listing.js';
import { ProfileManagerOperations } from './profile-manager-operations.js';
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
  config?: Partial<Record<string, unknown>>;
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
  private operations!: ProfileManagerOperations;
  private listing!: ProfileManagerListing;
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
  /**
   * Constructor with optional parameters - handles both parameterized and default initialization
   *
   * @param {(string | Logger) | undefined} profilesDir - Directory where profiles are stored or Logger instance if first parameter is Logger
   * @param {Logger} [logger] - Logger instance for recording operations
   */
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
    this.operations = new ProfileManagerOperations(
      profilesDir,
      logger.child({ component: 'ProfileManagerOperations' })
    );
    this.listing = new ProfileManagerListing(
      profilesDir,
      logger.child({ component: 'ProfileManagerListing' })
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
    this.operations = new ProfileManagerOperations(
      DEFAULT_PROFILES_DIR,
      MOCK_LOGGER.child({ component: 'ProfileManagerOperations' })
    );
    this.listing = new ProfileManagerListing(
      DEFAULT_PROFILES_DIR,
      MOCK_LOGGER.child({ component: 'ProfileManagerListing' })
    );
    this.validationUtils = new ProfileValidationUtils(
      MOCK_LOGGER.child({ component: 'ProfileValidationUtils' })
    );
    this.importExportManager = new ProfileImportExportManager(
      DEFAULT_PROFILES_DIR,
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
    return this.operations.validateProfileName(name);
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
    return this.operations.create(data);
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
      const getResult = await this.validateProfileExists(profileName);
      if (!getResult.success) {
        return getResult;
      }

      const updateResult =
        await this.listing.updateActiveProfileFlags(profileName);
      if (!updateResult.success) {
        return updateResult as Result<
          { activeProfile: string },
          ConfigurationError
        >;
      }

      return this.completeProfileSwitch(profileName);
    } catch (error) {
      return this.handleSwitchError(profileName, error);
    }
  }

  /**
   * Validate that profile exists before switching
   *
   * @param {string} profileName - Name of the profile to validate
   * @returns {Promise<Result<ProfileData, ConfigurationError>>} Result containing the profile or an error
   * @private
   */
  private async validateProfileExists(
    profileName: string
  ): Promise<Result<ProfileData, ConfigurationError>> {
    return this.operations.get(profileName);
  }

  /**
   * Complete the profile switch operation
   *
   * @param {string} profileName - Name of the profile to switch to
   * @returns {Promise<Result<{ activeProfile: string }, ConfigurationError>>} Result containing the active profile name or an error
   * @private
   */
  private async completeProfileSwitch(
    profileName: string
  ): Promise<Result<{ activeProfile: string }, ConfigurationError>> {
    const switchResult = await this.operations.switch(profileName);
    this.logger.info('Profile switched successfully', { profileName });
    return switchResult;
  }

  /**
   * Handle profile switch errors
   *
   * @param {string} profileName - Name of the profile that failed to switch
   * @param {unknown} error - The error that occurred
   * @returns {Result<{ activeProfile: string }, ConfigurationError>} Error result
   * @private
   */
  private handleSwitchError(
    profileName: string,
    error: unknown
  ): Result<{ activeProfile: string }, ConfigurationError> {
    this.logger.error('Failed to switch profile', { profileName, error });
    return {
      success: false,
      error: new ConfigurationError(
        `Failed to switch profile: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { profileName, error }
      ),
    };
  }

  /**
   * List all profiles
   *
   * @returns {Promise<Result<ProfileData[], ConfigurationError>>} Result containing an array of profiles or an error
   */
  async list(): Promise<Result<ProfileData[], ConfigurationError>> {
    return this.listing.list();
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
    return this.operations.get(profileName);
  }

  /**
   * Delete a profile
   *
   * @param {string} profileName - Name of the profile to delete
   * @returns {Promise<Result<void, ConfigurationError>>} Result indicating success or containing an error
   */
  async delete(profileName: string): Promise<Result<void, ConfigurationError>> {
    return this.operations.delete(profileName);
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
