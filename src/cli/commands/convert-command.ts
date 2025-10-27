import { ConfigManager } from '../../config/index.js';
import type { Logger } from '../../interfaces/logger.js';
import type { CliContext } from '../../types/index.js';

/**
 * Convert Command - Converts documents to audiobook format
 * Uses dependency injection for logging and configuration
 */
export class ConvertCommand {
  /**
   * Creates a new instance of the ConvertCommand.
   *
   * @param logger - The logger instance for recording command execution details
   * @param configManager - The configuration manager for handling configuration loading
   */
  constructor(
    private logger: Logger,
    private configManager: ConfigManager
  ) {}

  /**
   * Executes the convert command with the provided CLI context.
   *
   * @param context - The CLI context containing input file, flags, and log level
   * @returns Promise that resolves when the command execution is complete
   */
  public async execute(context: CliContext): Promise<void> {
    this.logCommandStart(context);
    this.displayPlaceholderInfo(context);

    if (context.flags.config) {
      await this.handleConfigurationLoading(context.flags.config);
    }

    this.logger.info('Convert command completed (placeholder implementation)');
  }

  /**
   * Logs the start of the convert command execution.
   *
   * @param context - The CLI context containing execution details
   * @private
   */
  private logCommandStart(context: CliContext): void {
    this.logger.info('Convert command started', {
      input: context.input,
      verbose: context.flags.verbose,
      configPath: context.flags.config,
    });
  }

  /**
   * Displays placeholder information about the convert command functionality.
   *
   * @param context - The CLI context containing execution details
   * @private
   */
  private displayPlaceholderInfo(context: CliContext): void {
    console.log('Convert command - not yet implemented');
    console.log(
      'This will convert documents to audiobooks in future iterations'
    );
    console.log(
      `Context: logLevel=${context.logLevel}, verbose=${context.flags.verbose}`
    );
  }

  /**
   * Handles loading configuration if a config path is provided.
   *
   * @param configPath - The path to the configuration file
   * @private
   */
  private async handleConfigurationLoading(configPath: string): Promise<void> {
    this.logger.debug('Loading configuration', {
      configPath,
    });

    const configResult = await this.configManager.loadConfig({
      configPath,
    });

    if (configResult.success) {
      this.logger.info('Configuration loaded successfully');
      console.log('Configuration loaded from:', configPath);
    } else {
      this.logger.error('Failed to load configuration', {
        message: configResult.error.message,
        code: configResult.error.code,
        category: configResult.error.category,
        details: configResult.error.details,
      });
      console.error(
        'Error loading configuration:',
        configResult.error.message
      );
    }
  }
}
