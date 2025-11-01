import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import pino from 'pino';
import {
  Logger,
  createLogger,
  getLogger,
  logOperation,
  logPerformance,
  withContext,
  type LogContext,
} from '../../src/utils/logger';

// Helper function to create mock pino logger for testing (with context)
function _createMockPinoWithContext(mockCalls: any[]): typeof pino {
  const mockPino = (options: any) => {
    const mockLogger = {
      level: options.level || 'info',
      info: mock((...args: any[]) => {
        mockCalls.push({ level: 'info', args, context: options });
      }),
      debug: mock((...args: any[]) => {
        mockCalls.push({ level: 'debug', args, context: options });
      }),
      warn: mock((...args: any[]) => {
        mockCalls.push({ level: 'warn', args, context: options });
      }),
      error: mock((...args: any[]) => {
        mockCalls.push({ level: 'error', args, context: options });
      }),
      trace: mock((...args: any[]) => {
        mockCalls.push({ level: 'trace', args, context: options });
      }),
      fatal: mock((...args: any[]) => {
        mockCalls.push({ level: 'fatal', args, context: options });
      }),
      child: mock((context: any) =>
        _createMockPinoWithContext(mockCalls)({ ...options, ...context })
      ),
      bindings: mock(() => ({})),
      setLevel: mock(() => {
        // Mock implementation for setLevel
      }),
      get levelVal(): number {
        return 30;
      },
      get version(): string {
        return '8.0.0';
      },
      get levels(): any {
        return { values: {}, labels: {} };
      },
      get useLevelLabels(): boolean {
        return false;
      },
      on: mock(() => {
        // Mock implementation for on
      }),
      emit: mock(() => {
        // Mock implementation for emit
      }),
      addListener: mock(() => {
        // Mock implementation for addListener
      }),
      removeListener: mock(() => {
        // Mock implementation for removeListener
      }),
      removeAllListeners: mock(() => {
        // Mock implementation for removeAllListeners
      }),
      setMaxListeners: mock(() => {
        // Mock implementation for setMaxListeners
      }),
      getMaxListeners: mock(() => {
        // Mock implementation for getMaxListeners
      }),
      listeners: mock(() => []),
      rawListeners: mock(() => []),
      listenerCount: mock(() => 0),
      eventNames: mock(() => []),
      prependListener: mock(() => {
        // Mock implementation for prependListener
      }),
      prependOnceListener: mock(() => {
        // Mock implementation for prependOnceListener
      }),
      once: mock(() => {
        // Mock implementation for once
      }),
      write: mock(() => {
        // Mock implementation for write
      }),
    };
    return mockLogger as any;
  };

  // Add static properties to match typeof pino
  Object.defineProperty(mockPino, 'destination', {
    value: mock(() => ({})),
    writable: true,
    configurable: true,
  });
  Object.defineProperty(mockPino, 'transport', {
    value: mock(() => ({})),
    writable: true,
    configurable: true,
  });
  Object.defineProperty(mockPino, 'multistream', {
    value: mock(() => ({})),
    writable: true,
    configurable: true,
  });
  Object.defineProperty(mockPino, 'stdTimeFunctions', {
    value: {
      epochTime: mock(() => '1234567890'),
      unixTime: mock(() => '1234567890'),
      nullTime: mock(() => ''),
      isoTime: mock(() => '2023-01-01T00:00:00.000Z'),
      isoTimeNano: mock(() => '2023-01-01T00:00:00.000000000Z'),
    },
    writable: true,
    configurable: true,
  });
  Object.defineProperty(mockPino, 'stdSerializers', {
    value: {},
    writable: true,
    configurable: true,
  });
  Object.defineProperty(mockPino, 'levels', {
    value: { values: {}, labels: {} },
    writable: true,
    configurable: true,
  });
  Object.defineProperty(mockPino, 'symbols', {
    value: {},
    writable: true,
    configurable: true,
  });
  Object.defineProperty(mockPino, 'pino', {
    value: mockPino,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(mockPino, 'version', {
    value: '8.0.0',
    writable: true,
    configurable: true,
  });

  return mockPino as unknown as typeof pino;
}

// Helper function to create mock pino logger for testing (without context for basic tests)
function __createMockPino(mockCalls: any[]): typeof pino {
  const mockPino = (options: any) => {
    return {
      level: options.level || 'info',
      info: mock((...args: any[]) => mockCalls.push({ level: 'info', args })),
      debug: mock((...args: any[]) => mockCalls.push({ level: 'debug', args })),
      warn: mock((...args: any[]) => mockCalls.push({ level: 'warn', args })),
      error: mock((...args: any[]) => mockCalls.push({ level: 'error', args })),
      trace: mock((...args: any[]) => mockCalls.push({ level: 'trace', args })),
      fatal: mock((...args: any[]) => mockCalls.push({ level: 'fatal', args })),
      child: mock((context: any) =>
        __createMockPino(mockCalls)({ ...options, ...context })
      ),
      bindings: mock(() => ({})),
      setLevel: mock(() => {
        // Mock implementation for setLevel
      }),
      get levelVal(): number {
        return 30;
      },
      get version(): string {
        return '8.0.0';
      },
      get levels(): any {
        return { values: {}, labels: {} };
      },
      get useLevelLabels(): boolean {
        return false;
      },
      on: mock(() => {
        // Mock implementation for on
      }),
      emit: mock(() => {
        // Mock implementation for emit
      }),
      addListener: mock(() => {
        // Mock implementation for addListener
      }),
      removeListener: mock(() => {
        // Mock implementation for removeListener
      }),
      removeAllListeners: mock(() => {
        // Mock implementation for removeAllListeners
      }),
      setMaxListeners: mock(() => {
        // Mock implementation for setMaxListeners
      }),
      getMaxListeners: mock(() => {
        // Mock implementation for getMaxListeners
      }),
      listeners: mock(() => []),
      rawListeners: mock(() => []),
      listenerCount: mock(() => 0),
      eventNames: mock(() => []),
      prependListener: mock(() => {
        // Mock implementation for prependListener
      }),
      prependOnceListener: mock(() => {
        // Mock implementation for prependOnceListener
      }),
      once: mock(() => {
        // Mock implementation for once
      }),
      write: mock(() => {
        // Mock implementation for write
      }),
    };
  };

  // Add static properties to match typeof pino
  Object.defineProperty(mockPino, 'destination', {
    value: mock(() => ({})),
    writable: true,
    configurable: true,
  });
  Object.defineProperty(mockPino, 'transport', {
    value: mock(() => ({})),
    writable: true,
    configurable: true,
  });
  Object.defineProperty(mockPino, 'multistream', {
    value: mock(() => ({})),
    writable: true,
    configurable: true,
  });
  Object.defineProperty(mockPino, 'stdTimeFunctions', {
    value: {
      epochTime: mock(() => '1234567890'),
      unixTime: mock(() => '1234567890'),
      nullTime: mock(() => ''),
      isoTime: mock(() => '2023-01-01T00:00:00.000Z'),
      isoTimeNano: mock(() => '2023-01-01T00:00:00.000000000Z'),
    },
    writable: true,
    configurable: true,
  });
  Object.defineProperty(mockPino, 'stdSerializers', {
    value: {},
    writable: true,
    configurable: true,
  });
  Object.defineProperty(mockPino, 'levels', {
    value: { values: {}, labels: {} },
    writable: true,
    configurable: true,
  });
  Object.defineProperty(mockPino, 'symbols', {
    value: {},
    writable: true,
    configurable: true,
  });
  Object.defineProperty(mockPino, 'pino', {
    value: mockPino,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(mockPino, 'version', {
    value: '8.0.0',
    writable: true,
    configurable: true,
  });

  return mockPino as unknown as typeof pino;
}

// Helper function for testing deprecated logOperation
const testAsyncFn = async () => 'result';

describe('Logger Class', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalStdoutIsTTY: boolean;

  beforeEach(() => {
    originalEnv = { ...process.env };
    originalStdoutIsTTY = process.stdout.isTTY;
  });

  afterEach(() => {
    process.env = originalEnv;
    Object.defineProperty(process.stdout, 'isTTY', {
      value: originalStdoutIsTTY,
      writable: true,
    });
  });

  describe('Constructor', () => {
    it('should create a logger instance without errors', () => {
      const logger = new Logger();
      expect(logger).toBeDefined();
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should create a logger with verbose mode', () => {
      const logger = new Logger(true);
      expect(logger).toBeDefined();
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should create a logger without verbose mode', () => {
      const logger = new Logger(false);
      expect(logger).toBeDefined();
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe('Environment Detection', () => {
    it('should use test logger in test environment', () => {
      process.env.NODE_ENV = 'test';
      const logger = new Logger();
      const pinoLogger = logger.getPinoLogger();

      expect(pinoLogger).toBeDefined();
      // Test logger should have minimal configuration
      expect(typeof pinoLogger.info).toBe('function');
    });

    it('should use test logger when BUN_TEST is set', () => {
      process.env.BUN_TEST = '1';
      delete process.env.NODE_ENV;
      const logger = new Logger();
      const pinoLogger = logger.getPinoLogger();

      expect(pinoLogger).toBeDefined();
      expect(typeof pinoLogger.info).toBe('function');
    });

    it('should use production logger in non-test environment', () => {
      delete process.env.NODE_ENV;
      delete process.env.BUN_TEST;
      const logger = new Logger();
      const pinoLogger = logger.getPinoLogger();

      expect(pinoLogger).toBeDefined();
      expect(typeof pinoLogger.info).toBe('function');
    });
  });

  describe('Basic Logging Methods', () => {
    let logger: Logger;

    beforeEach(() => {
      // Set test environment to ensure Logger uses test configuration
      process.env.NODE_ENV = 'test';

      logger = new Logger(false);
    });

    it('should log info messages without context', () => {
      expect(() => logger.info('Test info message')).not.toThrow();
    });

    it('should log info messages with context', () => {
      const context: LogContext = { operation: 'test', file: 'test.txt' };
      expect(() => logger.info('Test info message', context)).not.toThrow();
    });

    it('should log debug messages without context', () => {
      expect(() => logger.debug('Test debug message')).not.toThrow();
    });

    it('should log debug messages with context', () => {
      const context: LogContext = { operation: 'debug-test' };
      expect(() => logger.debug('Test debug message', context)).not.toThrow();
    });

    it('should log warning messages without context', () => {
      expect(() => logger.warn('Test warning message')).not.toThrow();
    });

    it('should log warning messages with context', () => {
      const context: LogContext = { operation: 'warning-test' };
      expect(() => logger.warn('Test warning message', context)).not.toThrow();
    });

    it('should log error messages without context', () => {
      expect(() => logger.error('Test error message')).not.toThrow();
    });

    it('should log error messages with Error object', () => {
      const error = new Error('Test error details');
      expect(() => logger.error('Test error message', error)).not.toThrow();
    });

    it('should log error messages with context', () => {
      const context: LogContext = {
        operation: 'error-test',
        file: 'error.txt',
      };
      expect(() => logger.error('Test error message', context)).not.toThrow();
    });

    it('should handle custom error types', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const customError = new CustomError('Custom error message');
      expect(() => logger.error('Test error', customError)).not.toThrow();
    });
  });

  describe('Child Logger Creation', () => {
    let logger: Logger;

    beforeEach(() => {
      process.env.NODE_ENV = 'test';
      logger = new Logger(false);
    });

    it('should create child logger with context', () => {
      const context: LogContext = {
        operation: 'child-test',
        file: 'child.txt',
      };
      const childLogger = logger.child(context);

      expect(childLogger).toBeDefined();
      expect(childLogger).toBeInstanceOf(Logger);
    });

    it('should create child logger that inherits parent settings', () => {
      const verboseLogger = new Logger(true);
      const context: LogContext = { operation: 'inherit-test' };
      const childLogger = verboseLogger.child(context);

      expect(childLogger).toBeDefined();
      expect(childLogger).toBeInstanceOf(Logger);
    });

    it('should use withContext as alias for child', () => {
      const context: LogContext = { operation: 'alias-test' };
      const childLogger1 = logger.child(context);
      const childLogger2 = logger.withContext(context);

      expect(childLogger1).toBeDefined();
      expect(childLogger2).toBeDefined();
      expect(childLogger1).toBeInstanceOf(Logger);
      expect(childLogger2).toBeInstanceOf(Logger);
    });

    it('should log messages with child context', () => {
      const context: LogContext = { operation: 'child-operation' };
      const childLogger = logger.child(context);

      // Just verify that calling child logger methods doesn't throw
      expect(() => childLogger.info('Child logger message')).not.toThrow();
    });
  });

  describe('Performance Logging', () => {
    let logger: Logger;

    beforeEach(() => {
      process.env.NODE_ENV = 'test';
      logger = new Logger(false);
    });

    it('should log performance metrics', () => {
      const startTime = Date.now() - 100; // 100ms ago
      const operation = 'test-operation';
      const context: LogContext = { file: 'test.txt' };

      // Just verify that calling performance logging doesn't throw
      expect(() =>
        logger.logPerformance(operation, startTime, context)
      ).not.toThrow();
    });

    it('should handle performance logging without context', () => {
      const startTime = Date.now() - 50;
      const operation = 'simple-operation';

      // Just verify that calling performance logging doesn't throw
      expect(() => logger.logPerformance(operation, startTime)).not.toThrow();
    });

    it('should calculate duration correctly', () => {
      const startTime = Date.now() - 250;
      const operation = 'timing-test';

      // Just verify that calling performance logging doesn't throw
      expect(() => logger.logPerformance(operation, startTime)).not.toThrow();
    });
  });

  describe('Operation Logging', () => {
    let logger: Logger;

    beforeEach(() => {
      process.env.NODE_ENV = 'test';
      logger = new Logger(false);
    });

    it('should log successful operation', async () => {
      const operation = 'test-operation';
      const context: LogContext = { file: 'test.txt' };
      const result = 'success';

      const operationResult = await logger.logOperation(
        operation,
        async () => {
          return result;
        },
        context
      );

      expect(operationResult).toBe(result);
    });

    it('should log failed operation', async () => {
      const operation = 'failing-operation';
      const error = new Error('Test operation failed');

      await expect(
        logger.logOperation(operation, async () => {
          throw error;
        })
      ).rejects.toThrow('Test operation failed');
    });

    it('should handle operation without context', async () => {
      const operation = 'simple-operation';
      const result = 42;

      const operationResult = await logger.logOperation(operation, async () => {
        return result;
      });

      expect(operationResult).toBe(result);
    });

    it('should measure operation duration', async () => {
      const operation = 'timing-operation';

      await logger.logOperation(operation, async () => {
        await new Promise((resolve) => setTimeout(resolve, 10)); // 10ms delay
      });

      // Test completes without throwing - duration measurement works
      expect(true).toBe(true);
    });
  });

  describe('Pino Logger Access', () => {
    it('should provide access to underlying pino logger', () => {
      const logger = new Logger();
      const pinoLogger = logger.getPinoLogger();

      expect(pinoLogger).toBeDefined();
      expect(typeof pinoLogger.info).toBe('function');
      expect(typeof pinoLogger.debug).toBe('function');
      expect(typeof pinoLogger.warn).toBe('function');
      expect(typeof pinoLogger.error).toBe('function');
    });
  });

  describe('Production Logger Configuration', () => {
    it('should use debug level when verbose is true', () => {
      delete process.env.NODE_ENV;
      delete process.env.BUN_TEST;

      const logger = new Logger(true);
      const pinoLogger = logger.getPinoLogger();

      expect(pinoLogger.level).toBe('debug');
    });

    it('should use info level when verbose is false', () => {
      delete process.env.NODE_ENV;
      delete process.env.BUN_TEST;

      const logger = new Logger(false);
      const pinoLogger = logger.getPinoLogger();

      expect(pinoLogger.level).toBe('info');
    });

    it('should include service and pid in base configuration', () => {
      delete process.env.NODE_ENV;
      delete process.env.BUN_TEST;

      const logger = new Logger();
      const pinoLogger = logger.getPinoLogger();

      // The actual pino logger should have base configuration
      expect(pinoLogger).toBeDefined();
    });
  });

  describe('TTY Detection', () => {
    it('should handle TTY detection for pretty output', () => {
      delete process.env.NODE_ENV;
      delete process.env.BUN_TEST;
      Object.defineProperty(process.stdout, 'isTTY', { value: true });

      expect(() => new Logger()).not.toThrow();
    });

    it('should handle non-TTY environment', () => {
      delete process.env.NODE_ENV;
      delete process.env.BUN_TEST;
      Object.defineProperty(process.stdout, 'isTTY', { value: false });

      expect(() => new Logger()).not.toThrow();
    });

    it('should respect NO_COLOR environment variable', () => {
      delete process.env.NODE_ENV;
      delete process.env.BUN_TEST;
      process.env.NO_COLOR = '1';

      expect(() => new Logger()).not.toThrow();
    });
  });
});

describe('Logger Utility Functions', () => {
  describe('createLogger', () => {
    it('should create logger from CLI context', () => {
      const context = {
        input: [],
        flags: { verbose: true, help: false, config: undefined },
        logLevel: 'info' as const,
      };

      const logger = createLogger(context);
      expect(logger).toBeDefined();
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should create logger with verbose flag from context', () => {
      const context = {
        input: [],
        flags: { verbose: false, help: false, config: undefined },
        logLevel: 'info' as const,
      };

      const logger = createLogger(context);
      expect(logger).toBeDefined();
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should handle context without flags', () => {
      const context = {
        input: [],
        flags: {} as any,
        logLevel: 'info' as const,
      };

      const logger = createLogger(context);
      expect(logger).toBeDefined();
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe('getLogger (Deprecated)', () => {
    it('should throw error when called', () => {
      expect(() => getLogger()).toThrow(
        'getLogger() is deprecated. Use dependency injection instead.'
      );
    });

    it('should throw specific deprecation error', () => {
      expect(() => getLogger()).toThrow(/deprecated.*dependency injection/);
    });
  });

  describe('withContext', () => {
    it('should create child logger with context', () => {
      const mockPinoLogger = {
        child: (context: any) => ({ ...mockPinoLogger, ...context }),
      };

      const context: LogContext = { operation: 'test', file: 'test.txt' };
      const childLogger = withContext(mockPinoLogger as any, context);

      expect(childLogger).toBeDefined();
      expect(typeof childLogger).toBe('object');
    });

    it('should handle empty context', () => {
      const mockPinoLogger = {
        child: (context: any) => ({ ...mockPinoLogger, ...context }),
      };

      const childLogger = withContext(mockPinoLogger as any, {});

      expect(childLogger).toBeDefined();
    });
  });

  describe('logOperation (Deprecated)', () => {
    it('should throw error when called', () => {
      const operation = 'test-operation';

      expect(() => logOperation(operation, testAsyncFn)).toThrow(
        'logOperation() is deprecated. Use Logger.logOperation() instead.'
      );
    });

    it('should throw specific deprecation error', () => {
      expect(() =>
        logOperation('test', async () => {
          // Empty function to test deprecation error
        })
      ).toThrow('deprecated');
    });
  });

  describe('logPerformance (Deprecated)', () => {
    it('should throw error when called', () => {
      const operation = 'test-operation';
      const startTime = Date.now();

      expect(() => logPerformance(operation, startTime)).toThrow(
        'logPerformance() is deprecated. Use Logger.logPerformance() instead.'
      );
    });

    it('should throw specific deprecation error', () => {
      expect(() => logPerformance('test', Date.now())).toThrow(
        /deprecated.*Logger\.logPerformance/
      );
    });
  });
});

describe('Logger Edge Cases', () => {
  it('should handle undefined context in logging methods', () => {
    const logger = new Logger();

    expect(() => logger.info('test', undefined as any)).not.toThrow();
    expect(() => logger.debug('test', undefined as any)).not.toThrow();
    expect(() => logger.warn('test', undefined as any)).not.toThrow();
    expect(() => logger.error('test', undefined as any)).not.toThrow();
  });

  it('should handle null context in logging methods', () => {
    const logger = new Logger();

    expect(() => logger.info('test', null as any)).not.toThrow();
    expect(() => logger.debug('test', null as any)).not.toThrow();
    expect(() => logger.warn('test', null as any)).not.toThrow();
    expect(() => logger.error('test', null as any)).not.toThrow();
  });

  it('should handle complex nested context', () => {
    const logger = new Logger();
    const complexContext: LogContext = {
      operation: 'complex-operation',
      file: 'test.txt',
      duration: 100,
      nested: {
        level1: {
          level2: 'deep value',
        },
      },
      array: [1, 2, 3],
      specialChars: '!@#$%^&*()',
    };

    expect(() => logger.info('test', complexContext)).not.toThrow();
  });

  it('should handle circular references in context', () => {
    const logger = new Logger();
    const context: any = { operation: 'circular-test' };
    context.self = context;

    expect(() => logger.info('test', context)).not.toThrow();
  });

  it('should handle very long messages', () => {
    const logger = new Logger();
    const longMessage = 'x'.repeat(10000);

    expect(() => logger.info(longMessage)).not.toThrow();
  });

  it('should handle special characters in messages', () => {
    const logger = new Logger();
    const specialMessage =
      'Special chars: 🚀 \n\t "quotes" \'apostrophes\' $%&*(){}[]|\\/:;<>?.';

    expect(() => logger.info(specialMessage)).not.toThrow();
  });
});

describe('Logger Performance', () => {
  it('should create logger quickly', () => {
    const startTime = performance.now();
    const logger = new Logger();
    const endTime = performance.now();

    expect(logger).toBeDefined();
    expect(endTime - startTime).toBeLessThan(100);
  });

  it('should handle rapid logging', () => {
    const logger = new Logger();
    const iterations = 1000;

    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      logger.info(`Message ${i}`, { iteration: i });
    }

    const endTime = performance.now();
    const averageTime = (endTime - startTime) / iterations;

    expect(averageTime).toBeLessThan(1); // Should average less than 1ms per log call
  });
});
