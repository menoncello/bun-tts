import { promises as fs } from 'fs';
import { ConfigurationError } from '../errors/configuration-error.js';
import type { Logger } from '../interfaces/logger.js';
import { JSON_INDENT_SIZE } from './profile-constants.js';

/**
 * Directory operations utility class
 */
export class ProfileDirectoryOperations {
  private profilesDir: string;
  private logger: Logger;

  /**
   * Create a new ProfileDirectoryOperations instance
   *
   * @param {string} profilesDir - Directory where profiles are stored
   * @param {Logger} logger - Logger instance for recording operations
   */
  constructor(profilesDir: string, logger: Logger) {
    this.profilesDir = profilesDir;
    this.logger = logger;
  }

  /**
   * Create the target directory for export
   *
   * @param {string} targetDir - The target directory to create
   * @returns {Promise<void>}
   */
  async createTargetDirectory(targetDir: string): Promise<void> {
    await fs.mkdir(targetDir, { recursive: true });
  }

  /**
   * Read export directory entries
   *
   * @param {string} sourceDir - The source directory to read
   * @returns {Promise<string[]>} Array of directory entries
   */
  async readExportDirectory(sourceDir: string): Promise<string[]> {
    try {
      return await fs.readdir(sourceDir);
    } catch (error) {
      throw new ConfigurationError(
        `Failed to read export directory: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { sourceDir, error }
      );
    }
  }

  /**
   * Read import directory entries
   *
   * @param {string} sourceDir - The source directory to read
   * @returns {Promise<string[]>} Array of directory entries
   */
  async readImportDirectory(sourceDir: string): Promise<string[]> {
    try {
      return await fs.readdir(sourceDir);
    } catch (error) {
      throw new ConfigurationError(
        `Failed to read import directory: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { sourceDir, error }
      );
    }
  }

  /**
   * Write active profile to file
   *
   * @param {string} profileName - The profile name to mark as active
   * @param {string} activeProfilePath - The path to the active profile file
   * @returns {Promise<void>}
   */
  async writeActiveProfile(
    profileName: string,
    activeProfilePath: string
  ): Promise<void> {
    await fs.writeFile(
      activeProfilePath,
      JSON.stringify({ active: profileName }, null, JSON_INDENT_SIZE)
    );
  }
}
