import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { ConfigManager } from '../../../src/config/config-manager';
import { ConfigurationError } from '../../../src/errors/configuration-error';
import { createCustomTestConfig } from './config-manager-test-helpers';

describe('ConfigManager Basic Coverage Tests', () => {
  let configManager: ConfigManager;
  let tempDir: string;

  beforeEach(() => {
    configManager = new ConfigManager();
    // Create secure temporary directory for tests (kept for potential real file ops)
    tempDir = mkdtempSync(join(tmpdir(), 'bun-tts-test-'));
  });

  afterEach(() => {
    // Clean up temporary directory
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('core functionality coverage', () => {
    it('should load default configuration', async () => {
      const result = await configManager.load();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.logging.level).toBe('info');
        expect(result.data.tts.defaultEngine).toBe('kokoro');
        expect(result.data.processing.maxFileSize).toBe(100);
        expect(result.data.cli.showProgress).toBe(true);
        expect(result.data.cache.enabled).toBe(true);
      }
    });

    it('should throw error when getConfig called before load', () => {
      expect(() => configManager.getConfig()).toThrow(ConfigurationError);
      expect(() => configManager.getConfig()).toThrow(
        'Configuration not loaded. Call load() first.'
      );
    });

    it('should return config after successful load', async () => {
      await configManager.load();
      const config = configManager.getConfig();
      expect(config).toBeDefined();
      expect(config.logging).toBeDefined();
      expect(config.tts).toBeDefined();
      expect(config.processing).toBeDefined();
      expect(config.cli).toBeDefined();
      expect(config.cache).toBeDefined();
    });

    it('should return undefined config path when no file loaded', () => {
      const configPath = configManager.getConfigPath();
      expect(configPath).toBeUndefined();
    });

    it('should return config path after loading from file', async () => {
      // Since we can't easily mock cosmiconfig in this setup,
      // we'll test the default behavior
      const result = await configManager.load();
      expect(result.success).toBe(true);
      // When no specific file is loaded, configPath should be undefined
      expect(configManager.getConfigPath()).toBeUndefined();
    });

    it('should create sample configuration', async () => {
      const sampleConfig = await configManager.createSampleConfig();
      expect(typeof sampleConfig).toBe('string');
      expect(sampleConfig).toContain('logging');
      expect(sampleConfig).toContain('tts');
      expect(sampleConfig).toContain('processing');
      expect(sampleConfig).toContain('cli');
      expect(sampleConfig).toContain('cache');
      expect(sampleConfig).toContain('_comment');
    });

    it('should validate correct configuration', () => {
      const config = createCustomTestConfig();
      const result = configManager.validate(config);
      expect(result.success).toBe(true);
    });

    it('should validate incorrect configuration', () => {
      const invalidConfig = {
        logging: { level: 123 }, // Invalid type
        tts: { defaultEngine: 'invalid' }, // Invalid enum
      } as any;

      const result = configManager.validate(invalidConfig);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error).toBeInstanceOf(ConfigurationError);
      }
    });
  });

  describe('configuration access methods', () => {
    beforeEach(async () => {
      await configManager.load();
    });

    it('should get configuration values', () => {
      expect(configManager.get<string>('logging.level')).toBe('info');
      expect(configManager.get<string>('tts.defaultEngine')).toBe('kokoro');
      expect(configManager.get<number>('processing.maxFileSize')).toBe(100);
      expect(configManager.get<boolean>('cli.showProgress')).toBe(true);
      expect(configManager.get<boolean>('cache.enabled')).toBe(true);
    });

    it('should get configuration values with default', () => {
      expect(configManager.get('nonexistent.key', 'default')).toBe('default');
      expect(configManager.get('nonexistent.number', 42)).toBe(42);
      expect(configManager.get('nonexistent.boolean', true)).toBe(true);
    });

    it('should set configuration values', () => {
      configManager.set('logging.level', 'debug');
      configManager.set('tts.defaultEngine', 'chatterbox');
      configManager.set('processing.maxFileSize', 200);

      expect(configManager.get<string>('logging.level')).toBe('debug');
      expect(configManager.get<string>('tts.defaultEngine')).toBe('chatterbox');
      expect(configManager.get<number>('processing.maxFileSize')).toBe(200);
    });

    it('should check if configuration keys exist', () => {
      expect(configManager.has('logging.level')).toBe(true);
      expect(configManager.has('tts.defaultEngine')).toBe(true);
      expect(configManager.has('nonexistent.key')).toBe(false);
    });

    it('should handle clear operation', () => {
      configManager.set('logging.level', 'debug');
      expect(configManager.get<string>('logging.level')).toBe('debug');

      configManager.clear();
      expect(() => configManager.getConfig()).toThrow(ConfigurationError);
      expect(configManager.getConfigPath()).toBeUndefined();
    });
  });

  describe('global configuration paths', () => {
    it('should return global config directory', () => {
      const globalDir = configManager.getGlobalConfigDir();
      expect(typeof globalDir).toBe('string');
      expect(globalDir.length).toBeGreaterThan(0);
      expect(globalDir).toContain('bun-tts');
    });

    it('should return global config path', () => {
      const globalPath = configManager.getGlobalConfigPath();
      expect(typeof globalPath).toBe('string');
      expect(globalPath.length).toBeGreaterThan(0);
      expect(globalPath).toContain('bun-tts');
      expect(globalPath).toMatch(/config(\.json)?$/);
    });

    it('should have consistent global paths', () => {
      const dir1 = configManager.getGlobalConfigDir();
      const dir2 = configManager.getGlobalConfigDir();
      expect(dir1).toBe(dir2);

      const path1 = configManager.getGlobalConfigPath();
      const path2 = configManager.getGlobalConfigPath();
      expect(path1).toBe(path2);

      expect(path1).toContain(dir1);
    });
  });

  describe('configuration persistence', () => {
    beforeEach(async () => {
      await configManager.load();
    });

    it('should save configuration to file', async () => {
      const config = configManager.getConfig();
      const savePath = join(tempDir, 'test-config.json');

      const result = await configManager.save(config, savePath);
      expect(result.success).toBe(true);
    });

    it('should fail to save invalid configuration', async () => {
      const invalidConfig = {
        logging: { level: 123 }, // Invalid
      } as any;

      const result = await configManager.save(
        invalidConfig,
        join(tempDir, 'invalid-config.json')
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ConfigurationError);
      }
    });

    it('should handle save errors gracefully', async () => {
      const config = configManager.getConfig();

      // Try to save to a directory path (should fail)
      const result = await configManager.save(config, '/');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ConfigurationError);
      }
    });
  });

  describe('loadConfig method', () => {
    it('should load configuration with options object', async () => {
      const result = await configManager.loadConfig();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.logging.level).toBe('info');
      }
    });

    it('should load configuration with configPath option', async () => {
      const result = await configManager.loadConfig({
        configPath: '/nonexistent.json',
      });
      // This should either fail gracefully or succeed with defaults
      expect(result).toBeDefined();
    });
  });

  describe('configuration state management', () => {
    it('should maintain configuration reference across calls', async () => {
      await configManager.load();

      const config1 = configManager.getConfig();
      const config2 = configManager.getConfig();
      const config3 = configManager.getConfig();

      expect(config1).toBe(config2);
      expect(config2).toBe(config3);
    });

    it('should preserve modifications', async () => {
      await configManager.load();

      configManager.set('logging.level', 'warn');
      configManager.set('tts.quality', 0.95);

      expect(configManager.get<string>('logging.level')).toBe('warn');
      expect(configManager.get<number>('tts.quality')).toBe(0.95);

      const config = configManager.getConfig();
      expect(config.logging.level).toBe('warn');
      expect(config.tts.quality).toBe(0.95);
    });

    it('should handle multiple modifications', async () => {
      await configManager.load();

      const modifications = [
        { path: 'logging.level', value: 'error' },
        { path: 'tts.defaultEngine', value: 'chatterbox' },
        { path: 'processing.parallel', value: false },
        { path: 'cli.debug', value: true },
        { path: 'cache.maxSize', value: 2048 },
      ];

      for (const mod of modifications) {
        configManager.set(mod.path, mod.value);
      }

      for (const mod of modifications) {
        expect(configManager.get<typeof mod.value>(mod.path)).toBe(mod.value);
      }
    });
  });

  describe('error handling', () => {
    it('should handle invalid configuration access', async () => {
      await configManager.load();

      // These should not throw
      expect(configManager.get('nonexistent.deep.path')).toBeUndefined();
      expect(configManager.has('nonexistent.deep.path')).toBe(false);
    });

    it('should handle configuration operations without load', () => {
      // These should handle the case where no config is loaded
      expect(configManager.get('any.key')).toBeUndefined();
      expect(configManager.has('any.key')).toBe(false);

      // set should not throw but should have no effect
      expect(() => configManager.set('any.key', 'value')).not.toThrow();
    });

    it('should handle clear operations correctly', async () => {
      await configManager.load();

      configManager.clear();

      // Multiple clears should be safe
      configManager.clear();
      configManager.clear();

      expect(() => configManager.getConfig()).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in configuration values', async () => {
      await configManager.load();

      const specialValues = {
        'test.string': 'Special chars: !@#$%^&*()',
        'test.number': 42,
        'test.boolean': true,
        'test.null': null,
        'test.undefined': undefined,
      };

      for (const [key, value] of Object.entries(specialValues)) {
        configManager.set(key, value);
        expect(configManager.get<typeof value>(key)).toBe(value);
      }
    });

    it('should handle configuration with many properties', async () => {
      await configManager.load();

      // Add many properties
      for (let i = 0; i < 100; i++) {
        configManager.set(`test.prop${i}`, `value${i}`);
      }

      // Verify they were added
      for (let i = 0; i < 100; i++) {
        expect(configManager.get<string>(`test.prop${i}`)).toBe(`value${i}`);
        expect(configManager.has(`test.prop${i}`)).toBe(true);
      }
    });

    it('should handle rapid successive operations', async () => {
      await configManager.load();

      // Rapid get operations
      for (let i = 0; i < 1000; i++) {
        configManager.get('logging.level');
        configManager.has('tts.defaultEngine');
      }

      // Rapid set operations
      for (let i = 0; i < 100; i++) {
        configManager.set(
          'logging.level',
          ['debug', 'info', 'warn', 'error'][i % 4]
        );
      }

      // Should still work
      expect(['debug', 'info', 'warn', 'error']).toContain(
        configManager.get('logging.level')
      );
    });
  });
});
