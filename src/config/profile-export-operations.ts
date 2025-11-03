import { promises as fs } from 'fs';
import { join } from 'path';
import type { Logger } from '../interfaces/logger.js';
import { ProfileContentGenerator } from './profile-content-generator.js';
import { ProfileDirectoryOperations } from './profile-directory-operations.js';
import { ProfileFileOperations } from './profile-file-operations.js';

/**
 * Profile export operations utility class
 */
export class ProfileExportOperations {
  private fileOperations: ProfileFileOperations;
  private contentGenerator: ProfileContentGenerator;
  private directoryOperations: ProfileDirectoryOperations;
  private logger: Logger;

  /**
   * Create a new ProfileExportOperations instance
   *
   * @param {ProfileFileOperations} fileOperations - File operations instance
   * @param {ProfileContentGenerator} contentGenerator - Content generator instance
   * @param {ProfileDirectoryOperations} directoryOperations - Directory operations instance
   * @param {Logger} logger - Logger instance for recording operations
   */
  constructor(
    fileOperations: ProfileFileOperations,
    contentGenerator: ProfileContentGenerator,
    directoryOperations: ProfileDirectoryOperations,
    logger: Logger
  ) {
    this.fileOperations = fileOperations;
    this.contentGenerator = contentGenerator;
    this.directoryOperations = directoryOperations;
    this.logger = logger;
  }

  /**
   * Export all profiles from source directory
   *
   * @param {string} sourceDir - The source directory
   * @param {string} targetDir - The target directory
   * @param {string} format - The export format
   * @returns {Promise<void>}
   */
  async exportAllProfiles(
    sourceDir: string,
    targetDir: string,
    format: 'json' | 'yaml'
  ): Promise<void> {
    const entries =
      await this.directoryOperations.readExportDirectory(sourceDir);
    const exportPromises = entries.map((entry) =>
      this.exportProfileIfJson(entry, sourceDir, targetDir, format)
    );
    await Promise.all(exportPromises);
  }

  /**
   * Export profile if it's a JSON file
   *
   * @param {string} entry - File entry name
   * @param {string} sourceDir - The source directory
   * @param {string} targetDir - The target directory
   * @param {string} format - The export format
   * @returns {Promise<void>}
   */
  async exportProfileIfJson(
    entry: string,
    sourceDir: string,
    targetDir: string,
    format: 'json' | 'yaml'
  ): Promise<void> {
    if (!entry.endsWith('.json')) {
      return;
    }

    const filePath = join(sourceDir, entry);
    const profileName = entry.replace('.json', '');
    const extension = format === 'json' ? 'json' : 'yaml';
    const targetPath = join(targetDir, `${profileName}.${extension}`);

    try {
      const profileData = await this.fileOperations.readProfileFile(filePath);
      const content = await this.contentGenerator.generateProfileContent(
        profileData,
        format
      );
      await fs.writeFile(targetPath, content, 'utf-8');
    } catch (error) {
      this.logger.warn('Failed to export profile', { file: entry, error });
    }
  }

  /**
   * Read and parse a profile from file
   *
   * @param {string} filePath - The path to the profile file
   * @returns {Promise<unknown>} The parsed profile data
   */
  async readProfile(filePath: string): Promise<unknown> {
    return this.fileOperations.readProfileFile(filePath);
  }
}
