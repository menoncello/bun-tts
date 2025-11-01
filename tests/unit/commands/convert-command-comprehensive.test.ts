import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import {
  ConvertCommand,
  type ConvertOptions,
} from '../../../src/cli/commands/convert-command';
import { ConfigurationError } from '../../../src/errors/configuration-error';
import { Ok, Err } from '../../../src/errors/result';
import type { CliContext } from '../../../src/types/index';
import { createMockLogger, createMockConfigManager } from '../di/test-utils';

describe('ConvertCommand Comprehensive Tests', () => {
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockConfigManager: ReturnType<typeof createMockConfigManager>;
  let mockConsole: {
    logs: string[];
    errors: string[];
    restore: () => void;
  };
  let command: ConvertCommand;

  beforeEach(() => {
    // Mock logger and config manager using existing utilities
    mockLogger = createMockLogger();
    mockConfigManager = createMockConfigManager();

    // Mock console
    const originalConsoleLog = globalThis.console.log;
    const originalConsoleError = globalThis.console.error;
    mockConsole = {
      logs: [],
      errors: [],
      restore: () => {
        globalThis.console.log = originalConsoleLog;
        globalThis.console.error = originalConsoleError;
      },
    };

    globalThis.console.log = (...args: any[]) => {
      mockConsole.logs.push(args.join(' '));
    };

    globalThis.console.error = (...args: any[]) => {
      mockConsole.errors.push(args.join(' '));
    };

    command = new ConvertCommand(mockLogger as any, mockConfigManager as any);
  });

  afterEach(() => {
    mockConsole.restore();
    clearMockLogger();
    clearMockConfigManager();
  });

  function clearMockLogger() {
    const loggerMethods = ['info', 'debug', 'error', 'warn', 'fatal', 'trace'];
    for (const method of loggerMethods) {
      const loggerMethod = mockLogger[method as keyof typeof mockLogger];
      if (
        loggerMethod &&
        typeof (loggerMethod as any).mockClear === 'function'
      ) {
        (loggerMethod as any).mockClear();
      }
    }
  }

  function clearMockConfigManager() {
    if (
      mockConfigManager.loadConfig &&
      typeof (mockConfigManager.loadConfig as any).mockClear === 'function'
    ) {
      (mockConfigManager.loadConfig as any).mockClear();
    }
  }

  describe('Constructor', () => {
    it('should create ConvertCommand instance with dependencies', () => {
      expect(command).toBeInstanceOf(ConvertCommand);
      expect(command).toBeDefined();
    });

    it('should store logger and config manager dependencies', () => {
      // Since these are private properties, we test behavior indirectly
      expect(command.describe).toBeDefined();
      expect(command.execute).toBeDefined();
      expect(command.validate).toBeDefined();
    });
  });

  describe('describe()', () => {
    it('should return command description', () => {
      const description = command.describe();
      expect(description).toBe(
        'Convert documents to audiobook format using text-to-speech synthesis'
      );
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
    });

    it('should contain relevant keywords', () => {
      const description = command.describe();
      expect(description.toLowerCase()).toContain('convert');
      expect(description.toLowerCase()).toContain('audiobook');
      expect(description.toLowerCase()).toContain('text-to-speech');
    });
  });

  describe('execute()', () => {
    const mockOptions: ConvertOptions = {
      inputFile: '/path/to/input.md',
      outputFile: '/path/to/output.mp3',
      format: 'mp3',
    };

    const mockCliContext: CliContext = {
      input: [mockOptions.inputFile],
      flags: {
        verbose: true,
        config: '/path/to/config.json',
      },
      logLevel: 'info',
    };

    it('should return successful Result for valid options', async () => {
      const result = await command.execute(mockOptions, mockCliContext);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });

    it('should log command start with options and context', async () => {
      await command.execute(mockOptions, mockCliContext);

      const calls = mockLogger.info.mockCalls();
      const startCall = calls.find(
        (call) => call[0] === 'Convert command started'
      );
      expect(startCall).toBeDefined();
      if (startCall) {
        expect(startCall[1]).toEqual({
          options: mockOptions,
          cliContext: mockCliContext,
        });
      }
    });

    it('should log completion message', async () => {
      await command.execute(mockOptions, mockCliContext);

      const calls = mockLogger.info.mockCalls();
      expect(calls.length).toBeGreaterThanOrEqual(2);
      const completionCall = calls.find(
        (call) =>
          call[0] === 'Convert command completed (placeholder implementation)'
      );
      expect(completionCall).toBeDefined();
    });

    it('should handle options without cliContext', async () => {
      const result = await command.execute(mockOptions);

      expect(result.success).toBe(true);
      const calls = mockLogger.info.mockCalls();
      const startCall = calls.find(
        (call) => call[0] === 'Convert command started'
      );
      expect(startCall).toBeDefined();
      if (startCall) {
        expect(startCall[1]).toEqual({
          options: mockOptions,
          cliContext: undefined,
        });
      }
    });

    it('should handle minimal options', async () => {
      const minimalOptions: ConvertOptions = {
        inputFile: '/path/to/input.md',
        outputFile: '/path/to/output.mp3',
      };

      const result = await command.execute(minimalOptions);

      expect(result.success).toBe(true);
    });

    it('should handle error and wrap in ConfigurationError', async () => {
      // Force an error by making the logger throw - override the mock
      const originalInfo = mockLogger.info;
      mockLogger.info = ((message: string, context?: any) => {
        if (message === 'Convert command started') {
          throw new Error('Test error');
        }
        return originalInfo(message, context);
      }) as any;

      const result = await command.execute(mockOptions, mockCliContext);

      expect(result.success).toBe(false);
      if (!result.success && result.error) {
        expect(result.error).toBeInstanceOf(ConfigurationError);
        expect(result.error.message).toContain(
          'Convert command failed: Test error'
        );
        expect(result.error.details).toEqual({
          options: mockOptions,
          cliContext: mockCliContext,
          error: expect.any(Error),
        });
      }

      // Restore original mock
      mockLogger.info = originalInfo;
    });

    it('should handle non-Error objects thrown', async () => {
      const originalInfo = mockLogger.info;
      mockLogger.info = ((message: string, context?: any) => {
        if (message === 'Convert command started') {
          throw 'String error';
        }
        return originalInfo(message, context);
      }) as any;

      const result = await command.execute(mockOptions, mockCliContext);

      expect(result.success).toBe(false);
      if (!result.success && result.error) {
        expect(result.error.message).toContain(
          'Convert command failed: String error'
        );
      }

      mockLogger.info = originalInfo;
    });

    it('should handle null/undefined thrown', async () => {
      const originalInfo = mockLogger.info;
      mockLogger.info = ((message: string, context?: any) => {
        if (message === 'Convert command started') {
          throw null;
        }
        return originalInfo(message, context);
      }) as any;

      const result = await command.execute(mockOptions, mockCliContext);

      expect(result.success).toBe(false);
      if (!result.success && result.error) {
        expect(result.error.message).toContain('Convert command failed: null');
      }

      mockLogger.info = originalInfo;
    });
  });

  describe('validate()', () => {
    it('should return success for valid options', async () => {
      const validOptions: ConvertOptions = {
        inputFile: '/path/to/input.md',
        outputFile: '/path/to/output.mp3',
      };

      const result = await command.validate(validOptions);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('should return error for missing inputFile', async () => {
      const invalidOptions: ConvertOptions = {
        inputFile: '',
        outputFile: '/path/to/output.mp3',
      };

      const result = await command.validate(invalidOptions);

      expect(result.success).toBe(false);
      if (!result.success && result.error) {
        expect(result.error).toBeInstanceOf(ConfigurationError);
        expect(result.error.message).toBe('Input file is required');
        expect(result.error.details).toEqual({ options: invalidOptions });
      }
    });

    it('should return error for whitespace-only inputFile', async () => {
      const invalidOptions: ConvertOptions = {
        inputFile: '   \t\n   ',
        outputFile: '/path/to/output.mp3',
      };

      const result = await command.validate(invalidOptions);

      expect(result.success).toBe(false);
      if (!result.success && result.error) {
        expect(result.error.message).toBe('Input file is required');
      }
    });

    it('should return error for missing outputFile', async () => {
      const invalidOptions: ConvertOptions = {
        inputFile: '/path/to/input.md',
        outputFile: '',
      };

      const result = await command.validate(invalidOptions);

      expect(result.success).toBe(false);
      if (!result.success && result.error) {
        expect(result.error).toBeInstanceOf(ConfigurationError);
        expect(result.error.message).toBe('Output file is required');
        expect(result.error.details).toEqual({ options: invalidOptions });
      }
    });

    it('should return error for whitespace-only outputFile', async () => {
      const invalidOptions: ConvertOptions = {
        inputFile: '/path/to/input.md',
        outputFile: '   \t\n   ',
      };

      const result = await command.validate(invalidOptions);

      expect(result.success).toBe(false);
      if (!result.success && result.error) {
        expect(result.error.message).toBe('Output file is required');
      }
    });

    it('should return error for both files missing', async () => {
      const invalidOptions: ConvertOptions = {
        inputFile: '',
        outputFile: '',
      };

      const result = await command.validate(invalidOptions);

      expect(result.success).toBe(false);
      if (!result.success && result.error) {
        expect(result.error.message).toBe('Input file is required');
      }
    });

    it('should handle validation errors and wrap them', async () => {
      // Mock the validation to throw an error by monkey-patching String.prototype.trim
      const originalTrim = String.prototype.trim;
      String.prototype.trim = function () {
        String.prototype.trim = originalTrim;
        throw new Error('Trim error');
      };

      const options: ConvertOptions = {
        inputFile: '/path/to/input.md',
        outputFile: '/path/to/output.mp3',
      };

      const result = await command.validate(options);

      expect(result.success).toBe(false);
      if (!result.success && result.error) {
        expect(result.error).toBeInstanceOf(ConfigurationError);
        expect(result.error.message).toContain('Validation failed: Trim error');
        expect(result.error.details).toEqual({
          options,
          error: expect.any(Error),
        });
      }
    });

    it('should handle options with additional properties', async () => {
      const optionsWithExtras: ConvertOptions = {
        inputFile: '/path/to/input.md',
        outputFile: '/path/to/output.mp3',
        format: 'mp3',
        engine: 'kokoro',
        voice: { speed: 1.2 },
        verbose: true,
        // Additional unknown property
        customOption: 'custom value',
      } as any;

      const result = await command.validate(optionsWithExtras);

      expect(result.success).toBe(true);
    });
  });

  describe('executeLegacy()', () => {
    const mockCliContext: CliContext = {
      input: ['/path/to/input.md'],
      flags: {
        verbose: true,
        config: '/path/to/config.json',
      },
      logLevel: 'info',
    };

    it('should execute without error', async () => {
      await expect(
        command.executeLegacy(mockCliContext)
      ).resolves.toBeUndefined();
    });

    it('should log command start with context details', async () => {
      await command.executeLegacy(mockCliContext);

      const calls = mockLogger.info.mockCalls();
      const startCall = calls.find(
        (call) => call[0] === 'Convert command started'
      );
      expect(startCall).toBeDefined();
      if (startCall) {
        expect(startCall[1]).toEqual({
          input: mockCliContext.input,
          verbose: mockCliContext.flags.verbose,
          configPath: mockCliContext.flags.config,
        });
      }
    });

    it('should display placeholder information to console', async () => {
      await command.executeLegacy(mockCliContext);

      const calls = mockLogger.info.mockCalls();
      const placeholderCall = calls.find(
        (call) =>
          call[0] === 'Convert command functionality not yet implemented'
      );
      expect(placeholderCall).toBeDefined();
      if (placeholderCall) {
        expect(placeholderCall[1]).toEqual({
          inputFile: mockCliContext.input[0],
          outputDir: undefined,
          format: undefined,
        });
      }
    });

    it('should handle context without config flag', async () => {
      const contextWithoutConfig: CliContext = {
        input: ['/path/to/input.md'],
        flags: {
          verbose: false,
        },
        logLevel: 'warn',
      };

      await command.executeLegacy(contextWithoutConfig);

      const calls = mockLogger.info.mockCalls();
      const startCall = calls.find(
        (call) => call[0] === 'Convert command started'
      );
      expect(startCall).toBeDefined();
      if (startCall) {
        expect(startCall[1]).toEqual({
          input: contextWithoutConfig.input,
          verbose: contextWithoutConfig.flags.verbose,
          configPath: undefined,
        });
      }
    });

    it('should load configuration when config flag is provided', async () => {
      const configPath = '/path/to/config.json';
      const contextWithConfig: CliContext = {
        input: ['/path/to/input.md'],
        flags: {
          config: configPath,
        },
        logLevel: 'info',
      };

      // Mock successful config loading
      const mockConfigResult = Ok({
        ttsEngine: 'kokoro',
        outputFormat: 'mp3' as const,
        sampleRate: 22050,
        channels: 1 as const,
        voiceSettings: {
          speed: 1.0,
          pitch: 0,
          volume: 1.0,
        },
      });

      const originalLoadConfig = mockConfigManager.loadConfig;
      mockConfigManager.loadConfig = ((...args: any[]) => {
        (mockConfigManager.loadConfig as any).calls?.push(args);
        return Promise.resolve(mockConfigResult);
      }) as any;
      (mockConfigManager.loadConfig as any).calls = (
        originalLoadConfig as any
      ).calls;
      (mockConfigManager.loadConfig as any).mockClear = (
        originalLoadConfig as any
      ).mockClear;
      (mockConfigManager.loadConfig as any).mockCalls = (
        originalLoadConfig as any
      ).mockCalls;

      await command.executeLegacy(contextWithConfig);

      const calls = (mockConfigManager.loadConfig as any).mockCalls();
      expect(calls).toHaveLength(1);
      expect(calls[0]).toEqual([{ configPath }]);
    });

    it('should log successful configuration loading', async () => {
      const configPath = '/path/to/config.json';
      const contextWithConfig: CliContext = {
        input: ['/path/to/input.md'],
        flags: {
          config: configPath,
        },
        logLevel: 'info',
      };

      const mockConfigResult = Ok({
        ttsEngine: 'kokoro',
        outputFormat: 'mp3' as const,
        sampleRate: 22050,
        channels: 1 as const,
        voiceSettings: {
          speed: 1.0,
          pitch: 0,
          volume: 1.0,
        },
      });

      // Override the loadConfig mock to return our specific result
      const originalLoadConfig2 = mockConfigManager.loadConfig;
      mockConfigManager.loadConfig = ((...args: any[]) => {
        (mockConfigManager.loadConfig as any).calls?.push(args);
        return Promise.resolve(mockConfigResult);
      }) as any;
      (mockConfigManager.loadConfig as any).calls = (
        originalLoadConfig2 as any
      ).calls;
      (mockConfigManager.loadConfig as any).mockClear = (
        originalLoadConfig2 as any
      ).mockClear;
      (mockConfigManager.loadConfig as any).mockCalls = (
        originalLoadConfig2 as any
      ).mockCalls;

      await command.executeLegacy(contextWithConfig);

      const debugCalls = (mockLogger.debug as any).mockCalls();
      const loadDebugCall = debugCalls.find(
        (call: any) => call[0] === 'Loading configuration'
      );
      expect(loadDebugCall).toBeDefined();
      if (loadDebugCall) {
        expect(loadDebugCall[1]).toEqual({ configPath });
      }

      const infoCalls = mockLogger.info.mockCalls();
      const successCall = infoCalls.find(
        (call) => call[0] === 'Configuration loaded successfully'
      );
      expect(successCall).toBeDefined();
    });

    it('should handle configuration loading failure', async () => {
      const configPath = '/path/to/invalid.json';
      const contextWithConfig: CliContext = {
        input: ['/path/to/input.md'],
        flags: {
          config: configPath,
        },
        logLevel: 'info',
      };

      const mockConfigError = new ConfigurationError('Config file not found', {
        configPath,
      });
      const mockConfigResult = Err(mockConfigError);

      // Override the loadConfig mock to return our error result
      const originalLoadConfig3 = mockConfigManager.loadConfig;
      mockConfigManager.loadConfig = ((...args: any[]) => {
        (mockConfigManager.loadConfig as any).calls?.push(args);
        return Promise.resolve(mockConfigResult);
      }) as any;
      (mockConfigManager.loadConfig as any).calls = (
        originalLoadConfig3 as any
      ).calls;
      (mockConfigManager.loadConfig as any).mockClear = (
        originalLoadConfig3 as any
      ).mockClear;
      (mockConfigManager.loadConfig as any).mockCalls = (
        originalLoadConfig3 as any
      ).mockCalls;

      await command.executeLegacy(contextWithConfig);

      const errorCalls = (mockLogger.error as any).mockCalls();
      const errorCall = errorCalls.find(
        (call: any) => call[0] === 'Failed to load configuration'
      );
      expect(errorCall).toBeDefined();
      if (errorCall) {
        expect(errorCall[1]).toEqual({
          message: mockConfigError.message,
          code: mockConfigError.code,
          category: mockConfigError.category,
          details: mockConfigError.details,
        });
      }
    });

    it('should log completion message', async () => {
      await command.executeLegacy(mockCliContext);

      const calls = mockLogger.info.mockCalls();
      const completionCall = calls.find(
        (call) =>
          call[0] === 'Convert command completed (placeholder implementation)'
      );
      expect(completionCall).toBeDefined();
    });

    it('should handle minimal context', async () => {
      const minimalContext: CliContext = {
        input: ['/path/to/input.md'],
        flags: {},
        logLevel: 'error',
      };

      await command.executeLegacy(minimalContext);

      const calls = mockLogger.info.mockCalls();
      const startCall = calls.find(
        (call) => call[0] === 'Convert command started'
      );
      expect(startCall).toBeDefined();
      if (startCall) {
        expect(startCall[1]).toEqual({
          input: minimalContext.input,
          verbose: undefined,
          configPath: undefined,
        });
      }
    });
  });

  describe('Integration between methods', () => {
    it('should validate options before execution in typical workflow', async () => {
      const validOptions: ConvertOptions = {
        inputFile: '/path/to/input.md',
        outputFile: '/path/to/output.mp3',
      };

      // First validate
      const validationResult = await command.validate(validOptions);
      expect(validationResult.success).toBe(true);

      // Then execute if validation passed
      if (validationResult.success) {
        const executionResult = await command.execute(validOptions);
        expect(executionResult.success).toBe(true);
      }
    });

    it('should not execute when validation fails', async () => {
      const invalidOptions: ConvertOptions = {
        inputFile: '',
        outputFile: '/path/to/output.mp3',
      };

      const validationResult = await command.validate(invalidOptions);
      expect(validationResult.success).toBe(false);

      // In real usage, execution should not proceed when validation fails
      if (!validationResult.success && validationResult.error) {
        expect(validationResult.error.message).toBe('Input file is required');
      }
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle very long file paths', async () => {
      const longPath = `${'/very/long/path/that/exceeds/normal/filesystem/limits/'.repeat(
        10
      )}input.md`;
      const options: ConvertOptions = {
        inputFile: longPath,
        outputFile: longPath.replace('.md', '.mp3'),
      };

      const validationResult = await command.validate(options);
      expect(validationResult.success).toBe(true);

      const executionResult = await command.execute(options);
      expect(executionResult.success).toBe(true);
    });

    it('should handle special characters in file paths', async () => {
      const specialPath = '/path/with-special chars & symbols (2024)/input.md';
      const options: ConvertOptions = {
        inputFile: specialPath,
        outputFile: specialPath.replace('.md', '.mp3'),
      };

      const validationResult = await command.validate(options);
      expect(validationResult.success).toBe(true);

      const executionResult = await command.execute(options);
      expect(executionResult.success).toBe(true);
    });

    it('should handle Unicode characters in file paths', async () => {
      const unicodePath = '/path/with-ñáéíóú-测试/input.md';
      const options: ConvertOptions = {
        inputFile: unicodePath,
        outputFile: unicodePath.replace('.md', '.mp3'),
      };

      const validationResult = await command.validate(options);
      expect(validationResult.success).toBe(true);

      const executionResult = await command.execute(options);
      expect(executionResult.success).toBe(true);
    });

    it('should handle empty object as cliContext', async () => {
      const options: ConvertOptions = {
        inputFile: '/path/to/input.md',
        outputFile: '/path/to/output.mp3',
      };

      const emptyContext = {} as CliContext;

      const executionResult = await command.execute(options, emptyContext);
      expect(executionResult.success).toBe(true);

      const calls = mockLogger.info.mockCalls();
      const startCall = calls.find(
        (call) => call[0] === 'Convert command started'
      );
      expect(startCall).toBeDefined();
      if (startCall) {
        expect(startCall[1]).toEqual({
          options,
          cliContext: emptyContext,
        });
      }
    });

    it('should handle null cliContext', async () => {
      const options: ConvertOptions = {
        inputFile: '/path/to/input.md',
        outputFile: '/path/to/output.mp3',
      };

      const executionResult = await command.execute(options, null as any);
      expect(executionResult.success).toBe(true);

      const calls = mockLogger.info.mockCalls();
      const startCall = calls.find(
        (call) => call[0] === 'Convert command started'
      );
      expect(startCall).toBeDefined();
      if (startCall) {
        expect(startCall[1]).toEqual({
          options,
          cliContext: null,
        });
      }
    });
  });

  describe('Error recovery and resilience', () => {
    it('should handle multiple sequential errors gracefully', async () => {
      // Force an error by overriding the logger
      const originalInfo = mockLogger.info;
      mockLogger.info = ((message: string, context?: any) => {
        if (message === 'Convert command started') {
          throw new Error('Sequential error');
        }
        return originalInfo(message, context);
      }) as any;

      const options: ConvertOptions = {
        inputFile: '/path/to/input.md',
        outputFile: '/path/to/output.mp3',
      };

      // Execute multiple times
      for (let i = 0; i < 3; i++) {
        const result = await command.execute(options);
        expect(result.success).toBe(false);
        if (!result.success && result.error) {
          expect(result.error.message).toContain('Sequential error');
        }
      }

      // Restore original mock
      mockLogger.info = originalInfo;
    });

    it('should maintain logger state across multiple calls', async () => {
      const options: ConvertOptions = {
        inputFile: '/path/to/input.md',
        outputFile: '/path/to/output.mp3',
      };

      // Execute multiple successful calls
      for (let i = 0; i < 3; i++) {
        const result = await command.execute(options);
        expect(result.success).toBe(true);
      }

      // Verify all calls were logged
      expect(mockLogger.info.mockCalls().length).toBeGreaterThanOrEqual(6); // 2 calls per execution (start + completion)
    });

    it('should handle configuration manager failures gracefully', async () => {
      const context: CliContext = {
        input: ['/path/to/input.md'],
        flags: {
          config: '/path/to/config.json',
        },
        logLevel: 'info',
      };

      // Mock config manager to return an error result
      const mockConfigError = new ConfigurationError('Config manager failure', {
        configPath: '/path/to/config.json',
      });
      const mockConfigResult = Err(mockConfigError);

      const originalLoadConfig4 = mockConfigManager.loadConfig;
      mockConfigManager.loadConfig = ((...args: any[]) => {
        (mockConfigManager.loadConfig as any).calls?.push(args);
        return Promise.resolve(mockConfigResult);
      }) as any;
      (mockConfigManager.loadConfig as any).calls = (
        originalLoadConfig4 as any
      ).calls;
      (mockConfigManager.loadConfig as any).mockClear = (
        originalLoadConfig4 as any
      ).mockClear;
      (mockConfigManager.loadConfig as any).mockCalls = (
        originalLoadConfig4 as any
      ).mockCalls;

      // Should not throw, but handle the error gracefully
      await expect(command.executeLegacy(context)).resolves.toBeUndefined();

      // Error should be logged
      const errorCalls = mockLogger.error.mockCalls();
      const errorCall = errorCalls.find(
        (call) => call[0] === 'Failed to load configuration'
      );
      expect(errorCall).toBeDefined();
    });
  });
});
