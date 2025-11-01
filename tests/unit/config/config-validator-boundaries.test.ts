import { describe, it, expect, beforeEach } from 'bun:test';
import {
  ConfigValidator,
  MIN_SAMPLE_RATE,
  MAX_SAMPLE_RATE,
  MIN_QUALITY,
  MAX_QUALITY,
  MIN_RATE,
  MAX_RATE,
  MIN_VOLUME,
  MAX_VOLUME,
} from '../../../src/config/config-validator';
import { ConfigurationError } from '../../../src/errors/configuration-error';

describe('ConfigValidator - Boundary Value Testing', () => {
  let configValidator: ConfigValidator;

  beforeEach(() => {
    configValidator = new ConfigValidator();
  });

  describe('sample rate boundaries', () => {
    it('should accept exact minimum sample rate', () => {
      const result = configValidator.validateTtsSampleRate(MIN_SAMPLE_RATE);
      expect(result.success).toBe(true);
    });

    it('should accept exact maximum sample rate', () => {
      const result = configValidator.validateTtsSampleRate(MAX_SAMPLE_RATE);
      expect(result.success).toBe(true);
    });

    it('should reject just below minimum sample rate', () => {
      const result = configValidator.validateTtsSampleRate(MIN_SAMPLE_RATE - 1);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ConfigurationError);
        expect(result.error.message).toContain('Sample rate must be between');
      }
    });

    it('should reject just above maximum sample rate', () => {
      const result = configValidator.validateTtsSampleRate(MAX_SAMPLE_RATE + 1);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ConfigurationError);
        expect(result.error.message).toContain('Sample rate must be between');
      }
    });

    it('should accept common sample rates within range', () => {
      const commonRates = [8000, 11025, 16000, 22050, 44100, 48000];

      for (const rate of commonRates) {
        const result = configValidator.validateTtsSampleRate(rate);
        expect(result.success).toBe(true);
      }
    });

    it('should handle fractional sample rates at boundaries', () => {
      const result = configValidator.validateTtsSampleRate(
        MIN_SAMPLE_RATE + 0.5
      );
      expect(result.success).toBe(true);

      const result2 = configValidator.validateTtsSampleRate(
        MAX_SAMPLE_RATE - 0.5
      );
      expect(result2.success).toBe(true);
    });
  });

  describe('quality boundaries', () => {
    it('should accept exact minimum quality', () => {
      const result = configValidator.validateTtsQuality(MIN_QUALITY);
      expect(result.success).toBe(true);
    });

    it('should accept exact maximum quality', () => {
      const result = configValidator.validateTtsQuality(MAX_QUALITY);
      expect(result.success).toBe(true);
    });

    it('should reject just below minimum quality', () => {
      const result = configValidator.validateTtsQuality(MIN_QUALITY - 0.001);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ConfigurationError);
        expect(result.error.message).toContain('Quality must be between');
      }
    });

    it('should reject just above maximum quality', () => {
      const result = configValidator.validateTtsQuality(MAX_QUALITY + 0.001);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ConfigurationError);
        expect(result.error.message).toContain('Quality must be between');
      }
    });

    it('should handle very small positive values', () => {
      const result = configValidator.validateTtsQuality(0.001);
      expect(result.success).toBe(true);
    });

    it('should handle values very close to maximum', () => {
      const result = configValidator.validateTtsQuality(0.999);
      expect(result.success).toBe(true);
    });
  });

  describe('rate boundaries', () => {
    it('should accept exact minimum rate', () => {
      const result = configValidator.validateTtsRate(MIN_RATE);
      expect(result.success).toBe(true);
    });

    it('should accept exact maximum rate', () => {
      const result = configValidator.validateTtsRate(MAX_RATE);
      expect(result.success).toBe(true);
    });

    it('should reject just below minimum rate', () => {
      const result = configValidator.validateTtsRate(MIN_RATE - 0.001);
      expect(result.success).toBe(false);
    });

    it('should reject just above maximum rate', () => {
      const result = configValidator.validateTtsRate(MAX_RATE + 0.001);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ConfigurationError);
        expect(result.error.message).toContain('Rate must be between');
      }
    });

    it('should handle common rate values', () => {
      const commonRates = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5];

      for (const rate of commonRates) {
        const result = configValidator.validateTtsRate(rate);
        expect(result.success).toBe(true);
      }
    });

    it('should handle fractional rates at boundaries', () => {
      const result = configValidator.validateTtsRate(MIN_RATE + 0.1);
      expect(result.success).toBe(true);

      const result2 = configValidator.validateTtsRate(MAX_RATE - 0.1);
      expect(result2.success).toBe(true);
    });
  });

  describe('volume boundaries', () => {
    it('should accept exact minimum volume', () => {
      const result = configValidator.validateTtsVolume(MIN_VOLUME);
      expect(result.success).toBe(true);
    });

    it('should accept exact maximum volume', () => {
      const result = configValidator.validateTtsVolume(MAX_VOLUME);
      expect(result.success).toBe(true);
    });

    it('should reject just below minimum volume', () => {
      const result = configValidator.validateTtsVolume(MIN_VOLUME - 0.001);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ConfigurationError);
        expect(result.error.message).toContain('Volume must be between');
      }
    });

    it('should reject just above maximum volume', () => {
      const result = configValidator.validateTtsVolume(MAX_VOLUME + 0.001);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ConfigurationError);
        expect(result.error.message).toContain('Volume must be between');
      }
    });

    it('should handle zero volume (silent)', () => {
      const result = configValidator.validateTtsVolume(0);
      expect(result.success).toBe(true);
    });

    it('should handle common volume values', () => {
      const commonVolumes = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5];

      for (const volume of commonVolumes) {
        const result = configValidator.validateTtsVolume(volume);
        expect(result.success).toBe(true);
      }
    });

    it('should handle fractional volumes at boundaries', () => {
      const result = configValidator.validateTtsVolume(MIN_VOLUME + 0.1);
      expect(result.success).toBe(true);

      const result2 = configValidator.validateTtsVolume(MAX_VOLUME - 0.1);
      expect(result2.success).toBe(true);
    });
  });

  describe('processing config boundaries', () => {
    it('should accept minimum positive file size', () => {
      const processing = {
        maxFileSize: 1,
        parallel: true,
        maxWorkers: 1,
      };

      const result = configValidator.validateProcessingConfig(processing);
      expect(result.success).toBe(true);
    });

    it('should accept large file sizes', () => {
      const processing = {
        maxFileSize: Number.MAX_SAFE_INTEGER,
        parallel: true,
        maxWorkers: 1,
      };

      const result = configValidator.validateProcessingConfig(processing);
      expect(result.success).toBe(true);
    });

    it('should accept minimum positive workers', () => {
      const processing = {
        maxFileSize: 100,
        parallel: true,
        maxWorkers: 1,
      };

      const result = configValidator.validateProcessingConfig(processing);
      expect(result.success).toBe(true);
    });

    it('should accept reasonable number of workers', () => {
      const processing = {
        maxFileSize: 100,
        parallel: true,
        maxWorkers: 32, // Common maximum for practical systems
      };

      const result = configValidator.validateProcessingConfig(processing);
      expect(result.success).toBe(true);
    });
  });

  describe('cache config boundaries', () => {
    it('should accept minimum positive cache size', () => {
      const cache = {
        enabled: true,
        maxSize: 1,
        ttl: 1,
      };

      const result = configValidator.validateCacheConfig(cache);
      expect(result.success).toBe(true);
    });

    it('should accept large cache sizes', () => {
      const cache = {
        enabled: true,
        maxSize: Number.MAX_SAFE_INTEGER,
        ttl: Number.MAX_SAFE_INTEGER,
      };

      const result = configValidator.validateCacheConfig(cache);
      expect(result.success).toBe(true);
    });

    it('should accept minimum positive TTL', () => {
      const cache = {
        enabled: true,
        maxSize: 100,
        ttl: 1,
      };

      const result = configValidator.validateCacheConfig(cache);
      expect(result.success).toBe(true);
    });

    it('should accept long TTL values', () => {
      const cache = {
        enabled: true,
        maxSize: 100,
        ttl: 86400, // 24 hours in seconds
      };

      const result = configValidator.validateCacheConfig(cache);
      expect(result.success).toBe(true);
    });
  });

  describe('extreme boundary values', () => {
    it('should handle very small positive numbers', () => {
      const tinyNumber = Number.EPSILON;

      const qualityResult = configValidator.validateTtsQuality(tinyNumber);
      expect(qualityResult.success).toBe(true);

      const rateResult = configValidator.validateTtsRate(MIN_RATE + tinyNumber);
      expect(rateResult.success).toBe(true);

      const volumeResult = configValidator.validateTtsVolume(tinyNumber);
      expect(volumeResult.success).toBe(true);
    });

    it('should handle values close to Number.MAX_VALUE', () => {
      const largeNumber = Number.MAX_VALUE;

      const sampleRateResult =
        configValidator.validateTtsSampleRate(largeNumber);
      expect(sampleRateResult.success).toBe(false);

      const processingResult = configValidator.validateProcessingConfig({
        maxFileSize: largeNumber,
        parallel: true,
        maxWorkers: 1,
      });
      expect(processingResult.success).toBe(true);
    });

    it('should handle floating point precision at boundaries', () => {
      const justAboveMin = MIN_QUALITY + Number.EPSILON;
      const justBelowMax = MAX_QUALITY - Number.EPSILON;

      const result1 = configValidator.validateTtsQuality(justAboveMin);
      expect(result1.success).toBe(true);

      const result2 = configValidator.validateTtsQuality(justBelowMax);
      expect(result2.success).toBe(true);
    });
  });
});
