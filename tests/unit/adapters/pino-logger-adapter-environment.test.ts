import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { PinoLoggerAdapter } from '../../../src/adapters/pino-logger-adapter';
import {
  setupTTYEnvironment,
  setupTestEnvironment,
  expectTransportError,
  expectSuccessfulCreation,
} from './pino-logger-adapter-test-helpers';

describe('PinoLoggerAdapter Environment Configuration Tests', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalStdout: any;

  beforeEach(() => {
    originalEnv = { ...process.env };
    originalStdout = process.stdout.isTTY;
  });

  afterEach(() => {
    process.env = originalEnv;
    (process.stdout as any).isTTY = originalStdout;
  });

  describe('transport configuration in test environment', () => {
    it('should not configure transport in NODE_ENV=test regardless of TTY', () => {
      setupTestEnvironment();
      setupTTYEnvironment(true);

      expectTransportError(() => {
        const adapter = new PinoLoggerAdapter();
        expect(adapter).toBeDefined();
      });
    });

    it('should not configure transport in BUN_TEST=1 regardless of TTY', () => {
      setupTTYEnvironment(true);
      setupTestEnvironment('1');

      expectTransportError(() => {
        const adapter = new PinoLoggerAdapter();
        expect(adapter).toBeDefined();
      });
    });
  });

  describe('conflicting environment variables', () => {
    it('should handle conflicting environment variables', () => {
      process.env.NODE_ENV = 'development';
      process.env.BUN_TEST = '1'; // This should override
      setupTTYEnvironment(true);

      expectSuccessfulCreation(() => new PinoLoggerAdapter());
    });

    it('should handle empty environment variables', () => {
      process.env.NODE_ENV = '';
      process.env.BUN_TEST = '';
      setupTTYEnvironment(true, '');

      expectTransportError(() => {
        const adapter = new PinoLoggerAdapter();
        expect(adapter).toBeDefined();
      });
    });
  });
});
