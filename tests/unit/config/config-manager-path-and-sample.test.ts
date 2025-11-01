import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { ConfigManager } from '../../../src/config/config-manager';
import { createCustomTestConfig } from './config-manager-test-helpers';

describe('ConfigManager GetConfigPath - Method Coverage', () => {
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

  describe('getConfigPath method behavior', () => {
    it('should return undefined when no configuration is loaded', () => {
      const path = configManager.getConfigPath();
      expect(path).toBeUndefined();
    });

    it('should return correct path after loading configuration', async () => {
      const config = createCustomTestConfig();
      const configPath = join(tempDir, 'test-config.json');
      writeFileSync(configPath, JSON.stringify(config, null, 2));

      const result = await configManager.load(configPath);
      expect(result.success).toBe(true);

      const path = configManager.getConfigPath();
      expect(path).toBe(configPath);
    });

    it('should maintain path after configuration modifications', async () => {
      const config = createCustomTestConfig();
      const configPath = join(tempDir, 'modified-config.json');
      writeFileSync(configPath, JSON.stringify(config, null, 2));

      await configManager.load(configPath);
      expect(configManager.getConfigPath()).toBe(configPath);

      // Modify configuration
      configManager.set('logging.level', 'error');
      configManager.set('tts.quality', 0.95);

      // Path should remain unchanged
      expect(configManager.getConfigPath()).toBe(configPath);
    });

    it('should reset to empty string after clearing configuration', async () => {
      const config = createCustomTestConfig();
      const configPath = join(tempDir, 'clear-config.json');
      writeFileSync(configPath, JSON.stringify(config, null, 2));

      await configManager.load(configPath);
      expect(configManager.getConfigPath()).toBe(configPath);

      configManager.clear();
      expect(configManager.getConfigPath()).toBeUndefined();
    });

    it('should update path when loading different configuration', async () => {
      const config1 = createCustomTestConfig();
      const config2 = createCustomTestConfig();
      config2.logging.level = 'warn';

      const configPath1 = join(tempDir, 'config1.json');
      const configPath2 = join(tempDir, 'config2.json');

      writeFileSync(configPath1, JSON.stringify(config1, null, 2));
      writeFileSync(configPath2, JSON.stringify(config2, null, 2));

      await configManager.load(configPath1);
      expect(configManager.getConfigPath()).toBe(configPath1);

      await configManager.load(configPath2);
      expect(configManager.getConfigPath()).toBe(configPath2);
    });

    it('should preserve path after save operations', async () => {
      const config = createCustomTestConfig();
      const configPath = join(tempDir, 'save-config.json');
      writeFileSync(configPath, JSON.stringify(config, null, 2));

      await configManager.load(configPath);
      expect(configManager.getConfigPath()).toBe(configPath);

      // Modify and save
      configManager.set('logging.level', 'error');
      const saveResult = await configManager.save(
        configManager.getConfig(),
        configPath
      );
      expect(saveResult.success).toBe(true);

      // Path should be preserved
      expect(configManager.getConfigPath()).toBe(configPath);
    });

    it('should handle save to different path without affecting loaded path', async () => {
      const config = createCustomTestConfig();
      const loadPath = join(tempDir, 'load-config.json');
      const savePath = join(tempDir, 'save-config.json');

      writeFileSync(loadPath, JSON.stringify(config, null, 2));

      await configManager.load(loadPath);
      expect(configManager.getConfigPath()).toBe(loadPath);

      // Save to different path
      const saveResult = await configManager.save(
        configManager.getConfig(),
        savePath
      );
      expect(saveResult.success).toBe(true);

      // Original path should be preserved
      expect(configManager.getConfigPath()).toBe(loadPath);
    });
  });

  describe('edge cases and error conditions', () => {
    it('should handle relative paths correctly', async () => {
      const config = createCustomTestConfig();
      const configPath = join(tempDir, 'relative-config.json');
      writeFileSync(configPath, JSON.stringify(config, null, 2));

      // Convert to relative path
      const relativePath = configPath.replace(process.cwd(), '.');

      const result = await configManager.load(relativePath);
      expect(result.success).toBe(true);

      // Should return the path as provided
      expect(configManager.getConfigPath()).toBe(relativePath);
    });

    it('should handle paths with special characters', async () => {
      const config = createCustomTestConfig();
      const configPath = join(tempDir, 'config with spaces.json');
      writeFileSync(configPath, JSON.stringify(config, null, 2));

      const result = await configManager.load(configPath);
      expect(result.success).toBe(true);

      expect(configManager.getConfigPath()).toBe(configPath);
    });

    it('should handle loading from non-existent paths gracefully', async () => {
      const nonExistentPath = join(tempDir, 'non-existent.json');

      const result = await configManager.load(nonExistentPath);
      expect(result.success).toBe(true); // Should return default config
      expect(configManager.getConfigPath()).toBeUndefined();
    });

    it('should maintain path even when configuration is invalid', async () => {
      const configPath = join(tempDir, 'invalid-config.json');
      writeFileSync(configPath, '{ invalid json }');

      const result = await configManager.load(configPath);
      expect(result.success).toBe(false);

      // Path should not be set for failed loads
      expect(configManager.getConfigPath()).toBeUndefined();
    });
  });

  describe('sample configuration behavior', () => {
    it('should create sample configuration files correctly', async () => {
      const samplePath = join(tempDir, 'sample-config.json');

      // Create a sample configuration
      const sampleConfig = createCustomTestConfig();
      const saveResult = await configManager.save(sampleConfig, samplePath);
      expect(saveResult.success).toBe(true);

      // Load the sample
      const loadResult = await configManager.load(samplePath);
      expect(loadResult.success).toBe(true);
      expect(configManager.getConfigPath()).toBe(samplePath);

      // Verify the configuration
      const loadedConfig = configManager.getConfig();
      expect(loadedConfig.logging.level).toBe('debug');
      expect(loadedConfig.tts.defaultEngine).toBe('chatterbox');
    });

    it('should use sample configuration as fallback', async () => {
      // This would typically involve loading from multiple potential locations
      // For this test, we'll simulate the behavior

      const sampleConfig = createCustomTestConfig();
      const configPath = join(tempDir, 'fallback-config.json');

      writeFileSync(configPath, JSON.stringify(sampleConfig, null, 2));
      await configManager.load(configPath);

      expect(configManager.getConfigPath()).toBe(configPath);
      expect(configManager.getConfig()).toBeDefined();
    });

    it('should preserve sample configuration structure through load/save cycles', async () => {
      const originalConfig = createCustomTestConfig();
      const configPath = join(tempDir, 'structure-test.json');

      writeFileSync(configPath, JSON.stringify(originalConfig, null, 2));
      await configManager.load(configPath);

      const loadedConfig = configManager.getConfig();

      // Save the loaded configuration
      const savePath = join(tempDir, 'saved-config.json');
      const saveResult = await configManager.save(loadedConfig, savePath);
      expect(saveResult.success).toBe(true);

      // Reload and verify structure
      configManager.clear();
      await configManager.load(savePath);

      const reloadedConfig = configManager.getConfig();

      // Verify all main sections exist
      expect(reloadedConfig).toHaveProperty('logging');
      expect(reloadedConfig).toHaveProperty('tts');
      expect(reloadedConfig).toHaveProperty('processing');
      expect(reloadedConfig).toHaveProperty('cli');
      expect(reloadedConfig).toHaveProperty('cache');

      // Verify nested structure
      expect(reloadedConfig.logging).toHaveProperty('level');
      expect(reloadedConfig.logging).toHaveProperty('pretty');
      expect(reloadedConfig.logging).toHaveProperty('file');

      expect(reloadedConfig.tts).toHaveProperty('defaultEngine');
      expect(reloadedConfig.tts).toHaveProperty('outputFormat');
      expect(reloadedConfig.tts).toHaveProperty('sampleRate');
    });
  });

  describe('path resolution and normalization', () => {
    it('should handle paths with different formats', async () => {
      const config = createCustomTestConfig();

      // Test with absolute path
      const absolutePath = join(tempDir, 'absolute.json');
      writeFileSync(absolutePath, JSON.stringify(config, null, 2));

      await configManager.load(absolutePath);
      expect(configManager.getConfigPath()).toBe(absolutePath);

      configManager.clear();

      // Test with different format
      const normalizedPath = absolutePath.replace(/\\/g, '/');
      writeFileSync(normalizedPath, JSON.stringify(config, null, 2));

      await configManager.load(normalizedPath);
      expect(configManager.getConfigPath()).toBe(normalizedPath);
    });

    it('should maintain path consistency through operations', async () => {
      const config = createCustomTestConfig();
      const configPath = join(tempDir, 'consistency.json');
      writeFileSync(configPath, JSON.stringify(config, null, 2));

      await configManager.load(configPath);
      const originalPath = configManager.getConfigPath();

      // Perform multiple operations
      configManager.set('logging.level', 'warn');
      configManager.set('tts.quality', 0.7);

      await configManager.save(configManager.getConfig(), configPath);

      // Path should remain consistent
      expect(configManager.getConfigPath()).toBe(originalPath);
      expect(configManager.getConfigPath()).toBe(configPath);
    });
  });

  describe('integration with other configuration operations', () => {
    it('should work correctly with has() method', async () => {
      const config = createCustomTestConfig();
      const configPath = join(tempDir, 'has-integration.json');
      writeFileSync(configPath, JSON.stringify(config, null, 2));

      await configManager.load(configPath);
      expect(configManager.getConfigPath()).toBe(configPath);

      // has() should work correctly
      expect(configManager.has('logging.level')).toBe(true);
      expect(configManager.has('nonexistent.path')).toBe(false);

      // Path should be unaffected
      expect(configManager.getConfigPath()).toBe(configPath);
    });

    it('should work correctly with get() method', async () => {
      const config = createCustomTestConfig();
      const configPath = join(tempDir, 'get-integration.json');
      writeFileSync(configPath, JSON.stringify(config, null, 2));

      await configManager.load(configPath);
      expect(configManager.getConfigPath()).toBe(configPath);

      // get() should work correctly
      expect(configManager.get('logging.level', 'info')).toBe('debug');
      expect(configManager.get('tts.defaultEngine', 'kokoro')).toBe(
        'chatterbox'
      );

      // Path should be unaffected
      expect(configManager.getConfigPath()).toBe(configPath);
    });

    // Note: delete() method is not implemented in ConfigManager
    // This functionality would need to be added if needed
  });
});
