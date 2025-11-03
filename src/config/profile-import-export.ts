import { ConfigurationError } from '../errors/configuration-error.js';
import { Result, Ok, Err } from '../errors/result.js';
import type { Logger } from '../interfaces/logger.js';
import { ConfigMerger } from './config-merger.js';
import { ProfileContentGenerator } from './profile-content-generator.js';
import { ProfileDirectoryOperations } from './profile-directory-operations.js';
import { ProfileExportOperations } from './profile-export-operations.js';
import { ProfileFileOperations } from './profile-file-operations.js';
import { ProfileImportOperations } from './profile-import-operations.js';
import type {
  ImportExportStats,
  ImportOptions,
  MergeStrategy,
} from './profile-import-types.js';
import { ProfileImportValidation } from './profile-import-validation.js';
import { ProfileMergeOperations } from './profile-merge-operations.js';

/**
 * ProfileManager import/export functionality
 *
 * Provides high-level operations for importing and exporting configuration profiles.
 * This class orchestrates various helper classes to handle different aspects of the
 * import/export process.
 */
export class ProfileImportExportManager {
  private profilesDir: string;
  private merger: ConfigMerger;
  private fileOperations: ProfileFileOperations;
  private mergeOperations: ProfileMergeOperations;
  private directoryOperations: ProfileDirectoryOperations;
  private contentGenerator: ProfileContentGenerator;
  private validation: ProfileImportValidation;
  private importOperations: ProfileImportOperations;
  private exportOperations: ProfileExportOperations;
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
    this.validation = new ProfileImportValidation(this.fileOperations, logger);
    this.importOperations = new ProfileImportOperations(
      profilesDir,
      this.fileOperations,
      this.validation,
      logger
    );
    this.exportOperations = new ProfileExportOperations(
      this.fileOperations,
      this.contentGenerator,
      this.directoryOperations,
      logger
    );
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
      await this.exportOperations.exportAllProfiles(
        sourceDir,
        targetDir,
        format
      );

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
      this.importOperations.processImportEntry(
        entry,
        sourceDir,
        mergeStrategy,
        importStats
      )
    );
    await Promise.all(processPromises);
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
