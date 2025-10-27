import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import {
  ConfigurationError,
  FileNotFoundError,
  TTSError,
  success, failure } from '../../src/errors/index.js';
import { debugManager, DebugManager } from '../../src/utils/debug.js';
import {
  recoveryManager,
  executeWithRecovery,
} from '../../src/utils/error-recovery.js';
import { errorReporter } from '../../src/utils/error-reporter.js';

function setupErrorHandlingTests(): void {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
    cleanupDebugManager();
  });
}

function cleanupDebugManager(): void {
  const dm = debugManager();
  dm.clearLogs();
  dm.clearPerformanceMetrics();
  dm.clearMemorySnapshots();
}

describe('End-to-End Error Reporting Workflow', () => {
  setupErrorHandlingTests();
});

describe('Error Reporting Pipeline Tests', () => {
  setupErrorHandlingTests();

  describe('end-to-end error reporting workflow', () => {
    it('should report error through entire pipeline', async () => {
      const error = createConfigurationError();
      const report = await performErrorReporting(error);

      validateErrorReport(report);
      validatePerformanceMetrics();
      validateDebugLogs();
    });

    it('should handle error with recovery and reporting', async () => {
      const error = new FileNotFoundError('/missing/file.txt');
      const { failingOperation, fallbackOperation } = createRecoveryOperations(error);

      const result = await performRecoveryWithError(error, failingOperation, fallbackOperation);

      validateRecoveryResult(result);
      validateRecoveryLogs();
    });
  });
});

// Helper functions for error reporting tests
function createConfigurationError(): ConfigurationError {
  return new ConfigurationError('Configuration file is corrupted', {
    filePath: '/invalid/config.json',
    line: 15,
    column: 5,
  });
}

async function performErrorReporting(error: ConfigurationError): Promise<any> {
  debugManager().startTimer('error-reporting-test');

  await new Promise((resolve) => setTimeout(resolve, 1));

  const report = errorReporter().reportError(error, {
    operation: 'config-loading',
    component: 'config-manager',
    userId: 'integration-test-user',
  });

  await new Promise((resolve) => setTimeout(resolve, 1));

  debugManager().endTimer('error-reporting-test');

  return report;
}

function validateErrorReport(report: any): void {
  expect(report.error.name).toBe('ConfigurationError');
  expect(report.error.message).toBe('Configuration file is corrupted');
  expect(report.error.details).toEqual({
    filePath: '/invalid/config.json',
    line: 15,
    column: 5,
  });
  expect(report.context.operation).toBe('config-loading');
  expect(report.context.component).toBe('config-manager');
  expect(report.userId).toBe('integration-test-user');
  expect(report.environment).toBe('test');
  expect(report.timestamp).toBeDefined();
}

function validatePerformanceMetrics(): void {
  const metrics = debugManager().getPerformanceMetrics('error-reporting-test');
  expect(metrics).toHaveLength(1);
  if (metrics[0]) {
    expect(metrics[0].duration).toBeGreaterThan(0);
  }
}

function validateDebugLogs(): void {
  const logs = debugManager().getLogs();
  expect(logs.length).toBeGreaterThan(0);
}

function createRecoveryOperations(error: FileNotFoundError) {
  let fallbackCalled = false;

  const failingOperation = async () => {
    return failure(error);
  };

  const fallbackOperation = async () => {
    fallbackCalled = true;
    return success('fallback-success');
  };

  return { failingOperation, fallbackOperation };
}

async function performRecoveryWithError(
  error: FileNotFoundError,
  failingOperation: () => Promise<any>,
  fallbackOperation: () => Promise<any>
): Promise<any> {
  debugManager().startTimer('recovery-test');

  const result = await recoveryManager().attemptRecovery(
    error,
    {
      operation: 'file-processing',
      attempt: 1,
      maxAttempts: 3,
      metadata: { fileName: 'missing-file.txt' },
    },
    fallbackOperation
  );

  debugManager().endTimer('recovery-test');

  return result;
}

function validateRecoveryResult(result: any): void {
  expect(result.success).toBe(true);
}

function validateRecoveryLogs(): void {
  const logs = debugManager().getLogs();
  expect(
    logs.some((log) => log.message.includes('Attempting recovery'))
  ).toBe(true);
}

describe('Complex Error Scenarios Tests', () => {
  setupErrorHandlingTests();

  describe('complex error scenarios', () => {
    it('should handle cascading errors with context preservation', async () => {
      const { primaryReport, secondaryReport } = await performCascadingErrorReporting();

      validateCascadingErrorReports(primaryReport, secondaryReport);
      validateCascadingErrorMetrics();
    });

    it('should measure performance during error recovery', async () => {
      const { strategy, operation } = createRecoveryTestSetup();
      const result = await performPerformanceRecoveryTest(strategy, operation);

      validatePerformanceRecoveryResult(result);
      validatePerformanceRecoveryMetrics();
    });

    it('should track memory usage during error handling', async () => {
      const { initialSnapshot, finalSnapshot, memoryDebugManager } = await performMemoryTrackingTest();

      validateMemoryTrackingResults(memoryDebugManager, initialSnapshot, finalSnapshot);
    });
  });
});

// Helper functions for complex error scenarios
async function performCascadingErrorReporting(): Promise<{ primaryReport: any; secondaryReport: any }> {
  const primaryError = new ConfigurationError('Primary config error');
  const secondaryError = new FileNotFoundError('Secondary file error');

  debugManager().startTimer('cascading-error-test');

  const primaryReport = errorReporter().reportError(primaryError, {
    phase: 'initialization',
    step: 1,
  });

  const secondaryReport = errorReporter().reportError(secondaryError, {
    phase: 'initialization',
    step: 2,
    primaryError: {
      name: primaryError.name,
      message: primaryError.message,
      timestamp: primaryReport.timestamp,
    },
  });

  debugManager().endTimer('cascading-error-test');

  return { primaryReport, secondaryReport };
}

function validateCascadingErrorReports(primaryReport: any, secondaryReport: any): void {
  expect(primaryReport.context.step).toBe(1);
  expect(secondaryReport.context.step).toBe(2);
  expect(secondaryReport.context.primaryError).toBeDefined();
}

function validateCascadingErrorMetrics(): void {
  const metrics = debugManager().getPerformanceMetrics('cascading-error-test');
  expect(metrics).toHaveLength(1);
}

function createRecoveryTestSetup() {
  const error = new TTSError('TTS engine unavailable');
  const strategy = new (class TestStrategy {
    canRecover() {
      return true;
    }
    async recover() {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return success('recovered');
    }
  })();

  recoveryManager().registerStrategy('TTSError', strategy);

  const operation = async () => {
    return failure(error);
  };

  return { strategy, operation };
}

async function performPerformanceRecoveryTest(strategy: any, operation: () => Promise<any>): Promise<any> {
  debugManager().startTimer('performance-recovery-test');

  const result = await executeWithRecovery(operation, 'tts-operation', 3, {
    audioFormat: 'mp3',
    voice: 'default',
  });

  debugManager().endTimer('performance-recovery-test', {
    audioFormat: 'mp3',
    voice: 'default',
    success: result.success,
  });

  return result;
}

function validatePerformanceRecoveryResult(result: any): void {
  expect(result.success).toBe(true);
}

function validatePerformanceRecoveryMetrics(): void {
  const metrics = debugManager().getPerformanceMetrics('performance-recovery-test');
  expect(metrics).toHaveLength(1);
  if (metrics[0]) {
    expect(metrics[0].duration).toBeGreaterThan(40);
    expect(metrics[0].metadata).toEqual({
      audioFormat: 'mp3',
      voice: 'default',
      success: true,
    });
  }
}

async function performMemoryTrackingTest(): Promise<{ initialSnapshot: any; finalSnapshot: any; memoryDebugManager: DebugManager }> {
  DebugManager.resetInstance();
  const memoryDebugManager = DebugManager.getInstance({
    enableMemoryTracking: true,
    logLevel: 'debug',
  });

  const initialSnapshot = memoryDebugManager.takeMemorySnapshot('initial');

  for (let i = 0; i < 10; i++) {
    const error = new Error(`Test error ${i}`);
    errorReporter().reportError(error, {
      errorIndex: i,
      batch: 'memory-test',
    });
  }

  await new Promise((resolve) => setTimeout(resolve, 1));

  const finalSnapshot = memoryDebugManager.takeMemorySnapshot('final');

  return { initialSnapshot, finalSnapshot, memoryDebugManager };
}

function validateMemoryTrackingResults(memoryDebugManager: DebugManager, initialSnapshot: any, finalSnapshot: any): void {
  const snapshots = memoryDebugManager.getMemorySnapshots();
  expect(snapshots).toHaveLength(2);
  expect(finalSnapshot.timestamp).toBeGreaterThan(initialSnapshot.timestamp);
  expect(initialSnapshot.timestamp).toBeDefined();
  expect(finalSnapshot.timestamp).toBeDefined();
  expect(finalSnapshot.heapUsed).toBeGreaterThan(0);
}

describe('Environment-Specific Error Handling', () => {
  setupErrorHandlingTests();

  describe('environment-specific behavior', () => {
    it('should behave differently in production vs development', () => {
      const { devReport, prodReport } = testEnvironmentSpecificBehavior();

      expect(devReport.environment).toBe('development');
      expect(prodReport.environment).toBe('production');
    });

    it('should respect trace level settings', () => {
      const { traceEnabledLogs, traceDisabledLogs } = testTraceLevelSettings();

      expect(traceEnabledLogs).toHaveLength(1);
      expect(traceDisabledLogs).toHaveLength(0);
    });
  });

  function testEnvironmentSpecificBehavior(): { devReport: any; prodReport: any } {
    errorReporter().setEnvironment('development');

    const devError = new Error('Development error');
    const devReport = errorReporter().reportError(devError, {
      environment: 'development',
    });

    errorReporter().setEnvironment('production');

    const prodError = new Error('Production error');
    const prodReport = errorReporter().reportError(prodError, {
      environment: 'production',
    });

    return { devReport, prodReport };
  }

  function testTraceLevelSettings(): { traceEnabledLogs: any[]; traceDisabledLogs: any[] } {
    (DebugManager as any).instance = null;
    const traceEnabledManager = DebugManager.getInstance({
      enableTrace: true,
      logLevel: 'debug',
    });

    traceEnabledManager.trace('Trace message 1', { traceId: 'test-1' });

    const traceEnabledLogs = traceEnabledManager.getLogs('trace');

    (DebugManager as any).instance = null;
    const traceDisabledManager = DebugManager.getInstance({
      enableTrace: false,
      logLevel: 'debug',
    });

    traceDisabledManager.trace('Trace message 2', { traceId: 'test-2' });

    const traceDisabledLogs = traceDisabledManager.getLogs('trace');

    return { traceEnabledLogs, traceDisabledLogs };
  }
});

describe('Multi-Strategy Error Recovery', () => {
  setupErrorHandlingTests();

  describe('error recovery with multiple strategies', () => {
    it('should try multiple recovery strategies in order', async () => {
      const { error, strategy1, strategy2 } = createMultiStrategySetup();
      const result = await testMultiStrategyRecovery(error, strategy1, strategy2);

      validateMultiStrategyResult(result);
    });
  });

  function createMultiStrategySetup() {
    const error = new ConfigurationError('Complex config error');

    const strategy1 = new (class Strategy1 {
      canRecover(err: any) {
        return err.message.includes('Complex');
      }
      async recover() {
        throw new Error('Strategy 1 failed');
      }
    })();

    const strategy2 = new (class Strategy2 {
      canRecover(err: any) {
        return err.message.includes('config error');
      }
      async recover() {
        return success('strategy-2-success');
      }
    })();

    return { error, strategy1, strategy2 };
  }

  async function testMultiStrategyRecovery(error: ConfigurationError, strategy1: any, strategy2: any): Promise<any> {
    recoveryManager().registerStrategy('ConfigurationError', strategy1);
    recoveryManager().registerStrategy('ConfigurationError', strategy2);

    const operation = async () => {
      return failure(error);
    };

    return executeWithRecovery(operation, 'multi-strategy-test', 2);
  }

  function validateMultiStrategyResult(result: any): void {
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('strategy-2-success');
    }
  }
});

describe('Session and User Tracking', () => {
  setupErrorHandlingTests();

  describe('session and user tracking', () => {
    it('should track errors across session updates', () => {
      const { report1, report2 } = testSessionUpdates();

      validateSessionUpdateResults(report1, report2);
    });

    it('should preserve user context across different error types', () => {
      const { configReport, fileReport, ttsReport } = testUserContextPreservation();

      validateUserContextResults(configReport, fileReport, ttsReport);
    });
  });

  function testSessionUpdates(): { report1: any; report2: any } {
    errorReporter().updateSession('user-123');
    const error1 = new Error('Session 1 error');
    const report1 = errorReporter().reportError(error1, { session: 1 });

    errorReporter().updateSession('user-456');
    const error2 = new Error('Session 2 error');
    const report2 = errorReporter().reportError(error2, { session: 2 });

    return { report1, report2 };
  }

  function validateSessionUpdateResults(report1: any, report2: any): void {
    expect(report1.userId).toBe('user-123');
    expect(report1.sessionId).toBeDefined();
    expect(report2.userId).toBe('user-456');
    expect(report2.sessionId).toBeDefined();
    expect(report2.sessionId).not.toBe(report1.sessionId);
  }

  function testUserContextPreservation(): { configReport: any; fileReport: any; ttsReport: any } {
    errorReporter().updateSession('persistent-user');

    const configError = new ConfigurationError('Config error');
    const fileError = new FileNotFoundError('File error');
    const ttsError = new TTSError('TTS error');

    const configReport = errorReporter().reportError(configError, {
      type: 'configuration',
    });
    const fileReport = errorReporter().reportError(fileError, {
      type: 'file',
    });
    const ttsReport = errorReporter().reportError(ttsError, { type: 'tts' });

    return { configReport, fileReport, ttsReport };
  }

  function validateUserContextResults(configReport: any, fileReport: any, ttsReport: any): void {
    expect(configReport.userId).toBe('persistent-user');
    expect(fileReport.userId).toBe('persistent-user');
    expect(ttsReport.userId).toBe('persistent-user');
    expect(configReport.sessionId).toBe(fileReport.sessionId);
    expect(fileReport.sessionId).toBe(ttsReport.sessionId);
  }
});