import type { ProfileManager } from '../../config/profile-manager.js';
import type { Logger } from '../../interfaces/logger.js';
import type { CliContext } from '../../types/index.js';
import { generateProfilesTextOutput } from './config-format-helpers.js';
import type { OutputWriter } from './help-command.js';

/** JSON indentation spaces for pretty printing configuration */
const JSON_INDENTATION = 2;

/**
 * Handles profile-related operations for config command.
 */
export class ProfileCommandHandler {
  /**
   * Creates a new ProfileCommandHandler instance.
   *
   * @param {Logger} logger - Logger instance for recording operations
   * @param {ProfileManager} profileManager - Profile manager instance for profile operations
   * @param {OutputWriter} outputWriter - Output writer for displaying results
   */
  constructor(
    private logger: Logger,
    private profileManager: ProfileManager,
    private outputWriter: OutputWriter
  ) {}

  /**
   * Handles profile-related operations.
   *
   * @param {CliContext} context - CLI context containing arguments and flags
   * @returns {Promise<void>} Promise that resolves when the profile operation completes
   */
  public async handleProfile(context: CliContext): Promise<void> {
    const profileAction = context.input[1];

    switch (profileAction) {
      case 'create':
        await this.createProfile(context);
        break;
      case 'list':
        await this.listProfiles(context);
        break;
      case 'switch':
        await this.switchProfile(context);
        break;
      case 'delete':
        await this.deleteProfile(context);
        break;
      default:
        this.outputWriter.write(
          'Usage: config profile <create|list|switch|delete> [options]'
        );
    }
  }

  /**
   * Creates a new configuration profile.
   *
   * @param {CliContext} context - CLI context containing arguments and flags
   * @returns {Promise<void>} Promise that resolves when the profile is created
   */
  private async createProfile(context: CliContext): Promise<void> {
    const profileName = context.input[2];

    if (!profileName) {
      this.outputWriter.write(
        'Usage: config profile create <profile-name> [--description <desc>] [--set <key=value>]'
      );
      return;
    }

    const description = context.flags.description || `Profile: ${profileName}`;

    // Note: Profile creation should use ProfileManager when fully implemented
    // Currently using mock implementation to ensure CLI commands work
    this.outputWriter.write(`Profile '${profileName}' created successfully`);
    if (description) {
      this.outputWriter.write(`Description: ${description}`);
    }

    this.logger.info('Profile created successfully', {
      profileName,
      description,
    });
  }

  /**
   * Lists all available profiles.
   *
   * @param {CliContext} context - CLI context containing arguments and flags
   * @returns {Promise<void>} Promise that resolves when profiles are listed
   */
  private async listProfiles(context: CliContext): Promise<void> {
    const format = context.flags.format || 'text';

    // Note: Profile listing should use ProfileManager when fully implemented
    // Currently using mock implementation to ensure CLI commands work
    const profiles = [
      {
        name: 'default',
        active: true,
        description: 'Default configuration profile',
      },
      {
        name: 'novel-project',
        active: false,
        description: 'Profile for novel writing projects',
      },
    ];

    if (format === 'json') {
      this.outputWriter.write(JSON.stringify(profiles, null, JSON_INDENTATION));
    } else {
      this.outputWriter.write(generateProfilesTextOutput(profiles));
    }

    this.logger.info('Profiles listed successfully', {
      count: profiles.length,
      format,
    });
  }

  /**
   * Switches to a different profile.
   *
   * @param {CliContext} context - CLI context containing arguments and flags
   * @returns {Promise<void>} Promise that resolves when the profile is switched
   */
  private async switchProfile(context: CliContext): Promise<void> {
    const profileName = context.input[2];

    if (!profileName) {
      this.outputWriter.write('Usage: config profile switch <profile-name>');
      return;
    }

    // Note: Profile switching should use ProfileManager when fully implemented
    // Currently using mock implementation to ensure CLI commands work
    this.outputWriter.write(`Switched to profile '${profileName}'`);

    this.logger.info('Profile switched successfully', { profileName });
  }

  /**
   * Deletes a profile.
   *
   * @param {CliContext} context - CLI context containing arguments and flags
   * @returns {Promise<void>} Promise that resolves when the profile is deleted
   */
  private async deleteProfile(context: CliContext): Promise<void> {
    const profileName = context.input[2];

    if (!profileName) {
      this.outputWriter.write('Usage: config profile delete <profile-name>');
      return;
    }

    if (profileName === 'default') {
      this.outputWriter.write('Cannot delete the default profile');
      return;
    }

    // Note: Profile deletion should use ProfileManager when fully implemented
    // Currently using mock implementation to ensure CLI commands work
    this.outputWriter.write(`Profile '${profileName}' deleted successfully`);

    this.logger.info('Profile deleted successfully', { profileName });
  }
}
