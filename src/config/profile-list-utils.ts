/**
 * Profile Listing Utilities - Extracted from ProfileManager to reduce line count
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { ConfigurationError } from '../errors/configuration-error.js';
import { Result, Ok, Err } from '../errors/result.js';
import type { Logger } from '../interfaces/logger.js';
import { ConfigMerger } from './config-merger.js';
import { ConfigValidator } from './config-validator.js';
import {
  ACTIVE_PROFILE_FILENAME,
  JSON_INDENT_SIZE,
} from './profile-constants.js';
import type {
  ProfileData,
  CreateProfileData,
  ProfileMetadata,
} from './profile-manager.js';

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
 * ProfileLister - Handles listing and loading profiles
 */
export class ProfileLister {
  private profilesDir: string;
  private validator: ConfigValidator;
  private merger: ConfigMerger;
  private logger: Logger;

  /**
   * Create a new ProfileLister
   *
   * @param {string} profilesDir - Directory where profiles are stored
   * @param {Logger} [logger] - Logger instance for recording operations
   */
  constructor(profilesDir: string, logger?: Logger) {
    this.profilesDir = profilesDir;
    this.validator = new ConfigValidator();
    this.merger = new ConfigMerger();
    this.logger = logger || MOCK_LOGGER;
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
      return this.createError('list profiles', error);
    }
  }

  /**
   * Read profile directory entries
   *
   * @returns {Promise<Result<string[], ConfigurationError>>} Result containing directory entries
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
   * Load a profile with active flag
   *
   * @param {string} profilePath - Path to the profile file
   * @param {string} entryName - Entry name
   * @param {string | null} activeProfile - The currently active profile name
   * @returns {Promise<ProfileData | null>} Profile data or null if failed to load
   */
  private async loadProfileWithActiveFlag(
    profilePath: string,
    entryName: string,
    activeProfile: string | null
  ): Promise<ProfileData | null> {
    try {
      const profileData = await this.readProfileFile(profilePath);
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
   * Read a profile file
   *
   * @param {string} profilePath - Path to the profile file
   * @returns {Promise<ProfileData>} Parsed profile data
   */
  private async readProfileFile(profilePath: string): Promise<ProfileData> {
    const content = await fs.readFile(profilePath, 'utf-8');
    return JSON.parse(content) as ProfileData;
  }

  /**
   * Get the active profile name
   *
   * @returns {Promise<string | null>} Active profile name or null
   */
  private async getActiveProfileName(): Promise<string | null> {
    try {
      const activeProfilePath = join(this.profilesDir, ACTIVE_PROFILE_FILENAME);
      const content = await fs.readFile(activeProfilePath, 'utf-8');
      const data = JSON.parse(content);
      return data.active || null;
    } catch {
      return null;
    }
  }

  /**
   * Create an error result
   *
   * @param {string} operation - The operation that failed
   * @param {unknown} error - The error that occurred
   * @returns {Result<never, ConfigurationError>} Error result
   */
  private createError(
    operation: string,
    error: unknown
  ): Result<never, ConfigurationError> {
    return Err(
      new ConfigurationError(
        `Failed to ${operation}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { error }
      )
    );
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
      const metadata = this.createProfileMetadata(data);
      const profileData: ProfileData = {
        name: data.name,
        description: data.description,
        tags: data.tags,
        config: data.config || {},
        metadata,
      };
      await this.saveProfile(data.name, profileData);
      this.logger.info('Profile created successfully', { name: data.name });
      return Ok(profileData);
    } catch (error) {
      this.logger.error('Failed to create profile', { name: data.name, error });
      return this.createError('create profile', error);
    }
  }

  /**
   * Validate a profile name
   *
   * @param {string} name - The profile name to validate
   * @returns {{ valid: boolean; error?: ConfigurationError }} Validation result
   */
  validateProfileName(name: string): {
    valid: boolean;
    error?: ConfigurationError;
  } {
    const lengthValidation = this.validateProfileNameLength(name);
    if (!lengthValidation.valid) {
      return lengthValidation;
    }

    const characterValidation = this.validateProfileNameCharacters(name);
    if (!characterValidation.valid) {
      return characterValidation;
    }

    const formatValidation = this.validateProfileNameFormat(name);
    if (!formatValidation.valid) {
      return formatValidation;
    }

    return { valid: true };
  }

  /**
   * Validate profile name length
   *
   * @param {string} name - The profile name to validate
   * @returns {{ valid: boolean; error?: ConfigurationError }} Length validation result
   */
  private validateProfileNameLength(name: string): {
    valid: boolean;
    error?: ConfigurationError;
  } {
    const MINIMUM_NAME_LENGTH = 2;
    const MAXIMUM_NAME_LENGTH = 50;

    if (name.length < MINIMUM_NAME_LENGTH) {
      return {
        valid: false,
        error: new ConfigurationError(
          `Profile name must be at least ${MINIMUM_NAME_LENGTH} characters long`
        ),
      };
    }

    if (name.length > MAXIMUM_NAME_LENGTH) {
      return {
        valid: false,
        error: new ConfigurationError(
          `Profile name must be less than ${MAXIMUM_NAME_LENGTH} characters long`
        ),
      };
    }

    return { valid: true };
  }

  /**
   * Validate profile name characters
   *
   * @param {string} name - The profile name to validate
   * @returns {{ valid: boolean; error?: ConfigurationError }} Character validation result
   */
  private validateProfileNameCharacters(name: string): {
    valid: boolean;
    error?: ConfigurationError;
  } {
    if (name.includes(' ')) {
      return {
        valid: false,
        error: new ConfigurationError('Profile name cannot contain spaces'),
      };
    }

    return { valid: true };
  }

  /**
   * Validate profile name format
   *
   * @param {string} name - The profile name to validate
   * @returns {{ valid: boolean; error?: ConfigurationError }} Format validation result
   */
  private validateProfileNameFormat(name: string): {
    valid: boolean;
    error?: ConfigurationError;
  } {
    if (!/^[\w-]+$/.test(name)) {
      return {
        valid: false,
        error: new ConfigurationError(
          'Profile name can only contain letters, numbers, hyphens, and underscores'
        ),
      };
    }

    return { valid: true };
  }

  /**
   * Create profile metadata
   *
   * @param {CreateProfileData} data - Profile creation data
   * @returns {ProfileMetadata} Profile metadata
   */
  private createProfileMetadata(data: CreateProfileData): ProfileMetadata {
    const now = new Date().toISOString();
    return {
      name: data.name,
      description: data.description || '',
      tags: data.tags || [],
      createdAt: now,
      updatedAt: now,
      isActive: false,
    };
  }

  /**
   * Save a profile
   *
   * @param {string} profileName - The profile name
   * @param {ProfileData} profileData - The profile data to save
   * @returns {Promise<void>}
   */
  private async saveProfile(
    profileName: string,
    profileData: ProfileData
  ): Promise<void> {
    const profilePath = join(this.profilesDir, `${profileName}.json`);
    await fs.mkdir(profilePath, { recursive: true });
    await fs.writeFile(
      profilePath,
      JSON.stringify(profileData, null, JSON_INDENT_SIZE),
      'utf-8'
    );
  }
}
