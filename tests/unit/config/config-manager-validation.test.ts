import { describe, it, expect, beforeEach } from 'bun:test';
import { ConfigManager } from '../../../src/config/config-manager';
import { createCustomTestConfig } from './config-manager-test-helpers';

describe('ConfigManager - Configuration Structure Validation', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager();
  });

  it('should validate complete configuration structure', () => {
    const config = createCustomTestConfig();
    const result = configManager.validate(config);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(true);
    }
  });

  it('should allow incomplete configurations (permissive validation)', () => {
    const incompleteConfig = {
      logging: { level: 'info', pretty: true, file: false },
      // Missing tts, processing, cli, cache - this is allowed
    } as any;

    const result = configManager.validate(incompleteConfig);
    expect(result.success).toBe(true);
    // ConfigValidator is permissive - only validates what's present
  });

  it('should allow incomplete nested properties (permissive validation)', () => {
    const invalidConfig = {
      logging: { level: 'info' }, // Missing pretty and file - this is allowed
      tts: { defaultEngine: 'kokoro' }, // Missing many required properties - allowed
      processing: { maxFileSize: 100 }, // Missing parallel and maxWorkers - allowed
      cli: { showProgress: true }, // Missing colors and debug - allowed
      cache: { enabled: true }, // Missing maxSize and ttl - allowed
    } as any;

    const result = configManager.validate(invalidConfig);
    expect(result.success).toBe(true);
    // ConfigValidator is permissive - only validates what's present
  });
});

describe('ConfigManager - Type Validation', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager();
  });

  it('should validate property types correctly', () => {
    const typeInvalidConfig = {
      logging: {
        level: 'info',
        pretty: 'yes', // Should be boolean
        file: 1, // Should be boolean
      },
      tts: {
        defaultEngine: 'kokoro',
        outputFormat: 'mp3',
        sampleRate: '22050', // Should be number
        quality: 0.8,
        rate: 1.0,
        volume: 1.0,
      },
      processing: {
        maxFileSize: 100,
        parallel: 'true', // Should be boolean
        maxWorkers: '4', // Should be number
      },
      cli: {
        showProgress: true,
        colors: 1, // Should be boolean
        debug: 'false', // Should be boolean
      },
      cache: {
        enabled: true,
        maxSize: '1024', // Should be number
        ttl: 3600,
      },
    } as any;

    const result = configManager.validate(typeInvalidConfig);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
      // The error message should contain validation details (specific error messages)
      expect(result.error.message).toBeDefined();
    }
  });

  it('should validate optional properties with correct types', () => {
    const configWithOptionsals = {
      logging: {
        level: 'info' as const,
        pretty: true,
        file: true,
        filePath: '/var/log/app.log', // Optional string
      },
      tts: {
        defaultEngine: 'kokoro' as const,
        outputFormat: 'mp3' as const,
        sampleRate: 22050,
        quality: 0.8,
        defaultVoice: 'en-US', // Optional string
        rate: 1.0,
        volume: 1.0,
      },
      processing: {
        maxFileSize: 100,
        parallel: true,
        maxWorkers: 4,
        tempDir: '/tmp', // Optional string
      },
      cli: {
        showProgress: true,
        colors: true,
        debug: false,
      },
      cache: {
        enabled: true,
        dir: '/cache', // Optional string
        maxSize: 1024,
        ttl: 3600,
      },
    };

    const result = configManager.validate(configWithOptionsals);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(true);
    }
  });
});

describe('ConfigManager - Enum Value Validation', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager();
  });

  it('should validate logging level enum values', () => {
    const validLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

    for (const level of validLevels) {
      const config = createCustomTestConfig();
      config.logging.level = level as any;

      const result = configManager.validate(config);
      expect(result.success).toBe(true);
    }

    // Test invalid level
    const invalidConfig = createCustomTestConfig();
    invalidConfig.logging.level = 'invalid' as any;

    const invalidResult = configManager.validate(invalidConfig);
    expect(invalidResult.success).toBe(false);
    if (!invalidResult.success) {
      // ConfigValidator returns specific error message
      expect(invalidResult.error.message).toContain('Invalid log level');
    }
  });

  it('should validate TTS engine enum values', () => {
    const validEngines = ['kokoro', 'chatterbox'];

    for (const engine of validEngines) {
      const config = createCustomTestConfig();
      config.tts.defaultEngine = engine as any;

      const result = configManager.validate(config);
      expect(result.success).toBe(true);
    }

    // Test invalid engine
    const invalidConfig = createCustomTestConfig();
    invalidConfig.tts.defaultEngine = 'invalid-engine' as any;

    const invalidResult = configManager.validate(invalidConfig);
    expect(invalidResult.success).toBe(false);
    if (!invalidResult.success) {
      // ConfigValidator returns specific error message
      expect(invalidResult.error.message).toContain('Invalid TTS engine');
    }
  });

  it('should validate output format enum values', () => {
    const validFormats = ['mp3', 'wav', 'm4a'];

    for (const format of validFormats) {
      const config = createCustomTestConfig();
      config.tts.outputFormat = format as any;

      const result = configManager.validate(config);
      expect(result.success).toBe(true);
    }

    // Test invalid format
    const invalidConfig = createCustomTestConfig();
    invalidConfig.tts.outputFormat = 'flac' as any;

    const invalidResult = configManager.validate(invalidConfig);
    expect(invalidResult.success).toBe(false);
    if (!invalidResult.success) {
      // ConfigValidator returns specific error message
      expect(invalidResult.error.message).toContain('Invalid output format');
    }
  });
});

describe('ConfigManager - Range Validation', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager();
  });

  it('should validate numeric ranges', () => {
    const config = createCustomTestConfig();

    // Test valid sample rates
    for (const sampleRate of [8000, 16000, 22050, 44100, 48000]) {
      config.tts.sampleRate = sampleRate;
      const result = configManager.validate(config);
      expect(result.success).toBe(true);
    }

    // Test invalid sample rate
    config.tts.sampleRate = -1;
    let result = configManager.validate(config);
    expect(result.success).toBe(false);

    config.tts.sampleRate = 1000000;
    result = configManager.validate(config);
    expect(result.success).toBe(false);

    // Reset sampleRate to valid value before testing quality
    config.tts.sampleRate = 22050;

    // Test valid quality range (values greater than MIN_QUALITY)
    for (const quality of [Number.EPSILON, 0.1, 0.5, 0.8, 1.0]) {
      config.tts.quality = quality;
      result = configManager.validate(config);
      expect(result.success).toBe(true);
    }

    // Test invalid quality
    config.tts.quality = -0.1;
    result = configManager.validate(config);
    expect(result.success).toBe(false);

    config.tts.quality = 1.1;
    result = configManager.validate(config);
    expect(result.success).toBe(false);
  });
});

describe('ConfigManager - Edge Cases', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager();
  });

  it('should handle null and undefined values', () => {
    const configWithNulls = {
      logging: null,
      tts: undefined,
      processing: {},
      cli: { showProgress: null, colors: undefined, debug: false },
      cache: { enabled: null, maxSize: undefined, ttl: 0 },
    } as any;

    const result = configManager.validate(configWithNulls);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });

  it('should handle empty objects (permissive validation)', () => {
    const result = configManager.validate({} as any);
    expect(result.success).toBe(true);
    // ConfigValidator is permissive - empty config passes validation
  });

  it('should handle arrays instead of objects (permissive validation)', () => {
    const arrayConfig = {
      logging: [],
      tts: [],
      processing: [],
      cli: [],
      cache: [],
    } as any;

    const result = configManager.validate(arrayConfig);
    expect(result.success).toBe(true);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });
});

describe('ConfigManager - Validation Error Messages', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager();
  });

  it('should provide clear error messages', () => {
    const invalidConfig = {
      logging: { level: 123 }, // Type error
      tts: { defaultEngine: 'invalid' }, // Enum error
    } as any;

    const result = configManager.validate(invalidConfig);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();

      // Check that error messages are descriptive
      expect(typeof result.error.message).toBe('string');
      expect(result.error.message.length).toBeGreaterThan(0);
    }
  });
});
