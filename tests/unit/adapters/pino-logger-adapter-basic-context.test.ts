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

describe('PinoLoggerAdapter Context Tests', () => {
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

  describe('context handling', () => {
    it('should handle context with flags only', () => {
      const adapter = new PinoLoggerAdapter({
        flags: {
          verbose: true,
        },
      });

      expect(adapter).toBeDefined();
      expect(adapter.level).toBe('debug');
    });

    it('should handle empty context', () => {
      const adapter = new PinoLoggerAdapter({});

      expect(adapter).toBeDefined();
      expect(typeof adapter.info).toBe('function');
    });

    it('should handle null context', () => {
      const adapter = new PinoLoggerAdapter(null as any);

      expect(adapter).toBeDefined();
      expect(typeof adapter.info).toBe('function');
    });
  });

  describe('context with different environments', () => {
    it('should handle development environment', () => {
      process.env.NODE_ENV = 'development';
      const adapter = new PinoLoggerAdapter();

      expect(adapter).toBeDefined();
      expect(typeof adapter.info).toBe('function');
    });

    it('should handle production environment', () => {
      process.env.NODE_ENV = 'production';
      const adapter = new PinoLoggerAdapter();

      expect(adapter).toBeDefined();
      expect(typeof adapter.info).toBe('function');
    });

    it('should handle undefined environment', () => {
      delete process.env.NODE_ENV;
      const adapter = new PinoLoggerAdapter();

      expect(adapter).toBeDefined();
      expect(typeof adapter.info).toBe('function');
    });
  });

  describe('context inheritance', () => {
    it('should handle basic logger functionality', () => {
      const adapter = new PinoLoggerAdapter({
        flags: { verbose: true },
      });

      expect(adapter).toBeDefined();
      expect(adapter.level).toBe('debug'); // From verbose flag
    });
  });
});
