import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { PinoLoggerAdapter } from '../../../src/adapters/pino-logger-adapter';

function setupTestEnvironment() {
  const originalEnv = { ...process.env };
  const originalStdout = process.stdout.isTTY;

  // Ensure test environment settings';
  process.env.NODE_ENV = 'test';
  process.env.NO_COLOR = 'true';

  return { originalEnv, originalStdout };
}

function restoreTestEnvironment(
  originalEnv: NodeJS.ProcessEnv,
  originalStdout: any
) {
  process.env = originalEnv;
  (process.stdout as any).isTTY = originalStdout;
}

describe('PinoLoggerAdapter Basic Core Tests', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalStdout: any;

  beforeEach(() => {
    const testEnv = setupTestEnvironment();
    originalEnv = testEnv.originalEnv;
    originalStdout = testEnv.originalStdout;
  });

  afterEach(() => {
    restoreTestEnvironment(originalEnv, originalStdout);
  });

  describe('constructor and basic functionality', () => {
    it('should create a logger instance', () => {
      const adapter = new PinoLoggerAdapter();

      expect(adapter).toBeDefined();
      expect(typeof adapter.debug).toBe('function');
      expect(typeof adapter.info).toBe('function');
      expect(typeof adapter.warn).toBe('function');
      expect(typeof adapter.error).toBe('function');
      expect(typeof adapter.fatal).toBe('function');
      // trace method is not available in PinoLoggerAdapter
    });

    it('should create a logger with custom options', () => {
      const adapter = new PinoLoggerAdapter({
        flags: { verbose: true },
      });

      expect(adapter).toBeDefined();
      expect(typeof adapter.debug).toBe('function');
      expect(typeof adapter.info).toBe('function');
    });

    it('should create a logger with default config', () => {
      const adapter = new PinoLoggerAdapter();

      expect(adapter.level).toBe('info');
      expect(adapter).toBeDefined();
    });

    it('should create a logger with verbose flag', () => {
      const adapter = new PinoLoggerAdapter({
        flags: { verbose: true },
      });

      expect(adapter.level).toBe('debug');
      expect(adapter).toBeDefined();
    });
  });

  describe('log level management', () => {
    it('should have correct default log level', () => {
      const adapter = new PinoLoggerAdapter();
      expect(adapter.level).toBe('info');
    });

    it('should respect verbose flag for log level', () => {
      const adapter = new PinoLoggerAdapter({
        flags: { verbose: true },
      });
      expect(adapter.level).toBe('debug');
    });

    it('should have read-only level property', () => {
      const adapter = new PinoLoggerAdapter();
      // level property is read-only, can only be set through constructor options
      expect(typeof adapter.level).toBe('string');
      expect(adapter.level).toBe('info');
    });
  });
});
