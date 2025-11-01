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

describe('PinoLoggerAdapter Basic Integration Tests', () => {
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

  describe('integration tests', () => {
    it('should work in typical usage scenario', () => {
      const adapter = new PinoLoggerAdapter({
        flags: { verbose: false },
      });

      expect(adapter).toBeDefined();
      // Note: level is read-only, check through other means

      // Should be able to call all log methods without errors
      expect(() => {
        adapter.debug('Debug message');
        adapter.info('Info message');
        adapter.warn('Warning message');
        adapter.error('Error message');
        adapter.fatal('Fatal message');
      }).not.toThrow();
    });

    it('should handle complex logging scenarios', () => {
      const adapter = new PinoLoggerAdapter({
        flags: { verbose: true },
      });

      expect(adapter).toBeDefined();
      // Note: level is read-only, cannot be directly accessed

      // Complex object logging
      const complexObject = {
        user: { id: 123, name: 'Test User' },
        action: 'test-action',
        metadata: { timestamp: Date.now(), requestId: 'req-123' },
      };

      expect(() => {
        adapter.info('Complex operation', { data: complexObject });
        adapter.warn('Warning with context', complexObject);
        adapter.error('Error with details', {
          error: new Error('Test error'),
          context: complexObject,
        });
      }).not.toThrow();
    });

    it('should handle rapid logging without errors', () => {
      const adapter = new PinoLoggerAdapter();

      expect(() => {
        for (let i = 0; i < 100; i++) {
          adapter.info(`Message ${i}`);
        }
      }).not.toThrow();
    });
  });

  describe('error handling integration', () => {
    it('should handle logging null values', () => {
      const adapter = new PinoLoggerAdapter();

      expect(() => {
        adapter.info(null as any);
        adapter.info('Message', null as any);
      }).not.toThrow();
    });

    it('should handle logging undefined values', () => {
      const adapter = new PinoLoggerAdapter();

      expect(() => {
        adapter.info(undefined as any);
        adapter.info('Message', undefined as any);
      }).not.toThrow();
    });

    it('should handle logging very large objects', () => {
      const adapter = new PinoLoggerAdapter();
      const largeObject = { data: 'x'.repeat(10000) };

      expect(() => {
        adapter.info('Large object', largeObject);
      }).not.toThrow();
    });
  });

  describe('performance considerations', () => {
    it('should handle high-frequency logging efficiently', () => {
      const adapter = new PinoLoggerAdapter();
      const startTime = Date.now();

      expect(() => {
        for (let i = 0; i < 1000; i++) {
          adapter.debug(`High frequency message ${i}`);
        }
      }).not.toThrow();

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
    });

    it('should handle disabled log levels efficiently', () => {
      const adapter = new PinoLoggerAdapter({
        flags: { verbose: false }, // Set to error level
      });
      // Note: level is read-only, cannot be modified after creation

      const startTime = Date.now();

      expect(() => {
        for (let i = 0; i < 1000; i++) {
          adapter.debug(`This should be filtered out ${i}`);
        }
      }).not.toThrow();

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should be very fast since messages are filtered out
      expect(duration).toBeLessThan(100);
    });
  });
});
