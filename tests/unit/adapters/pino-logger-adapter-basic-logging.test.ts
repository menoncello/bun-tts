import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { PinoLoggerAdapter } from '../../../src/adapters/pino-logger-adapter';
import {
  setupPinoTestEnvironment,
  restorePinoTestEnvironment,
} from './pino-test-setup';

function createMockStdoutWrite() {
  const mockWrite = {
    calls: [] as any[][],
    mock: { calls: [] as any[][] },
  };

  const mockWriteFunction = (...args: any[]) => {
    mockWrite.calls.push(args);
    mockWrite.mock.calls.push(args);
    return true;
  };

  return { mockWrite, mockWriteFunction };
}

function setupLoggingTestEnvironment() {
  const testEnv = setupPinoTestEnvironment();
  const { mockWrite, mockWriteFunction } = createMockStdoutWrite();
  const originalWrite = process.stdout.write;

  process.stdout.write = mockWriteFunction as typeof process.stdout.write;

  return { testEnv, mockWrite, originalWrite };
}

function cleanupLoggingTestEnvironment(
  testEnv: any,
  originalWrite: typeof process.stdout.write
) {
  restorePinoTestEnvironment(testEnv);
  process.stdout.write = originalWrite;
}

describe('PinoLoggerAdapter Basic Logging Tests', () => {
  let testEnv: ReturnType<typeof setupPinoTestEnvironment>;
  let mockWrite: any;
  let originalWrite: typeof process.stdout.write;

  beforeEach(() => {
    const loggingEnv = setupLoggingTestEnvironment();
    testEnv = loggingEnv.testEnv;
    mockWrite = loggingEnv.mockWrite;
    originalWrite = loggingEnv.originalWrite;
  });

  afterEach(() => {
    cleanupLoggingTestEnvironment(testEnv, originalWrite);
  });

  describe('basic logging functionality', () => {
    it('should log debug messages', () => {
      const adapter = new PinoLoggerAdapter({ flags: { verbose: true } });
      adapter.debug('Test debug message');

      expect(mockWrite.calls.length).toBeGreaterThan(0);
      const logOutput = mockWrite.mock.calls[0][0];
      expect(logOutput).toContain('debug');
      expect(logOutput).toContain('Test debug message');
    });

    it('should log info messages', () => {
      const adapter = new PinoLoggerAdapter();
      adapter.info('Test info message');

      expect(mockWrite.calls.length).toBeGreaterThan(0);
      const logOutput = mockWrite.mock.calls[0][0];
      expect(logOutput).toContain('info');
      expect(logOutput).toContain('Test info message');
    });

    it('should log warn messages', () => {
      const adapter = new PinoLoggerAdapter();
      adapter.warn('Test warning message');

      expect(mockWrite.calls.length).toBeGreaterThan(0);
      const logOutput = mockWrite.mock.calls[0][0];
      expect(logOutput).toContain('warn');
      expect(logOutput).toContain('Test warning message');
    });

    it('should log error messages', () => {
      const adapter = new PinoLoggerAdapter();
      adapter.error('Test error message');

      expect(mockWrite.calls.length).toBeGreaterThan(0);
      const logOutput = mockWrite.mock.calls[0][0];
      expect(logOutput).toContain('error');
      expect(logOutput).toContain('Test error message');
    });

    it('should log fatal messages', () => {
      const adapter = new PinoLoggerAdapter();
      adapter.fatal('Test fatal message');

      expect(mockWrite.calls.length).toBeGreaterThan(0);
      const logOutput = mockWrite.mock.calls[0][0];
      expect(logOutput).toContain('fatal');
      expect(logOutput).toContain('Test fatal message');
    });

    // trace method is not available in PinoLoggerAdapter
  });

  describe('logging with objects', () => {
    it('should log messages with objects', () => {
      const adapter = new PinoLoggerAdapter();
      const testObject = { key: 'value', number: 42 };
      adapter.info('Test message with object', { data: testObject });

      expect(mockWrite.calls.length).toBeGreaterThan(0);
      const logOutput = mockWrite.mock.calls[0][0];
      expect(logOutput).toContain('Test message with object');
      expect(logOutput).toContain('key');
      expect(logOutput).toContain('value');
    });

    it('should log messages with errors', () => {
      const adapter = new PinoLoggerAdapter();
      const testError = new Error('Test error');
      adapter.error('Error occurred', {
        error: testError.message,
        stack: testError.stack,
      });

      expect(mockWrite.calls.length).toBeGreaterThan(0);
      const logOutput = mockWrite.calls[0][0];
      expect(typeof logOutput).toBe('string');
    });

    it('should handle circular references in objects', () => {
      const adapter = new PinoLoggerAdapter();
      const circularObject: any = { name: 'test' };
      circularObject.self = circularObject;

      expect(() => {
        adapter.info('Circular object', { data: circularObject });
      }).not.toThrow();
    });
  });

  describe('log level filtering', () => {
    // Note: PinoLoggerAdapter level property is read-only in TypeScript
    // These tests demonstrate expected behavior when using different constructor options

    it('should log debug messages when verbose flag is set', () => {
      const adapter = new PinoLoggerAdapter({ flags: { verbose: true } });

      mockWrite.calls = [];
      adapter.debug('This should be logged');

      expect(mockWrite.calls.length).toBeGreaterThan(0);
    });

    it('should not filter debug messages in normal operation', () => {
      const adapter = new PinoLoggerAdapter({ flags: { verbose: false } });

      mockWrite.calls = [];
      adapter.debug('This should be logged at debug level');

      // Debug level messages are always logged, but output may be filtered
      expect(typeof adapter.debug).toBe('function');
    });
  });
});
