import { cosmiconfig, type CosmiconfigResult } from 'cosmiconfig';
import { ConfigurationError } from '../errors/configuration-error.js';
import { Result, Ok, Err } from '../errors/result.js';
import type { BunTtsConfig } from '../types/config.js';
import { ConfigAccess } from './config-access.js';
import { ConfigMerger } from './config-merger.js';
import { ConfigPaths } from './config-paths.js';
import { ConfigValidator } from './config-validator.js';

/**
 * Configuration constants
 */
const JSON_INDENTATION = 2;

/**
 * Configuration manager for bun-tts
 *
 * This class handles loading, validating, and managing configuration for the bun-tts application.
 * It supports loading configuration from files using cosmiconfig and provides default values
 * when no configuration is found.
 */
export class ConfigManager {
  private config: BunTtsConfig | undefined;
  private configPath: string | undefined;
  private readonly moduleName = 'bun-tts';
  private readonly validator = new ConfigValidator();
  private readonly merger = new ConfigMerger();
  private readonly paths = new ConfigPaths();
  private readonly access = new ConfigAccess();

  /**
   * Load configuration from file system
   *
   * Searches for configuration files using cosmiconfig or loads from a specified path.
   * Merges the loaded configuration with default values and validates the result.
   *
   * @param {string} [configPath] - Optional path to a specific configuration file to load
   * @returns {any} Promise<Result<BunTtsConfig, ConfigurationError>> Promise resolving to a Result containing the loaded configuration or a ConfigurationError
   */
  async load(
    configPath?: string
  ): Promise<Result<BunTtsConfig, ConfigurationError>> {
    try {
      const explorer = cosmiconfig(this.moduleName);

      const result: CosmiconfigResult = await (configPath
        ? explorer.load(configPath)
        : explorer.search());

      if (result) {
        this.configPath = result.filepath;
        this.config = await this.mergeWithDefaults(result.config);
      } else {
        // Use default config if no configuration file found
        this.config = await this.getDefaultConfig();
        this.configPath = undefined;
      }

      return Ok(this.config);
    } catch (error) {
      const wrappedError = new ConfigurationError(
        `Failed to load configuration: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { configPath, error }
      );
      return Err(wrappedError);
    }
  }

  /**
   * Load configuration with options object (alias for load method)
   *
   * Provides a compatible interface for code expecting an options parameter.
   *
   * @param {object} [options] - Options object containing optional configPath
   * @param {string} [options.configPath] - Optional path to a specific configuration file to load
   * @returns {any} Promise<Result<BunTtsConfig, ConfigurationError>> Promise resolving to a Result containing the loaded configuration or a ConfigurationError
   */
  async loadConfig(options?: {
    configPath?: string;
  }): Promise<Result<BunTtsConfig, ConfigurationError>> {
    return this.load(options?.configPath);
  }

  /**
   * Get current configuration
   *
   * Returns the currently loaded configuration. Throws an error if no configuration
   * has been loaded yet.
   *
   * @returns {BunTtsConfig} The current BunTtsConfig object
   * @throws {ConfigurationError} if no configuration has been loaded
   */
  getConfig(): BunTtsConfig {
    if (!this.config) {
      throw new ConfigurationError(
        'Configuration not loaded. Call load() first.'
      );
    }
    return this.config;
  }

  /**
   * Get configuration file path
   *
   * Returns the path to the configuration file that was loaded, or undefined
   * if no configuration file was found (using defaults).
   *
   * @returns {string | undefined} The configuration file path or undefined
   */
  getConfigPath(): string | undefined {
    return this.configPath;
  }

  /**
   * Get default configuration
   *
   * Returns a deep copy of the default configuration values.
   *
   * @returns {Promise<BunTtsConfig>} A new BunTtsConfig object with default values
   */
  private async getDefaultConfig(): Promise<BunTtsConfig> {
    // Import DEFAULT_CONFIG dynamically to avoid circular dependencies
    const configModule = await import('../types/config.js');
    const { DEFAULT_CONFIG: defaultConfig } = configModule;
    return JSON.parse(JSON.stringify(defaultConfig)) as BunTtsConfig;
  }

  /**
   * Merge user configuration with defaults
   *
   * Performs a deep merge of user-provided configuration with default values,
   * ensuring all required properties are present.
   *
   * @param {Partial<BunTtsConfig>} userConfig - The user-provided configuration object
   * @returns {Promise<BunTtsConfig>} A merged BunTtsConfig object
   */
  private async mergeWithDefaults(
    userConfig: Partial<BunTtsConfig>
  ): Promise<BunTtsConfig> {
    const defaults = await this.getDefaultConfig();
    return this.merger.mergeWithDefaults(defaults, userConfig);
  }

  /**
   * Validate configuration values
   *
   * Validates that all configuration values are within acceptable ranges and
   * have valid types. Returns a Result indicating success or failure.
   *
   * @param {Partial<BunTtsConfig>} config - The configuration object to validate
   * @returns {any} Result<true, ConfigurationError> A Result containing true on success or a ConfigurationError on failure
   */
  validate(config: Partial<BunTtsConfig>): Result<true, ConfigurationError> {
    return this.validator.validate(config);
  }

  /**
   * Get global configuration directory
   *
   * Returns the path to the global configuration directory in the user's home directory.
   *
   * @returns {string} The absolute path to the global config directory
   */
  getGlobalConfigDir(): string {
    return this.paths.getGlobalConfigDir();
  }

  /**
   * Get global configuration file path
   *
   * Returns the full path to the global configuration file.
   *
   * @returns {string} The absolute path to the global config file
   */
  getGlobalConfigPath(): string {
    return this.paths.getGlobalConfigPath();
  }

  /**
   * Create a sample configuration string
   *
   * Returns a formatted JSON string containing sample configuration values
   * to help users understand the configuration format.
   *
   * @returns {Promise<string>} A JSON string containing sample configuration
   */
  async createSampleConfig(): Promise<string> {
    const defaultConfig = await this.getDefaultConfig();
    const sampleConfig = {
      ...defaultConfig,
      _comment: {
        'This is a sample configuration file for bun-tts': true,
        'Copy this to bun-tts.config.json and modify as needed': true,
        'See documentation for all available options': true,
      },
    };
    return JSON.stringify(sampleConfig, null, JSON_INDENTATION);
  }

  /**
   * Get configuration value by key
   *
   * Retrieves a configuration value using dot notation for nested keys.
   * Returns the provided default value if the key is not found.
   *
   * @param {any} key - The configuration key to retrieve (supports dot notation)
   * @param {T} [defaultValue] - Default value to return if key is not found
   * @returns {T} The configuration value or default
   */
  get<T = unknown>(key: string, defaultValue?: T): T {
    return this.access.get(this.config, key, defaultValue);
  }

  /**
   * Set configuration value by key
   *
   * Sets a configuration value using dot notation for nested keys.
   *
   * @param {any} key - The configuration key to set (supports dot notation)
   * @param {any} value - The value to set
   * @returns {void}
   */
  set(key: string, value: unknown): void {
    if (this.config) {
      this.config = this.access.set(this.config, key, value);
    }
  }

  /**
   * Check if configuration key exists
   *
   * @param {any} key - The configuration key to check (supports dot notation)
   * @returns {boolean} True if the key exists, false otherwise
   */
  has(key: string): boolean {
    return this.access.has(this.config, key);
  }

  /**
   * Clear all configuration
   *
   * @returns {void}
   */
  clear(): void {
    this.config = undefined;
    this.configPath = undefined;
  }

  /**
   * Save configuration to file
   *
   * Validates the provided configuration and saves it to the specified file path
   * as a JSON file with proper formatting.
   *
   * @param {object} config - The configuration object to save
   * @param {any} filePath - The path where the configuration should be saved
   * @returns {any} Promise<Result<void, ConfigurationError>> A Result indicating success or containing a ConfigurationError on failure
   */
  async save(
    config: BunTtsConfig,
    filePath: string
  ): Promise<Result<void, ConfigurationError>> {
    try {
      const validation = this.validate(config);
      if (!validation.success) {
        return validation as Result<void, ConfigurationError>;
      }

      const fs = await import('fs/promises');
      await fs.writeFile(
        filePath,
        JSON.stringify(config, null, JSON_INDENTATION)
      );

      return Ok(undefined as void);
    } catch (error) {
      const wrappedError = new ConfigurationError(
        `Failed to save configuration: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { filePath, error }
      );
      return Err(wrappedError);
    }
  }
}
