import { describe, it, expect, beforeEach } from 'bun:test';
import { VersionCommand } from '../../../src/cli/commands/version-command.js';
import type { CliFlags } from '../../../src/types/index.js';
import {
  createMockLogger,
  createMockOutputWriter,
  createTestCliContext,
} from '../di/test-utils';

// Test helper functions
function setupVersionCommand() {
  const mockLogger = createMockLogger() as any;
  const mockOutputWriter = createMockOutputWriter() as any;
  const versionCommand = new VersionCommand(mockLogger, mockOutputWriter);
  return { mockLogger, mockOutputWriter, versionCommand };
}

function clearAllMocks(mockLogger: any, mockOutputWriter: any) {
  mockLogger.info.mockClear();
  mockLogger.debug.mockClear();
  mockLogger.error.mockClear();
  mockOutputWriter.write.mockClear();
}

describe('VersionCommand Constructor and Dependencies', () => {
  let mockLogger: any;
  let mockOutputWriter: any;

  beforeEach(() => {
    mockLogger = createMockLogger();
    mockOutputWriter = createMockOutputWriter();
  });

  describe('Successful Construction', () => {
    it('should receive logger and outputWriter via dependency injection', () => {
      const versionCommand = new VersionCommand(mockLogger, mockOutputWriter);

      expect((versionCommand as any).logger).toBeDefined();
      expect((versionCommand as any).logger).toBe(mockLogger);
      expect((versionCommand as any).outputWriter).toBeDefined();
      expect((versionCommand as any).outputWriter).toBe(mockOutputWriter);
    });

    it('should create instance without throwing errors', () => {
      const versionCommand = new VersionCommand(mockLogger, mockOutputWriter);
      expect(versionCommand).toBeDefined();
      expect(versionCommand).toBeInstanceOf(VersionCommand);
    });
  });

  describe('Constructor Edge Cases', () => {
    it('should accept null logger (TypeScript allows, runtime may handle)', () => {
      const versionCommand = new VersionCommand(null as any, mockOutputWriter);
      expect(versionCommand).toBeDefined();
      expect((versionCommand as any).logger).toBeNull();
    });

    it('should accept null outputWriter (TypeScript allows, runtime may handle)', () => {
      const versionCommand = new VersionCommand(mockLogger, null as any);
      expect(versionCommand).toBeDefined();
      expect((versionCommand as any).outputWriter).toBeNull();
    });

    it('should accept undefined logger (TypeScript allows, runtime may handle)', () => {
      const versionCommand = new VersionCommand(
        undefined as any,
        mockOutputWriter
      );
      expect(versionCommand).toBeDefined();
      expect((versionCommand as any).logger).toBeUndefined();
    });

    it('should accept undefined outputWriter (TypeScript allows, runtime may handle)', () => {
      const versionCommand = new VersionCommand(mockLogger, undefined as any);
      expect(versionCommand).toBeDefined();
      expect((versionCommand as any).outputWriter).toBeUndefined();
    });
  });
});

describe('VersionCommand Basic Execution', () => {
  let mockLogger: any;
  let mockOutputWriter: any;
  let versionCommand: VersionCommand;
  let testContext: any;

  beforeEach(() => {
    const setup = setupVersionCommand();
    mockLogger = setup.mockLogger;
    mockOutputWriter = setup.mockOutputWriter;
    versionCommand = setup.versionCommand;
    testContext = createTestCliContext();
  });

  beforeEach(() => clearAllMocks(mockLogger, mockOutputWriter));

  it('should execute version command successfully', async () => {
    await versionCommand.execute(testContext);

    expect(mockOutputWriter.write.calls).toHaveLength(1);
    expect(mockLogger.info.calls).toHaveLength(1);

    // Verify version text structure
    const versionText = mockOutputWriter.write.calls[0][0];
    expect(versionText).toContain('bun-tts version 0.1.0');
    expect(versionText).toContain('Build Information:');
    expect(versionText).toContain('Node.js:');
    expect(versionText).toContain('Platform:');
    expect(versionText).toContain('Architecture:');
    expect(versionText).toContain('Built:');

    // Verify logging
    expect(mockLogger.info.calls[0]).toEqual([
      'Version command executed',
      {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    ]);
  });

  it('should display current process information correctly', async () => {
    await versionCommand.execute(testContext);

    const versionText = mockOutputWriter.write.calls[0][0];
    expect(versionText).toContain(`Node.js: ${process.version}`);
    expect(versionText).toContain(`Platform: ${process.platform}`);
    expect(versionText).toContain(`Architecture: ${process.arch}`);

    // Verify build timestamp is recent (within last minute)
    const timestampMatch = versionText.match(/Built: (.+)/);
    expect(timestampMatch).toBeTruthy();
    if (timestampMatch) {
      const buildTime = new Date(timestampMatch[1]);
      const now = new Date();
      const timeDiff = Math.abs(now.getTime() - buildTime.getTime());
      expect(timeDiff).toBeLessThan(60000); // Less than 1 minute
    }
  });

  it('should ignore context parameters in execution', async () => {
    const complexContext = createTestCliContext({
      args: ['--verbose'],
      flags: { verbose: true, config: 'test.json' },
      input: ['extra-args'],
    });

    await versionCommand.execute(complexContext);

    // Should behave the same as basic execution
    expect(mockOutputWriter.write.calls).toHaveLength(1);
    expect(mockLogger.info.calls).toHaveLength(1);
  });
});

describe('VersionCommand Output Writer Functionality', () => {
  let mockLogger: any;
  let mockOutputWriter: any;
  let versionCommand: VersionCommand;

  beforeEach(() => {
    const setup = setupVersionCommand();
    mockLogger = setup.mockLogger;
    mockOutputWriter = setup.mockOutputWriter;
    versionCommand = setup.versionCommand;
  });

  beforeEach(() => clearAllMocks(mockLogger, mockOutputWriter));

  it('should use injected outputWriter correctly', async () => {
    const context = createTestCliContext();
    await versionCommand.execute(context);

    expect((versionCommand as any).outputWriter).toBe(mockOutputWriter);
    expect(mockOutputWriter.write.calls).toHaveLength(1);
  });

  it('should call outputWriter.write exactly once', async () => {
    const context = createTestCliContext();
    await versionCommand.execute(context);

    expect(mockOutputWriter.write.calls).toHaveLength(1);
  });

  it('should pass version text as string to outputWriter', async () => {
    const context = createTestCliContext();
    await versionCommand.execute(context);

    const [versionText] = mockOutputWriter.write.calls[0];
    expect(typeof versionText).toBe('string');
    expect(versionText.length).toBeGreaterThan(0);
  });

  it('should write complete version information in correct format', async () => {
    const context = createTestCliContext();
    await versionCommand.execute(context);

    const versionText = mockOutputWriter.write.calls[0][0];

    // Check for expected sections and formatting
    expect(versionText).toMatch(/^bun-tts version 0\.1\.0\s*$/m);
    expect(versionText).toMatch(/^Build Information:\s*$/m);
    expect(versionText).toMatch(/Node\.js:/);
    expect(versionText).toMatch(/Platform:/);
    expect(versionText).toMatch(/Architecture:/);
    expect(versionText).toMatch(/Built:/);
  });
});

describe('VersionCommand Logging Functionality', () => {
  let mockLogger: any;
  let mockOutputWriter: any;
  let versionCommand: VersionCommand;

  beforeEach(() => {
    const setup = setupVersionCommand();
    mockLogger = setup.mockLogger;
    mockOutputWriter = setup.mockOutputWriter;
    versionCommand = setup.versionCommand;
  });

  beforeEach(() => clearAllMocks(mockLogger, mockOutputWriter));

  it('should use injected logger correctly', async () => {
    const context = createTestCliContext();
    await versionCommand.execute(context);

    expect((versionCommand as any).logger).toBe(mockLogger);
    expect(mockLogger.info.calls).toHaveLength(1);
  });

  it('should log execution with correct context information', async () => {
    const context = createTestCliContext();
    await versionCommand.execute(context);

    expect(mockLogger.info.calls[0]).toEqual([
      'Version command executed',
      {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    ]);
  });

  it('should log only once per execution', async () => {
    const context = createTestCliContext();
    await versionCommand.execute(context);

    expect(mockLogger.info.calls).toHaveLength(1);
    expect(mockLogger.debug.calls).toHaveLength(0);
    expect(mockLogger.error.calls).toHaveLength(0);
    expect(mockLogger.warn.calls).toHaveLength(0);
    expect(mockLogger.fatal.calls).toHaveLength(0);
  });

  it('should not log debug messages during normal execution', async () => {
    const context = createTestCliContext();
    await versionCommand.execute(context);

    expect(mockLogger.debug.calls).toHaveLength(0);
  });
});

describe('VersionCommand Context Handling', () => {
  let mockLogger: any;
  let mockOutputWriter: any;
  let versionCommand: VersionCommand;

  beforeEach(() => {
    const setup = setupVersionCommand();
    mockLogger = setup.mockLogger;
    mockOutputWriter = setup.mockOutputWriter;
    versionCommand = setup.versionCommand;
  });

  beforeEach(() => clearAllMocks(mockLogger, mockOutputWriter));

  it('should handle empty context', async () => {
    const emptyContext = {} as any;
    await versionCommand.execute(emptyContext);

    expect(mockOutputWriter.write.calls).toHaveLength(1);
    expect(mockLogger.info.calls).toHaveLength(1);
  });

  it('should handle null context', async () => {
    const nullContext = null as any;
    await versionCommand.execute(nullContext);

    expect(mockOutputWriter.write.calls).toHaveLength(1);
    expect(mockLogger.info.calls).toHaveLength(1);
  });

  it('should handle undefined context', async () => {
    const undefinedContext = undefined as any;
    await versionCommand.execute(undefinedContext);

    expect(mockOutputWriter.write.calls).toHaveLength(1);
    expect(mockLogger.info.calls).toHaveLength(1);
  });

  it('should handle context with various flag combinations', async () => {
    const contextVariations = [
      createTestCliContext({ flags: { verbose: true } }),
      createTestCliContext({ flags: { verbose: false } }),
      createTestCliContext({ flags: { config: 'test.json' } }),
      createTestCliContext({ flags: { help: true } }),
      createTestCliContext({ flags: { version: true } }),
      createTestCliContext({ flags: { output: '/tmp' } }),
    ];

    for (const context of contextVariations) {
      clearAllMocks(mockLogger, mockOutputWriter);
      await versionCommand.execute(context);

      expect(mockOutputWriter.write.calls).toHaveLength(1);
      expect(mockLogger.info.calls).toHaveLength(1);
    }
  });

  it('should handle context with input arguments', async () => {
    const contextWithInput = createTestCliContext({
      input: ['--help', '--verbose'],
      args: ['extra', 'args'],
    });

    await versionCommand.execute(contextWithInput);

    expect(mockOutputWriter.write.calls).toHaveLength(1);
    expect(mockLogger.info.calls).toHaveLength(1);
  });
});

describe('VersionCommand Multiple Executions', () => {
  let mockLogger: any;
  let mockOutputWriter: any;
  let versionCommand: VersionCommand;

  beforeEach(() => {
    const setup = setupVersionCommand();
    mockLogger = setup.mockLogger;
    mockOutputWriter = setup.mockOutputWriter;
    versionCommand = setup.versionCommand;
  });

  beforeEach(() => clearAllMocks(mockLogger, mockOutputWriter));

  it('should handle multiple executions with same context', async () => {
    const context = createTestCliContext();

    await versionCommand.execute(context);
    await versionCommand.execute(context);
    await versionCommand.execute(context);

    expect(mockOutputWriter.write.calls).toHaveLength(3);
    expect(mockLogger.info.calls).toHaveLength(3);

    // Verify all executions logged the same information
    for (let i = 0; i < 3; i++) {
      expect(mockLogger.info.calls[i]).toEqual([
        'Version command executed',
        {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
        },
      ]);
    }
  });

  it('should handle multiple executions with different contexts', async () => {
    const contexts = [
      createTestCliContext({ flags: { verbose: true } }),
      createTestCliContext({ flags: { config: 'test.json' } }),
      createTestCliContext({ input: ['args'] }),
    ];

    for (const context of contexts) {
      await versionCommand.execute(context);
    }

    expect(mockOutputWriter.write.calls).toHaveLength(3);
    expect(mockLogger.info.calls).toHaveLength(3);
  });

  it('should generate consistent version text across multiple executions', async () => {
    const context = createTestCliContext();

    await versionCommand.execute(context);
    const firstVersionText = mockOutputWriter.write.calls[0][0];

    clearAllMocks(mockLogger, mockOutputWriter);

    await versionCommand.execute(context);
    const secondVersionText = mockOutputWriter.write.calls[0][0];

    expect(firstVersionText).toBe(secondVersionText);
  });
});

describe('VersionCommand Edge Cases', () => {
  let mockLogger: any;
  let mockOutputWriter: any;
  let versionCommand: VersionCommand;

  beforeEach(() => {
    const setup = setupVersionCommand();
    mockLogger = setup.mockLogger;
    mockOutputWriter = setup.mockOutputWriter;
    versionCommand = setup.versionCommand;
  });

  beforeEach(() => clearAllMocks(mockLogger, mockOutputWriter));

  it('should handle process properties being undefined', async () => {
    // Save original process properties
    const originalVersion = process.version;
    const originalPlatform = process.platform;
    const originalArch = process.arch;

    try {
      // Temporarily modify process properties
      (process as any).version = undefined;
      (process as any).platform = undefined;
      (process as any).arch = undefined;

      const context = createTestCliContext();
      await versionCommand.execute(context);

      expect(mockOutputWriter.write.calls).toHaveLength(1);
      expect(mockLogger.info.calls).toHaveLength(1);

      // Version text should contain undefined values
      const versionText = mockOutputWriter.write.calls[0][0];
      expect(versionText).toContain('Node.js: undefined');
      expect(versionText).toContain('Platform: undefined');
      expect(versionText).toContain('Architecture: undefined');
    } finally {
      // Restore original process properties
      (process as any).version = originalVersion;
      (process as any).platform = originalPlatform;
      (process as any).arch = originalArch;
    }
  });

  it('should handle Date constructor throwing error', async () => {
    // Save original Date constructor
    const originalDate = global.Date;

    try {
      // Override Date constructor to throw error
      global.Date = class extends Date {
        constructor() {
          super();
          throw new Error('Date constructor failed');
        }
      } as any;

      const context = createTestCliContext();

      // Should handle the error gracefully
      await expect(versionCommand.execute(context)).rejects.toThrow(
        'Date constructor failed'
      );
    } finally {
      // Restore original Date constructor
      global.Date = originalDate;
    }
  });
});

describe('VersionCommand Integration Scenarios', () => {
  let mockLogger: any;
  let mockOutputWriter: any;
  let versionCommand: VersionCommand;

  beforeEach(() => {
    const setup = setupVersionCommand();
    mockLogger = setup.mockLogger;
    mockOutputWriter = setup.mockOutputWriter;
    versionCommand = setup.versionCommand;
  });

  beforeEach(() => clearAllMocks(mockLogger, mockOutputWriter));

  it('should work correctly in realistic CLI scenario', async () => {
    // Simulate realistic CLI context
    const cliContext = {
      input: ['version'],
      flags: {
        verbose: false,
        config: undefined,
        help: false,
        version: true,
      } as CliFlags,
      logLevel: 'info' as const,
      command: 'version',
      workingDirectory: '/Users/test/project',
    };

    await versionCommand.execute(cliContext);

    expect(mockOutputWriter.write.calls).toHaveLength(1);
    expect(mockLogger.info.calls).toHaveLength(1);

    const versionText = mockOutputWriter.write.calls[0][0];
    expect(versionText).toContain('bun-tts version 0.1.0');
    expect(versionText).toContain('Build Information:');
  });

  it('should handle concurrent executions', async () => {
    const context = createTestCliContext();

    // Execute concurrently
    const promises = [
      versionCommand.execute(context),
      versionCommand.execute(context),
      versionCommand.execute(context),
    ];

    await Promise.all(promises);

    expect(mockOutputWriter.write.calls).toHaveLength(3);
    expect(mockLogger.info.calls).toHaveLength(3);
  });

  it('should maintain dependency injection integrity across multiple executions', async () => {
    const context = createTestCliContext();

    // Execute multiple times
    await versionCommand.execute(context);
    await versionCommand.execute(context);

    // Dependencies should remain the same
    expect((versionCommand as any).logger).toBe(mockLogger);
    expect((versionCommand as any).outputWriter).toBe(mockOutputWriter);

    // Mocks should have been called correctly
    expect(mockLogger.info.calls).toHaveLength(2);
    expect(mockOutputWriter.write.calls).toHaveLength(2);
  });
});
