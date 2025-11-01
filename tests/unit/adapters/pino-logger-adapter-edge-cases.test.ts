import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { PinoLoggerAdapter } from '../../../src/adapters/pino-logger-adapter';
import {
  setupTTYEnvironment,
  expectTransportError,
  expectSuccessfulCreation,
} from './pino-logger-adapter-test-helpers';

function setupTestEnvironment() {
  const originalEnv = { ...process.env };
  const originalStdout = process.stdout.isTTY;
  return { originalEnv, originalStdout };
}

function restoreTestEnvironment(
  originalEnv: NodeJS.ProcessEnv,
  originalStdout: any
) {
  process.env = originalEnv;
  (process.stdout as any).isTTY = originalStdout;
}

describe('PinoLoggerAdapter Edge Cases Tests', () => {
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

  describe('TTY detection edge cases', () => {
    it('should handle stdout.isTTY being a string', () => {
      setupTTYEnvironment('true');

      expectTransportError(() => {
        const adapter = new PinoLoggerAdapter();
        expect(adapter).toBeDefined();
      });
    });

    it('should handle stdout.isTTY being a number', () => {
      setupTTYEnvironment(1);

      expectTransportError(() => {
        const adapter = new PinoLoggerAdapter();
        expect(adapter).toBeDefined();
      });
    });

    it('should handle stdout.isTTY being 0', () => {
      setupTTYEnvironment(0);

      expectSuccessfulCreation(() => new PinoLoggerAdapter());
    });

    it('should handle stdout.isTTY being false string', () => {
      setupTTYEnvironment('false');

      expectSuccessfulCreation(() => new PinoLoggerAdapter());
    });
  });

  describe('transport configuration with verbose flag', () => {
    it('should attempt transport configuration with verbose flag and TTY', () => {
      setupTTYEnvironment(true);

      try {
        const adapter = new PinoLoggerAdapter({ flags: { verbose: true } });
        expect(adapter).toBeDefined();
        expect(adapter.level).toBe('debug');
      } catch (error) {
        expect((error as Error).message).toContain('transport target');
      }
    });

    it('should not configure transport with verbose flag but no TTY', () => {
      setupTTYEnvironment(false);

      const adapter = new PinoLoggerAdapter({ flags: { verbose: true } });
      expect(adapter).toBeDefined();
      expect(adapter.level).toBe('debug');
    });
  });

  describe('transport configuration with different contexts', () => {
    it('should handle empty context with TTY enabled', () => {
      setupTTYEnvironment(true);

      expectTransportError(() => {
        const adapter = new PinoLoggerAdapter({});
        expect(adapter).toBeDefined();
      });
    });

    it('should handle context with undefined flags with TTY enabled', () => {
      setupTTYEnvironment(true);

      expectTransportError(() => {
        const adapter = new PinoLoggerAdapter({ flags: undefined });
        expect(adapter).toBeDefined();
      });
    });
  });
});
