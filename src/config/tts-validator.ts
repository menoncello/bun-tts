import { ConfigurationError } from '../errors/configuration-error.js';
import { Result, Ok, Err } from '../errors/result.js';
import {
  VALID_TTS_ENGINES,
  VALID_OUTPUT_FORMATS,
  MIN_SAMPLE_RATE,
  MAX_SAMPLE_RATE,
  MIN_QUALITY,
  MAX_QUALITY,
  MIN_RATE,
  MAX_RATE,
  MIN_VOLUME,
  MAX_VOLUME,
} from './config-validator-constants.js';

// Export constants for testing
export {
  MIN_SAMPLE_RATE,
  MAX_SAMPLE_RATE,
  MIN_QUALITY,
  MAX_QUALITY,
  MIN_RATE,
  MAX_RATE,
  MIN_VOLUME,
  MAX_VOLUME,
  VALID_TTS_ENGINES,
  VALID_OUTPUT_FORMATS,
};

/**
 * TTS-specific configuration validation methods
 */
export class TtsValidator {
  /**
   * Validate TTS engine
   *
   * @param {string} engine - The engine to validate
   * @returns {Result<true, ConfigurationError>} A Result containing true on success or a ConfigurationError on failure
   */
  validateTtsEngine(engine?: string): Result<true, ConfigurationError> {
    if (engine && typeof engine !== 'string') {
      return Err(
        new ConfigurationError('Invalid TTS engine: must be a string', {
          path: 'tts.defaultEngine',
        })
      );
    }

    if (
      engine &&
      !VALID_TTS_ENGINES.includes(engine as (typeof VALID_TTS_ENGINES)[number])
    ) {
      return Err(
        new ConfigurationError(
          `Invalid TTS engine: ${engine}. Available engines: ${VALID_TTS_ENGINES.join(', ')}`,
          {
            path: 'tts.defaultEngine',
            code: 'INVALID_ENGINE',
            suggestions: [...VALID_TTS_ENGINES],
          }
        )
      );
    }
    return Ok(true);
  }

  /**
   * Validate TTS output format
   *
   * @param {string} format - The output format to validate
   * @returns {Result<true, ConfigurationError>} A Result containing true on success or a ConfigurationError on failure
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
      return Err(
        new ConfigurationError(`Invalid output format: ${format}`, {
          path: 'output.format',
        })
      );
    }
    return Ok(true);
  }

  /**
   * Validate TTS sample rate
   *
   * @param {number} sampleRate - The sample rate to validate
   * @returns {Result<true, ConfigurationError>} A Result containing true on success or a ConfigurationError on failure
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
   * @param {number} quality - The quality to validate
   * @returns {Result<true, ConfigurationError>} A Result containing true on success or a ConfigurationError on failure
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
   * @param {number} rate - The rate to validate
   * @returns {Result<true, ConfigurationError>} A Result containing true on success or a ConfigurationError on failure
   */
  validateTtsRate(rate?: number): Result<true, ConfigurationError> {
    if (
      rate !== undefined &&
      (rate <= 0 || rate < MIN_RATE || rate > MAX_RATE)
    ) {
      return Err(
        new ConfigurationError(
          `Rate must be between ${MIN_RATE} and ${MAX_RATE}`,
          {
            path: 'tts.rate',
          }
        )
      );
    }
    return Ok(true);
  }

  /**
   * Validate TTS volume
   *
   * @param {number} volume - The volume to validate
   * @returns {Result<true, ConfigurationError>} A Result containing true on success or a ConfigurationError on failure
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
}
