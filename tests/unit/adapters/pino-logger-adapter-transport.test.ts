import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { PinoLoggerAdapter } from '../../../src/adapters/pino-logger-adapter';
import {
  setupTTYEnvironment,
  expectTransportError,
} from './pino-logger-adapter-test-helpers';

describe('PinoLoggerAdapter Transport Configuration Core Tests', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalStdout: any;

  beforeEach(() => {
    originalEnv = { ...process.env };
    originalStdout = process.stdout.isTTY;

    // Ensure non-test environment to test transport configuration
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    process.env = originalEnv;
    (process.stdout as any).isTTY = originalStdout;
  });

  describe('basic transport configuration', () => {
    it('should create adapter without transport configuration', () => {
      setupTTYEnvironment(false);

      const adapter = new PinoLoggerAdapter();
      expect(adapter).toBeDefined();
      expect(adapter.level).toBeDefined();
    });

    it('should attempt transport configuration when conditions are met', () => {
      setupTTYEnvironment(true);

      expectTransportError(() => {
        const adapter = new PinoLoggerAdapter();
        expect(adapter).toBeDefined();
      });
    });
  });
});
