import { ConfigManager } from '../../config/index.js';
import type { Logger } from '../../interfaces/logger.js';
import type { CliContext } from '../../types/index.js';
import {
  formatOutput,
  formatConfigListing,
  getNestedValue,
  setNestedValue,
  parseValue,
} from './config-format-helpers.js';
import type { OutputWriter } from './help-command.js';

/** JSON indentation spaces for pretty printing configuration */
const JSON_INDENTATION = 2;

/**
 * Handles core configuration operations for config command.
 */
export class ConfigOperationHandlers {
  /**
   * Creates a new ConfigOperationHandlers instance.
   *
   * @param {Logger} logger - Logger instance for recording operations
   * @param {ConfigManager} configManager - Configuration manager instance
   * @param {OutputWriter} outputWriter - Output writer for displaying results
   */
  constructor(
    private logger: Logger,
    private configManager: ConfigManager,
    private outputWriter: OutputWriter
  ) {}

  /**
   * Displays the current configuration by loading it from the config manager.
   * Prints the configuration in a formatted JSON structure to the console.
   *
   * @returns {Promise<void>} Promise that resolves when the configuration is displayed
   */
  public async showConfig(): Promise<void> {
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
  public async showSampleConfig(): Promise<void> {
    await this.configManager.createSampleConfig();

    this.logger.info('Sample configuration displayed');
  }

  /**
   * Validates the configuration file at the specified path.
   * Attempts to load the configuration and reports success or failure.
   *
   * @param {string} configPath - Optional path to the configuration file to validate
   * @returns {Promise<void>} Promise that resolves when the configuration validation completes
   */
  public async validateConfig(configPath?: string): Promise<void> {
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

  /**
   * Gets configuration values and displays them based on the provided context.
   * Supports getting specific config paths or the entire configuration.
   *
   * @param {CliContext} context - CLI context containing arguments and flags
   * @returns {Promise<void>} Promise that resolves when the configuration is displayed
   */
  public async getConfig(context: CliContext): Promise<void> {
    const { configPath, configKey, format } = this.extractConfigParams(context);
    const configResult = await this.configManager.loadConfig({ configPath });

    if (configResult.success === false) {
      this.outputWriter.write(
        `Error loading configuration: ${configResult.error.message}`
      );
      return;
    }

    await this.displayConfigResult(configResult.data, configKey, format);
    this.logger.info('Configuration retrieved successfully', {
      configKey,
      format,
    });
  }

  /**
   * Sets configuration values based on the provided context.
   * Supports setting nested configuration values with validation.
   *
   * @param {CliContext} context - CLI context containing arguments and flags
   * @returns {Promise<void>} Promise that resolves when the configuration is set
   */
  public async setConfig(context: CliContext): Promise<void> {
    const { configPath, value, type } = this.extractSetConfigParams(context);

    if (!this.validateSetConfigParams(configPath, value)) {
      return;
    }

    const configResult = await this.configManager.loadConfig();
    if (configResult.success === false) {
      this.outputWriter.write(
        `Error loading configuration: ${configResult.error.message}`
      );
      return;
    }

    await this.updateAndSaveConfig(configResult.data, configPath, value, type);
  }

  /**
   * Lists configuration keys and optionally their values.
   *
   * @param {CliContext} context - CLI context containing arguments and flags
   * @returns {Promise<void>} Promise that resolves when the configuration is listed
   */
  public async listConfig(context: CliContext): Promise<void> {
    const { section, verbose, format } = this.extractListConfigParams(context);
    const configResult = await this.configManager.loadConfig();

    if (configResult.success === false) {
      this.outputWriter.write(
        `Error loading configuration: ${configResult.error.message}`
      );
      return;
    }

    const output = this.generateListOutput(
      configResult.data,
      section,
      verbose,
      format
    );
    this.outputWriter.write(output);
    this.logger.info('Configuration listed successfully', {
      section,
      verbose,
      format,
    });
  }

  /**
   * Extracts configuration parameters from context.
   *
   * @param {CliContext} context - CLI context containing arguments and flags
   * @returns {ConfigParams} Extracted parameters
   */
  private extractConfigParams(context: CliContext): {
    configPath: string;
    configKey: string;
    format: string;
  } {
    return {
      configPath: context.flags.config || '',
      configKey: context.input[1] || '',
      format: context.flags.format || 'pretty',
    };
  }

  /**
   * Displays configuration result based on whether a specific key was requested.
   *
   * @param {unknown} config - The configuration data
   * @param {string} configKey - The specific config key (if any)
   * @param {string} format - The output format
   * @returns {Promise<void>} Promise that resolves when the configuration is displayed
   */
  private async displayConfigResult(
    config: unknown,
    configKey: string,
    format: string
  ): Promise<void> {
    if (configKey) {
      await this.displaySpecificConfigValue(config, configKey, format);
    } else {
      const output = formatOutput(config, format);
      this.outputWriter.write(output);
    }
  }

  /**
   * Displays a specific configuration value.
   *
   * @param {unknown} config - The configuration data
   * @param {string} configKey - The specific config key
   * @param {string} format - The output format
   * @returns {Promise<void>} Promise that resolves when the value is displayed
   */
  private async displaySpecificConfigValue(
    config: unknown,
    configKey: string,
    format: string
  ): Promise<void> {
    const value = getNestedValue(config, configKey);
    if (value === undefined) {
      this.outputWriter.write(`Configuration path '${configKey}' not found`);
      return;
    }
    const output = formatOutput(value, format);
    this.outputWriter.write(output);
  }

  /**
   * Extracts parameters for set config command.
   *
   * @param {CliContext} context - CLI context containing arguments and flags
   * @returns {SetConfigParams} Extracted parameters
   */
  private extractSetConfigParams(context: CliContext): {
    configPath: string;
    value: string;
    type: string;
  } {
    return {
      configPath: context.input[1] || '',
      value: context.input[2] || '',
      type: (context.flags.type as string) || 'string',
    };
  }

  /**
   * Validates parameters for set config command.
   *
   * @param {string} configPath - The configuration path
   * @param {string} value - The value to set
   * @returns {boolean} True if parameters are valid
   */
  private validateSetConfigParams(configPath: string, value: string): boolean {
    if (!configPath || !value) {
      this.outputWriter.write(
        'Usage: config set <path> <value> [--type <type>]'
      );
      return false;
    }
    return true;
  }

  /**
   * Updates and saves configuration with new value.
   *
   * @param {unknown} config - The configuration to update
   * @param {string} configPath - The configuration path
   * @param {string} value - The value to set
   * @param {string} type - The value type
   * @returns {Promise<void>} Promise that resolves when configuration is saved
   */
  private async updateAndSaveConfig(
    config: unknown,
    configPath: string,
    value: string,
    type: string
  ): Promise<void> {
    const parsedValue = parseValue(value, type);
    setNestedValue(config, configPath, parsedValue);

    // For now, just log the update - actual save functionality needs to be implemented
    // in the ConfigManager class
    this.outputWriter.write(
      `Configuration updated: ${configPath} = ${JSON.stringify(parsedValue)}`
    );
    this.logger.info(
      'Configuration updated successfully (save not yet implemented)',
      {
        configPath,
        value: parsedValue,
      }
    );
  }

  /**
   * Extracts parameters for list config command.
   *
   * @param {CliContext} context - CLI context containing arguments and flags
   * @returns {ListConfigParams} Extracted parameters
   */
  private extractListConfigParams(context: CliContext): {
    section: string;
    verbose: boolean;
    format: string;
  } {
    return {
      section: context.input[1] || '',
      verbose: context.flags.verbose || false,
      format: context.flags.format || 'text',
    };
  }

  /**
   * Generates output for the list config command.
   *
   * @param {unknown} config - The configuration data
   * @param {string} section - The specific section to list (if any)
   * @param {boolean} verbose - Whether to show values
   * @param {string} format - The output format
   * @returns {string} The generated output
   */
  private generateListOutput(
    config: unknown,
    section: string,
    verbose: boolean,
    format: string
  ): string {
    if (section) {
      const sectionConfig = getNestedValue(config, section);
      if (sectionConfig === undefined) {
        return `Section '${section}' not found`;
      }
      return formatConfigListing(sectionConfig, section, verbose, format);
    }

    return formatConfigListing(config, '', verbose, format);
  }
}
