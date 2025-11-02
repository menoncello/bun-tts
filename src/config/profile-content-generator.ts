import { ConfigurationError } from '../errors/configuration-error.js';
import type { Logger } from '../interfaces/logger.js';
import { JSON_INDENT_SIZE } from './profile-constants.js';
import type { ProfileData } from './profile-manager.js';

/**
 * Profile content generator utility class
 */
export class ProfileContentGenerator {
  private logger: Logger;

  /**
   * Create a new ProfileContentGenerator instance
   *
   * @param {Logger} logger - Logger instance for recording operations
   */
  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Generate profile content in the specified format
   *
   * @param {ProfileData} profile - The profile to serialize
   * @param {string} format - The format to generate ('json' or 'yaml')
   * @returns {Promise<string>} The serialized profile content
   */
  async generateProfileContent(
    profile: ProfileData,
    format: 'json' | 'yaml'
  ): Promise<string> {
    if (format === 'json') {
      return JSON.stringify(profile, null, JSON_INDENT_SIZE);
    }

    // YAML export not implemented - requires yaml package
    throw new ConfigurationError(
      'YAML export requires yaml package to be installed',
      { format }
    );
  }
}
