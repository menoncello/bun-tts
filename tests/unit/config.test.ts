import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { writeFileSync, unlinkSync, mkdirSync, rmdirSync } from 'fs';
import { join } from 'path';
import { ConfigManager, configManager } from '../../src/config/index.js';
import {
  InvalidConfigError,
  MissingConfigError,
} from '../../src/errors/index.js';

function getTestDirectory(): string {
  return join(process.cwd(), 'test-config');
}

function createTestConfigDirectory(testDir: string): void {
  try {
    mkdirSync(testDir, { recursive: true });
  } catch {
    // Directory might already exist
  }
}

function cleanupTestFiles(testDir: string): void {
  try {
    const testFiles = [
      join(testDir, 'bun-tts.json'),
      join(testDir, 'bun-tts.yml'),
      join(testDir, 'bun-tts.js'),
      join(testDir, '.bun-ttsrc.json'),
      join(testDir, '.bun-ttsrc.yml'),
      join(testDir, 'package.json'),
    ];

    for (const file of testFiles) {
      try {
        unlinkSync(file);
      } catch {
        // File doesn't exist, ignore
      }
    }

    try {
      rmdirSync(testDir);
    } catch {
      // Directory doesn't exist or not empty, ignore
    }
  } catch {
    // Ignore cleanup errors
  }
}

function validateDefaultConfig(config: any): void {
  expect(config.ttsEngine).toBe('kokoro');
  expect(config.outputFormat).toBe('mp3');
  expect(config.sampleRate).toBe(22050);
  expect(config.channels).toBe(1);
  expect(config.bitrate).toBe(128);
  expect(config.voiceSettings.speed).toBe(1.0);
  expect(config.voiceSettings.pitch).toBe(1.0);
  expect(config.voiceSettings.volume).toBe(1.0);
}

function validateCustomConfig(config: any, customValues: any): void {
  for (const key of Object.keys(customValues)) {
    if (
      typeof customValues[key] === 'object' &&
      !Array.isArray(customValues[key])
    ) {
      expect(config[key]).toEqual(expect.objectContaining(customValues[key]));
    } else {
      expect(config[key]).toBe(customValues[key]);
    }
  }
}

describe('ConfigManager Instance Management', () => {
  it('should create independent instances', () => {
    const manager1 = new ConfigManager();
    const manager2 = new ConfigManager();
    expect(manager1).not.toBe(manager2);
    expect(manager1).toBeInstanceOf(ConfigManager);
    expect(manager2).toBeInstanceOf(ConfigManager);
  });
});

describe('ConfigManager Default Configuration', () => {
  let manager: ConfigManager;

  beforeEach(() => {
    manager = new ConfigManager();
  });

  it('should load default configuration when no config file exists', async () => {
    const result = await manager.loadConfig();
    expect(result.success).toBe(true);
    validateDefaultConfig(result.data);
  });

  it('should merge provided defaults with built-in defaults', async () => {
    const customDefaults = {
      ttsEngine: 'chatterbox' as const,
      outputFormat: 'wav' as const,
      voiceSettings: {
        speed: 1.5,
        pitch: 0.8,
        volume: 1.2,
      },
    };

    const result = await manager.loadConfig({
      defaults: customDefaults,
    });

    expect(result.success).toBe(true);
    if (result.data) {
      validateCustomConfig(result.data, customDefaults);
      expect(result.data.sampleRate).toBe(22050); // Built-in default
    }
  });
});

describe('ConfigManager Validation', () => {
  let manager: ConfigManager;
  let testDir: string;

  beforeEach(() => {
    manager = new ConfigManager();
    testDir = getTestDirectory();
    createTestConfigDirectory(testDir);
  });

  afterEach(() => {
    cleanupTestFiles(testDir);
  });

  it('should reject invalid configuration during loadConfig', async () => {
    const configPath = join(testDir, 'invalid.json');
    const invalidConfig = { ttsEngine: 'invalid-engine' };

    writeFileSync(configPath, JSON.stringify(invalidConfig, null, 2));
    const result = await manager.loadConfig({ configPath });

    expect(result.success).toBe(false);
    if (result.error) {
      expect(result.error).toBeInstanceOf(InvalidConfigError);
      expect(result.error.message).toContain('Invalid ttsEngine');
    }
  });
});

describe('ConfigManager Validation - Valid Configuration', () => {
  let manager: ConfigManager;
  let testDir: string;

  beforeEach(() => {
    manager = new ConfigManager();
    testDir = getTestDirectory();
    createTestConfigDirectory(testDir);
  });

  afterEach(() => {
    cleanupTestFiles(testDir);
  });

  it('should accept valid configuration with all settings', async () => {
    const validConfig = {
      ttsEngine: 'chatterbox' as const,
      outputFormat: 'wav' as const,
      sampleRate: 44100,
      channels: 2 as const,
      bitrate: 320,
      voiceSettings: {
        speed: 1.5,
        pitch: 1.2,
        volume: 0.8,
        emotion: {
          enabled: true,
          engine: 'ai' as const,
          intensity: 0.7,
        },
      },
    };

    const result = await manager.loadConfig({
      defaults: validConfig,
    });

    expect(result.success).toBe(true);
    if (result.data) {
      validateCustomConfig(result.data, validConfig);
      expect(result.data.voiceSettings.emotion?.enabled).toBe(true);
      expect(result.data.voiceSettings.emotion?.engine).toBe('ai');
      expect(result.data.voiceSettings.emotion?.intensity).toBe(0.7);
    }
  });
});

describe('ConfigManager File Operations', () => {
  let manager: ConfigManager;
  let testDir: string;

  beforeEach(() => {
    manager = new ConfigManager();
    testDir = getTestDirectory();
    createTestConfigDirectory(testDir);
  });

  afterEach(() => {
    cleanupTestFiles(testDir);
  });

  it('should load JSON configuration file', async () => {
    const configPath = join(testDir, 'bun-tts.json');
    const config = {
      ttsEngine: 'chatterbox',
      outputFormat: 'wav',
      voiceSettings: { speed: 1.2, pitch: 0.9, volume: 1.5 },
    };

    writeFileSync(configPath, JSON.stringify(config, null, 2));
    const result = await manager.loadConfig({ configPath });

    expect(result.success).toBe(true);
    validateCustomConfig(result.data, config);
  });

  it('should return MissingConfigError for non-existent file', async () => {
    const configPath = join(testDir, 'non-existent.json');
    const result = await manager.loadConfig({ configPath });

    expect(result.success).toBe(false);
    if (result.error) {
      expect(result.error).toBeInstanceOf(MissingConfigError);
      expect(result.error.message).toContain('Configuration file not found');
    }
  });

  it('should return InvalidConfigError for malformed JSON', async () => {
    const configPath = join(testDir, 'malformed.json');
    writeFileSync(configPath, '{ invalid json }');

    const result = await manager.loadConfig({ configPath });

    expect(result.success).toBe(false);
    if (result.error) {
      expect(result.error).toBeInstanceOf(InvalidConfigError);
      expect(result.error.message).toContain('Invalid configuration');
    }
  });
});

describe('ConfigManager Configuration Access', () => {
  let manager: ConfigManager;

  beforeEach(() => {
    manager = new ConfigManager();
  });

  it('should return config after loading', async () => {
    await manager.loadConfig({
      defaults: { ttsEngine: 'chatterbox' },
    });

    const config = manager.getConfig();
    expect(config).not.toBeNull();
    if (config) {
      expect(config.ttsEngine).toBe('chatterbox');
    }
  });

  it('should store config in instance after loading', async () => {
    const result = await manager.loadConfig({
      defaults: { outputFormat: 'wav' },
    });

    expect(result.success).toBe(true);
    const config = manager.getConfig();
    expect(config).not.toBeNull();
    if (config) {
      expect(config.outputFormat).toBe('wav');
    }
  });
});

describe('ConfigManager Sample Configuration', () => {
  let manager: ConfigManager;

  beforeEach(() => {
    manager = new ConfigManager();
  });

  it('should generate a valid sample configuration', () => {
    const sample = manager.createSampleConfig();

    expect(sample).toContain('# bun-tts Configuration File');
    expect(sample).toContain('ttsEngine: "kokoro"');
    expect(sample).toContain('outputFormat: "mp3"');
    expect(sample).toContain('voiceSettings:');
    expect(sample).toContain('speed: 1.0');
    expect(sample).toContain('emotion:');
    expect(sample).toContain('# Options: kokoro, chatterbox');
  });
});

describe('ConfigManager Class Exports', () => {
  it('should provide access to ConfigManager class', () => {
    expect(typeof configManager).toBe('function');
    expect(configManager).toBe(ConfigManager);
  });

  it('should work with new instances', async () => {
    const manager = new configManager();
    const result = await manager.loadConfig({
      defaults: { ttsEngine: 'chatterbox' },
    });

    expect(result.success).toBe(true);
    const data = result.data;
    expect(data).toBeDefined();
    if (data) {
      expect(data.ttsEngine).toBe('chatterbox');
    }
  });
});
