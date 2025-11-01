import { ConfigurationError } from '../errors/configuration-error.js';
import { Result, Ok, Err } from '../errors/result.js';
import type { BunTtsConfig } from '../types/config.js';

/**
 * Configuration validation constants
 */
export const VALID_LOG_LEVELS = [
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
] as const;

export const VALID_TTS_ENGINES = ['kokoro', 'chatterbox'] as const;
export const VALID_OUTPUT_FORMATS = ['mp3', 'wav', 'm4a'] as const;
export const MIN_SAMPLE_RATE = 8000;
export const MAX_SAMPLE_RATE = 48000;
export const MIN_QUALITY = Number.EPSILON;
export const MAX_QUALITY = 1;
export const MIN_RATE = 0.1;
export const MAX_RATE = 3.0;
export const MIN_VOLUME = 0;
export const MAX_VOLUME = 2.0;
export const MIN_WORKERS = 1;
export const MAX_WORKERS = 32;

/**
 * Configuration validator for bun-tts
 *
 * Provides validation methods for all configuration sections including
 * logging, TTS, processing, and cache configurations.
 */
export class ConfigValidator {
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
    // Handle undefined config - treat as empty config
    if (!config) {
      return Ok(true);
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
      () => this.validateProcessingConfig(config.processing),
      () => this.validateCacheConfig(config.cache),
      () => this.validateCliConfig(config.cli),
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
   * @returns {any} Result<true, ConfigurationError> A Result containing true on success or a ConfigurationError on failure
   */
  validateTtsConfig(
    tts?: BunTtsConfig['tts']
  ): Result<true, ConfigurationError> {
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
   * @param {any} engine - The engine to validate
   * @returns {any} Result<true, ConfigurationError> A Result containing true on success or a ConfigurationError on failure
   */
  validateTtsEngine(engine?: string): Result<true, ConfigurationError> {
    if (engine && typeof engine !== 'string') {
      return Err(
        new ConfigurationError('Invalid TTS engine: must be a string')
      );
    }

    if (
      engine &&
      !VALID_TTS_ENGINES.includes(engine as (typeof VALID_TTS_ENGINES)[number])
    ) {
      return Err(new ConfigurationError(`Invalid TTS engine: ${engine}`));
    }
    return Ok(true);
  }

  /**
   * Validate TTS output format
   *
   * @param {any} format - The output format to validate
   * @returns {any} Result<true, ConfigurationError> A Result containing true on success or a ConfigurationError on failure
   */
  validateTtsOutputFormat(format?: string): Result<true, ConfigurationError> {
    if (format && typeof format !== 'string') {
      return Err(
        new ConfigurationError('Invalid output format: must be a string')
      );
    }

    if (
      format &&
      !VALID_OUTPUT_FORMATS.includes(
        format as (typeof VALID_OUTPUT_FORMATS)[number]
      )
    ) {
      return Err(new ConfigurationError(`Invalid output format: ${format}`));
    }
    return Ok(true);
  }

  /**
   * Validate TTS sample rate
   *
   * @param {any} sampleRate - The sample rate to validate
   * @returns {any} Result<true, ConfigurationError> A Result containing true on success or a ConfigurationError on failure
   */
  validateTtsSampleRate(sampleRate?: number): Result<true, ConfigurationError> {
    if (
      sampleRate !== undefined &&
      (sampleRate <= 0 ||
        sampleRate < MIN_SAMPLE_RATE ||
        sampleRate > MAX_SAMPLE_RATE)
    ) {
      return Err(
        new ConfigurationError(
          `Sample rate must be between ${MIN_SAMPLE_RATE} and ${MAX_SAMPLE_RATE}`
        )
      );
    }
    return Ok(true);
  }

  /**
   * Validate TTS quality
   *
   * @param {any} quality - The quality to validate
   * @returns {any} Result<true, ConfigurationError> A Result containing true on success or a ConfigurationError on failure
   */
  validateTtsQuality(quality?: number): Result<true, ConfigurationError> {
    if (
      quality !== undefined &&
      (quality < MIN_QUALITY || quality > MAX_QUALITY)
    ) {
      return Err(
        new ConfigurationError(
          `Quality must be between ${MIN_QUALITY} and ${MAX_QUALITY}`
        )
      );
    }
    return Ok(true);
  }

  /**
   * Validate TTS rate
   *
   * @param {any} rate - The rate to validate
   * @returns {any} Result<true, ConfigurationError> A Result containing true on success or a ConfigurationError on failure
   */
  validateTtsRate(rate?: number): Result<true, ConfigurationError> {
    if (
      rate !== undefined &&
      (rate <= 0 || rate < MIN_RATE || rate > MAX_RATE)
    ) {
      return Err(
        new ConfigurationError(
          `Rate must be between ${MIN_RATE} and ${MAX_RATE}`
        )
      );
    }
    return Ok(true);
  }

  /**
   * Validate TTS volume
   *
   * @param {any} volume - The volume to validate
   * @returns {any} Result<true, ConfigurationError> A Result containing true on success or a ConfigurationError on failure
   */
  validateTtsVolume(volume?: number): Result<true, ConfigurationError> {
    if (volume && (volume < MIN_VOLUME || volume > MAX_VOLUME)) {
      return Err(
        new ConfigurationError(
          `Volume must be between ${MIN_VOLUME} and ${MAX_VOLUME}`
        )
      );
    }
    return Ok(true);
  }

  /**
   * Validate processing configuration
   *
   * @param {BunTtsConfig['processing']} processing - The processing configuration to validate
   * @returns {any} Result<true, ConfigurationError> A Result containing true on success or a ConfigurationError on failure
   */
  validateProcessingConfig(
    processing?: BunTtsConfig['processing']
  ): Result<true, ConfigurationError> {
    if (processing?.maxFileSize !== undefined && processing.maxFileSize <= 0) {
      return Err(new ConfigurationError(`Max file size must be positive`));
    }

    if (
      processing?.maxWorkers !== undefined &&
      (processing.maxWorkers < MIN_WORKERS ||
        processing.maxWorkers > MAX_WORKERS)
    ) {
      return Err(
        new ConfigurationError(
          `Max workers must be between ${MIN_WORKERS} and ${MAX_WORKERS}`
        )
      );
    }

    return Ok(true);
  }

  /**
   * Validate cache configuration
   *
   * @param {BunTtsConfig['cache']} cache - The cache configuration to validate
   * @returns {any} Result<true, ConfigurationError> A Result containing true on success or a ConfigurationError on failure
   */
  validateCacheConfig(
    cache?: BunTtsConfig['cache']
  ): Result<true, ConfigurationError> {
    if (cache?.maxSize !== undefined && cache.maxSize <= 0) {
      return Err(new ConfigurationError(`Cache max size must be positive`));
    }

    if (cache?.ttl !== undefined && cache.ttl <= 0) {
      return Err(new ConfigurationError(`Cache TTL must be positive`));
    }

    return Ok(true);
  }

  /**
   * Validate CLI configuration
   *
   * @param {BunTtsConfig['cli']} cli - The CLI configuration to validate
   * @returns {any} Result<true, ConfigurationError> A Result containing true on success or a ConfigurationError on failure
   */
  validateCliConfig(
    cli?: BunTtsConfig['cli']
  ): Result<true, ConfigurationError> {
    if (
      cli?.showProgress !== undefined &&
      typeof cli.showProgress !== 'boolean'
    ) {
      return Err(
        new ConfigurationError(`Invalid show progress value: must be boolean`)
      );
    }

    if (cli?.colors !== undefined && typeof cli.colors !== 'boolean') {
      return Err(
        new ConfigurationError(`Invalid colors value: must be boolean`)
      );
    }

    if (cli?.debug !== undefined && typeof cli.debug !== 'boolean') {
      return Err(
        new ConfigurationError(`Invalid debug value: must be boolean`)
      );
    }

    return Ok(true);
  }
}
