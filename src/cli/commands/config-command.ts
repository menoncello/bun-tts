import { ConfigManager } from '../../config/index.js';
import type { Logger } from '../../interfaces/logger.js';
import type { CliContext } from '../../types/index.js';

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
   * @param logger - Logger instance for recording command execution and debugging information
   * @param configManager - Configuration manager instance for loading and validating configurations
   */
  constructor(
    private logger: Logger,
    private configManager: ConfigManager
  ) {}

  /**
   * Executes the config command based on the provided CLI context.
   * Handles different config actions: show, sample, and validate.
   *
   * @param context - CLI context containing command arguments and flags
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
        console.error(`Unknown config action: ${action}`);
        console.log('Available actions: show, sample, validate');
        this.logger.error('Unknown config action', { action });
    }

    this.logger.info('Config command completed', { action });
  }

  /**
   * Displays the current configuration by loading it from the config manager.
   * Prints the configuration in a formatted JSON structure to the console.
   */
  private async showConfig(): Promise<void> {
    const configResult = await this.configManager.loadConfig();

    if (configResult.success) {
      console.log('Current Configuration:');
      console.log(JSON.stringify(configResult.data, null, JSON_INDENTATION));
      this.logger.info('Configuration displayed successfully');
    } else {
      console.error(
        'Failed to load configuration:',
        configResult.error.message
      );
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
   */
  private async showSampleConfig(): Promise<void> {
    const sampleConfig = await this.configManager.createSampleConfig();
    console.log('Sample Configuration:');
    console.log(sampleConfig);
    this.logger.info('Sample configuration displayed');
  }

  /**
   * Validates the configuration file at the specified path.
   * Attempts to load the configuration and reports success or failure.
   *
   * @param configPath - Optional path to the configuration file to validate
   */
  private async validateConfig(configPath?: string): Promise<void> {
    if (!configPath) {
      console.error('Config path required for validation');
      console.log('Usage: bun-tts config validate --config <path>');
      return;
    }

    const configResult = await this.configManager.loadConfig({ configPath });

    if (configResult.success) {
      console.log(`✅ Configuration is valid: ${configPath}`);
      this.logger.info('Configuration validation successful', { configPath });
    } else {
      console.error(
        `❌ Configuration validation failed: ${configResult.error.message}`
      );
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
