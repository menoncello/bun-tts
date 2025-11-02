import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { ConfigurationError } from '../errors/configuration-error.js';
import type { Logger } from '../interfaces/logger.js';
import { JSON_INDENT_SIZE } from './profile-constants.js';
import type { ProfileData } from './profile-manager.js';

/**
 * Profile file operations helper class
 */
export class ProfileFileOperations {
  private profilesDir: string;
  private logger: Logger;

  /**
   * Create a new ProfileFileOperations instance
   *
   * @param {string} profilesDir - Directory where profiles are stored
   * @param {Logger} logger - Logger instance for recording operations
   */
  constructor(profilesDir: string, logger: Logger) {
    this.profilesDir = profilesDir;
    this.logger = logger;
  }

  /**
   * Save a profile to the profiles directory
   *
   * @param {string} profileName - The profile name
   * @param {ProfileData} profileData - The profile data to save
   * @returns {Promise<void>}
   */
  async saveProfile(
    profileName: string,
    profileData: ProfileData
  ): Promise<void> {
    const profilePath = join(this.profilesDir, `${profileName}.json`);
    await this.ensureDirectoryExists(profilePath);
    await this.writeProfileFile(profilePath, profileData);
  }

  /**
   * Check if a profile file exists
   *
   * @param {string} profileName - The profile name to check
   * @returns {Promise<boolean>} True if profile exists
   */
  async profileExists(profileName: string): Promise<boolean> {
    try {
      const profilePath = join(this.profilesDir, `${profileName}.json`);
      await fs.access(profilePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read a profile file
   *
   * @param {string} profilePath - The path to the profile file
   * @returns {Promise<ProfileData>} The parsed profile data
   */
  async readProfileFile(profilePath: string): Promise<ProfileData> {
    try {
      const content = await fs.readFile(profilePath, 'utf-8');
      return JSON.parse(content) as ProfileData;
    } catch (error) {
      this.logger.error('Failed to read profile file', { profilePath, error });
      throw new ConfigurationError(
        `Failed to read profile file: ${error instanceof Error ? error.message : String(error)}`,
        { profilePath, error }
      );
    }
  }

  /**
   * Delete a profile file
   *
   * @param {string} profileName - The profile name to delete
   * @returns {Promise<void>}
   */
  async deleteProfileFile(profileName: string): Promise<void> {
    const profilePath = join(this.profilesDir, `${profileName}.json`);
    await fs.unlink(profilePath);
  }

  /**
   * Check if error is a file not found error
   *
   * @param {unknown} error - The error to check
   * @returns {boolean} True if it's a file not found error
   */
  isFileNotFoundError(error: unknown): boolean {
    if (error instanceof Error) {
      const code = (error as NodeJS.ErrnoException).code;
      return code === 'ENOENT';
    }
    return false;
  }

  /**
   * Ensure directory exists for profile file
   *
   * @param {string} profilePath - The profile file path
   * @returns {Promise<void>}
   */
  private async ensureDirectoryExists(profilePath: string): Promise<void> {
    await fs.mkdir(dirname(profilePath), { recursive: true });
  }

  /**
   * Write profile file to disk
   *
   * @param {string} profilePath - The profile file path
   * @param {ProfileData} profileData - The profile data to write
   * @returns {Promise<void>}
   */
  private async writeProfileFile(
    profilePath: string,
    profileData: ProfileData
  ): Promise<void> {
    const content = JSON.stringify(profileData, null, JSON_INDENT_SIZE);
    await fs.writeFile(profilePath, content, 'utf-8');
  }
}
