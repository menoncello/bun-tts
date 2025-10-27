import { describe, it, expect, beforeEach } from 'bun:test';
import { HelpCommand, ConsoleOutputWriter } from '../../../src/cli/commands/help-command';
import { createMockLogger, createTestCliContext } from '../di/test-utils';

function createMockOutputWriter() {
  return {
    write: (() => {
      const calls: Array<[string]> = [];
      const fn = (content: string) => {
        calls.push([content]);
      };
      fn.calls = calls;
      fn.mockClear = () => (calls.length = 0);
      fn.mockCalls = () => [...calls];
      return fn;
    })(),
  };
}

function clearAllMocks(mockLogger: any, mockOutputWriter: any) {
  mockLogger.info.mockClear();
  mockLogger.debug.mockClear();
  mockOutputWriter.write.mockClear();
}

function setupHelpCommand() {
  const mockLogger = createMockLogger();
  const mockOutputWriter = createMockOutputWriter();
  const helpCommand = new HelpCommand(mockLogger, mockOutputWriter);
  return { mockLogger, mockOutputWriter, helpCommand };
}

describe('HelpCommand Basic Display', () => {
  let mockLogger: any;
  let mockOutputWriter: any;
  let helpCommand: HelpCommand;
  let testContext: any;

  beforeEach(() => {
    const setup = setupHelpCommand();
    mockLogger = setup.mockLogger;
    mockOutputWriter = setup.mockOutputWriter;
    helpCommand = setup.helpCommand;
    testContext = createTestCliContext();
  });

  it('should display help message without verbose info', async () => {
    clearAllMocks(mockLogger, mockOutputWriter);

    await helpCommand.execute(testContext);

    expect(mockOutputWriter.write.calls).toHaveLength(1);
    expect(mockOutputWriter.write.calls[0][0]).toContain('bun-tts - Professional Audiobook Creation Tool');

    expect(mockLogger.info.calls).toHaveLength(1);
    expect(mockLogger.info.calls[0]).toEqual([
      'Help command executed',
      undefined,
    ]);
    expect(mockLogger.debug.calls).toHaveLength(0);
  });
});

describe('HelpCommand Verbose Display', () => {
  let mockLogger: any;
  let mockOutputWriter: any;
  let helpCommand: HelpCommand;

  beforeEach(() => {
    const setup = setupHelpCommand();
    mockLogger = setup.mockLogger;
    mockOutputWriter = setup.mockOutputWriter;
    helpCommand = setup.helpCommand;
  });

  it('should display help message with verbose info when verbose flag is true', async () => {
    const verboseContext = createTestCliContext({
      flags: { verbose: true },
    });

    clearAllMocks(mockLogger, mockOutputWriter);
    await helpCommand.execute(verboseContext);

    expect(mockOutputWriter.write.calls).toHaveLength(1);
    expect(mockOutputWriter.write.calls[0][0]).toContain('Verbose Information:');

    expect(mockLogger.info.calls).toHaveLength(0);
    expect(mockLogger.debug.calls).toHaveLength(1);
    expect(mockLogger.debug.calls[0]).toEqual([
      'Help command executed with verbose information',
      undefined,
    ]);
  });
});

describe('HelpCommand Dependency Usage', () => {
  let mockLogger: any;
  let mockOutputWriter: any;
  let helpCommand: HelpCommand;
  let testContext: any;

  beforeEach(() => {
    const setup = setupHelpCommand();
    mockLogger = setup.mockLogger;
    mockOutputWriter = setup.mockOutputWriter;
    helpCommand = setup.helpCommand;
    testContext = createTestCliContext();
  });

  it('should use injected dependencies correctly', async () => {
    clearAllMocks(mockLogger, mockOutputWriter);

    expect((helpCommand as any).logger).toBe(mockLogger);
    expect((helpCommand as any).outputWriter).toBe(mockOutputWriter);

    await helpCommand.execute(testContext);

    expect(mockOutputWriter.write.calls).toHaveLength(1);
    expect(mockLogger.info.calls).toHaveLength(1);
  });
});

describe('HelpCommand Constructor Validation', () => {
  let mockLogger: any;
  let mockOutputWriter: any;

  beforeEach(() => {
    mockLogger = createMockLogger();
    mockOutputWriter = createMockOutputWriter();
  });

  describe('Successful Construction', () => {
    it('should receive dependencies via constructor injection', () => {
      const helpCommand = new HelpCommand(mockLogger, mockOutputWriter);

      expect((helpCommand as any).logger).toBeDefined();
      expect((helpCommand as any).logger).toBe(mockLogger);
      expect((helpCommand as any).outputWriter).toBeDefined();
      expect((helpCommand as any).outputWriter).toBe(mockOutputWriter);
    });

    it('should work with default outputWriter when only logger provided', () => {
      const commandWithDefaultOutput = new HelpCommand(mockLogger);
      expect(commandWithDefaultOutput).toBeDefined();
      expect((commandWithDefaultOutput as any).outputWriter).toBeInstanceOf(ConsoleOutputWriter);
    });
  });

  describe('Error Scenarios', () => {
    it('should fail without logger dependency', () => {
      expect(() => {
        new HelpCommand(null as any, mockOutputWriter);
      }).toThrow('Logger is required for HelpCommand');
    });

    it('should fail without outputWriter dependency', () => {
      expect(() => {
        new HelpCommand(mockLogger, null as any);
      }).toThrow('OutputWriter is required for HelpCommand');
    });
  });
});
