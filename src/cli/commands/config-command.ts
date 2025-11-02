import { ConfigManager } from '../../config/index.js';
import type { Logger } from '../../interfaces/logger.js';
import type { CliContext } from '../../types/index.js';
import { ConfigOperationHandlers } from './config-operation-handlers.js';
import { ProfileCommandHandler } from './config-profile-handler.js';
import type { OutputWriter } from './help-command.js';

/**
 * Config Command - Manages configuration
 * Uses dependency injection for logging and configuration management
 */
export class ConfigCommand {
  private profileHandler: ProfileCommandHandler;
  private operationHandlers: ConfigOperationHandlers;

  /**
   * Creates a new ConfigCommand instance with the provided dependencies.
   *
   * @param {Logger} logger - Logger instance for recording command execution and debugging information
   * @param {ConfigManager} configManager - Configuration manager instance for loading and validating configurations
   * @param {OutputWriter} outputWriter - Output writer for displaying configuration to the user
   */
  constructor(
    private logger: Logger,
    private configManager: ConfigManager,
    private outputWriter: OutputWriter
  ) {
    this.profileHandler = new ProfileCommandHandler(logger, outputWriter);
    this.operationHandlers = new ConfigOperationHandlers(
      logger,
      configManager,
      outputWriter
    );
  }

  /**
   * Executes the config command based on the provided CLI context.
   * Handles different config actions: get, set, list, profile, show, sample, and validate.
   *
   * @param {CliContext} context - CLI context containing command arguments and flags
   * @returns {Promise<void>} Promise that resolves when the command execution completes
   */
  public async execute(context: CliContext): Promise<void> {
    const action = this.getActionFromContext(context);
    this.logCommandStart(action, context);

    await this.executeAction(action, context);

    this.logger.info('Config command completed', { action });
  }

  /**
   * Extracts the action from the CLI context.
   *
   * @param {CliContext} context - CLI context containing command arguments
   * @returns {string} The action to execute
   */
  private getActionFromContext(context: CliContext): string {
    return context.input[1] || 'show';
  }

  /**
   * Logs the start of command execution.
   *
   * @param {string} action - The action being executed
   * @param {CliContext} context - CLI context containing flags
   */
  private logCommandStart(action: string, context: CliContext): void {
    this.logger.info('Config command started', {
      action,
      verbose: context.flags.verbose,
    });
  }

  /**
   * Executes the specified action.
   *
   * @param {string} action - The action to execute
   * @param {CliContext} context - CLI context containing arguments and flags
   * @returns {Promise<void>} Promise that resolves when the action completes
   */
  private async executeAction(
    action: string,
    context: CliContext
  ): Promise<void> {
    switch (action) {
      case 'get':
        await this.operationHandlers.getConfig(context);
        break;
      case 'set':
        await this.operationHandlers.setConfig(context);
        break;
      case 'list':
        await this.operationHandlers.listConfig(context);
        break;
      case 'profile':
        await this.handleProfile(context);
        break;
      case 'show':
        await this.operationHandlers.showConfig();
        break;
      case 'sample':
        await this.operationHandlers.showSampleConfig();
        break;
      case 'validate':
        await this.operationHandlers.validateConfig(context.flags.config);
        break;
      default:
        this.logger.error('Unknown config action', { action });
    }
  }

  /**
   * Handles profile-related operations.
   *
   * @param {CliContext} context - CLI context containing arguments and flags
   * @returns {Promise<void>} Promise that resolves when the profile operation completes
   */
  private async handleProfile(context: CliContext): Promise<void> {
    await this.profileHandler.handleProfile(context);
  }
}
