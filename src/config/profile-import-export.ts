import { promises as fs } from 'fs';
import { join } from 'path';
import { ConfigurationError } from '../errors/configuration-error.js';
import { Result, Ok, Err } from '../errors/result.js';
import type { Logger } from '../interfaces/logger.js';
import { ConfigMerger } from './config-merger.js';
import { ProfileContentGenerator } from './profile-content-generator.js';
import { ProfileDirectoryOperations } from './profile-directory-operations.js';
import { ProfileFileOperations } from './profile-file-operations.js';
import type { ProfileData } from './profile-manager.js';
import { ProfileMergeOperations } from './profile-merge-operations.js';

/**
 * Profile validation constants
 */
const MINIMUM_NAME_LENGTH = 2;
const MAXIMUM_NAME_LENGTH = 50;
const MAXIMUM_DESCRIPTION_LENGTH = 500;

/**
 * Import options interface
 */
type MergeStrategy = 'overwrite' | 'skip' | 'merge';

/**
 * Import options interface
 */
export interface ImportOptions {
  mergeStrategy?: MergeStrategy;
}

/**
 * Import/export statistics interface
 */
interface ImportExportStats {
  importedCount: number;
  failedCount: number;
  errors: Array<{ file: string; error: string }>;
}

/**
 * ProfileManager import/export functionality
 */
export class ProfileImportExportManager {
  private profilesDir: string;
  private merger: ConfigMerger;
  private fileOperations: ProfileFileOperations;
  private mergeOperations: ProfileMergeOperations;
  private directoryOperations: ProfileDirectoryOperations;
  private contentGenerator: ProfileContentGenerator;
  private logger: Logger;

  /**
   * Create a new ProfileImportExportManager
   *
   * @param {string} profilesDir - Directory where profiles are stored
   * @param {Logger} logger - Logger instance for recording operations
   */
  constructor(profilesDir: string, logger: Logger) {
    this.profilesDir = profilesDir;
    this.merger = new ConfigMerger();
    this.fileOperations = new ProfileFileOperations(profilesDir, logger);
    this.mergeOperations = new ProfileMergeOperations(profilesDir, logger);
    this.directoryOperations = new ProfileDirectoryOperations(
      profilesDir,
      logger
    );
    this.contentGenerator = new ProfileContentGenerator(logger);
    this.logger = logger;
  }

  /**
   * Export all profiles to a directory
   *
   * Exports all profiles from the source directory to the target directory
   * in the specified format (JSON or YAML).
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
    try {
      await this.directoryOperations.createTargetDirectory(targetDir);
      await this.exportAllProfiles(sourceDir, targetDir, format);

      this.logger.info('Profiles exported successfully', {
        targetDir,
        format,
      });

      return Ok({ success: true });
    } catch (error) {
      this.logger.error('Failed to export profiles', { error });
      return this.createError('export profiles', error);
    }
  }

  /**
   * Import profiles from a directory
   *
   * Imports all profiles from the source directory into the profile manager.
   * Supports merge strategies: 'overwrite', 'skip', or 'merge'.
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
    const mergeStrategy = options?.mergeStrategy || 'overwrite';
    const importStats = this.createImportStats();

    try {
      await this.performImport(sourceDir, mergeStrategy, importStats);

      this.logImportSuccess(importStats, mergeStrategy);

      return this.buildImportResult(importStats);
    } catch (error) {
      this.logger.error('Failed to import profiles', { error });
      return this.createError('import profiles', error);
    }
  }

  /**
   * Export all profiles from source directory
   *
   * @param {string} sourceDir - The source directory
   * @param {string} targetDir - The target directory
   * @param {string} format - The export format
   * @returns {Promise<void>}
   */
  private async exportAllProfiles(
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
  private async exportProfileIfJson(
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
   * @returns {Promise<ProfileData>} The parsed profile data
   */
  private async readProfile(filePath: string): Promise<ProfileData> {
    return this.fileOperations.readProfileFile(filePath);
  }

  /**
   * Perform the actual import operation
   *
   * @param {string} sourceDir - The source directory
   * @param {MergeStrategy} mergeStrategy - The merge strategy
   * @param {ImportExportStats} importStats - Import statistics
   * @returns {Promise<void>}
   */
  private async performImport(
    sourceDir: string,
    mergeStrategy: MergeStrategy,
    importStats: ImportExportStats
  ): Promise<void> {
    const entries =
      await this.directoryOperations.readImportDirectory(sourceDir);
    await this.processAllImportEntries(
      entries,
      sourceDir,
      mergeStrategy,
      importStats
    );
  }

  /**
   * Log successful import
   *
   * @param {ImportExportStats} importStats - Import statistics
   * @param {MergeStrategy} mergeStrategy - The merge strategy
   */
  private logImportSuccess(
    importStats: ImportExportStats,
    mergeStrategy: MergeStrategy
  ): void {
    this.logger.info('Profiles imported successfully', {
      importedCount: importStats.importedCount,
      failedCount: importStats.failedCount,
      mergeStrategy,
    });
  }

  /**
   * Build the import result object
   *
   * @param {ImportExportStats} importStats - Import statistics
   * @returns {Result<{ importedCount: number; failedCount: number; errors?: Array<{ file: string; error: string }> }, ConfigurationError>} A Result containing the import statistics
   */
  private buildImportResult(importStats: ImportExportStats): Result<
    {
      importedCount: number;
      failedCount: number;
      errors?: Array<{ file: string; error: string }>;
    },
    ConfigurationError
  > {
    return Ok({
      importedCount: importStats.importedCount,
      failedCount: importStats.failedCount,
      errors: importStats.errors.length > 0 ? importStats.errors : undefined,
    });
  }

  /**
   * Create import statistics tracker
   *
   * @returns {ImportExportStats} Import statistics object
   */
  private createImportStats(): ImportExportStats {
    return {
      importedCount: 0,
      failedCount: 0,
      errors: [] as Array<{ file: string; error: string }>,
    };
  }

  /**
   * Process all import entries concurrently
   *
   * @param {string[]} entries - Array of directory entries
   * @param {string} sourceDir - The source directory
   * @param {MergeStrategy} mergeStrategy - The merge strategy to use
   * @param {ImportExportStats} importStats - Import statistics tracker
   * @returns {Promise<void>}
   */
  private async processAllImportEntries(
    entries: string[],
    sourceDir: string,
    mergeStrategy: MergeStrategy,
    importStats: ImportExportStats
  ): Promise<void> {
    const processPromises = entries.map((entry) =>
      this.processImportEntry(entry, sourceDir, mergeStrategy, importStats)
    );
    await Promise.all(processPromises);
  }

  /**
   * Validate profile name
   *
   * @param {string} name - The profile name to validate
   * @returns {string | null} Error message if validation fails, null if valid
   */
  private validateProfileName(name: string): string | null {
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
  private validateProfileDescription(
    description: string | undefined
  ): string | null {
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
  private collectProfileValidationErrors(
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
  private async loadAndValidateProfile(
    filePath: string
  ): Promise<ProfileData | null> {
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

  /**
   * Import profile to target directory
   *
   * @param {string} profileName - The profile name
   * @param {ProfileData} profileData - The profile data
   * @param {MergeStrategy} mergeStrategy - The merge strategy to use
   * @param {ImportExportStats} importStats - Import statistics tracker
   * @returns {Promise<void>}
   */
  private async importProfileToTarget(
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
   * Process a single import entry
   *
   * @param {string} entry - The file entry to process
   * @param {string} sourceDir - The source directory
   * @param {MergeStrategy} mergeStrategy - The merge strategy to use
   * @param {ImportExportStats} importStats - Import statistics tracker
   */
  private async processImportEntry(
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
   * @param {ProfileImportParams} params - Import parameters
   */
  private async processProfileImport(params: {
    entry: string;
    filePath: string;
    profileName: string;
    mergeStrategy: MergeStrategy;
    importStats: ImportExportStats;
  }): Promise<void> {
    try {
      const profileData = await this.loadAndValidateProfile(params.filePath);
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
  private isJsonProfileFile(entry: string): boolean {
    return entry.endsWith('.json');
  }

  /**
   * Handle import error for a single profile
   *
   * @param {string} entry - The file entry that failed
   * @param {unknown} error - The error that occurred
   * @param {ImportExportStats} importStats - Import statistics tracker
   */
  private handleImportError(
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
   * Handle an existing profile based on merge strategy
   *
   * @param {string} profileName - The profile name
   * @param {ProfileData} profileData - The new profile data
   * @param {MergeStrategy} mergeStrategy - The merge strategy
   * @param {ImportExportStats} importStats - Import statistics tracker
   */
  private async handleExistingProfile(
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
      await this.mergeOperations.mergeExistingProfile(
        profileName,
        profileData,
        importStats
      );
    } else {
      // Overwrite
      await this.fileOperations.saveProfile(profileName, profileData);
      importStats.importedCount++;
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
}
