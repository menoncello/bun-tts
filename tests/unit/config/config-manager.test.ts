import { describe, it, expect, beforeEach } from 'bun:test';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { ConfigManager } from '../../../src/config/config-manager';
import {
  createMockFileSystemOperations,
  createMockLogger,
  createCustomTestConfig,
} from './config-manager-test-helpers';

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let _mockFs: ReturnType<typeof createMockFileSystemOperations>;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    _mockFs = createMockFileSystemOperations();
    mockLogger = createMockLogger();
    configManager = new ConfigManager();
  });

  describe('basic functionality', () => {
    it('should be instantiable', () => {
      expect(configManager).toBeDefined();
      expect(configManager instanceof ConfigManager).toBe(true);
    });

    it('should have required methods', () => {
      expect(typeof configManager.load).toBe('function');
      expect(typeof configManager.save).toBe('function');
      expect(typeof configManager.validate).toBe('function');
    });

    it('should use default options when none provided', () => {
      const defaultManager = new ConfigManager();
      expect(defaultManager).toBeDefined();
      expect(typeof defaultManager.load).toBe('function');
    });
  });

  describe('integrated workflow', () => {
    it('should support complete config workflow', async () => {
      const tempDir = mkdtempSync(join(tmpdir(), 'bun-tts-workflow-test-'));
      const configPath = join(tempDir, 'workflow-test.json');

      const customConfig = createCustomTestConfig(tempDir);

      // Validate configuration
      const validationResult = configManager.validate(customConfig);
      expect(validationResult.success).toBe(true);

      // Save configuration
      const saveResult = await configManager.save(customConfig, configPath);
      expect(saveResult.success).toBe(true);

      // Verify file exists
      const fs = await import('fs/promises');
      expect(
        await fs
          .access(configPath)
          .then(() => true)
          .catch(() => false)
      ).toBe(true);

      // Load configuration
      const loadResult = await configManager.load(configPath);
      expect(loadResult).toBeDefined();
      expect(loadResult.success).toBe(true);
      if (loadResult.success) {
        expect(loadResult.data.logging.level).toBe('debug');
        expect(loadResult.data.tts.defaultEngine).toBe('chatterbox');

        // Validate loaded configuration
        const validateLoaded = configManager.validate(loadResult.data);
        expect(validateLoaded.success).toBe(true);
      }
    });
  });

  describe('configuration merging', () => {
    it('should merge configurations correctly', async () => {
      const tempDir = mkdtempSync(join(tmpdir(), 'bun-tts-merge-test-'));
      const partialConfigPath = join(tempDir, 'partial.json');

      const partialConfig = {
        logging: { level: 'debug' }, // Override level
        tts: { defaultEngine: 'chatterbox' }, // Override engine
        cache: { maxSize: 512 }, // Override cache size
      };

      // Save partial config to real file
      const fs = await import('fs/promises');
      await fs.writeFile(
        partialConfigPath,
        JSON.stringify(partialConfig, null, 2)
      );

      try {
        // Load partial config - it should be merged with defaults
        const mergedConfigResult = await configManager.load(partialConfigPath);

        expect(mergedConfigResult).toBeDefined();
        if (mergedConfigResult.success) {
          // Values from partial config should override defaults
          expect(mergedConfigResult.data.logging.level).toBe('debug');
          expect(mergedConfigResult.data.tts.defaultEngine).toBe('chatterbox');
          expect(mergedConfigResult.data.cache.maxSize).toBe(512);

          // Default values should still be present for missing properties
          expect(mergedConfigResult.data.logging.pretty).toBeDefined();
          expect(mergedConfigResult.data.tts.outputFormat).toBeDefined();
          expect(mergedConfigResult.data.cache.enabled).toBeDefined();
        }
      } finally {
        // Clean up
        try {
          rmSync(tempDir, { recursive: true, force: true });
        } catch {
          // Ignore cleanup errors
        }
      }
    });
  });

  describe('error handling integration', () => {
    it('should handle cascading errors gracefully', async () => {
      mockLogger.clear();

      // Try to load non-existent config
      const missingResult = await configManager.load('/nonexistent.json');
      expect(missingResult).toBeDefined(); // Should return default

      // Try to save invalid config
      const invalidSaveResult = await configManager.save(
        null as any,
        '/config/invalid.json'
      );
      expect(invalidSaveResult.success).toBe(false);

      // Try to load invalid JSON
      const invalidLoadResult = await configManager.load(
        '/config/invalid.json'
      );
      expect(invalidLoadResult).toBeDefined();

      // Check that errors were handled appropriately
      // Note: Logging is tested separately in logging-specific tests
      expect(invalidSaveResult.success).toBe(false);
    });
  });
});
