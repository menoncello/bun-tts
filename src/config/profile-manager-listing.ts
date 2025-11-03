import { promises as fs } from 'fs';
import { join } from 'path';
import { ConfigurationError } from '../errors/configuration-error.js';
import { Result, Ok, Err } from '../errors/result.js';
import type { Logger } from '../interfaces/logger.js';
import { ACTIVE_PROFILE_FILENAME } from './profile-constants.js';
import { ProfileFileOperations } from './profile-file-operations.js';
import type { ProfileData } from './profile-manager.js';

/**
 * Profile manager listing utility class
 *
 * Handles profile listing, directory operations, and active profile management.
 */
export class ProfileManagerListing {
  private profilesDir: string;
  private fileOperations: ProfileFileOperations;
  private logger: Logger;

  /**
   * Create a new ProfileManagerListing instance
   *
   * @param {string} profilesDir - Directory where profiles are stored
   * @param {Logger} logger - Logger instance for recording operations
   */
  constructor(profilesDir: string, logger: Logger) {
    this.profilesDir = profilesDir;
    this.fileOperations = new ProfileFileOperations(profilesDir, logger);
    this.logger = logger;
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
      return Err(
        new ConfigurationError(
          `Failed to list profiles: ${
            error instanceof Error ? error.message : String(error)
          }`,
          { error }
        )
      );
    }
  }

  /**
   * Update active profile flags across all profiles
   *
   * @param {string} activeProfileName - The name of the profile to activate
   * @returns {Promise<Result<void, ConfigurationError>>} Result indicating success or error
   */
  async updateActiveProfileFlags(
    activeProfileName: string
  ): Promise<Result<void, ConfigurationError>> {
    try {
      const listResult = await this.list();
      if (!listResult.success) {
        return listResult as Result<void, ConfigurationError>;
      }

      await this.updateProfileFlags(listResult.data, activeProfileName);
      return Ok(void 0);
    } catch (error) {
      return Err(
        new ConfigurationError(
          `Failed to update active profile flags: ${
            error instanceof Error ? error.message : String(error)
          }`,
          { activeProfileName, error }
        )
      );
    }
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

      // Ensure metadata exists
      if (profileData.metadata === undefined) {
        profileData.metadata = {
          name: profileData.name,
          description: profileData.description || '',
          tags: profileData.tags || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: profileName === activeProfile,
        };
      } else {
        // Metadata exists, just update the active flag
        profileData.metadata.isActive = profileName === activeProfile;
      }
      return profileData;
    } catch (error) {
      this.logger.warn('Failed to read profile', { entry: entryName, error });
      return null;
    }
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
   * @param {string} _activeProfileName - The currently active profile name
   * @returns {Promise<void>}
   */
  private async updateSingleProfileFlag(
    profile: ProfileData,
    _activeProfileName: string
  ): Promise<void> {
    const updatedMetadata = {
      name: profile.metadata?.name || profile.name,
      description: profile.metadata?.description || '',
      tags: profile.metadata?.tags || [],
      createdAt: profile.metadata?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: profile.metadata?.name === _activeProfileName,
    };

    const updatedProfile: ProfileData = {
      ...profile,
      metadata: updatedMetadata,
    };

    await this.fileOperations.saveProfile(updatedMetadata.name, updatedProfile);
  }

  /**
   * Get the currently active profile name
   *
   * @returns {Promise<string | null>} The active profile name or null if none
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
}
