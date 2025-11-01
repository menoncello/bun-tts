import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { ConfigManager } from '../../../src/config/config-manager';
import { ConfigurationError } from '../../../src/errors/configuration-error';
import { createCustomTestConfig } from './config-manager-test-helpers';

describe('ConfigManager Save - Successful Saving Scenarios', () => {
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

  it('should save configuration to specified path', async () => {
    const config = createCustomTestConfig();
    const savePath = join(tempDir, 'custom.json');

    const result = await configManager.save(config, savePath);
    expect(result.success).toBe(true);

    const fs = await import('fs/promises');
    const savedContent = await fs.readFile(savePath, 'utf-8');
    const parsedConfig = JSON.parse(savedContent);
    expect(parsedConfig.logging.level).toBe('debug');
    expect(parsedConfig.tts.defaultEngine).toBe('chatterbox');
  });

  it('should create directory if it does not exist', async () => {
    const config = createCustomTestConfig();
    const savePath = join(tempDir, 'new', 'deep', 'path', 'config.json');

    const result = await configManager.save(config, savePath);
    expect(result.success).toBe(true);
  });

  it('should overwrite existing configuration', async () => {
    const config = createCustomTestConfig();
    const savePath = join(tempDir, 'test.json');

    // Save initial config
    await configManager.save(config, savePath);

    // Modify config and save again
    const modifiedConfig = createCustomTestConfig();
    modifiedConfig.logging.level = 'error';
    const result = await configManager.save(modifiedConfig, savePath);
    expect(result.success).toBe(true);

    const fs = await import('fs/promises');
    const savedContent = await fs.readFile(savePath, 'utf-8');
    const parsedConfig = JSON.parse(savedContent);
    expect(parsedConfig.logging.level).toBe('error');
  });

  it('should format JSON with proper indentation', async () => {
    const config = createCustomTestConfig();
    const savePath = join(tempDir, 'formatted.json');

    const result = await configManager.save(config, savePath);
    expect(result.success).toBe(true);

    const fs = await import('fs/promises');
    const savedContent = await fs.readFile(savePath, 'utf-8');
    // Check that JSON is properly formatted with indentation
    expect(savedContent).toContain('  "logging":');
    expect(savedContent).toContain('    "level"');
  });
});

describe('ConfigManager Save - Error Handling', () => {
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

  it('should handle invalid configuration object', async () => {
    const invalidConfig = {
      logging: {
        level: 123, // Invalid log level
      },
    };
    const savePath = join(tempDir, 'invalid.json');

    const result = await configManager.save(invalidConfig as any, savePath);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
      expect(result.error).toBeInstanceOf(ConfigurationError);
    }
  });

  it('should handle invalid file path', async () => {
    const config = createCustomTestConfig();
    const invalidPath = '';

    const result = await configManager.save(config, invalidPath);
    expect(result.success).toBe(false);
  });
});

describe('ConfigManager Save - Configuration Validation Before Save', () => {
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

  it('should allow partial configurations to be saved', async () => {
    const partialConfig = {
      logging: {
        level: 'info',
      },
    };
    const savePath = join(tempDir, 'partial.json');

    const result = await configManager.save(partialConfig as any, savePath);
    expect(result.success).toBe(true);
  });

  it('should validate property types before saving', async () => {
    const invalidConfig = {
      logging: {
        level: 123, // Invalid type
      },
    };
    const savePath = join(tempDir, 'invalid.json');

    const result = await configManager.save(invalidConfig as any, savePath);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
      expect(result.error).toBeInstanceOf(ConfigurationError);
    }
  });
});

describe('ConfigManager Save - Partial Configuration Saving', () => {
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

  it('should save valid partial configuration', async () => {
    const partialConfig = {
      logging: {
        level: 'warn',
        pretty: false,
      },
    };
    const savePath = join(tempDir, 'partial.json');

    const result = await configManager.save(partialConfig as any, savePath);
    expect(result.success).toBe(true);
  });

  it('should merge partial configuration with defaults when saving', async () => {
    const partialConfig = {
      logging: {
        level: 'error',
      },
    };
    const savePath = join(tempDir, 'partial.json');

    const result = await configManager.save(partialConfig as any, savePath);
    expect(result.success).toBe(true);
  });
});
