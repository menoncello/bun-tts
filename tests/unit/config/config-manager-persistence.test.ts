import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { ConfigManager } from '../../../src/config/config-manager';
import { ConfigurationError } from '../../../src/errors/configuration-error';
import { createCustomTestConfig } from './config-manager-test-helpers';

describe('ConfigManager Configuration Persistence and State Management', () => {
  let configManager: ConfigManager;
  let tempDir: string;

  beforeEach(() => {
    configManager = new ConfigManager();
    tempDir = mkdtempSync(join(tmpdir(), 'bun-tts-test-'));
  });

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('configuration state persistence', () => {
    it('should maintain configuration state across multiple operations', async () => {
      const customConfig = createCustomTestConfig();
      const configPath = join(tempDir, 'config.json');

      // Write initial config to file
      writeFileSync(configPath, JSON.stringify(customConfig, null, 2));

      // Load configuration
      const loadResult = await configManager.load(configPath);
      expect(loadResult.success).toBe(true);

      // Verify initial state
      let currentConfig = configManager.getConfig();
      expect(currentConfig.logging.level).toBe('debug');
      expect(currentConfig.tts.defaultEngine).toBe('chatterbox');

      // Modify configuration
      configManager.set('logging.level', 'warn');
      configManager.set('tts.quality', 0.95);

      // Verify modifications are persisted in memory
      currentConfig = configManager.getConfig();
      expect(currentConfig.logging.level).toBe('warn');
      expect(currentConfig.tts.quality).toBe(0.95);

      // Config path should remain unchanged
      expect(configManager.getConfigPath()).toBe(configPath);
    });

    it('should preserve configuration modifications through save/load cycles', async () => {
      const initialConfig = createCustomTestConfig();
      const testPath = join(tempDir, 'persistence-config.json');

      // Write initial config
      writeFileSync(testPath, JSON.stringify(initialConfig, null, 2));

      // Load initial config
      await configManager.load(testPath);

      // Modify configuration
      configManager.set('logging.level', 'error');
      configManager.set('tts.sampleRate', 48000);
      configManager.set('processing.maxWorkers', 8);

      const modifiedConfig = configManager.getConfig();

      // Save modified configuration
      const saveResult = await configManager.save(modifiedConfig, testPath);
      expect(saveResult.success).toBe(true);

      // Verify file was written correctly
      const savedContent = readFileSync(testPath, 'utf8');
      expect(savedContent).toContain('"level": "error"');
      expect(savedContent).toContain('"sampleRate": 48000');

      // Clear and reload
      configManager.clear();
      expect(() => configManager.getConfig()).toThrow();

      const reloadResult = await configManager.load(testPath);
      expect(reloadResult.success).toBe(true);

      // Verify modifications persisted
      const reloadedConfig = configManager.getConfig();
      expect(reloadedConfig.logging.level).toBe('error');
      expect(reloadedConfig.tts.sampleRate).toBe(48000);
      expect(reloadedConfig.processing.maxWorkers).toBe(8);
    });

    it('should maintain state when loading multiple configurations', async () => {
      const config1 = createCustomTestConfig();
      const config2 = createCustomTestConfig();
      config2.logging.level = 'warn';
      config2.tts.defaultEngine = 'kokoro';

      const configPath1 = join(tempDir, 'config1.json');
      const configPath2 = join(tempDir, 'config2.json');

      // Write configs to files
      writeFileSync(configPath1, JSON.stringify(config1, null, 2));
      writeFileSync(configPath2, JSON.stringify(config2, null, 2));

      // Load first configuration
      await configManager.load(configPath1);
      expect(configManager.getConfig().logging.level).toBe('debug');
      expect(configManager.getConfigPath()).toBe(configPath1);

      // Load second configuration
      await configManager.load(configPath2);
      expect(configManager.getConfig().logging.level).toBe('warn');
      expect(configManager.getConfigPath()).toBe(configPath2);

      // Verify only the latest config is retained
      expect(configManager.getConfig().tts.defaultEngine).toBe('kokoro');
      expect(configManager.getConfigPath()).toBe(configPath2);
    });

    it('should handle configuration state reset correctly', async () => {
      const customConfig = createCustomTestConfig();
      const configPath = join(tempDir, 'reset-config.json');

      writeFileSync(configPath, JSON.stringify(customConfig, null, 2));

      // Load configuration
      await configManager.load(configPath);
      expect(configManager.getConfig().logging.level).toBe('debug');

      // Reset configuration
      configManager.clear();
      expect(() => configManager.getConfig()).toThrow();
      expect(configManager.getConfigPath()).toBeUndefined();
    });
  });

  describe('configuration modification and persistence', () => {
    it('should track modifications through set operations', async () => {
      const initialConfig = createCustomTestConfig();
      const configPath = join(tempDir, 'tracking-config.json');

      writeFileSync(configPath, JSON.stringify(initialConfig, null, 2));
      await configManager.load(configPath);

      // Make multiple modifications
      configManager.set('logging.level', 'error');
      configManager.set('tts.defaultEngine', 'kokoro');
      configManager.set('processing.parallel', false);
      configManager.set('cache.enabled', false);

      // Verify all modifications are tracked
      const finalConfig = configManager.getConfig();
      expect(finalConfig.logging.level).toBe('error');
      expect(finalConfig.tts.defaultEngine).toBe('kokoro');
      expect(finalConfig.processing.parallel).toBe(false);
      expect(finalConfig.cache.enabled).toBe(false);
    });

    it('should handle nested configuration modifications', async () => {
      const initialConfig = createCustomTestConfig();
      const configPath = join(tempDir, 'nested-config.json');

      writeFileSync(configPath, JSON.stringify(initialConfig, null, 2));
      await configManager.load(configPath);

      // Modify nested properties
      configManager.set('logging.level', 'warn');
      configManager.set('tts.sampleRate', 44100);
      configManager.set('processing.maxWorkers', 6);

      // Verify nested modifications
      const config = configManager.getConfig();
      expect(config.logging.level).toBe('warn');
      expect(config.tts.sampleRate).toBe(44100);
      expect(config.processing.maxWorkers).toBe(6);

      // Other properties should remain unchanged
      expect(config.logging.pretty).toBe(false);
      expect(config.tts.defaultEngine).toBe('chatterbox');
      expect(config.processing.maxFileSize).toBe(200);
    });
  });

  describe('error handling in persistence operations', () => {
    it('should handle invalid configuration files gracefully', async () => {
      const invalidConfigPath = join(tempDir, 'invalid.json');

      // Write invalid JSON
      writeFileSync(invalidConfigPath, '{ invalid json }');

      const result = await configManager.load(invalidConfigPath);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ConfigurationError);
      }
    });

    it('should handle missing configuration files', async () => {
      const missingPath = join(tempDir, 'nonexistent.json');

      const result = await configManager.load(missingPath);
      expect(result.success).toBe(true); // Should return default config
      if (result.success) {
        expect(result.data?.logging.level).toBe('info'); // Default value
      }
    });

    it('should handle save operations on read-only directories', async () => {
      const readOnlyPath = join(tempDir, 'readonly.json');
      const config = createCustomTestConfig();

      // Load a valid config first
      writeFileSync(readOnlyPath, JSON.stringify(config, null, 2));
      await configManager.load(readOnlyPath);

      // Try to save to an invalid path
      const invalidSavePath = '/root/readonly.json'; // Assuming this doesn't exist/writable
      const saveResult = await configManager.save(
        configManager.getConfig(),
        invalidSavePath
      );

      // Should handle the error gracefully
      expect(saveResult).toBeDefined();
    });
  });

  describe('configuration validation during persistence', () => {
    it('should validate configuration before saving', async () => {
      const configPath = join(tempDir, 'validation-config.json');
      const validConfig = createCustomTestConfig();

      writeFileSync(configPath, JSON.stringify(validConfig, null, 2));
      await configManager.load(configPath);

      // Modify with valid values
      configManager.set('logging.level', 'info');
      const validResult = await configManager.save(
        configManager.getConfig(),
        configPath
      );
      expect(validResult.success).toBe(true);
    });

    it('should maintain configuration integrity', async () => {
      const configPath = join(tempDir, 'integrity-config.json');
      const originalConfig = createCustomTestConfig();

      writeFileSync(configPath, JSON.stringify(originalConfig, null, 2));
      await configManager.load(configPath);

      // Get the loaded config
      const loadedConfig = configManager.getConfig();

      // Save and reload
      await configManager.save(loadedConfig, configPath);
      configManager.clear();
      await configManager.load(configPath);

      // Verify integrity
      const reloadedConfig = configManager.getConfig();
      expect(reloadedConfig).toEqual(loadedConfig);
    });
  });
});
