import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import {
  ConfigurationError,
  FileNotFoundError,
} from '../../src/errors/index.js';
import { debugManager } from '../../src/utils/debug.js';
import { recoveryManager } from '../../src/utils/error-recovery.js';
import { errorReporter } from '../../src/utils/error-reporter.js';
import {
  setupErrorHandlingTests,
  createConfigurationError,
  createDelay,
  createRecoveryOperations,
} from '../support/error-handling-test-utils.js';

function startErrorReportingTimer(): void {
  debugManager().startTimer('error-reporting-test');
}

function generateErrorReport(error: ConfigurationError): any {
  return errorReporter().reportError(error, {
    operation: 'config-loading',
    component: 'config-manager',
    userId: 'integration-test-user',
  });
}

function endErrorReportingTimer(): void {
  debugManager().endTimer('error-reporting-test');
}

async function performErrorReporting(error: ConfigurationError): Promise<any> {
  startErrorReportingTimer();
  await createDelay();
  const report = generateErrorReport(error);
  await createDelay();
  endErrorReportingTimer();
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

function startRecoveryTimer(): void {
  debugManager().startTimer('recovery-test');
}

async function performRecoveryOperation(
  error: FileNotFoundError,
  fallbackOperation: () => Promise<any>
): Promise<any> {
  return recoveryManager().attemptRecovery(
    error,
    {
      operation: 'file-processing',
      attempt: 1,
      maxAttempts: 3,
      metadata: { fileName: 'missing-file.txt' },
    },
    fallbackOperation
  );
}

function endRecoveryTimer(): void {
  debugManager().endTimer('recovery-test');
}

async function performRecoveryWithError(
  error: FileNotFoundError,
  failingOperation: () => Promise<any>,
  fallbackOperation: () => Promise<any>
): Promise<any> {
  startRecoveryTimer();
  const result = await performRecoveryOperation(error, fallbackOperation);
  endRecoveryTimer();
  return result;
}

function validateRecoveryResult(result: any): void {
  expect(result.success).toBe(true);
}

function validateRecoveryLogs(): void {
  const logs = debugManager().getLogs();
  expect(logs.some((log) => log.message.includes('Attempting recovery'))).toBe(
    true
  );
}

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
      const { failingOperation, fallbackOperation } =
        createRecoveryOperations(error);

      const result = await performRecoveryWithError(
        error,
        failingOperation,
        fallbackOperation
      );

      validateRecoveryResult(result);
      validateRecoveryLogs();
    });
  });
});
