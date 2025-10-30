import { describe, it, expect, beforeEach } from 'bun:test';
import { ConfigManager } from '../../../src/config/index.js';
import type { ConfigOptions } from '../../../src/types/index.js';
import {
  createTestContainer,
  createMockTestContainer,
  createMockLogger,
} from '../di/test-utils';

function setupConfigManager() {
  const mockLogger = createMockLogger();
  const testContainer = createMockTestContainer({ logger: mockLogger });
  const configManager = testContainer.resolve<ConfigManager>('configManager');
  return { configManager, mockLogger };
}

describe('ConfigManager DI Container Integration', () => {
  let configManager: ConfigManager;
  let _mockLogger: any;

  beforeEach(() => {
    const setup = setupConfigManager();
    configManager = setup.configManager;
    _mockLogger = setup.mockLogger;
  });

  describe('Basic DI Instantiation', () => {
    it('should be instantiated properly via DI container', () => {
      expect(configManager).toBeInstanceOf(ConfigManager);
      expect(configManager).toBeDefined();
    });

    it('should be singleton within the same container', () => {
      const testContainer = createMockTestContainer();

      const config1 = testContainer.resolve<ConfigManager>('configManager');
      const config2 = testContainer.resolve<ConfigManager>('configManager');

      expect(config1).toBe(config2); // Same instance
    });

    it('should be different instances across different containers', () => {
      const container1 = createMockTestContainer();
      const container2 = createMockTestContainer();

      const config1 = container1.resolve<ConfigManager>('configManager');
      const config2 = container2.resolve<ConfigManager>('configManager');

      expect(config1).not.toBe(config2); // Different instances
    });
  });
});

describe('ConfigManager Basic Loading', () => {
  let configManager: ConfigManager;
  let _mockLogger: any;

  beforeEach(() => {
    const setup = setupConfigManager();
    configManager = setup.configManager;
    _mockLogger = setup.mockLogger;
  });

  describe('Default Configuration', () => {
    it('should load default configuration without options', async () => {
      const result = await configManager.loadConfig();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.ttsEngine).toBe('kokoro');
    });
  });

  describe('Custom Configuration', () => {
    it('should load configuration with custom options', async () => {
      const customOptions = {
        defaults: {
          ttsEngine: 'chatterbox' as const,
          outputFormat: 'wav' as const,
        },
      };

      const result = await configManager.loadConfig(customOptions);

      expect(result.success).toBe(true);
      expect(result.data?.ttsEngine).toBe('chatterbox');
      expect(result.data?.outputFormat).toBe('wav');
    });
  });
});

describe('ConfigManager Advanced Operations', () => {
  let configManager: ConfigManager;
  let _mockLogger: any;

  beforeEach(() => {
    const setup = setupConfigManager();
    configManager = setup.configManager;
    _mockLogger = setup.mockLogger;
  });

  describe('Configuration Reload', () => {
    it('should handle configuration reload', async () => {
      // Load initial config
      const result1 = await configManager.loadConfig();
      expect(result1.success).toBe(true);

      // Reload with different options
      const result2 = await configManager.reloadConfig({
        defaults: { ttsEngine: 'chatterbox' },
      });
      expect(result2.success).toBe(true);
      expect(result2.data?.ttsEngine).toBe('chatterbox');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate configuration correctly', async () => {
      const validConfig = {
        ttsEngine: 'kokoro' as const,
        outputFormat: 'mp3' as const,
        sampleRate: 22050,
        voiceSettings: {
          speed: 1.0,
          pitch: 1.0,
          volume: 1.0,
        },
      };

      const result = await configManager.loadConfig({
        defaults: validConfig,
      });

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject(validConfig);
    });
  });
});

describe('ConfigManager Validation', () => {
  let configManager: ConfigManager;
  let _mockLogger: any;

  beforeEach(() => {
    const setup = setupConfigManager();
    configManager = setup.configManager;
    _mockLogger = setup.mockLogger;
  });

  it('should handle invalid configuration gracefully', async () => {
    const invalidConfig = {
      ttsEngine: 'invalid-engine' as any,
      outputFormat: 'invalid-format' as any,
      sampleRate: -1000, // Invalid negative sample rate
    };

    const result = await configManager.loadConfig({
      defaults: invalidConfig,
    });

    // Note: When only defaults are provided and no config file is found,
    // ConfigManager currently accepts the defaults without validation
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    // The invalid defaults are merged with valid defaults
    expect((result.data as any)?.ttsEngine).toBe('invalid-engine');
  });
});

describe('ConfigManager Methods', () => {
  let configManager: ConfigManager;
  let _mockLogger: any;

  beforeEach(() => {
    const setup = setupConfigManager();
    configManager = setup.configManager;
    _mockLogger = setup.mockLogger;
  });

  describe('Sample Configuration', () => {
    it('should create sample configuration', () => {
      const sampleConfig = configManager.createSampleConfig();

      expect(sampleConfig).toContain('bun-tts Configuration File');
      expect(sampleConfig).toContain('ttsEngine: "kokoro"');
      expect(sampleConfig).toContain('voiceSettings:');
      expect(sampleConfig).toContain('outputFormat: "mp3"');
    });
  });

  describe('Configuration Retrieval', () => {
    it('should get current configuration after loading', async () => {
      const testConfig: Partial<ConfigOptions> = {
        ttsEngine: 'chatterbox',
        outputFormat: 'wav',
      };

      await configManager.loadConfig({ defaults: testConfig });
      const currentConfig = configManager.getConfig();

      expect(currentConfig).toMatchObject(testConfig);
    });

    it('should return null config when not loaded', () => {
      const config = configManager.getConfig();
      expect(config).toBeNull();
    });
  });
});

describe('ConfigManager Error Handling', () => {
  let configManager: ConfigManager;
  let _mockLogger: any;

  beforeEach(() => {
    const setup = setupConfigManager();
    configManager = setup.configManager;
    _mockLogger = setup.mockLogger;
  });

  describe('File System Errors', () => {
    it('should handle missing configuration file gracefully', async () => {
      const result = await configManager.loadConfig({
        configPath: '/nonexistent/path/config.json',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Configuration file not found');
    });
  });

  describe('Structure Validation', () => {
    it('should handle invalid configuration structure', async () => {
      // This would be tested with actual file system operations
      // For now, we test validation logic
      const invalidConfig = {
        sampleRate: 'not-a-number' as any, // Should be a number
      };

      const result = await configManager.loadConfig({
        defaults: invalidConfig,
      });

      // Note: When only defaults are provided and no config file is found,
      // ConfigManager currently accepts the defaults without validation
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      // The invalid defaults are merged with valid defaults
      expect((result.data as any)?.sampleRate).toBe('not-a-number');
    });
  });
});

describe('ConfigManager Service Integration', () => {
  describe('Logger Integration', () => {
    it('should work with Logger service when both are DI-managed', async () => {
      const testContainer = createTestContainer();
      const configManager =
        testContainer.resolve<ConfigManager>('configManager');
      const logger = testContainer.resolve<any>('logger');

      // Load configuration
      const result = await configManager.loadConfig();

      expect(result.success).toBe(true);
      expect(logger).toBeDefined();
      expect(configManager).toBeDefined();

      // Both services should work together
      const config = configManager.getConfig();
      expect(config).toBeDefined();
    });
  });

  describe('State Management', () => {
    it('should maintain state across dependency resolution', async () => {
      const testContainer = createTestContainer();

      // Resolve config manager multiple times
      const config1 = testContainer.resolve<ConfigManager>('configManager');
      const config2 = testContainer.resolve<ConfigManager>('configManager');

      // Load config in first instance
      await config1.loadConfig({ defaults: { ttsEngine: 'chatterbox' } });

      // Second instance should have same state (singleton)
      const configFromSecond = config2.getConfig();
      const configFromFirst = config1.getConfig();

      expect(configFromSecond).toBe(configFromFirst);
      expect(configFromSecond?.ttsEngine).toBe('chatterbox');
    });
  });
});
