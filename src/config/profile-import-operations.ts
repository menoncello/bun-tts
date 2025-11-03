import { promises as fs } from 'fs';
import { join } from 'path';
import type { Logger } from '../interfaces/logger.js';
import { ProfileFileOperations } from './profile-file-operations.js';
import type {
  ImportExportStats,
  MergeStrategy,
  ProfileImportParams,
} from './profile-import-types.js';
import { ProfileImportValidation } from './profile-import-validation.js';
import type { ProfileData } from './profile-manager.js';

/**
 * Profile import operations utility class
 */
export class ProfileImportOperations {
  private profilesDir: string;
  private fileOperations: ProfileFileOperations;
  private validation: ProfileImportValidation;
  private logger: Logger;

  /**
   * Create a new ProfileImportOperations instance
   *
   * @param {string} profilesDir - Directory where profiles are stored
   * @param {ProfileFileOperations} fileOperations - File operations instance
   * @param {ProfileImportValidation} validation - Validation utility instance
   * @param {Logger} logger - Logger instance for recording operations
   */
  constructor(
    profilesDir: string,
    fileOperations: ProfileFileOperations,
    validation: ProfileImportValidation,
    logger: Logger
  ) {
    this.profilesDir = profilesDir;
    this.fileOperations = fileOperations;
    this.validation = validation;
    this.logger = logger;
  }

  /**
   * Process a single import entry
   *
   * @param {string} entry - The file entry to process
   * @param {string} sourceDir - The source directory
   * @param {MergeStrategy} mergeStrategy - The merge strategy to use
   * @param {ImportExportStats} importStats - Import statistics tracker
   */
  async processImportEntry(
    entry: string,
    sourceDir: string,
    mergeStrategy: MergeStrategy,
    importStats: ImportExportStats
  ): Promise<void> {
    if (!this.isJsonProfileFile(entry)) {
      return;
    }

    const filePath = join(sourceDir, entry);
    const profileName = entry.replace('.json', '');

    await this.processProfileImport({
      entry,
      filePath,
      profileName,
      mergeStrategy,
      importStats,
    });
  }

  /**
   * Process the actual profile import with error handling
   *
   * @param {ProfileImportParams} params - Import parameters object
   * @param {string} params.entry - The file entry name being processed
   * @param {string} params.filePath - The full file path to the profile
   * @param {string} params.profileName - The extracted profile name from file
   * @param {MergeStrategy} params.mergeStrategy - The merge strategy to use
   * @param {ImportExportStats} params.importStats - Import statistics tracker
   */
  async processProfileImport(params: ProfileImportParams): Promise<void> {
    try {
      const profileData = await this.validation.loadAndValidateProfile(
        params.filePath
      );
      if (!profileData) {
        this.handleImportError(
          params.entry,
          new Error('Profile validation failed'),
          params.importStats
        );
        return;
      }

      await this.importProfileToTarget(
        params.profileName,
        profileData,
        params.mergeStrategy,
        params.importStats
      );
    } catch (error) {
      this.handleImportError(params.entry, error, params.importStats);
    }
  }

  /**
   * Check if file is a JSON profile file
   *
   * @param {string} entry - File entry name
   * @returns {boolean} True if it's a JSON profile file
   */
  isJsonProfileFile(entry: string): boolean {
    return entry.endsWith('.json');
  }

  /**
   * Handle import error for a single profile
   *
   * @param {string} entry - The file entry that failed
   * @param {unknown} error - The error that occurred
   * @param {ImportExportStats} importStats - Import statistics tracker
   */
  handleImportError(
    entry: string,
    error: unknown,
    importStats: ImportExportStats
  ): void {
    importStats.failedCount++;
    importStats.errors.push({
      file: entry,
      error: error instanceof Error ? error.message : String(error),
    });
    this.logger.warn('Failed to import profile', {
      file: entry,
      error,
    });
  }

  /**
   * Import profile to target directory
   *
   * @param {string} profileName - The profile name
   * @param {ProfileData} profileData - The profile data
   * @param {MergeStrategy} mergeStrategy - The merge strategy to use
   * @param {ImportExportStats} importStats - Import statistics tracker
   * @returns {Promise<void>}
   */
  async importProfileToTarget(
    profileName: string,
    profileData: ProfileData,
    mergeStrategy: MergeStrategy,
    importStats: ImportExportStats
  ): Promise<void> {
    const targetPath = join(this.profilesDir, `${profileName}.json`);

    try {
      await fs.access(targetPath);
      // Profile exists, handle based on merge strategy
      await this.handleExistingProfile(
        profileName,
        profileData,
        mergeStrategy,
        importStats
      );
    } catch {
      // Profile doesn't exist, save it
      await this.fileOperations.saveProfile(profileName, profileData);
      importStats.importedCount++;
    }
  }

  /**
   * Handle an existing profile based on merge strategy
   *
   * @param {string} profileName - The profile name
   * @param {ProfileData} profileData - The new profile data
   * @param {MergeStrategy} mergeStrategy - The merge strategy
   * @param {ImportExportStats} importStats - Import statistics tracker
   * @returns {Promise<void>}
   */
  async handleExistingProfile(
    profileName: string,
    profileData: ProfileData,
    mergeStrategy: MergeStrategy,
    importStats: ImportExportStats
  ): Promise<void> {
    if (mergeStrategy === 'skip') {
      this.logger.debug('Skipping existing profile', { profileName });
      return;
    }

    if (mergeStrategy === 'merge') {
      // This will be handled by ProfileMergeOperations
      throw new Error(
        'Merge operation should be handled by ProfileMergeOperations'
      );
    } else {
      // Overwrite
      await this.fileOperations.saveProfile(profileName, profileData);
      importStats.importedCount++;
    }
  }
}
