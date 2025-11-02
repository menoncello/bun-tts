import { ConfigurationError } from '../errors/configuration-error.js';
import { Result, Ok, Err } from '../errors/result.js';
import type { BunTtsConfig } from '../types/config.js';
import { CacheValidator } from './cache-validator.js';
import { CliValidator } from './cli-validator.js';
import { VALID_LOG_LEVELS } from './config-validator-constants.js';
import { OutputValidator } from './output-validator.js';
import { ProcessingValidator } from './processing-validator.js';
import { SchemaValidator } from './schema-validator.js';
import { TtsValidator } from './tts-validator.js';

// Export constants for testing (unused in this file but needed by tests)
export {
  VALID_LOG_LEVELS,
  VALID_TTS_ENGINES,
  VALID_OUTPUT_FORMATS,
  MIN_WORKERS,
  MAX_WORKERS,
  MIN_SAMPLE_RATE,
  MAX_SAMPLE_RATE,
  MIN_QUALITY,
  MAX_QUALITY,
  MIN_RATE,
  MAX_RATE,
  MIN_VOLUME,
  MAX_VOLUME,
} from './config-validator-constants.js';

/**
 * Context for configuration validation containing existing profiles
 */
export interface ValidationContext {
  existingProfiles?: string[];
}

/**
 * Warning information for schema validation
 */
export interface SchemaWarning {
  code: string;
  message: string;
}

/**
 * Configuration validator for bun-tts
 *
 * Provides validation methods for all configuration sections including
 * logging, TTS, processing, and cache configurations.
 */
export class ConfigValidator {
  private readonly outputValidator = new OutputValidator();
  private readonly processingValidator = new ProcessingValidator();
  private readonly cacheValidator = new CacheValidator();
  private readonly cliValidator = new CliValidator();
  private readonly schemaValidator = new SchemaValidator();

  /**
   * Validate configuration values
   *
   * Validates that all configuration values are within acceptable ranges and
   * have valid types. Returns a Result indicating success or failure.
   *
   * @param {Partial<BunTtsConfig>} config - The configuration object to validate
   * @param {ValidationContext} [context] - Optional context for validation (e.g., existing profiles)
   * @returns {Result<true, ConfigurationError>} A Result containing true on success or a ConfigurationError on failure
   */
  validate(
    config: Partial<BunTtsConfig>,
    context?: ValidationContext
  ): Result<true, ConfigurationError> {
    // Handle undefined config - treat as empty config
    if (!config) {
      return Ok(true);
    }

    // Validate profile references if context provided
    if (
      context?.existingProfiles &&
      config.profiles?.active &&
      !context.existingProfiles.includes(config.profiles.active)
    ) {
      return Err(
        new ConfigurationError(
          `Active profile '${config.profiles.active}' does not exist`,
          {
            path: 'profiles.active',
            profile: config.profiles.active,
            existingProfiles: context.existingProfiles,
          }
        )
      );
    }

    return this.validateAllConfigSections(config);
  }

  /**
   * Validate all configuration sections
   *
   * @param {Partial<BunTtsConfig>} config - The configuration object to validate
   * @returns {Result<true, ConfigurationError>} Validation result
   */
  private validateAllConfigSections(
    config: Partial<BunTtsConfig>
  ): Result<true, ConfigurationError> {
    const validators = [
      () => this.validateLoggingConfig(config.logging),
      () => this.validateTtsConfig(config.tts),
      () =>
        this.processingValidator.validateProcessingConfig(config.processing),
      () => this.outputValidator.validateOutputConfig(config.output),
      () => this.cacheValidator.validateCacheConfig(config.cache),
      () => this.cliValidator.validateCliConfig(config.cli),
    ];

    return this.executeValidators(validators);
  }

  /**
   * Execute a list of validator functions
   *
   * @param {(() => Result<true, ConfigurationError>)[]} validators - Array of validator functions
   * @returns {Result<true, ConfigurationError>} First failure or success
   */
  private executeValidators(
    validators: Array<() => Result<true, ConfigurationError>>
  ): Result<true, ConfigurationError> {
    for (const validator of validators) {
      const result = validator();
      if (!result.success) {
        return result;
      }
    }
    return Ok(true);
  }

  /**
   * Validate logging configuration
   *
   * @param {BunTtsConfig['logging']} logging - The logging configuration to validate
   * @returns {any} Result<true, ConfigurationError> A Result containing true on success or a ConfigurationError on failure
   */
  validateLoggingConfig(
    logging?: BunTtsConfig['logging']
  ): Result<true, ConfigurationError> {
    if (logging?.level && !VALID_LOG_LEVELS.includes(logging.level)) {
      return Err(new ConfigurationError(`Invalid log level: ${logging.level}`));
    }
    return Ok(true);
  }

  /**
   * Validate TTS configuration
   *
   * @param {BunTtsConfig['tts']} tts - The TTS configuration to validate
   * @returns {Result<true, ConfigurationError>} A Result containing true on success or a ConfigurationError on failure
   */
  validateTtsConfig(
    tts?: BunTtsConfig['tts']
  ): Result<true, ConfigurationError> {
    if (!tts) return Ok(true);

    const validator = this.createTtsValidator();

    const validations = [
      () => validator.validateTtsEngine(tts.defaultEngine),
      () => validator.validateTtsOutputFormat(tts.outputFormat),
      () => validator.validateTtsSampleRate(tts.sampleRate),
      () => validator.validateTtsQuality(tts.quality),
      () => validator.validateTtsRate(tts.rate),
      () => validator.validateTtsVolume(tts.volume),
    ];

    return this.executeValidators(validations);
  }

  /**
   * Create and return a TTS validator instance
   *
   * @private
   * @returns {TtsValidator} TTS validator instance
   */
  private createTtsValidator(): TtsValidator {
    return new TtsValidator();
  }

  /**
   * Validate TTS engine (wrapper method for testing)
   *
   * @param {string} engine - The engine to validate
   * @returns {Result<true, ConfigurationError>} Validation result
   */
  validateTtsEngine(engine?: string): Result<true, ConfigurationError> {
    return this.createTtsValidator().validateTtsEngine(engine);
  }

  /**
   * Validate TTS output format (wrapper method for testing)
   *
   * @param {string} format - The output format to validate
   * @returns {Result<true, ConfigurationError>} Validation result
   */
  validateTtsOutputFormat(format?: string): Result<true, ConfigurationError> {
    return this.createTtsValidator().validateTtsOutputFormat(format);
  }

  /**
   * Validate TTS sample rate (wrapper method for testing)
   *
   * @param {number} sampleRate - The sample rate to validate
   * @returns {Result<true, ConfigurationError>} Validation result
   */
  validateTtsSampleRate(sampleRate?: number): Result<true, ConfigurationError> {
    return this.createTtsValidator().validateTtsSampleRate(sampleRate);
  }

  /**
   * Validate TTS quality (wrapper method for testing)
   *
   * @param {number} quality - The quality to validate
   * @returns {Result<true, ConfigurationError>} Validation result
   */
  validateTtsQuality(quality?: number): Result<true, ConfigurationError> {
    return this.createTtsValidator().validateTtsQuality(quality);
  }

  /**
   * Validate TTS rate (wrapper method for testing)
   *
   * @param {number} rate - The rate to validate
   * @returns {Result<true, ConfigurationError>} Validation result
   */
  validateTtsRate(rate?: number): Result<true, ConfigurationError> {
    return this.createTtsValidator().validateTtsRate(rate);
  }

  /**
   * Validate TTS volume (wrapper method for testing)
   *
   * @param {number} volume - The volume to validate
   * @returns {Result<true, ConfigurationError>} Validation result
   */
  validateTtsVolume(volume?: number): Result<true, ConfigurationError> {
    return this.createTtsValidator().validateTtsVolume(volume);
  }

  /**
   * Type guard to check if a config is valid at runtime
   *
   * @param {Partial<BunTtsConfig>} config - The configuration to check
   * @returns {boolean} True if config is valid
   */
  isValidConfig(config: Partial<BunTtsConfig>): config is BunTtsConfig {
    return this.validate(config).success;
  }

  /**
   * Type guard to check if a config is valid for profiles
   *
   * @param {Partial<BunTtsConfig>} config - The configuration to check
   * @returns {boolean} True if config is valid for profiles
   */
  isValidProfileConfig(config: Partial<BunTtsConfig>): boolean {
    return this.isValidConfig(config);
  }

  /**
   * Validate configuration before saving
   *
   * @param {Partial<BunTtsConfig>} config - The configuration to validate
   * @param {object} options - Validation options
   * @param {boolean} [options.allowUnknownFields] - Whether to allow unknown fields
   * @returns {Promise<Result<true, ConfigurationError>>} Validation result
   */
  async validateBeforeSave(
    config: Partial<BunTtsConfig>,
    options?: { allowUnknownFields?: boolean }
  ): Promise<Result<true, ConfigurationError>> {
    const result = this.validate(config);
    return result.success
      ? this.schemaValidator.validateUnknownFields(
          config,
          options?.allowUnknownFields
        )
      : result;
  }

  /**
   * Validate configuration for import
   *
   * @param {Partial<BunTtsConfig>} config - The configuration to validate
   * @returns {Promise<Result<{ valid: boolean; warnings?: SchemaWarning[] }, ConfigurationError>>} Validation result with warnings
   */
  async validateForImport(
    config: Partial<BunTtsConfig>
  ): Promise<
    Result<{ valid: boolean; warnings?: SchemaWarning[] }, ConfigurationError>
  > {
    return this.schemaValidator.validateForImport(config);
  }

  /**
   * Validate processing configuration (wrapper method for testing)
   *
   * @param {BunTtsConfig['processing']} processing - The processing configuration to validate
   * @returns {Result<true, ConfigurationError>} Validation result
   */
  validateProcessingConfig(
    processing?: BunTtsConfig['processing']
  ): Result<true, ConfigurationError> {
    return this.processingValidator.validateProcessingConfig(processing);
  }

  /**
   * Validate cache configuration (wrapper method for testing)
   *
   * @param {BunTtsConfig['cache']} cache - The cache configuration to validate
   * @returns {Result<true, ConfigurationError>} Validation result
   */
  validateCacheConfig(
    cache?: BunTtsConfig['cache']
  ): Result<true, ConfigurationError> {
    return this.cacheValidator.validateCacheConfig(cache);
  }
}
