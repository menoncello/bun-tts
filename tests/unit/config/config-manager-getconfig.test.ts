import { describe, it, expect, beforeEach } from 'bun:test';
import { ConfigManager } from '../../../src/config/config-manager';
import { ConfigurationError } from '../../../src/errors/configuration-error';

describe('ConfigManager GetConfig - Method Coverage', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
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
      expect(typeof configManager.getConfig).toBe('function');
    });
  });

  describe('getConfig method error scenarios', () => {
    it('should throw ConfigurationError when no config has been loaded', () => {
      expect(() => configManager.getConfig()).toThrow(ConfigurationError);
      expect(() => configManager.getConfig()).toThrow(
        'Configuration not loaded. Call load() first.'
      );
    });

    it('should throw ConfigurationError with correct message and type', () => {
      try {
        configManager.getConfig();
        expect.unreachable('Expected ConfigurationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigurationError);
        expect((error as ConfigurationError).message).toBe(
          'Configuration not loaded. Call load() first.'
        );
      }
    });

    it('should throw ConfigurationError when config was cleared', async () => {
      // First load a config successfully
      const loadResult = await configManager.load();
      expect(loadResult.success).toBe(true);

      // getConfig should work now
      const config = configManager.getConfig();
      expect(config).toBeDefined();

      // Clear the config
      configManager.clear();

      // Now getConfig should throw again
      expect(() => configManager.getConfig()).toThrow(ConfigurationError);
      expect(() => configManager.getConfig()).toThrow(
        'Configuration not loaded. Call load() first.'
      );
    });

    it('should handle non-existent files gracefully', async () => {
      // Try to load a non-existent config file - should return default config
      const loadResult = await configManager.load('/nonexistent/config.json');
      expect(loadResult.success).toBe(true);

      // getConfig should return the default config
      const config = configManager.getConfig();
      expect(config).toBeDefined();
      expect(config.logging.level).toBe('info'); // Default value
    });

    it('should return the same config object reference across multiple calls', async () => {
      const loadResult = await configManager.load();
      expect(loadResult.success).toBe(true);

      const config1 = configManager.getConfig();
      const config2 = configManager.getConfig();
      const config3 = configManager.getConfig();

      expect(config1).toBe(config2);
      expect(config2).toBe(config3);
    });

    it('should preserve config state across load operations', async () => {
      // Load initial config
      const loadResult1 = await configManager.load();
      expect(loadResult1.success).toBe(true);

      const initialConfig = configManager.getConfig();

      // Modify the config through setter
      configManager.set('logging.level', 'debug');

      // getConfig should reflect the change
      const modifiedConfig = configManager.getConfig();
      expect(modifiedConfig.logging.level).toBe('debug');
      expect(modifiedConfig).toBe(initialConfig); // Same object reference
    });

    it('should handle config modifications returned by getConfig', async () => {
      const loadResult = await configManager.load();
      expect(loadResult.success).toBe(true);

      const config = configManager.getConfig();

      // Direct modifications to the returned config should be possible
      config.logging.level = 'error';
      config.tts.defaultEngine = 'chatterbox';

      // Subsequent calls to getConfig should reflect these changes
      const updatedConfig = configManager.getConfig();
      expect(updatedConfig.logging.level).toBe('error');
      expect(updatedConfig.tts.defaultEngine).toBe('chatterbox');
    });

    it('should handle multiple load attempts gracefully', async () => {
      // Try multiple invalid paths - all should succeed with default config
      const result1 = await configManager.load('/invalid1.json');
      const result2 = await configManager.load('/invalid2.json');
      const result3 = await configManager.load('/invalid3.json');

      // All should succeed with default config
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);

      // getConfig should return the default config
      const config = configManager.getConfig();
      expect(config).toBeDefined();
      expect(config.logging.level).toBe('info'); // Default value
    });
  });

  describe('getConfig method after successful operations', () => {
    it('should return valid config after successful load', async () => {
      const loadResult = await configManager.load();
      expect(loadResult.success).toBe(true);

      const config = configManager.getConfig();
      expect(config).toBeDefined();
      expect(config.logging).toBeDefined();
      expect(config.tts).toBeDefined();
      expect(config.processing).toBeDefined();
      expect(config.cli).toBeDefined();
      expect(config.cache).toBeDefined();
    });

    it('should return config with all expected properties', async () => {
      const loadResult = await configManager.load();
      expect(loadResult.success).toBe(true);

      const config = configManager.getConfig();

      // Check all required properties exist
      expect(config.logging).toHaveProperty('level');
      expect(config.logging).toHaveProperty('pretty');
      expect(config.logging).toHaveProperty('file');

      expect(config.tts).toHaveProperty('defaultEngine');
      expect(config.tts).toHaveProperty('outputFormat');
      expect(config.tts).toHaveProperty('sampleRate');
      expect(config.tts).toHaveProperty('quality');
      expect(config.tts).toHaveProperty('rate');
      expect(config.tts).toHaveProperty('volume');

      expect(config.processing).toHaveProperty('maxFileSize');
      expect(config.processing).toHaveProperty('parallel');
      expect(config.processing).toHaveProperty('maxWorkers');

      expect(config.cli).toHaveProperty('showProgress');
      expect(config.cli).toHaveProperty('colors');
      expect(config.cli).toHaveProperty('debug');

      expect(config.cache).toHaveProperty('enabled');
      expect(config.cache).toHaveProperty('maxSize');
      expect(config.cache).toHaveProperty('ttl');
    });
  });

  describe('getConfig error handling edge cases', () => {
    it('should handle config state corruption gracefully', async () => {
      const loadResult = await configManager.load();
      expect(loadResult.success).toBe(true);

      // Manually corrupt the internal config (this would be a bug scenario)
      (configManager as any).config = null;

      expect(() => configManager.getConfig()).toThrow(ConfigurationError);
    });

    it('should handle config set to undefined', async () => {
      const loadResult = await configManager.load();
      expect(loadResult.success).toBe(true);

      // Manually set config to undefined
      (configManager as any).config = undefined;

      expect(() => configManager.getConfig()).toThrow(ConfigurationError);
    });

    it('should maintain error throwing behavior consistency', async () => {
      // Test multiple scenarios where getConfig should throw
      const scenarios = [
        () => configManager.getConfig(), // Initial state
        () => {
          configManager.clear();
          return configManager.getConfig();
        }, // After clear
        () => {
          (configManager as any).config = null;
          return configManager.getConfig();
        }, // After corruption
      ];

      for (const scenario of scenarios) {
        expect(scenario).toThrow(ConfigurationError);
        expect(scenario).toThrow(
          'Configuration not loaded. Call load() first.'
        );
      }
    });
  });
});
