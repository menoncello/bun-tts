import { describe, it, expect, beforeEach } from 'bun:test';
import { ConfigValidator } from '../../../src/config/config-validator';
import type { BunTtsConfig } from '../../../src/types/config';

describe('ConfigValidator - Type Safety and Edge Cases', () => {
  let configValidator: ConfigValidator;

  beforeEach(() => {
    configValidator = new ConfigValidator();
  });

  describe('type safety and edge cases', () => {
    it('should handle string numbers for numeric validations', () => {
      const result = configValidator.validateTtsSampleRate('22050' as any);
      expect(result.success).toBe(true); // Current implementation accepts string numbers
    });

    it('should handle null values for validations', () => {
      const loggingResult = configValidator.validateLoggingConfig({
        level: null,
      } as any);
      expect(loggingResult.success).toBe(true); // null passes the validation check

      const ttsResult = configValidator.validateTtsEngine(null as any);
      expect(ttsResult.success).toBe(true); // null is treated as undefined
    });

    it('should handle empty strings for validations', () => {
      const engineResult = configValidator.validateTtsEngine('');
      expect(engineResult.success).toBe(true); // Empty string doesn't match valid engines, but returns true since engine is falsy

      const formatResult = configValidator.validateTtsOutputFormat('');
      expect(formatResult.success).toBe(true); // Same behavior as engine
    });

    it('should handle special numeric values', () => {
      const nanResult = configValidator.validateTtsSampleRate(Number.NaN);
      expect(nanResult.success).toBe(true); // NaN is falsy, so it's not validated

      const infinityResult = configValidator.validateTtsSampleRate(Infinity);
      expect(infinityResult.success).toBe(false); // Infinity is truthy and outside range

      const negInfinityResult =
        configValidator.validateTtsSampleRate(-Infinity);
      expect(negInfinityResult.success).toBe(false); // Negative infinity is truthy and outside range
    });

    it('should handle very large numbers', () => {
      const largeNumber = Number.MAX_SAFE_INTEGER;
      const result = configValidator.validateTtsSampleRate(largeNumber);
      expect(result.success).toBe(false); // Large number is outside valid range
    });
  });

  describe('malformed configurations', () => {
    it('should handle cyclic object references', () => {
      const cyclicConfig: any = { logging: { level: 'info' } };
      cyclicConfig.self = cyclicConfig;

      expect(() => {
        configValidator.validate(cyclicConfig);
      }).not.toThrow();
    });

    it('should handle deeply nested objects', () => {
      const deepConfig: any = {
        logging: {
          level: 'info',
          nested: {
            deep: {
              very: {
                deep: {
                  value: 'should not break validation',
                },
              },
            },
          },
        },
      };

      const result = configValidator.validate(deepConfig);
      expect(result.success).toBe(true);
    });

    it('should handle objects with many properties', () => {
      const largeConfig: any = {};
      for (let i = 0; i < 1000; i++) {
        largeConfig[`prop${i}`] = `value${i}`;
      }
      largeConfig.logging = { level: 'info' };

      const result = configValidator.validate(largeConfig);
      expect(result.success).toBe(true);
    });

    it('should handle arrays in config properties', () => {
      const configWithArrays = {
        logging: {
          level: 'info',
          levels: ['debug', 'info', 'warn', 'error'],
        },
        tts: {
          defaultEngine: 'kokoro',
          outputFormat: 'mp3',
          sampleRate: 22050,
          quality: 0.8,
          rate: 1.0,
          volume: 1.0,
          engines: ['kokoro', 'chatterbox'],
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
      } as any;

      const result = configValidator.validate(configWithArrays);
      expect(result.success).toBe(true); // Arrays are ignored by current validation
    });
  });

  describe('unexpected data types', () => {
    it('should handle boolean values where strings are expected', () => {
      const result = configValidator.validateTtsEngine(true as any);
      expect(result.success).toBe(false); // Boolean is truthy but doesn't match valid engines
    });

    it('should handle objects where strings are expected', () => {
      const result = configValidator.validateTtsEngine({} as any);
      expect(result.success).toBe(false); // Object is truthy but doesn't match valid engines
    });

    it('should handle functions where values are expected', () => {
      // Cast function to number to test error handling for invalid input types
      const result = configValidator.validateTtsSampleRate((() => {
        // Empty function for testing purposes
      }) as unknown as number);
      expect(result.success).toBe(true); // Function is truthy but isNaN check in comparison makes it falsy
    });

    it('should handle symbols as values', () => {
      const result = configValidator.validateTtsEngine(Symbol('test') as any);
      expect(result.success).toBe(false); // Symbol is not a string, should return error result
    });

    it('should handle Buffer objects', () => {
      const result = configValidator.validateTtsEngine(
        Buffer.from('test') as any
      );
      expect(result.success).toBe(false); // Buffer is truthy but doesn't match valid engines
    });
  });

  describe('prototype pollution attempts', () => {
    it('should not be affected by prototype pollution', () => {
      const pollutedConfig = JSON.parse('{"__proto__":{"level":"polluted"}}');
      const result = configValidator.validateLoggingConfig(pollutedConfig);
      expect(result.success).toBe(true); // Should not break validation
    });

    it('should handle constructor pollution', () => {
      const pollutedConfig = JSON.parse('{"constructor":{"level":"polluted"}}');
      const result = configValidator.validateLoggingConfig(pollutedConfig);
      expect(result.success).toBe(true); // Should not break validation
    });
  });

  describe('memory and performance edge cases', () => {
    it('should handle very long strings', () => {
      const longString = 'a'.repeat(1000000); // 1MB string
      const result = configValidator.validateTtsEngine(longString as any);
      expect(result.success).toBe(false); // Long string doesn't match valid engines
    });

    it('should handle configurations with many nested levels', () => {
      let nestedObj: any = { level: 'info' };
      for (let i = 0; i < 100; i++) {
        nestedObj = { nested: nestedObj };
      }

      const config = { logging: nestedObj };
      const result = configValidator.validate(config);
      expect(result.success).toBe(true);
    });

    it('should handle repeated validation calls', () => {
      const config = {
        logging: { level: 'info' as const, pretty: true, file: false },
        tts: {
          defaultEngine: 'kokoro' as const,
          outputFormat: 'mp3' as const,
          sampleRate: 22050,
          quality: 0.8,
          rate: 1.0,
          volume: 1.0,
        },
        processing: { maxFileSize: 100, parallel: true, maxWorkers: 4 },
        cli: { showProgress: true, colors: true, debug: false },
        cache: { enabled: true, maxSize: 1024, ttl: 3600 },
      };

      // Run validation many times to check for memory leaks
      for (let i = 0; i < 1000; i++) {
        const result = configValidator.validate(config);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('unicode and encoding edge cases', () => {
    it('should handle unicode characters in string values', () => {
      const unicodeConfig = {
        logging: {
          level: 'info',
          message: '🚀 Test with unicode: ñáéíóú',
        },
        tts: {
          defaultEngine: 'kokoro',
          outputFormat: 'mp3',
          sampleRate: 22050,
          quality: 0.8,
          rate: 1.0,
          volume: 1.0,
          voice: '🎤 voice-with-unicode-ñ',
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
      } as any;

      const result = configValidator.validate(unicodeConfig);
      expect(result.success).toBe(true); // Unicode characters should be handled gracefully
    });

    it('should handle zero-width characters', () => {
      const configWithZwc = {
        level: 'info' + '\u200B', // Zero-width space
        pretty: true,
        file: false,
      } as any;

      const result = configValidator.validateLoggingConfig(configWithZwc);
      expect(result.success).toBe(false); // Invalid log level with zero-width space
    });

    it('should handle control characters', () => {
      const configWithControl = {
        level: 'info\n\r\t', // Control characters
        pretty: true,
        file: false,
      } as any;

      const result = configValidator.validateLoggingConfig(configWithControl);
      expect(result.success).toBe(false); // Invalid log level with control characters
    });
  });

  describe('configuration validation integration', () => {
    it('should handle mixed valid and invalid properties gracefully', () => {
      const mixedConfig = {
        logging: {
          level: 'info', // Valid
          invalidProp: 'ignored',
        },
        tts: {
          defaultEngine: 'invalid-engine', // Invalid
          sampleRate: 22050, // Valid
          invalidProp: 'ignored',
        },
        processing: {
          maxFileSize: -100, // Invalid
          parallel: true, // Valid
        },
        invalidSection: {
          shouldNotBreak: 'validation',
        },
      } as any;

      const result = configValidator.validate(mixedConfig);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Invalid TTS engine'); // TTS validation comes after logging
      }
    });

    it('should validate complex nested configuration structures', () => {
      const complexConfig: Partial<BunTtsConfig> = {
        logging: {
          level: 'debug',
          pretty: true,
          file: false,
        },
        tts: {
          defaultEngine: 'kokoro',
          outputFormat: 'mp3',
          sampleRate: 44100,
          quality: 0.9,
          rate: 1.2,
          volume: 1.1,
        },
        processing: {
          maxFileSize: 500,
          parallel: true,
          maxWorkers: 8,
        },
        cli: {
          showProgress: true,
          colors: true,
          debug: false,
        },
        cache: {
          enabled: true,
          maxSize: 2048,
          ttl: 7200,
        },
      };

      const result = configValidator.validate(complexConfig);
      expect(result.success).toBe(true);
    });
  });
});
