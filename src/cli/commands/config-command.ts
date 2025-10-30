import { ConfigManager } from '../../config/index.js';
import type { Logger } from '../../interfaces/logger.js';
import type { CliContext } from '../../types/index.js';
import type { OutputWriter } from './help-command.js';

/** JSON indentation spaces for pretty printing configuration */
const JSON_INDENTATION = 2;

/**
 * Config Command - Manages configuration
 * Uses dependency injection for logging and configuration management
 */
export class ConfigCommand {
  /**
   * Creates a new ConfigCommand instance with the provided dependencies.
   *
   * @param {Logger} logger - Logger instance for recording command execution and debugging information
   * @param {any} configManager - Configuration manager instance for loading and validating configurations
   * @param {any} outputWriter - Output writer for displaying configuration to the user
   */
  constructor(
    private logger: Logger,
    private configManager: ConfigManager,
    private outputWriter: OutputWriter
  ) {}

  /**
   * Executes the config command based on the provided CLI context.
   * Handles different config actions: show, sample, and validate.
   *
   * @param {any} context - CLI context containing command arguments and flags
   * @returns {Promise<void>} Promise that resolves when the command execution completes
   */
  public async execute(context: CliContext): Promise<void> {
    this.logger.info('Config command started', {
      action: context.input[0],
      verbose: context.flags.verbose,
    });

    const action = context.input[0] || 'show';

    switch (action) {
      case 'show':
        await this.showConfig();
        break;
      case 'sample':
        await this.showSampleConfig();
        break;
      case 'validate':
        await this.validateConfig(context.flags.config);
        break;
      default:
        this.logger.error('Unknown config action', { action });
    }

    this.logger.info('Config command completed', { action });
  }

  /**
   * Displays the current configuration by loading it from the config manager.
   * Prints the configuration in a formatted JSON structure to the console.
   *
   * @returns {Promise<void>} Promise that resolves when the configuration is displayed
   */
  private async showConfig(): Promise<void> {
    const configResult = await this.configManager.loadConfig();

    if (configResult.success) {
      this.outputWriter.write(
        JSON.stringify(configResult.data, null, JSON_INDENTATION)
      );
      this.logger.info('Configuration displayed successfully');
    } else {
      this.logger.error('Failed to load configuration', {
        message: configResult.error.message,
        code: configResult.error.code,
        category: configResult.error.category,
        details: configResult.error.details,
      });
    }
  }

  /**
   * Displays a sample configuration template to help users understand
   * the required configuration format and available options.
   *
   * @returns {Promise<void>} Promise that resolves when the sample configuration is displayed
   */
  private async showSampleConfig(): Promise<void> {
    await this.configManager.createSampleConfig();

    this.logger.info('Sample configuration displayed');
  }

  /**
   * Validates the configuration file at the specified path.
   * Attempts to load the configuration and reports success or failure.
   *
   * @param {any} configPath - Optional path to the configuration file to validate
   * @returns {Promise<void>} Promise that resolves when the configuration validation completes
   */
  private async validateConfig(configPath?: string): Promise<void> {
    if (!configPath) {
      return;
    }

    const configResult = await this.configManager.loadConfig({ configPath });

    if (configResult.success) {
      this.logger.info('Configuration validation successful', { configPath });
    } else {
      this.logger.error('Configuration validation failed', {
        configPath,
        error: {
          message: configResult.error.message,
          code: configResult.error.code,
          category: configResult.error.category,
          details: configResult.error.details,
        },
      });
    }
  }
}
