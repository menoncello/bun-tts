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
export const VALID_OUTPUT_FORMATS = ['mp3', 'wav', 'ogg'] as const;
export const MIN_SAMPLE_RATE = 8000;
export const MAX_SAMPLE_RATE = 48000;
export const MIN_QUALITY = 0;
export const MAX_QUALITY = 1;
export const MIN_RATE = 0.1;
export const MAX_RATE = 3.0;
export const MIN_VOLUME = 0;
export const MAX_VOLUME = 2.0;

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

    const processingValidation = this.validateProcessingConfig(
      config.processing
    );
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
   * @param tts - The TTS configuration to validate
   * @returns A Result containing true on success or a ConfigurationError on failure
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
   * @param engine - The engine to validate
   * @returns A Result containing true on success or a ConfigurationError on failure
   */
  validateTtsEngine(engine?: string): Result<true, ConfigurationError> {
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
   * @param format - The output format to validate
   * @returns A Result containing true on success or a ConfigurationError on failure
   */
  validateTtsOutputFormat(format?: string): Result<true, ConfigurationError> {
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
   * @param sampleRate - The sample rate to validate
   * @returns A Result containing true on success or a ConfigurationError on failure
   */
  validateTtsSampleRate(sampleRate?: number): Result<true, ConfigurationError> {
    if (
      sampleRate &&
      (sampleRate < MIN_SAMPLE_RATE || sampleRate > MAX_SAMPLE_RATE)
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
   * @param quality - The quality to validate
   * @returns A Result containing true on success or a ConfigurationError on failure
   */
  validateTtsQuality(quality?: number): Result<true, ConfigurationError> {
    if (quality && (quality < MIN_QUALITY || quality > MAX_QUALITY)) {
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
   * @param rate - The rate to validate
   * @returns A Result containing true on success or a ConfigurationError on failure
   */
  validateTtsRate(rate?: number): Result<true, ConfigurationError> {
    if (rate && (rate < MIN_RATE || rate > MAX_RATE)) {
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
   * @param volume - The volume to validate
   * @returns A Result containing true on success or a ConfigurationError on failure
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
   * @param processing - The processing configuration to validate
   * @returns A Result containing true on success or a ConfigurationError on failure
   */
  validateProcessingConfig(
    processing?: BunTtsConfig['processing']
  ): Result<true, ConfigurationError> {
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
  validateCacheConfig(
    cache?: BunTtsConfig['cache']
  ): Result<true, ConfigurationError> {
    if (cache?.maxSize && cache.maxSize <= 0) {
      return Err(new ConfigurationError(`Cache max size must be positive`));
    }

    if (cache?.ttl && cache.ttl <= 0) {
      return Err(new ConfigurationError(`Cache TTL must be positive`));
    }

    return Ok(true);
  }
}
