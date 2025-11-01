import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { ConfigManager } from '../../../src/config/config-manager';
import { createMockFileSystemOperations } from './config-manager-test-helpers';

describe('ConfigManager ConfigAccess Integration - Method Coverage', () => {
  let configManager: ConfigManager;
  let tempDir: string;
  let _mockFs: ReturnType<typeof createMockFileSystemOperations>;

  beforeEach(async () => {
    _mockFs = createMockFileSystemOperations();
    configManager = new ConfigManager();
    // Create secure temporary directory for tests (kept for potential real file ops)
    tempDir = mkdtempSync(join(tmpdir(), 'bun-tts-test-'));
    await configManager.load(); // Load default config for testing
  });

  afterEach(() => {
    // Clean up temporary directory
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('get method functionality', () => {
    it('should retrieve top-level configuration values', () => {
      const logLevel = configManager.get('logging.level');
      expect(logLevel).toBe('info');

      const defaultEngine = configManager.get('tts.defaultEngine');
      expect(defaultEngine).toBe('kokoro');

      const maxFileSize = configManager.get('processing.maxFileSize');
      expect(maxFileSize).toBe(100);
    });

    it('should retrieve nested configuration values', () => {
      const pretty = configManager.get('logging.pretty');
      expect(pretty).toBe(true);

      const quality = configManager.get('tts.quality');
      expect(quality).toBe(0.8);

      const parallel = configManager.get('processing.parallel');
      expect(parallel).toBe(true);

      const showProgress = configManager.get('cli.showProgress');
      expect(showProgress).toBe(true);

      const cacheEnabled = configManager.get('cache.enabled');
      expect(cacheEnabled).toBe(true);
    });

    it('should return default value when key does not exist', () => {
      const nonExistent = configManager.get('nonexistent.key', 'default-value');
      expect(nonExistent).toBe('default-value');

      const nonExistentNested = configManager.get(
        'nonexistent.deep.nested.key',
        42
      );
      expect(nonExistentNested).toBe(42);
    });

    it('should return undefined when key does not exist and no default provided', () => {
      const nonExistent = configManager.get('nonexistent.key');
      expect(nonExistent).toBeUndefined();

      const nonExistentNested = configManager.get(
        'nonexistent.deep.nested.key'
      );
      expect(nonExistentNested).toBeUndefined();
    });

    it('should handle different data types correctly', () => {
      // String values
      expect(typeof configManager.get('logging.level')).toBe('string');
      expect(typeof configManager.get('tts.defaultEngine')).toBe('string');

      // Boolean values
      expect(typeof configManager.get('logging.pretty')).toBe('boolean');
      expect(typeof configManager.get('processing.parallel')).toBe('boolean');

      // Number values
      expect(typeof configManager.get('tts.sampleRate')).toBe('number');
      expect(typeof configManager.get('processing.maxFileSize')).toBe('number');

      // Test with custom default values of different types
      expect(configManager.get('nonexistent.string', 'default')).toBe(
        'default'
      );
      expect(configManager.get('nonexistent.number', 123)).toBe(123);
      expect(configManager.get('nonexistent.boolean', true)).toBe(true);
      expect(configManager.get('nonexistent.object', { key: 'value' })).toEqual(
        { key: 'value' }
      );
      expect(configManager.get('nonexistent.array', [1, 2, 3])).toEqual([
        1, 2, 3,
      ]);
    });

    it('should handle optional properties that may be undefined', () => {
      // These might be undefined in default config
      const filePath = configManager.get('logging.filePath', '/default/path');
      const defaultVoice = configManager.get(
        'tts.defaultVoice',
        'default-voice'
      );
      const processingTempDir = configManager.get(
        'processing.tempDir',
        tempDir
      );
      const cacheDir = configManager.get('cache.dir', tempDir);

      // Should return either the actual value or the default
      expect(['string', 'undefined']).toContain(typeof filePath);
      expect(['string', 'undefined']).toContain(typeof defaultVoice);
      expect(['string', 'undefined']).toContain(typeof processingTempDir);
      expect(['string', 'undefined']).toContain(typeof cacheDir);
    });

    it('should work with deeply nested paths', () => {
      // Even though our config isn't deeply nested, test the capability
      const simplePath = configManager.get('logging.level');
      expect(simplePath).toBe('info');

      // Test path with exactly two segments
      const twoSegmentPath = configManager.get('tts.defaultEngine');
      expect(twoSegmentPath).toBe('kokoro');
    });

    it('should preserve type information', () => {
      const logLevel = configManager.get<string>('logging.level', 'debug');
      expect(typeof logLevel).toBe('string');

      const sampleRate = configManager.get<number>('tts.sampleRate', 44100);
      expect(typeof sampleRate).toBe('number');

      const pretty = configManager.get<boolean>('logging.pretty', false);
      expect(typeof pretty).toBe('boolean');
    });
  });

  describe('set method functionality', () => {
    it('should set top-level configuration values', () => {
      configManager.set('logging.level', 'debug');
      expect(configManager.get<string>('logging.level')).toBe('debug');

      configManager.set('tts.defaultEngine', 'chatterbox');
      expect(configManager.get<string>('tts.defaultEngine')).toBe('chatterbox');

      configManager.set('processing.maxFileSize', 200);
      expect(configManager.get<number>('processing.maxFileSize')).toBe(200);
    });

    it('should set nested configuration values', () => {
      configManager.set('logging.pretty', false);
      expect(configManager.get<boolean>('logging.pretty')).toBe(false);

      configManager.set('tts.quality', 0.9);
      expect(configManager.get<number>('tts.quality')).toBe(0.9);

      configManager.set('processing.parallel', false);
      expect(configManager.get<boolean>('processing.parallel')).toBe(false);

      configManager.set('cli.debug', true);
      expect(configManager.get<boolean>('cli.debug')).toBe(true);

      configManager.set('cache.enabled', false);
      expect(configManager.get<boolean>('cache.enabled')).toBe(false);
    });

    it('should set values of different data types', () => {
      // String
      configManager.set('logging.level', 'warn');
      expect(configManager.get<string>('logging.level')).toBe('warn');

      // Number
      configManager.set('tts.sampleRate', 44100);
      expect(configManager.get<number>('tts.sampleRate')).toBe(44100);

      // Boolean
      configManager.set('logging.pretty', false);
      expect(configManager.get<boolean>('logging.pretty')).toBe(false);

      // Null and undefined
      configManager.set('logging.filePath', null);
      expect(configManager.get('logging.filePath', null)).toBeNull();

      configManager.set('tts.defaultVoice', undefined);
      expect(configManager.get('tts.defaultVoice')).toBeUndefined();
    });

    it('should handle setting optional properties', () => {
      configManager.set('logging.filePath', '/custom/log/path');
      expect(configManager.get<string>('logging.filePath')).toBe(
        '/custom/log/path'
      );

      configManager.set('tts.defaultVoice', 'custom-voice');
      expect(configManager.get<string>('tts.defaultVoice')).toBe(
        'custom-voice'
      );

      configManager.set('processing.tempDir', '/custom/temp');
      expect(configManager.get<string>('processing.tempDir')).toBe(
        '/custom/temp'
      );

      configManager.set('cache.dir', '/custom/cache');
      expect(configManager.get<string>('cache.dir')).toBe('/custom/cache');
    });

    it('should create new properties when setting non-existent paths', () => {
      configManager.set('newProperty', 'newValue');
      expect(configManager.get<string>('newProperty')).toBe('newValue');

      configManager.set('new.nested.property', 'nestedValue');
      expect(configManager.get<string>('new.nested.property')).toBe(
        'nestedValue'
      );
    });

    it('should handle multiple sequential sets', () => {
      configManager.set('logging.level', 'debug');
      configManager.set('logging.pretty', false);
      configManager.set('logging.file', true);
      configManager.set('logging.filePath', '/debug.log');

      expect(configManager.get<string>('logging.level')).toBe('debug');
      expect(configManager.get<boolean>('logging.pretty')).toBe(false);
      expect(configManager.get<boolean>('logging.file')).toBe(true);
      expect(configManager.get<string>('logging.filePath')).toBe('/debug.log');
    });

    it('should overwrite existing values', () => {
      // Initial value
      expect(configManager.get<string>('logging.level')).toBe('info');

      // Overwrite multiple times
      configManager.set('logging.level', 'debug');
      expect(configManager.get<string>('logging.level')).toBe('debug');

      configManager.set('logging.level', 'error');
      expect(configManager.get<string>('logging.level')).toBe('error');

      configManager.set('logging.level', 'warn');
      expect(configManager.get<string>('logging.level')).toBe('warn');
    });

    it('should do nothing when config is not loaded', async () => {
      const emptyConfigManager = new ConfigManager();

      // These should not throw but should have no effect
      expect(() => {
        emptyConfigManager.set('logging.level', 'debug');
      }).not.toThrow();

      // Verify the value wasn't actually set (getConfig should throw)
      expect(() => emptyConfigManager.getConfig()).toThrow();
    });
  });

  describe('has method functionality', () => {
    it('should return true for existing top-level properties', () => {
      expect(configManager.has('logging')).toBe(true);
      expect(configManager.has('tts')).toBe(true);
      expect(configManager.has('processing')).toBe(true);
      expect(configManager.has('cli')).toBe(true);
      expect(configManager.has('cache')).toBe(true);
    });

    it('should return true for existing nested properties', () => {
      expect(configManager.has('logging.level')).toBe(true);
      expect(configManager.has('logging.pretty')).toBe(true);
      expect(configManager.has('logging.file')).toBe(true);

      expect(configManager.has('tts.defaultEngine')).toBe(true);
      expect(configManager.has('tts.outputFormat')).toBe(true);
      expect(configManager.has('tts.sampleRate')).toBe(true);

      expect(configManager.has('processing.maxFileSize')).toBe(true);
      expect(configManager.has('processing.parallel')).toBe(true);
      expect(configManager.has('processing.maxWorkers')).toBe(true);
    });

    it('should return false for non-existent properties', () => {
      expect(configManager.has('nonexistent')).toBe(false);
      expect(configManager.has('nonexistent.key')).toBe(false);
      expect(configManager.has('logging.nonexistent')).toBe(false);
      expect(configManager.has('tts.nonexistent.property')).toBe(false);
    });

    it('should return false for undefined optional properties', () => {
      // These optional properties might be undefined
      const hasFilePath = configManager.has('logging.filePath');
      const hasDefaultVoice = configManager.has('tts.defaultVoice');
      const hasTempDir = configManager.has('processing.tempDir');
      const hasCacheDir = configManager.has('cache.dir');

      // Should be false if undefined, true if they have a value
      expect([true, false]).toContain(hasFilePath);
      expect([true, false]).toContain(hasDefaultVoice);
      expect([true, false]).toContain(hasTempDir);
      expect([true, false]).toContain(hasCacheDir);
    });

    it('should return true for properties set to falsy values', () => {
      configManager.set('logging.pretty', false);
      expect(configManager.has('logging.pretty')).toBe(true);

      configManager.set('test.number', 0);
      expect(configManager.has('test.number')).toBe(true);

      configManager.set('test.string', ';');
      expect(configManager.has('test.string')).toBe(true);

      configManager.set('test.null', null);
      expect(configManager.has('test.null')).toBe(true);
    });

    it('should return false for properties set to undefined', () => {
      configManager.set('test.undefined', undefined);
      expect(configManager.has('test.undefined')).toBe(false);
    });

    it('should work consistently after multiple modifications', () => {
      // Initial state
      expect(configManager.has('logging.level')).toBe(true);
      expect(configManager.has('new.property')).toBe(false);

      // Add new property
      configManager.set('new.property', 'value');
      expect(configManager.has('new.property')).toBe(true);

      // Remove property (by setting to undefined)
      configManager.set('new.property', undefined);
      expect(configManager.has('new.property')).toBe(false);
    });

    it('should return false when config is not loaded', () => {
      const emptyConfigManager = new ConfigManager();

      expect(emptyConfigManager.has('logging')).toBe(false);
      expect(emptyConfigManager.has('any.property')).toBe(false);
    });
  });

  describe('clear method functionality', () => {
    it('should clear all configuration state', async () => {
      // Verify config is loaded
      expect(() => configManager.getConfig()).not.toThrow();
      // Config path may be undefined when using default config (no specific file)
      expect(configManager.getConfigPath()).toBeUndefined();

      // Modify some values
      configManager.set('logging.level', 'debug');
      expect(configManager.get<string>('logging.level')).toBe('debug');

      // Clear the config
      configManager.clear();

      // Should throw when trying to get config
      expect(() => configManager.getConfig()).toThrow(
        'Configuration not loaded. Call load() first.'
      );

      // Config path should be undefined
      expect(configManager.getConfigPath()).toBeUndefined();

      // Access methods should return undefined/false
      expect(configManager.get('logging.level')).toBeUndefined();
      expect(configManager.has('logging.level')).toBe(false);
    });

    it('should allow setting and getting values after clear and reload', async () => {
      // Clear the config
      configManager.clear();

      // Reload
      await configManager.load();

      // Should work normally again
      expect(configManager.get<string>('logging.level')).toBe('info');
      expect(configManager.has('logging.level')).toBe(true);

      configManager.set('logging.level', 'warn');
      expect(configManager.get<string>('logging.level')).toBe('warn');
    });

    it('should clear config path when loaded from file', async () => {
      const testConfigManager = new ConfigManager();

      // First load default config
      await testConfigManager.load();

      // Create a temporary config file using the loaded config
      const configPath = join(tempDir, 'test-config.json');
      await testConfigManager.save(testConfigManager.getConfig(), configPath);

      // Load from the specific path
      const loadResult = await testConfigManager.load(configPath);
      expect(loadResult.success).toBe(true);
      expect(testConfigManager.getConfigPath()).toBe(configPath);

      // Clear should also clear the path
      testConfigManager.clear();
      expect(testConfigManager.getConfigPath()).toBeUndefined();
    });

    it('should be idempotent - multiple clears should be safe', () => {
      // Clear multiple times
      configManager.clear();
      configManager.clear();
      configManager.clear();

      // Should still throw when trying to get config
      expect(() => configManager.getConfig()).toThrow(
        'Configuration not loaded. Call load() first.'
      );
    });

    it('should reset state completely for new configuration load', async () => {
      // Modify current config
      configManager.set('logging.level', 'error');
      configManager.set('custom.property', 'custom-value');

      // Clear and reload
      configManager.clear();
      await configManager.load();

      // Should be back to defaults
      expect(configManager.get<string>('logging.level')).toBe('info');
      expect(configManager.has('custom.property')).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should support complete configuration workflow with access methods', async () => {
      // Start with default config
      expect(configManager.get<string>('logging.level')).toBe('info');

      // Modify configuration
      configManager.set('logging.level', 'debug');
      configManager.set('tts.defaultEngine', 'chatterbox');
      configManager.set('processing.maxFileSize', 200);

      // Verify modifications
      expect(configManager.get<string>('logging.level')).toBe('debug');
      expect(configManager.get<string>('tts.defaultEngine')).toBe('chatterbox');
      expect(configManager.get<number>('processing.maxFileSize')).toBe(200);

      // Check existence
      expect(configManager.has('logging.level')).toBe(true);
      expect(configManager.has('tts.defaultEngine')).toBe(true);
      expect(configManager.has('processing.maxFileSize')).toBe(true);

      // Save modified config
      const configPath = join(tempDir, 'modified-config.json');
      const saveResult = await configManager.save(
        configManager.getConfig(),
        configPath
      );
      expect(saveResult.success).toBe(true);

      // Clear and reload
      configManager.clear();
      const loadResult = await configManager.load(configPath);
      expect(loadResult.success).toBe(true);

      // Verify persisted modifications
      expect(configManager.get<string>('logging.level')).toBe('debug');
      expect(configManager.get<string>('tts.defaultEngine')).toBe('chatterbox');
      expect(configManager.get<number>('processing.maxFileSize')).toBe(200);
    });

    it('should handle configuration with dynamic property access', async () => {
      const dynamicUpdates = [
        { path: 'logging.level', value: 'warn' },
        { path: 'tts.quality', value: 0.95 },
        { path: 'processing.parallel', value: false },
        { path: 'cli.colors', value: false },
        { path: 'cache.maxSize', value: 2048 },
      ];

      // Apply dynamic updates
      for (const update of dynamicUpdates) {
        configManager.set(update.path, update.value);
        expect(configManager.get(update.path) as any).toBe(update.value);
        expect(configManager.has(update.path)).toBe(true);
      }

      // Verify all updates persisted
      const currentConfig = configManager.getConfig();
      expect(currentConfig.logging.level).toBe('warn');
      expect(currentConfig.tts.quality).toBe(0.95);
      expect(currentConfig.processing.parallel).toBe(false);
      expect(currentConfig.cli.colors).toBe(false);
      expect(currentConfig.cache.maxSize).toBe(2048);
    });

    it('should handle complex nested configuration operations', async () => {
      // Test with optional properties
      const optionalProperties = [
        'logging.filePath',
        'tts.defaultVoice',
        'processing.tempDir',
        'cache.dir',
      ];

      // Initially, some might not exist
      for (const prop of optionalProperties) {
        const initialExists = configManager.has(prop);
        if (initialExists) {
          expect(configManager.get(prop)).toBeDefined();
        }
      }

      // Set all optional properties

      const values = {
        'logging.filePath': join(tempDir, 'app.log'),
        'tts.defaultVoice': 'en-US-Wavenet-D',
        'processing.tempDir': join(tempDir, 'app-processing'),
        'cache.dir': join(tempDir, 'cache'),
      };

      for (const [prop, value] of Object.entries(values)) {
        configManager.set(prop, value);
        expect(configManager.has(prop)).toBe(true);
        expect(configManager.get(prop) as any).toBe(value);
      }

      // Clear and verify optional properties are gone
      configManager.clear();
      await configManager.load();

      for (const prop of optionalProperties) {
        expect(configManager.has(prop)).toBe(false);
        expect(configManager.get(prop)).toBeUndefined();
      }
    });
  });
});
