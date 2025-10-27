import { homedir } from 'os';
import { join } from 'path';
import { cosmiconfig, type CosmiconfigResult } from 'cosmiconfig';
import { ConfigurationError } from '../errors/configuration-error.js';
import { Result, Ok, Err } from '../errors/result.js';
import type { BunTtsConfig } from '../types/config.js';

/**
 * Configuration validation constants
 */
const VALID_LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const;
const VALID_TTS_ENGINES = ['kokoro', 'chatterbox'] as const;
const VALID_OUTPUT_FORMATS = ['mp3', 'wav', 'ogg'] as const;
const MIN_SAMPLE_RATE = 8000;
const MAX_SAMPLE_RATE = 48000;
const MIN_QUALITY = 0;
const MAX_QUALITY = 1;
const MIN_RATE = 0.1;
const MAX_RATE = 3.0;
const MIN_VOLUME = 0;
const MAX_VOLUME = 2.0;
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

  /**
   * Load configuration from file system
   *
   * Searches for configuration files using cosmiconfig or loads from a specified path.
   * Merges the loaded configuration with default values and validates the result.
   *
   * @param configPath - Optional path to a specific configuration file to load
   * @returns Promise resolving to a Result containing the loaded configuration or a ConfigurationError
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
   * @param options - Options object containing optional configPath
   * @param options.configPath - Optional path to a specific configuration file to load
   * @returns Promise resolving to a Result containing the loaded configuration or a ConfigurationError
   */
  async loadConfig(options?: { configPath?: string }): Promise<Result<BunTtsConfig, ConfigurationError>> {
    return this.load(options?.configPath);
  }

  /**
   * Get current configuration
   *
   * Returns the currently loaded configuration. Throws an error if no configuration
   * has been loaded yet.
   *
   * @returns The current BunTtsConfig object
   * @throws ConfigurationError if no configuration has been loaded
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
   * @returns The configuration file path or undefined
   */
  getConfigPath(): string | undefined {
    return this.configPath;
  }

  /**
   * Get default configuration
   *
   * Returns a deep copy of the default configuration values.
   *
   * @returns A new BunTtsConfig object with default values
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
   * @param userConfig - The user-provided configuration object
   * @returns A merged BunTtsConfig object
   */
  private async mergeWithDefaults(userConfig: Partial<BunTtsConfig>): Promise<BunTtsConfig> {
    const defaults = await this.getDefaultConfig();
    return this.deepMerge(defaults as unknown as Record<string, unknown>, userConfig as unknown as Record<string, unknown>) as unknown as BunTtsConfig;
  }

  /**
   * Deep merge two objects
   *
   * Recursively merges properties from the source object into the target object.
   * Arrays are replaced rather than merged. Objects are merged recursively.
   *
   * @param target - The target object to merge into
   * @param source - The source object to merge from
   * @returns A new object containing the merged properties
   */
  private deepMerge<T extends Record<string, unknown>>(
    target: T,
    source: Partial<T>
  ): T {
    const result = { ...target } as T;

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key];
        const targetValue = result[key];

        if (
          sourceValue &&
          typeof sourceValue === 'object' &&
          !Array.isArray(sourceValue) &&
          targetValue &&
          typeof targetValue === 'object' &&
          !Array.isArray(targetValue)
        ) {
          // Recursively merge nested objects
          result[key] = this.deepMerge(
            targetValue as Record<string, unknown>,
            sourceValue as Partial<Record<string, unknown>>
          ) as T[Extract<keyof T, string>];
        } else if (sourceValue !== undefined) {
          // Use source value if it's defined
          result[key] = sourceValue as T[Extract<keyof T, string>];
        }
      }
    }

    return result;
  }

  /**
   * Validate configuration values
   *
   * Validates that all configuration values are within acceptable ranges and
   * have valid types. Returns a Result indicating success or failure.
   *
   * @param config - The configuration object to validate
   * @returns A Result containing true on success or a ConfigurationError on failure
   */
  validate(config: Partial<BunTtsConfig>): Result<true, ConfigurationError> {
    const loggingValidation = this.validateLoggingConfig(config.logging);
    if (!loggingValidation.success) {
      return loggingValidation;
    }

    const ttsValidation = this.validateTtsConfig(config.tts);
    if (!ttsValidation.success) {
      return ttsValidation;
    }

    const processingValidation = this.validateProcessingConfig(config.processing);
    if (!processingValidation.success) {
      return processingValidation;
    }

    const cacheValidation = this.validateCacheConfig(config.cache);
    if (!cacheValidation.success) {
      return cacheValidation;
    }

    return Ok(true);
  }

  /**
   * Validate logging configuration
   *
   * @param logging - The logging configuration to validate
   * @returns A Result containing true on success or a ConfigurationError on failure
   */
  private validateLoggingConfig(logging?: BunTtsConfig['logging']): Result<true, ConfigurationError> {
    if (logging?.level && !VALID_LOG_LEVELS.includes(logging.level)) {
      return Err(new ConfigurationError(`Invalid log level: ${logging.level}`));
    }
    return Ok(true);
  }

  /**
   * Validate TTS configuration
   *
   * @param tts - The TTS configuration to validate
   * @returns A Result containing true on success or a ConfigurationError on failure
   */
  private validateTtsConfig(tts?: BunTtsConfig['tts']): Result<true, ConfigurationError> {
    if (!tts) {
      return Ok(true);
    }

    const validations = [
      () => this.validateTtsEngine(tts.defaultEngine),
      () => this.validateTtsOutputFormat(tts.outputFormat),
      () => this.validateTtsSampleRate(tts.sampleRate),
      () => this.validateTtsQuality(tts.quality),
      () => this.validateTtsRate(tts.rate),
      () => this.validateTtsVolume(tts.volume),
    ];

    for (const validation of validations) {
      const result = validation();
      if (!result.success) {
        return result;
      }
    }

    return Ok(true);
  }

  /**
   * Validate TTS engine
   *
   * @param engine - The engine to validate
   * @returns A Result containing true on success or a ConfigurationError on failure
   */
  private validateTtsEngine(engine?: string): Result<true, ConfigurationError> {
    if (engine && !VALID_TTS_ENGINES.includes(engine as typeof VALID_TTS_ENGINES[number])) {
      return Err(new ConfigurationError(`Invalid TTS engine: ${engine}`));
    }
    return Ok(true);
  }

  /**
   * Validate TTS output format
   *
   * @param format - The output format to validate
   * @returns A Result containing true on success or a ConfigurationError on failure
   */
  private validateTtsOutputFormat(format?: string): Result<true, ConfigurationError> {
    if (format && !VALID_OUTPUT_FORMATS.includes(format as typeof VALID_OUTPUT_FORMATS[number])) {
      return Err(new ConfigurationError(`Invalid output format: ${format}`));
    }
    return Ok(true);
  }

  /**
   * Validate TTS sample rate
   *
   * @param sampleRate - The sample rate to validate
   * @returns A Result containing true on success or a ConfigurationError on failure
   */
  private validateTtsSampleRate(sampleRate?: number): Result<true, ConfigurationError> {
    if (sampleRate && (sampleRate < MIN_SAMPLE_RATE || sampleRate > MAX_SAMPLE_RATE)) {
      return Err(new ConfigurationError(`Sample rate must be between ${MIN_SAMPLE_RATE} and ${MAX_SAMPLE_RATE}`));
    }
    return Ok(true);
  }

  /**
   * Validate TTS quality
   *
   * @param quality - The quality to validate
   * @returns A Result containing true on success or a ConfigurationError on failure
   */
  private validateTtsQuality(quality?: number): Result<true, ConfigurationError> {
    if (quality && (quality < MIN_QUALITY || quality > MAX_QUALITY)) {
      return Err(new ConfigurationError(`Quality must be between ${MIN_QUALITY} and ${MAX_QUALITY}`));
    }
    return Ok(true);
  }

  /**
   * Validate TTS rate
   *
   * @param rate - The rate to validate
   * @returns A Result containing true on success or a ConfigurationError on failure
   */
  private validateTtsRate(rate?: number): Result<true, ConfigurationError> {
    if (rate && (rate < MIN_RATE || rate > MAX_RATE)) {
      return Err(new ConfigurationError(`Rate must be between ${MIN_RATE} and ${MAX_RATE}`));
    }
    return Ok(true);
  }

  /**
   * Validate TTS volume
   *
   * @param volume - The volume to validate
   * @returns A Result containing true on success or a ConfigurationError on failure
   */
  private validateTtsVolume(volume?: number): Result<true, ConfigurationError> {
    if (volume && (volume < MIN_VOLUME || volume > MAX_VOLUME)) {
      return Err(new ConfigurationError(`Volume must be between ${MIN_VOLUME} and ${MAX_VOLUME}`));
    }
    return Ok(true);
  }

  /**
   * Validate processing configuration
   *
   * @param processing - The processing configuration to validate
   * @returns A Result containing true on success or a ConfigurationError on failure
   */
  private validateProcessingConfig(processing?: BunTtsConfig['processing']): Result<true, ConfigurationError> {
    if (processing?.maxFileSize && processing.maxFileSize <= 0) {
      return Err(new ConfigurationError(`Max file size must be positive`));
    }

    if (processing?.maxWorkers && processing.maxWorkers <= 0) {
      return Err(new ConfigurationError(`Max workers must be positive`));
    }

    return Ok(true);
  }

  /**
   * Validate cache configuration
   *
   * @param cache - The cache configuration to validate
   * @returns A Result containing true on success or a ConfigurationError on failure
   */
  private validateCacheConfig(cache?: BunTtsConfig['cache']): Result<true, ConfigurationError> {
    if (cache?.maxSize && cache.maxSize <= 0) {
      return Err(new ConfigurationError(`Cache max size must be positive`));
    }

    if (cache?.ttl && cache.ttl <= 0) {
      return Err(new ConfigurationError(`Cache TTL must be positive`));
    }

    return Ok(true);
  }

  /**
   * Get global configuration directory
   *
   * Returns the path to the global configuration directory in the user's home directory.
   *
   * @returns The absolute path to the global config directory
   */
  getGlobalConfigDir(): string {
    return join(homedir(), '.bun-tts');
  }

  /**
   * Get global configuration file path
   *
   * Returns the full path to the global configuration file.
   *
   * @returns The absolute path to the global config file
   */
  getGlobalConfigPath(): string {
    return join(this.getGlobalConfigDir(), 'config.json');
  }

  /**
   * Create a sample configuration string
   *
   * Returns a formatted JSON string containing sample configuration values
   * to help users understand the configuration format.
   *
   * @returns A JSON string containing sample configuration
   */
  async createSampleConfig(): Promise<string> {
    const defaultConfig = await this.getDefaultConfig();
    const sampleConfig = {
      ...defaultConfig,
      _comment: {
        'This is a sample configuration file for bun-tts': true,
        'Copy this to bun-tts.config.json and modify as needed': true,
        'See documentation for all available options': true
      }
    };
    return JSON.stringify(sampleConfig, null, JSON_INDENTATION);
  }

  /**
   * Save configuration to file
   *
   * Validates the provided configuration and saves it to the specified file path
   * as a JSON file with proper formatting.
   *
   * @param config - The configuration object to save
   * @param filePath - The path where the configuration should be saved
   * @returns A Result indicating success or containing a ConfigurationError on failure
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
      await fs.writeFile(filePath, JSON.stringify(config, null, JSON_INDENTATION));

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