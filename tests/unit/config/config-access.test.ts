import { describe, it, expect, beforeEach } from 'bun:test';
import { ConfigAccess } from '../../../src/config/config-access';
import { createTestConfig } from './config-test-helpers';

describe('ConfigAccess', () => {
  let configAccess: ConfigAccess;
  let testConfig: any;

  beforeEach(() => {
    configAccess = new ConfigAccess();
    testConfig = createTestConfig();
  });

  describe('basic functionality', () => {
    it('should be instantiable', () => {
      expect(configAccess).toBeDefined();
      expect(configAccess instanceof ConfigAccess).toBe(true);
    });

    it('should have get, set, has, and delete methods', () => {
      expect(typeof configAccess.get).toBe('function');
      expect(typeof configAccess.set).toBe('function');
      expect(typeof configAccess.has).toBe('function');
      expect(typeof configAccess.delete).toBe('function');
    });
  });

  describe('integrated workflow', () => {
    it('should support full CRUD workflow', () => {
      // Check existence
      expect(configAccess.has(testConfig, 'logging.level')).toBe(true);

      // Get value
      expect(configAccess.get(testConfig, 'logging.level', 'info')).toBe(
        'info'
      );

      // Set value
      const updatedConfig = configAccess.set(
        testConfig,
        'logging.level',
        'debug'
      );
      expect(configAccess.get<string>(updatedConfig, 'logging.level')).toBe(
        'debug'
      );

      // Check existence after update
      expect(configAccess.has(updatedConfig, 'logging.level')).toBe(true);

      // Delete value
      const finalConfig = configAccess.delete(updatedConfig, 'logging.level');
      expect(configAccess.has(finalConfig, 'logging.level')).toBe(false);
      expect(configAccess.get(finalConfig, 'logging.level', 'default')).toBe(
        'default'
      );
    });
  });
});
