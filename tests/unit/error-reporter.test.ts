import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import {
  ConfigurationError,
  FileNotFoundError,
} from '../../src/errors/index.js';
import {
  ErrorReporter,
  reportError,
  reportWarning,
  reportInfo,
} from '../../src/utils/error-reporter.js';
import { createMockLogger } from '../mocks/logger-mock.js';

function createTestErrorReporter(): ErrorReporter {
  ErrorReporter.resetInstance();
  const mockLogger = createMockLogger() as any;
  return ErrorReporter.getInstance(
    {
      environment: 'development',
      enableConsoleReporting: false,
      enableFileReporting: false,
      userId: 'test-user',
      sessionId: 'test-session',
    },
    mockLogger
  );
}

function setupTestEnvironment(): string | undefined {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'test';
  return originalEnv;
}

function restoreTestEnvironment(originalEnv: string | undefined): void {
  if (originalEnv) {
    process.env.NODE_ENV = originalEnv;
  } else {
    delete process.env.NODE_ENV;
  }
}

describe('ErrorReporter Error Processing - BunTtsError', () => {
  let reporter: ErrorReporter;
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = setupTestEnvironment();
    reporter = createTestErrorReporter();
  });

  afterEach(() => {
    restoreTestEnvironment(originalEnv);
  });

  it('should report BunTtsError correctly', () => {
    const error = new ConfigurationError('Test configuration error', {
      configPath: '/test/config.json',
    });
    const report = reporter.reportError(error, {
      operation: 'test',
      environment: 'development',
    });

    expect(report.error.name).toBe('ConfigurationError');
    expect(report.error.message).toBe('Test configuration error');
    expect(report.error.category).toBe('configuration');
    expect(report.context.operation).toBe('test');
    expect(report.userId).toBe('test-user');
    expect(report.sessionId).toBe('test-session');
    expect(report.environment).toBe('development');
    expect(report.timestamp).toBeDefined();
  });
});

describe('ErrorReporter Error Processing - Error Normalization', () => {
  let reporter: ErrorReporter;
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = setupTestEnvironment();
    reporter = createTestErrorReporter();
  });

  afterEach(() => {
    restoreTestEnvironment(originalEnv);
  });

  it('should normalize regular Error to BunTtsError', () => {
    const error = new Error('Regular error');
    const report = reporter.reportError(error);

    expect(report.error.name).toBe('Error');
    expect(report.error.message).toBe('Regular error');
    expect(report.error.code).toBe('UNKNOWN_ERROR');
    expect(report.error.category).toBe('validation');
    expect(report.error.recoverable).toBe(true);
  });

  it('should normalize unknown error to BunTtsError', () => {
    const error = 'String error';
    const report = reporter.reportError(error);

    expect(report.error.name).toBe('UnknownError');
    expect(report.error.message).toBe('String error');
    expect(report.error.code).toBe('UNKNOWN_ERROR');
    expect(report.error.category).toBe('validation');
  });
});

describe('ErrorReporter Error Processing - System Context', () => {
  let reporter: ErrorReporter;
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = setupTestEnvironment();
    reporter = createTestErrorReporter();
  });

  afterEach(() => {
    restoreTestEnvironment(originalEnv);
  });

  it('should include system context in error report', () => {
    const error = new FileNotFoundError('/missing/file.txt');
    const report = reporter.reportError(error);

    expect(report.context.platform).toBeDefined();
    expect(report.context.arch).toBeDefined();
    expect(report.context.nodeVersion).toBeDefined();
  });
});

describe('ErrorReporter Warning and Info Reporting', () => {
  let reporter: ErrorReporter;
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = setupTestEnvironment();
    reporter = createTestErrorReporter();
  });

  afterEach(() => {
    restoreTestEnvironment(originalEnv);
  });

  describe('Warning Reporting', () => {
    it('should report warning messages', () => {
      const logger = reporter.getLogger() as any;
      logger.clearCalls();

      reporter.reportWarning('Test warning', { code: 'WARN_001' });

      const warnCalls = logger.getCalls('warn');
      expect(warnCalls.length).toBeGreaterThan(0);

      const [message, context] = warnCalls[0];
      expect(message).toBe('Test warning');
      expect(context.context).toEqual({ code: 'WARN_001' });
      expect(context.timestamp).toBeDefined();
    });
  });

  describe('Info Reporting', () => {
    it('should report info messages', () => {
      const logger = reporter.getLogger() as any;
      logger.clearCalls();

      reporter.reportInfo('Test info', { action: 'test' });

      const infoCalls = logger.getCalls('info');
      expect(infoCalls.length).toBeGreaterThan(0);

      const [message, context] = infoCalls[0];
      expect(message).toBe('Test info');
      expect(context.context).toEqual({ action: 'test' });
      expect(context.timestamp).toBeDefined();
    });
  });
});

describe('ErrorReporter Session Management', () => {
  let reporter: ErrorReporter;
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = setupTestEnvironment();
    reporter = createTestErrorReporter();
  });

  afterEach(() => {
    restoreTestEnvironment(originalEnv);
  });

  describe('Session Updates', () => {
    it('should update session with new user ID', () => {
      const originalReport = reporter.reportError(new Error('Test error'), {
        test: 'session',
      });
      const originalSessionId = originalReport.sessionId;

      reporter.updateSession('new-user');
      const newReport = reporter.reportError(new Error('Test error 2'), {
        test: 'session-2',
      });

      expect(newReport.userId).toBe('new-user');
      expect(newReport.sessionId).not.toBe(originalSessionId);
    });

    it('should update session without changing user ID', () => {
      reporter.updateSession('persistent-user');
      const firstReport = reporter.reportError(new Error('Test error 1'), {
        test: 'persistent',
      });
      const firstSessionId = firstReport.sessionId;

      reporter.updateSession(); // Update without changing user
      const secondReport = reporter.reportError(new Error('Test error 2'), {
        test: 'persistent-2',
      });

      expect(secondReport.userId).toBe('persistent-user');
      expect(secondReport.sessionId).not.toBe(firstSessionId);
    });
  });
});

describe('ErrorReporter Singleton Behavior', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = setupTestEnvironment();
  });

  afterEach(() => {
    restoreTestEnvironment(originalEnv);
  });

  describe('Instance Management', () => {
    it('should return the same instance', () => {
      ErrorReporter.resetInstance();
      const reporter1 = ErrorReporter.getInstance();
      const reporter2 = ErrorReporter.getInstance();

      expect(reporter1).toBe(reporter2);
    });

    it('should allow updating environment on existing instance', () => {
      const reporter = createTestErrorReporter();
      reporter.setEnvironment('production');
      const report = reporter.reportError(new Error('Test error'), {
        test: 'env',
        environment: 'production',
      });

      expect(report.environment).toBe('production');
      expect(report.sessionId).toBeDefined();
    });
  });
});

describe('Global Convenience Functions', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
  });

  describe('Global Error Reporting', () => {
    it('should use global error reporter instance', () => {
      const error = new Error('Test error');
      const report = reportError(error, { test: true });

      expect(report.error.message).toBe('Test error');
      expect(report.context.test).toBe(true);
    });
  });

  describe('Global Warning Reporting', () => {
    it('should use global warning reporter', () => {
      expect(() => reportWarning('Test warning')).not.toThrow();
    });
  });

  describe('Global Info Reporting', () => {
    it('should use global info reporter', () => {
      expect(() => reportInfo('Test info')).not.toThrow();
    });
  });
});
