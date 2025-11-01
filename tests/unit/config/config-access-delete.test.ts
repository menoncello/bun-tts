import { describe, it, expect, beforeEach } from 'bun:test';
import { ConfigAccess } from '../../../src/config/config-access';
import {
  createTestConfig,
  createConfigWithTestArray,
} from './config-test-helpers';

// Helper functions to reduce complexity (moved to outer scope)
function createDeepConfig() {
  return {
    level1: {
      level2: {
        level3: {
          level4: {
            value: 'delete-me',
            otherValue: 'other',
          },
        },
      },
    },
  };
}

function assertDeepPathDeletion(result: any) {
  const deletedValue = getNestedValue(
    result,
    'level1.level2.level3.level4.value'
  );
  const otherValue = getNestedValue(
    result,
    'level1.level2.level3.level4.otherValue'
  );

  expect(deletedValue).toBeUndefined();
  expect(otherValue).toBe('other');
}

function getNestedValue(obj: any, path: string) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

describe('ConfigAccess delete method', () => {
  let configAccess: ConfigAccess;
  let testConfig: any;

  beforeEach(() => {
    configAccess = new ConfigAccess();
    testConfig = createTestConfig();
  });

  describe('basic deletion', () => {
    it('should delete existing top-level key', () => {
      const result = configAccess.delete(testConfig, 'logging');
      expect(result?.logging).toBeUndefined();
      expect(result?.tts).toBeDefined();
    });

    it('should delete existing nested key', () => {
      const result = configAccess.delete(testConfig, 'logging.level');
      expect(result?.logging?.level).toBeUndefined();
      expect(result?.logging?.pretty).toBeDefined();
    });

    it('should return original config for non-existent top-level key', () => {
      const result = configAccess.delete(testConfig, 'nonexistent');
      expect(result).toEqual(testConfig);
    });

    it('should return original config for non-existent nested key', () => {
      const result = configAccess.delete(testConfig, 'logging.nonexistent');
      expect(result).toEqual(testConfig);
    });

    it('should return original config for non-existent deep path', () => {
      const result = configAccess.delete(testConfig, 'nonexistent.deep.path');
      expect(result).toEqual(testConfig);
    });
  });

  describe('complex deletion scenarios', () => {
    it('should handle deletion of undefined intermediate values', () => {
      const configWithUndefined = {
        ...testConfig,
        logging: undefined,
      };
      const result = configAccess.delete(configWithUndefined, 'logging.level');
      expect(result).toEqual(configWithUndefined);
    });

    it('should handle deletion of null intermediate values', () => {
      const configWithNull = {
        ...testConfig,
        logging: null,
      };
      const result = configAccess.delete(configWithNull, 'logging.level');
      expect(result).toEqual(configWithNull);
    });

    it('should handle deletion of undefined leaf values', () => {
      const configWithUndefinedLeaf = {
        ...testConfig,
        logging: {
          ...testConfig.logging,
          filePath: undefined,
        },
      };
      const result = configAccess.delete(
        configWithUndefinedLeaf,
        'logging.filePath'
      );
      expect(result?.logging?.filePath).toBeUndefined();
      expect(result?.logging?.level).toBe(testConfig.logging.level);
    });

    it('should handle deletion of null leaf values', () => {
      const configWithNullLeaf = {
        ...testConfig,
        logging: {
          ...testConfig.logging,
          filePath: null,
        },
      };
      const result = configAccess.delete(
        configWithNullLeaf,
        'logging.filePath'
      );
      expect(result?.logging?.filePath).toBeUndefined();
      expect(result?.logging?.level).toBe(testConfig.logging.level);
    });
  });

  describe('array deletion', () => {
    it('should delete existing array indices', () => {
      const arrayConfig = createConfigWithTestArray();
      const result = configAccess.delete(arrayConfig as any, 'testArray.0');
      // Note: When deleting array index 0, the item becomes empty but array structure remains
      const testArray = (result as any)?.testArray;
      expect(testArray).toBeDefined();
      expect(testArray[0]).toBeUndefined();
      expect(testArray[1]).toBe('item2');
      expect(testArray[2]).toBe('item3');
    });

    it('should return original config for out-of-bounds array indices', () => {
      const arrayConfig = createConfigWithTestArray();
      const result = configAccess.delete(arrayConfig, 'testArray.10');
      expect(result).toEqual(arrayConfig);
    });

    it('should return original config for non-array with index access', () => {
      const testConfig = createTestConfig();
      const result = configAccess.delete(testConfig, 'logging.0');
      expect(result).toEqual(testConfig);
    });
  });

  describe('edge cases', () => {
    it('should handle empty key', () => {
      const emptyKey = ';';
      const result = configAccess.delete(testConfig, emptyKey);
      expect(result).toEqual(testConfig);
    });

    it('should handle null key', () => {
      const result = configAccess.delete(testConfig, null as any);
      expect(result).toEqual(testConfig);
    });

    it('should handle empty key parts', () => {
      const result = configAccess.delete(testConfig, '.logging..level.');
      expect(result?.logging?.level).toBeUndefined();
      expect(result?.logging?.pretty).toBeDefined();
    });

    it('should handle deeply nested paths', () => {
      const deepConfig = {
        ...createTestConfig(),
        ...createDeepConfig(),
      };
      const result = configAccess.delete(
        deepConfig,
        'level1.level2.level3.level4.value'
      );
      assertDeepPathDeletion(result);
    });

    it('should return original config for partially existing deep paths', () => {
      const deepConfig = {
        ...createTestConfig(),
        level1: {
          level2: {},
        },
      };
      const result = configAccess.delete(
        deepConfig,
        'level1.level2.level3.level4.value'
      );
      expect(result).toEqual(deepConfig);
    });
  });

  describe('immutability', () => {
    it('should not mutate original config', () => {
      const originalConfig = JSON.parse(JSON.stringify(testConfig));
      configAccess.delete(testConfig, 'logging.level');
      expect(testConfig).toEqual(originalConfig);
    });

    it('should preserve all other properties when deleting one', () => {
      const result = configAccess.delete(testConfig, 'logging.level');
      expect(result?.tts).toEqual(testConfig.tts);
      expect(result?.processing).toEqual(testConfig.processing);
      expect(result?.cli).toEqual(testConfig.cli);
      expect(result?.cache).toEqual(testConfig.cache);
      expect(result?.logging?.pretty).toBe(testConfig.logging.pretty);
      expect(result?.logging?.file).toBe(testConfig.logging.file);
    });
  });
});
