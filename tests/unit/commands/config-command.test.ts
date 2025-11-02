import { describe, it, expect, beforeEach } from 'bun:test';
import { ConfigCommand } from '../../../src/cli/commands/config-command.js';
import { ConfigManager } from '../../../src/config/index.js';
import { success } from '../../../src/errors/index.js';
import {
  createMockLogger,
  createMockConfigManager,
  createMockOutputWriter,
  createTestCliContext,
} from '../di/test-utils';

// Shared test utilities
function setupCommand() {
  const mockLogger = createMockLogger() as any;
  const mockConfigManager =
    createMockConfigManager() as unknown as ConfigManager;
  const mockOutputWriter = createMockOutputWriter() as any;
  const configCommand = new ConfigCommand(
    mockLogger,
    mockConfigManager,
    mockOutputWriter
  );
  return { mockLogger, mockConfigManager, configCommand };
}

function clearMocks(mockLogger: any, mockConfigManager: any) {
  mockConfigManager.loadConfig.mockClear();
  mockConfigManager.createSampleConfig.mockClear();
  mockLogger.info.mockClear();
  mockLogger.error.mockClear();
}

describe('ConfigCommand Setup', () => {
  it('should receive logger, configManager, and outputWriter via DI', () => {
    const { mockLogger, mockConfigManager, configCommand } = setupCommand();

    expect((configCommand as any).logger).toBe(mockLogger);
    expect((configCommand as any).configManager).toBe(mockConfigManager);
    expect((configCommand as any).outputWriter).toBeDefined();
  });
});

describe('Config Show Action - Success', () => {
  let mockLogger: any;
  let mockConfigManager: any;
  let configCommand: ConfigCommand;

  beforeEach(() => {
    const setup = setupCommand();
    mockLogger = setup.mockLogger;
    mockConfigManager = setup.mockConfigManager;
    configCommand = setup.configCommand;
  });

  beforeEach(() => clearMocks(mockLogger, mockConfigManager));

  it('should display current configuration when config loads successfully', async () => {
    const mockConfig = {
      ttsEngine: 'kokoro',
      voiceSettings: { speed: 1.0, pitch: 1.0 },
    };
    mockConfigManager.loadConfig.mockResolvedValue = Promise.resolve(
      success(mockConfig)
    );

    const context = createTestCliContext({ args: ['config', 'show'] });
    await configCommand.execute(context);

    expect(mockConfigManager.loadConfig.calls).toHaveLength(1);
    expect(mockLogger.info.calls).toContainEqual([
      'Configuration displayed successfully',
      undefined,
    ]);
  });
});

describe('Config Show Action - Error', () => {
  let mockLogger: any;
  let mockConfigManager: any;
  let configCommand: ConfigCommand;

  beforeEach(() => {
    const setup = setupCommand();
    mockLogger = setup.mockLogger;
    mockConfigManager = setup.mockConfigManager;
    configCommand = setup.configCommand;
  });

  beforeEach(() => clearMocks(mockLogger, mockConfigManager));

  it('should log error when config loading fails', async () => {
    const mockError = new Error('Config file not found');
    mockConfigManager.loadConfig = async () => ({
      success: false,
      error: mockError,
    });

    const context = createTestCliContext({ args: ['config', 'show'] });
    await configCommand.execute(context);

    expect(mockLogger.error.calls).toContainEqual([
      'Failed to load configuration',
      {
        message: mockError.message,
        code: undefined,
        category: undefined,
        details: undefined,
      },
    ]);
  });
});

describe('Config Sample Action', () => {
  let mockLogger: any;
  let mockConfigManager: any;
  let configCommand: ConfigCommand;

  beforeEach(() => {
    const setup = setupCommand();
    mockLogger = setup.mockLogger;
    mockConfigManager = setup.mockConfigManager;
    configCommand = setup.configCommand;
  });

  beforeEach(() => clearMocks(mockLogger, mockConfigManager));

  it('should display sample configuration', async () => {
    const sampleConfig = '# Sample Configuration Content';
    mockConfigManager.createSampleConfig.mockReturnValue = sampleConfig;

    const context = createTestCliContext({ args: ['config', 'sample'] });
    await configCommand.execute(context);

    expect(mockConfigManager.createSampleConfig.calls).toHaveLength(1);
    expect(mockLogger.info.calls).toContainEqual([
      'Sample configuration displayed',
      undefined,
    ]);
  });
});

describe('Config Validate Action', () => {
  let mockLogger: any;
  let mockConfigManager: any;
  let configCommand: ConfigCommand;

  beforeEach(() => {
    const setup = setupCommand();
    mockLogger = setup.mockLogger;
    mockConfigManager = setup.mockConfigManager;
    configCommand = setup.configCommand;
  });

  beforeEach(() => clearMocks(mockLogger, mockConfigManager));

  describe('With Config Path', () => {
    it('should validate configuration successfully', async () => {
      mockConfigManager.loadConfig.mockResolvedValue = Promise.resolve(
        success({ valid: true })
      );

      const context = createTestCliContext({
        args: ['config', 'validate'],
        flags: { config: 'test.json' },
      });
      await configCommand.execute(context);

      expect(mockConfigManager.loadConfig.calls).toHaveLength(1);
      expect(mockLogger.info.calls.length).toBeGreaterThan(0);
    });
  });

  describe('Without Config Path', () => {
    it('should handle validation without config path', async () => {
      const context = createTestCliContext({ args: ['config', 'validate'] });
      await configCommand.execute(context);

      expect(mockConfigManager.loadConfig.calls).toHaveLength(0);
    });
  });
});

describe('ConfigCommand Integration', () => {
  let mockLogger: any;
  let mockConfigManager: any;
  let configCommand: ConfigCommand;

  beforeEach(() => {
    const setup = setupCommand();
    mockLogger = setup.mockLogger;
    mockConfigManager = setup.mockConfigManager;
    configCommand = setup.configCommand;
  });

  beforeEach(() => clearMocks(mockLogger, mockConfigManager));

  it('should use injected dependencies in all operations', async () => {
    mockConfigManager.loadConfig.mockResolvedValue = Promise.resolve(
      success({})
    );

    await configCommand.execute(createTestCliContext({ args: ['config', 'show'] }));
    await configCommand.execute(createTestCliContext({ args: ['config', 'sample'] }));

    expect(mockConfigManager.loadConfig.calls.length).toBeGreaterThan(0);
    expect(mockConfigManager.createSampleConfig.calls.length).toBeGreaterThan(
      0
    );
    expect(mockLogger.info.calls.length).toBeGreaterThanOrEqual(2);
  });
});

describe('ConfigCommand Error Handling', () => {
  let mockLogger: any;
  let mockConfigManager: any;
  let configCommand: ConfigCommand;

  beforeEach(() => {
    const setup = setupCommand();
    mockLogger = setup.mockLogger;
    mockConfigManager = setup.mockConfigManager;
    configCommand = setup.configCommand;
  });

  beforeEach(() => clearMocks(mockLogger, mockConfigManager));

  it('should handle unknown actions gracefully', async () => {
    const context = createTestCliContext({ args: ['config', 'unknown'] });
    await configCommand.execute(context);

    expect(mockLogger.error.calls).toContainEqual([
      'Unknown config action',
      { action: 'unknown' },
    ]);
  });
});
