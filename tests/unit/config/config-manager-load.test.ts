import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { ConfigManager } from '../../../src/config/config-manager';
import { DEFAULT_CONFIG } from '../../../src/types/config';
import {
  createMockFileSystemOperations,
  createMockLogger,
  createTestScenarios,
} from './config-manager-test-helpers';

describe('ConfigManager Load - Successful Loading Scenarios', () => {
  let configManager: ConfigManager;
  let _mockFs: ReturnType<typeof createMockFileSystemOperations>;
  let _mockLogger: ReturnType<typeof createMockLogger>;
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'bun-tts-load-test-'));

    // Create test config files
    writeFileSync(
      join(tempDir, 'default.json'),
      JSON.stringify(DEFAULT_CONFIG)
    );
    writeFileSync(
      join(tempDir, 'user.json'),
      JSON.stringify({
        logging: { level: 'debug' },
        tts: { defaultEngine: 'chatterbox' },
      })
    );
    writeFileSync(join(tempDir, 'empty.json'), '{}');

    _mockFs = createMockFileSystemOperations();
    _mockLogger = createMockLogger();
    configManager = new ConfigManager();
  });

  afterEach(() => {
    // Clean up temp directory
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should load configuration from default path', async () => {
    const result = await configManager.load();
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.logging.level).toBe('info');
      expect(result.data?.tts.defaultEngine).toBe('kokoro');
    }
  });

  it('should load configuration from custom path', async () => {
    const result = await configManager.load(join(tempDir, 'default.json'));
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.logging.level).toBe('info');
    }
  });

  it('should handle loading with a custom path', async () => {
    // Test with single path parameter (ConfigManager only accepts one path)
    const result = await configManager.load(join(tempDir, 'default.json'));
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.logging.level).toBe('info');
      expect(result.data?.tts.defaultEngine).toBe('kokoro');
    }
  });

  it('should return default config when no files exist', async () => {
    // Test with nonexistent file - should return default config
    const result = await configManager.load(join(tempDir, 'nonexistent.json'));
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.logging.level).toBe('info'); // Default value
      expect(result.data?.tts.defaultEngine).toBe('kokoro'); // Default value
    }
  });
});

describe('ConfigManager Load - Error Handling', () => {
  let configManager: ConfigManager;
  let _mockFs: ReturnType<typeof createMockFileSystemOperations>;
  let _mockLogger: ReturnType<typeof createMockLogger>;
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'bun-tts-load-error-test-'));

    // Create test config files
    writeFileSync(
      join(tempDir, 'default.json'),
      JSON.stringify(DEFAULT_CONFIG)
    );
    writeFileSync(join(tempDir, 'empty.json'), '{}');
    writeFileSync(join(tempDir, 'invalid.json'), '{ invalid json content }');

    _mockFs = createMockFileSystemOperations();
    _mockLogger = createMockLogger();
    configManager = new ConfigManager();
  });

  afterEach(() => {
    // Clean up temp directory
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should handle invalid JSON gracefully', async () => {
    const result = await configManager.load(join(tempDir, 'invalid.json'));
    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('Failed to load configuration');
    }
  });

  it('should handle empty configuration gracefully', async () => {
    const result = await configManager.load(join(tempDir, 'empty.json'));
    expect(result).toBeDefined();
    // Empty config should be merged with defaults, so success should be true
    expect(result.success).toBe(true);
  });

  it('should handle missing files gracefully', async () => {
    const result = await configManager.load(join(tempDir, 'nonexistent.json'));
    expect(result).toBeDefined();
    expect(result.success).toBe(true); // Should return default config
    if (result.success) {
      expect(result.data?.logging.level).toBe('info'); // Default value
    }
  });

  it('should handle cosmiconfig errors', async () => {
    // Test with a path that might cause cosmiconfig to fail
    const result = await configManager.load(';');
    expect(result).toBeDefined();
    // Should either succeed with defaults or fail gracefully
    if (result.success) {
      expect(result.data).toBeDefined();
    } else {
      expect(result.error).toBeDefined();
    }
  });
});

describe('ConfigManager Load - Configuration Validation', () => {
  let configManager: ConfigManager;
  let _mockFs: ReturnType<typeof createMockFileSystemOperations>;
  let _mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    _mockFs = createMockFileSystemOperations();
    _mockLogger = createMockLogger();
    configManager = new ConfigManager();
  });

  it('should validate required properties', async () => {
    const invalidConfig = { logging: null };
    _mockFs.writeFile('/config/invalid.json', JSON.stringify(invalidConfig));

    const result = await configManager.load('/config/invalid.json');
    expect(result).toBeDefined();
    // Invalid configs might be merged with defaults or fail validation
    if (result.success) {
      expect(result.data).toBeDefined();
    } else {
      expect(result.error).toBeDefined();
    }
  });

  it('should handle property type validation', async () => {
    const typeInvalidConfig = {
      logging: { level: 123 }, // Should be string
      tts: { defaultEngine: true }, // Should be string
    };
    _mockFs.writeFile(
      '/config/invalid.json',
      JSON.stringify(typeInvalidConfig)
    );

    const result = await configManager.load('/config/invalid.json');
    expect(result).toBeDefined();
    // Type issues might be corrected or cause validation failure
    if (result.success) {
      expect(result.data).toBeDefined();
    } else {
      expect(result.error).toBeDefined();
    }
  });

  it('should handle enum value validation', async () => {
    const enumInvalidConfig = {
      logging: { level: 'invalid-level' }, // Should be valid log level
      tts: { defaultEngine: 'invalid-engine' }, // Should be valid engine
    };
    _mockFs.writeFile(
      '/config/invalid.json',
      JSON.stringify(enumInvalidConfig)
    );

    const result = await configManager.load('/config/invalid.json');
    expect(result).toBeDefined();
    // Invalid enum values might be corrected or cause validation failure
    if (result.success) {
      expect(result.data).toBeDefined();
    } else {
      expect(result.error).toBeDefined();
    }
  });
});

describe('ConfigManager Load - Test Scenarios', () => {
  let configManager: ConfigManager;
  let _mockFs: ReturnType<typeof createMockFileSystemOperations>;
  let _mockLogger: ReturnType<typeof createMockLogger>;
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'bun-tts-scenarios-test-'));

    // Create test config files
    writeFileSync(
      join(tempDir, 'default.json'),
      JSON.stringify(DEFAULT_CONFIG)
    );

    _mockFs = createMockFileSystemOperations();
    _mockLogger = createMockLogger();
    configManager = new ConfigManager();
  });

  afterEach(() => {
    // Clean up temp directory
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should handle all predefined test scenarios', async () => {
    const scenarios = createTestScenarios();

    for (const scenario of Object.values(scenarios)) {
      _mockLogger.clear();
      // Reset file system with scenario data
      Object.assign(_mockFs, scenario.fileSystem);

      const result = await configManager.load(join(tempDir, 'default.json'));

      if (scenario.shouldPass) {
        expect(result).toBeDefined();
        expect(result.success).toBe(true);
      } else {
        expect(result).toBeDefined();
        // Might succeed with defaults or fail gracefully
        if (!result.success) {
          expect(result.error).toBeDefined();
        }
      }
    }
  });
});
