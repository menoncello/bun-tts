import { describe, it, expect, beforeEach } from 'bun:test';
import { ConfigAccess } from '../../../src/config/config-access';
import {
  createTestConfig,
  createConfigWithUndefinedLogging,
  createConfigWithNullLogging,
  createConfigWithTestArray,
} from './config-test-helpers';

describe('ConfigAccess has method', () => {
  let configAccess: ConfigAccess;
  let testConfig: any;

  beforeEach(() => {
    configAccess = new ConfigAccess();
    testConfig = createTestConfig();
  });

  describe('basic existence checks', () => {
    it('should return true for existing top-level key', () => {
      const result = configAccess.has(testConfig, 'logging');
      expect(result).toBe(true);
    });

    it('should return true for existing nested key', () => {
      const result = configAccess.has(testConfig, 'logging.level');
      expect(result).toBe(true);
    });

    it('should return false for non-existent top-level key', () => {
      const result = configAccess.has(testConfig, 'nonexistent');
      expect(result).toBe(false);
    });

    it('should return false for non-existent nested key', () => {
      const result = configAccess.has(testConfig, 'logging.nonexistent');
      expect(result).toBe(false);
    });

    it('should return false for non-existent deep path', () => {
      const result = configAccess.has(testConfig, 'nonexistent.deep.path');
      expect(result).toBe(false);
    });
  });

  describe('undefined and null handling', () => {
    it('should return false for undefined intermediate values', () => {
      const configWithUndefined = createConfigWithUndefinedLogging();
      const result = configAccess.has(configWithUndefined, 'logging.level');
      expect(result).toBe(false);
    });

    it('should return false for null intermediate values', () => {
      const configWithNull = createConfigWithNullLogging();
      const result = configAccess.has(configWithNull, 'logging.level');
      expect(result).toBe(false);
    });

    it('should return true for explicitly undefined leaf values', () => {
      const configWithUndefinedLeaf = {
        ...testConfig,
        logging: {
          ...testConfig.logging,
          filePath: undefined,
        },
      };
      const result = configAccess.has(
        configWithUndefinedLeaf,
        'logging.filePath'
      );
      expect(result).toBe(true);
    });

    it('should return true for null leaf values', () => {
      const configWithNullLeaf = {
        ...testConfig,
        logging: {
          ...testConfig.logging,
          filePath: null,
        },
      };
      const result = configAccess.has(configWithNullLeaf, 'logging.filePath');
      expect(result).toBe(true);
    });
  });

  describe('array access', () => {
    it('should return true for existing array indices', () => {
      const arrayConfig = createConfigWithTestArray();
      const result = configAccess.has(arrayConfig, 'testArray.0');
      expect(result).toBe(true);
    });

    it('should return false for out-of-bounds array indices', () => {
      const arrayConfig = createConfigWithTestArray();
      const result = configAccess.has(arrayConfig, 'testArray.10');
      expect(result).toBe(false);
    });

    it('should return false for non-array with index access', () => {
      const result = configAccess.has(testConfig, 'logging.0');
      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty key', () => {
      const result = configAccess.has(testConfig, '');
      expect(result).toBe(false);
    });

    it('should handle null key', () => {
      const result = configAccess.has(testConfig, null as any);
      expect(result).toBe(false);
    });

    it('should handle empty key parts', () => {
      const result = configAccess.has(testConfig, '.logging..level.');
      expect(result).toBe(true); // Should find the path ignoring empty parts
    });

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
      const result = configAccess.has(
        deepConfig as any,
        'level1.level2.level3.value'
      );
      expect(result).toBe(true);
    });

    it('should return false for partially existing deep paths', () => {
      const deepConfig = {
        level1: {
          level2: {},
        },
      };
      const result = configAccess.has(
        deepConfig as any,
        'level1.level2.level3.value'
      );
      expect(result).toBe(false);
    });
  });
});
