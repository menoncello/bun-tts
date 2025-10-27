import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { errorReporter } from '../../src/utils/error-reporter.js';
import {
  setupErrorHandlingTests,
  createTraceEnabledManager,
  createTraceDisabledManager,
} from '../support/error-handling-test-utils.js';

function createDevelopmentErrorReport(): any {
  errorReporter().setEnvironment('development');
  const devError = new Error('Development error');
  return errorReporter().reportError(devError, {
    environment: 'development',
  });
}

function createProductionErrorReport(): any {
  errorReporter().setEnvironment('production');
  const prodError = new Error('Production error');
  return errorReporter().reportError(prodError, {
    environment: 'production',
  });
}

function testEnvironmentSpecificBehavior(): {
  devReport: any;
  prodReport: any;
} {
  const devReport = createDevelopmentErrorReport();
  const prodReport = createProductionErrorReport();
  return { devReport, prodReport };
}

function testTraceLevelSettings(): {
  traceEnabledLogs: any[];
  traceDisabledLogs: any[];
} {
  const traceEnabledManager = createTraceEnabledManager();
  traceEnabledManager.trace('Trace message 1', { traceId: 'test-1' });
  const traceEnabledLogs = traceEnabledManager.getLogs('trace');

  const traceDisabledManager = createTraceDisabledManager();
  traceDisabledManager.trace('Trace message 2', { traceId: 'test-2' });
  const traceDisabledLogs = traceDisabledManager.getLogs('trace');

  return { traceEnabledLogs, traceDisabledLogs };
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
});
