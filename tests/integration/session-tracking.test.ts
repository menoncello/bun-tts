import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { errorReporter } from '../../src/utils/error-reporter.js';
import {
  setupErrorHandlingTests,
  createUserContextTestErrors,
} from '../support/error-handling-test-utils.js';

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

function setupPersistentUserSession(): void {
  errorReporter().updateSession('persistent-user');
}

function generateUserContextReports(errors: {
  configError: any;
  fileError: any;
  ttsError: any;
}): {
  configReport: any;
  fileReport: any;
  ttsReport: any;
} {
  const configReport = errorReporter().reportError(errors.configError, {
    type: 'configuration',
  });
  const fileReport = errorReporter().reportError(errors.fileError, {
    type: 'file',
  });
  const ttsReport = errorReporter().reportError(errors.ttsError, {
    type: 'tts',
  });

  return { configReport, fileReport, ttsReport };
}

function testUserContextPreservation(): {
  configReport: any;
  fileReport: any;
  ttsReport: any;
} {
  setupPersistentUserSession();
  const errors = createUserContextTestErrors();
  return generateUserContextReports(errors);
}

function validateUserContextResults(
  configReport: any,
  fileReport: any,
  ttsReport: any
): void {
  expect(configReport.userId).toBe('persistent-user');
  expect(fileReport.userId).toBe('persistent-user');
  expect(ttsReport.userId).toBe('persistent-user');
  expect(configReport.sessionId).toBe(fileReport.sessionId);
  expect(fileReport.sessionId).toBe(ttsReport.sessionId);
}

describe('Session and User Tracking', () => {
  setupErrorHandlingTests();

  describe('session and user tracking', () => {
    it('should track errors across session updates', () => {
      const { report1, report2 } = testSessionUpdates();
      validateSessionUpdateResults(report1, report2);
    });

    it('should preserve user context across different error types', () => {
      const { configReport, fileReport, ttsReport } =
        testUserContextPreservation();
      validateUserContextResults(configReport, fileReport, ttsReport);
    });
  });
});
