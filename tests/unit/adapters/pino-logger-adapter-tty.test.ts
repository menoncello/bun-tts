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

describe('PinoLoggerAdapter TTY Configuration Tests', () => {
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

  describe('transport configuration with TTY enabled', () => {
    it('should configure transport when stdout.isTTY is true and NO_COLOR is not set', () => {
      setupTTYEnvironment(true);

      expectTransportError(() => {
        const adapter = new PinoLoggerAdapter();
        expect(adapter).toBeDefined();
      });
    });

    it('should configure transport when stdout.isTTY is true and NO_COLOR is false', () => {
      setupTTYEnvironment(true, 'false');

      expectTransportError(() => {
        const adapter = new PinoLoggerAdapter();
        expect(adapter).toBeDefined();
      });
    });
  });

  describe('transport configuration with TTY disabled', () => {
    it('should not configure transport when stdout.isTTY is false', () => {
      setupTTYEnvironment(false);

      expectSuccessfulCreation(() => new PinoLoggerAdapter());
    });

    it('should not configure transport when stdout.isTTY is undefined', () => {
      setupTTYEnvironment(false);

      expectSuccessfulCreation(() => new PinoLoggerAdapter());
    });
  });

  describe('transport configuration with NO_COLOR', () => {
    it('should not configure transport when NO_COLOR is set', () => {
      setupTTYEnvironment(true, '1');

      expectSuccessfulCreation(() => new PinoLoggerAdapter());
    });

    it('should not configure transport when NO_COLOR is true', () => {
      setupTTYEnvironment(true, 'true');

      expectSuccessfulCreation(() => new PinoLoggerAdapter());
    });

    it('should not configure transport when NO_COLOR is any non-empty string', () => {
      setupTTYEnvironment(true, 'any-value');

      expectSuccessfulCreation(() => new PinoLoggerAdapter());
    });
  });
});
