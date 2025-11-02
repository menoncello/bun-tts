import { join } from 'path';
import type { Logger } from '../interfaces/logger.js';
import type { BunTtsConfig } from '../types/config.js';
import { ConfigMerger } from './config-merger.js';
import { ProfileFileOperations } from './profile-file-operations.js';
import type { ProfileData } from './profile-manager.js';

/**
 * Merge operations utility class
 */
export class ProfileMergeOperations {
  private profilesDir: string;
  private merger: ConfigMerger;
  private fileOperations: ProfileFileOperations;
  private logger: Logger;

  /**
   * Create a new ProfileMergeOperations instance
   *
   * @param {string} profilesDir - Directory where profiles are stored
   * @param {Logger} logger - Logger instance for recording operations
   */
  constructor(profilesDir: string, logger: Logger) {
    this.profilesDir = profilesDir;
    this.merger = new ConfigMerger();
    this.fileOperations = new ProfileFileOperations(profilesDir, logger);
    this.logger = logger;
  }

  /**
   * Merge an existing profile with new profile data
   *
   * @param {string} profileName - The profile name
   * @param {ProfileData} newProfileData - The new profile data
   * @param {ImportExportStats} importStats - Import statistics
   * @returns {Promise<void>}
   */
  async mergeExistingProfile(
    profileName: string,
    newProfileData: ProfileData,
    importStats: ImportExportStats
  ): Promise<void> {
    try {
      const existingProfileData = await this.readExistingProfile(profileName);
      const mergedConfig = this.mergeProfileConfigurations(
        existingProfileData,
        newProfileData
      );
      const updatedProfile = this.createUpdatedProfile(
        profileName,
        newProfileData,
        existingProfileData,
        mergedConfig
      );

      await this.completeMergeProfile(profileName, updatedProfile, importStats);
    } catch (error) {
      this.logger.error('Failed to merge existing profile', {
        profileName,
        error,
      });
      throw error;
    }
  }

  /**
   * Read the existing profile data from file system
   *
   * @param {string} profileName - The profile name to read
   * @returns {Promise<ProfileData>} The existing profile data
   */
  private async readExistingProfile(profileName: string): Promise<ProfileData> {
    const existingProfilePath = join(this.profilesDir, `${profileName}.json`);
    return this.fileOperations.readProfileFile(existingProfilePath);
  }

  /**
   * Merge profile configurations using the config merger
   *
   * @param {ProfileData} existingProfileData - The existing profile data
   * @param {ProfileData} newProfileData - The new profile data
   * @returns {BunTtsConfig} The merged configuration
   */
  private mergeProfileConfigurations(
    existingProfileData: ProfileData,
    newProfileData: ProfileData
  ): BunTtsConfig {
    return this.merger.mergeWithDefaults(
      existingProfileData.config as unknown as BunTtsConfig,
      newProfileData.config as unknown as BunTtsConfig
    );
  }

  /**
   * Create an updated profile with merged configuration and metadata
   *
   * @param {string} profileName - The profile name
   * @param {ProfileData} newProfileData - The new profile data
   * @param {ProfileData} existingProfileData - The existing profile data
   * @param {BunTtsConfig} mergedConfig - The merged configuration
   * @returns {ProfileData} The updated profile data
   */
  private createUpdatedProfile(
    profileName: string,
    newProfileData: ProfileData,
    existingProfileData: ProfileData,
    mergedConfig: BunTtsConfig
  ): ProfileData {
    return {
      ...newProfileData,
      config: mergedConfig as unknown as Record<string, unknown>,
      metadata: this.createMergedMetadata(
        profileName,
        newProfileData,
        existingProfileData
      ),
    };
  }

  /**
   * Create merged metadata that preserves existing data when available
   *
   * @param {string} profileName - The profile name
   * @param {ProfileData} newProfileData - The new profile data
   * @param {ProfileData} existingProfileData - The existing profile data
   * @returns {ProfileData['metadata']} The merged metadata
   */
  private createMergedMetadata(
    profileName: string,
    newProfileData: ProfileData,
    existingProfileData: ProfileData
  ): ProfileData['metadata'] {
    return {
      ...newProfileData.metadata,
      name: profileName,
      updatedAt: new Date().toISOString(),
      createdAt: this.resolveCreatedAtTimestamp(
        newProfileData,
        existingProfileData
      ),
    };
  }

  /**
   * Resolve the createdAt timestamp, prioritizing existing data
   *
   * @param {ProfileData} newProfileData - The new profile data
   * @param {ProfileData} existingProfileData - The existing profile data
   * @returns {string} The resolved createdAt timestamp
   */
  private resolveCreatedAtTimestamp(
    newProfileData: ProfileData,
    existingProfileData: ProfileData
  ): string {
    return (
      newProfileData.metadata?.createdAt ||
      existingProfileData.metadata?.createdAt ||
      new Date().toISOString()
    );
  }

  /**
   * Complete the merge process by saving the profile and updating statistics
   *
   * @param {string} profileName - The profile name
   * @param {ProfileData} updatedProfile - The updated profile data
   * @param {ImportExportStats} importStats - Import statistics
   * @returns {Promise<void>}
   */
  private async completeMergeProfile(
    profileName: string,
    updatedProfile: ProfileData,
    importStats: ImportExportStats
  ): Promise<void> {
    await this.fileOperations.saveProfile(profileName, updatedProfile);
    importStats.importedCount++;
  }
}

/**
 * Import/export statistics interface
 */
export interface ImportExportStats {
  importedCount: number;
  failedCount: number;
  errors: Array<{ file: string; error: string }>;
}
