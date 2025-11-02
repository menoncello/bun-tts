import { describe, it, expect, beforeEach } from 'bun:test';
import { ConfigAccess } from '../../../src/config/config-access.js';
import type { BunTtsConfig } from '../../../src/types/config.js';
import {
  createTestConfig,
  createConfigWithUndefinedLogging,
  createConfigWithNullLogging,
} from './config-test-helpers.js';

describe('ConfigAccess get method', () => {
  let configAccess: ConfigAccess;
  let testConfig: BunTtsConfig;

  beforeEach(() => {
    configAccess = new ConfigAccess();
    testConfig = createTestConfig();
  });

  describe('basic value retrieval', () => {
    it('should return value for existing top-level key', () => {
      const result = configAccess.get(testConfig, 'logging');
      expect(result).toEqual(testConfig.logging);
    });

    it('should return value for nested key with dot notation', () => {
      const result = configAccess.get(testConfig, 'logging.level');
      expect(result).toBe('info');
    });

    it('should return default value for non-existent key', () => {
      const result = configAccess.get(testConfig, 'nonexistent', 'default');
      expect(result).toBe('default');
    });

    it('should return undefined for non-existent key without default', () => {
      const result = configAccess.get(testConfig, 'nonexistent');
      expect(result).toBeUndefined();
    });

    it('should return value for complex nested path', () => {
      const result = configAccess.get(testConfig, 'tts.defaultEngine');
      expect(result).toBe('kokoro');
    });
  });

  describe('type handling', () => {
    it('should return string values', () => {
      const stringVal = configAccess.get(testConfig, 'logging.level');
      expect(stringVal).toBe('info');
      expect(typeof stringVal).toBe('string');
    });

    it('should return boolean values', () => {
      const boolVal = configAccess.get(testConfig, 'logging.pretty');
      expect(boolVal).toBe(true);
      expect(typeof boolVal).toBe('boolean');
    });

    it('should return number values', () => {
      const numberVal = configAccess.get(testConfig, 'tts.sampleRate');
      expect(numberVal).toBe(22050);
      expect(typeof numberVal).toBe('number');
    });

    it('should return object values', () => {
      const objectVal = configAccess.get(testConfig, 'tts');
      expect(objectVal).toEqual(testConfig.tts);
      expect(typeof objectVal).toBe('object');
    });
  });

  describe('error handling', () => {
    it('should handle intermediate undefined values', () => {
      const configWithUndefined = createConfigWithUndefinedLogging();

      const result = configAccess.get(
        configWithUndefined as BunTtsConfig,
        'logging.level',
        'default'
      );
      expect(result).toBe('default');
    });

    it('should handle intermediate null values', () => {
      const configWithNull = createConfigWithNullLogging();

      const result = configAccess.get(
        configWithNull as unknown as BunTtsConfig,
        'logging.level',
        'default'
      );
      expect(result).toBe('default');
    });

    it('should handle undefined nested path', () => {
      const result = configAccess.get(
        testConfig,
        'logging.nonexistent.path',
        'default'
      );
      expect(result).toBe('default');
    });

    it('should handle empty key', () => {
      const result = configAccess.get(testConfig, ';', 'default');
      expect(result).toBe('default');
    });

    it('should handle null key', () => {
      const result = configAccess.get(testConfig, null, 'default');
      expect(result).toBe('default');
    });
  });

  describe('edge cases', () => {
    it('should handle deeply nested paths', () => {
      const deepConfig = {
        level1: {
          level2: {
            level3: {
              value: 'deep-value',
            },
          },
        },
      };
      const result = configAccess.get(
        deepConfig as unknown as BunTtsConfig,
        'level1.level2.level3.value'
      );
      expect(result).toBe('deep-value');
    });

    it('should handle array access', () => {
      const arrayConfig = {
        items: ['first', 'second', 'third'],
      };
      const result = configAccess.get(
        arrayConfig as unknown as BunTtsConfig,
        'items.1'
      );
      expect(result).toBe('second');
    });
  });
});
