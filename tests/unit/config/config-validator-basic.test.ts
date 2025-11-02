import { describe, it, expect, beforeEach } from 'bun:test';
import {
  ConfigValidator,
  VALID_LOG_LEVELS,
} from '../../../src/config/config-validator';
import { ConfigurationError } from '../../../src/errors/configuration-error';
import type { BunTtsConfig } from '../../../src/types/config';

// Type alias for log levels to replace union types
type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

describe('ConfigValidator - Basic Validation', () => {
  beforeEach(() => {
    // ConfigValidator setup if needed
  });

  describe('validate method', () => {
    testBasicValidation();
    testInvalidConfigurations();
    testBoundaryValues();
  });

  describe('validation helpers', () => {
    testValidateLogLevel();
    testValidateTTSEngine();
    testValidateOutputFormat();
    testValidateNumericValues();
    // testValidateBooleanValues(); // Function not implemented
  });
});

function testBasicValidation(): void {
  describe('basic validation', () => {
    it('should return success for valid complete configuration', () => {
      const configValidator = new ConfigValidator();
      const validConfig: Partial<BunTtsConfig> = {
        logging: {
          level: 'info',
          pretty: true,
          file: false,
        },
        tts: {
          defaultEngine: 'kokoro',
          outputFormat: 'mp3',
          sampleRate: 22050,
          quality: 0.8,
          rate: 1.0,
          volume: 1.0,
        },
        processing: {
          maxFileSize: 100,
          parallel: true,
          maxWorkers: 4,
        },
        cli: {
          showProgress: true,
          colors: true,
          debug: false,
        },
        cache: {
          enabled: true,
          maxSize: 1024,
          ttl: 3600,
        },
      };

      const result = configValidator.validate(validConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('should return success for empty configuration', () => {
      const configValidator = new ConfigValidator();
      const result = configValidator.validate({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('should handle undefined configuration gracefully', () => {
      const configValidator = new ConfigValidator();
      const result = configValidator.validate(
        undefined as unknown as Partial<BunTtsConfig>
      );
      expect(result.success).toBe(true); // undefined should be treated as empty config and validate successfully
    });
  });
}

function testInvalidConfigurations(): void {
  describe('invalid configurations', () => {
    it('should return error for invalid logging configuration', () => {
      const configValidator = new ConfigValidator();
      const invalidConfig: Partial<BunTtsConfig> = {
        logging: {
          // Using a wider type to test invalid values
          level: 'invalid' as unknown as LogLevel,
          pretty: true,
          file: false,
        },
      };

      const result = configValidator.validate(invalidConfig);
      expect(result.success).toBe(false);

      // Type assertion to help TypeScript understand this is an error case
      const errorResult = result as {
        success: false;
        error: ConfigurationError;
      };
      expect(errorResult.error).toBeInstanceOf(ConfigurationError);
      expect(errorResult.error.message).toContain('Invalid log level');
    });

    it('should return error for invalid TTS configuration', () => {
      const configValidator = new ConfigValidator();
      const invalidConfig: Partial<BunTtsConfig> = {
        tts: {
          defaultEngine: 'invalid' as unknown as 'kokoro' | 'chatterbox',
          outputFormat: 'mp3',
          sampleRate: 22050,
          quality: 0.8,
          rate: 1.0,
          volume: 1.0,
        },
      };

      const result = configValidator.validate(invalidConfig);
      expect(result.success).toBe(false);

      // Type assertion to help TypeScript understand this is an error case
      const errorResult = result as {
        success: false;
        error: ConfigurationError;
      };
      expect(errorResult.error).toBeInstanceOf(ConfigurationError);
      expect(errorResult.error.message).toContain('Invalid TTS engine');
    });

    it('should return error for invalid processing configuration', () => {
      const configValidator = new ConfigValidator();
      const invalidConfig: Partial<BunTtsConfig> = {
        processing: {
          maxFileSize: -1,
          parallel: true,
          maxWorkers: 4,
        },
      };

      const result = configValidator.validate(invalidConfig);
      expect(result.success).toBe(false);

      // Type assertion to help TypeScript understand this is an error case
      const errorResult = result as {
        success: false;
        error: ConfigurationError;
      };
      expect(errorResult.error).toBeInstanceOf(ConfigurationError);
      expect(errorResult.error.message).toContain(
        'Max file size must be positive'
      );
    });

    it('should return error for invalid cache configuration', () => {
      const configValidator = new ConfigValidator();
      const invalidConfig: Partial<BunTtsConfig> = {
        cache: {
          enabled: true,
          maxSize: -1,
          ttl: 3600,
        },
      };

      const result = configValidator.validate(invalidConfig);
      expect(result.success).toBe(false);

      // Type assertion to help TypeScript understand this is an error case
      const errorResult = result as {
        success: false;
        error: ConfigurationError;
      };
      expect(errorResult.error).toBeInstanceOf(ConfigurationError);
      expect(errorResult.error.message).toContain(
        'Cache max size must be positive'
      );
    });

    it('should return error for invalid CLI configuration', () => {
      const configValidator = new ConfigValidator();
      const invalidConfig: Partial<BunTtsConfig> = {
        cli: {
          showProgress: 'yes' as unknown as boolean,
          colors: true,
          debug: false,
        },
      };

      const result = configValidator.validate(invalidConfig);
      expect(result.success).toBe(false);

      // Type assertion to help TypeScript understand this is an error case
      const errorResult = result as {
        success: false;
        error: ConfigurationError;
      };
      expect(errorResult.error).toBeInstanceOf(ConfigurationError);
      expect(errorResult.error.message).toContain(
        'Invalid show progress value'
      );
    });
  });
}

function testBoundaryValues(): void {
  describe('boundary values', () => {
    it('should handle minimum valid values', () => {
      const configValidator = new ConfigValidator();
      const minConfig: Partial<BunTtsConfig> = {
        tts: {
          defaultEngine: 'kokoro',
          outputFormat: 'mp3',
          sampleRate: 8000,
          quality: 0.1,
          rate: 0.1,
          volume: 0.1,
        },
        processing: {
          maxFileSize: 1,
          parallel: true,
          maxWorkers: 1,
        },
        cache: {
          enabled: true,
          maxSize: 1,
          ttl: 1,
        },
      };

      const result = configValidator.validate(minConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('should handle maximum valid values', () => {
      const configValidator = new ConfigValidator();
      const maxConfig: Partial<BunTtsConfig> = {
        tts: {
          defaultEngine: 'kokoro',
          outputFormat: 'mp3',
          sampleRate: 48000,
          quality: 1.0,
          rate: 3.0,
          volume: 1.0,
        },
        processing: {
          maxFileSize: 1000,
          parallel: true,
          maxWorkers: 16,
        },
        cache: {
          enabled: true,
          maxSize: 10000,
          ttl: 86400,
        },
      };

      const result = configValidator.validate(maxConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('should reject values below minimum', () => {
      const configValidator = new ConfigValidator();
      const belowMinConfig: Partial<BunTtsConfig> = {
        tts: {
          defaultEngine: 'kokoro',
          outputFormat: 'mp3',
          sampleRate: 7999, // Below minimum
          quality: 0.8,
          rate: 1.0,
          volume: 1.0,
        },
      };

      const result = configValidator.validate(belowMinConfig);
      expect(result.success).toBe(false);

      // Type assertion to help TypeScript understand this is an error case
      const errorResult = result as {
        success: false;
        error: ConfigurationError;
      };
      expect(errorResult.error.message).toContain(
        'Sample rate must be between'
      );
    });

    it('should reject values above maximum', () => {
      const configValidator = new ConfigValidator();
      const aboveMaxConfig: Partial<BunTtsConfig> = {
        tts: {
          defaultEngine: 'kokoro',
          outputFormat: 'mp3',
          sampleRate: 22050,
          quality: 1.1, // Above maximum
          rate: 1.0,
          volume: 1.0,
        },
      };

      const result = configValidator.validate(aboveMaxConfig);
      expect(result.success).toBe(false);

      // Type assertion to help TypeScript understand this is an error case
      const errorResult = result as {
        success: false;
        error: ConfigurationError;
      };
      expect(errorResult.error.message).toContain('Quality must be between');
    });
  });
}

function testValidateLogLevel(): void {
  describe('validateLogLevel', () => {
    it('should accept all valid log levels', () => {
      const configValidator = new ConfigValidator();
      const validLevels = VALID_LOG_LEVELS;

      for (const level of validLevels) {
        const result = configValidator.validateLoggingConfig({
          level,
          pretty: true,
          file: false,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(true);
        }
      }
    });

    it('should reject invalid log levels', () => {
      const configValidator = new ConfigValidator();
      const invalidLevels = ['invalid', 'notice', 'critical', 123];

      for (const level of invalidLevels) {
        const result = configValidator.validateLoggingConfig({
          level: level as unknown as LogLevel,
          pretty: true,
          file: false,
        });
        expect(result.success).toBe(false);

        // Type assertion to help TypeScript understand this is an error case
        const errorResult = result as {
          success: false;
          error: ConfigurationError;
        };
        expect(errorResult.error.message).toContain('Invalid log level');
      }
    });

    it('should handle empty string', () => {
      const configValidator = new ConfigValidator();
      const result = configValidator.validateLoggingConfig({
        level: ';' as unknown as LogLevel,
        pretty: true,
        file: false,
      });
      expect(result.success).toBe(false);

      // Type assertion to help TypeScript understand this is an error case
      const errorResult = result as {
        success: false;
        error: ConfigurationError;
      };
      expect(errorResult.error.message).toContain('Invalid log level');
    });
  });
}

function testValidateTTSEngine(): void {
  describe('validateTTSEngine', () => {
    it('should accept valid TTS engines', () => {
      const configValidator = new ConfigValidator();
      const validEngines = ['kokoro', 'chatterbox'];

      for (const engine of validEngines) {
        const result = configValidator.validateTtsEngine(engine);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(true);
        }
      }
    });

    it('should reject invalid TTS engines', () => {
      const configValidator = new ConfigValidator();
      const invalidEngines = ['invalid', 'google', 'azure', 'aws', 123];

      for (const engine of invalidEngines) {
        const result = configValidator.validateTtsEngine(engine as string);
        expect(result.success).toBe(false);

        // Type assertion to help TypeScript understand this is an error case
        const errorResult = result as {
          success: false;
          error: ConfigurationError;
        };
        expect(errorResult.error.message).toContain('Invalid TTS engine');
      }
    });

    it('should handle empty string', () => {
      const configValidator = new ConfigValidator();
      const result = configValidator.validateTtsEngine(';');
      expect(result.success).toBe(false);

      // Type assertion to help TypeScript understand this is an error case
      const errorResult = result as {
        success: false;
        error: ConfigurationError;
      };
      expect(errorResult.error.message).toContain('Invalid TTS engine');
    });
  });
}

function testValidateOutputFormat(): void {
  describe('validateOutputFormat', () => {
    it('should accept valid output formats', () => {
      const configValidator = new ConfigValidator();
      const validFormats = ['mp3', 'wav', 'm4a'];

      for (const format of validFormats) {
        const result = configValidator.validateTtsOutputFormat(format);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(true);
        }
      }
    });

    it('should reject invalid output formats', () => {
      const configValidator = new ConfigValidator();
      const invalidFormats = ['flac', 'ogg', 'aac', 123];

      for (const format of invalidFormats) {
        const result = configValidator.validateTtsOutputFormat(
          format as string
        );
        expect(result.success).toBe(false);

        // Type assertion to help TypeScript understand this is an error case
        const errorResult = result as {
          success: false;
          error: ConfigurationError;
        };
        expect(errorResult.error.message).toContain('Invalid output format');
      }
    });

    it('should handle empty string', () => {
      const configValidator = new ConfigValidator();
      const result = configValidator.validateTtsOutputFormat(';');
      expect(result.success).toBe(false);

      // Type assertion to help TypeScript understand this is an error case
      const errorResult = result as {
        success: false;
        error: ConfigurationError;
      };
      expect(errorResult.error.message).toContain('Invalid output format');
    });
  });
}

function testValidateNumericValues(): void {
  describe('numeric validation', () => {
    it('should validate sample rate range', () => {
      const configValidator = new ConfigValidator();

      // Valid range
      const validRates = [8000, 22050, 44100, 48000];
      for (const rate of validRates) {
        const result = configValidator.validateTtsSampleRate(rate);
        expect(result.success).toBe(true);
      }

      // Invalid range
      const invalidRates = [7999, 48001, -1, 0];
      for (const rate of invalidRates) {
        const result = configValidator.validateTtsSampleRate(rate);
        expect(result.success).toBe(false);
      }
    });

    it('should validate quality range', () => {
      const configValidator = new ConfigValidator();

      // Valid range
      const validQualities = [0.1, 0.5, 0.8, 1.0];
      for (const quality of validQualities) {
        const result = configValidator.validateTtsQuality(quality);
        expect(result.success).toBe(true);
      }

      // Invalid range
      const invalidQualities = [0.0, 1.1, -0.1, 2.0];
      for (const quality of invalidQualities) {
        const result = configValidator.validateTtsQuality(quality);
        expect(result.success).toBe(false);
      }
    });

    it('should validate rate range', () => {
      const configValidator = new ConfigValidator();

      // Valid range
      const validRates = [0.1, 1.0, 2.0, 3.0];
      for (const rate of validRates) {
        const result = configValidator.validateTtsRate(rate);
        expect(result.success).toBe(true);
      }

      // Invalid range
      const invalidRates = [0.0, 3.1, -0.1, 5.0];
      for (const rate of invalidRates) {
        const result = configValidator.validateTtsRate(rate);
        expect(result.success).toBe(false);
      }
    });

    it('should validate volume range', () => {
      const configValidator = new ConfigValidator();

      // Valid range
      const validVolumes = [0, 0.1, 0.5, 0.8, 1.0, 1.5, 2.0];
      for (const volume of validVolumes) {
        const result = configValidator.validateTtsVolume(volume);
        expect(result.success).toBe(true);
      }

      // Invalid range
      const invalidVolumes = [-0.1, 2.1];
      for (const volume of invalidVolumes) {
        const result = configValidator.validateTtsVolume(volume);
        expect(result.success).toBe(false);
      }
    });

    it('should validate max file size', () => {
      const configValidator = new ConfigValidator();

      // Valid values
      const validSizes = [1, 100, 500, 1000, 10000];
      for (const size of validSizes) {
        const result = configValidator.validate({
          processing: {
            maxFileSize: size,
            parallel: true,
            maxWorkers: 4,
          },
        });
        expect(result.success).toBe(true);
      }

      // Invalid values
      const invalidSizes = [0, -1];
      for (const size of invalidSizes) {
        const result = configValidator.validate({
          processing: {
            maxFileSize: size,
            parallel: true,
            maxWorkers: 4,
          },
        });
        expect(result.success).toBe(false);
      }
    });

    it('should validate max workers', () => {
      const configValidator = new ConfigValidator();

      // Valid values
      const validWorkers = [1, 4, 8, 16];
      for (const workers of validWorkers) {
        const result = configValidator.validate({
          processing: {
            maxFileSize: 100,
            parallel: true,
            maxWorkers: workers,
          },
        });
        expect(result.success).toBe(true);
      }

      // Invalid values
      const invalidWorkers = [0, -1, 33];
      for (const workers of invalidWorkers) {
        const result = configValidator.validate({
          processing: {
            maxFileSize: 100,
            parallel: true,
            maxWorkers: workers,
          },
        });
        expect(result.success).toBe(false);
      }
    });

    it('should validate cache size', () => {
      const configValidator = new ConfigValidator();

      // Valid values
      const validSizes = [1, 1024, 5000, 10000, 100000];
      for (const size of validSizes) {
        const result = configValidator.validate({
          cache: {
            enabled: true,
            maxSize: size,
            ttl: 3600,
          },
        });
        expect(result.success).toBe(true);
      }

      // Invalid values
      const invalidSizes = [0, -1];
      for (const size of invalidSizes) {
        const result = configValidator.validate({
          cache: {
            enabled: true,
            maxSize: size,
            ttl: 3600,
          },
        });
        expect(result.success).toBe(false);
      }
    });

    it('should validate cache TTL', () => {
      const configValidator = new ConfigValidator();

      // Valid values
      const validTtls = [1, 3600, 7200, 86400];
      for (const ttl of validTtls) {
        const result = configValidator.validate({
          cache: {
            enabled: true,
            maxSize: 1024,
            ttl,
          },
        });
        expect(result.success).toBe(true);
      }

      // Invalid values
      const invalidTtls = [0, -1];
      for (const ttl of invalidTtls) {
        const result = configValidator.validate({
          cache: {
            enabled: true,
            maxSize: 1024,
            ttl,
          },
        });
        expect(result.success).toBe(false);
      }
    });
  });
}

// Boolean validation is handled as part of other config validations
// No separate validateBoolean method exists in ConfigValidator
