import { describe, it, expect } from 'bun:test';
import {
  ConfigurationError,
  TTSError,
  success,
  failure,
} from '../../src/errors/index.js';
import { debugManager, DebugManager } from '../../src/utils/debug.js';
import {
  executeWithRecovery,
  getRecoveryManager,
} from '../../src/utils/error-recovery.js';
import { errorReporter } from '../../src/utils/error-reporter.js';
import {
  setupErrorHandlingTests,
  createCascadingErrors,
  createDelay,
  createMemoryDebugManager,
} from '../support/error-handling-test-utils.js';

function startCascadingErrorTimer(): void {
  debugManager().startTimer('cascading-error-test');
}

function generatePrimaryErrorReport(primaryError: ConfigurationError): any {
  return errorReporter().reportError(primaryError, {
    phase: 'initialization',
    step: 1,
  });
}

function generateSecondaryErrorReport(
  secondaryError: ConfigurationError,
  primaryError: ConfigurationError,
  primaryReport: any
): any {
  return errorReporter().reportError(secondaryError, {
    phase: 'initialization',
    step: 2,
    primaryError: {
      name: primaryError.name,
      message: primaryError.message,
      timestamp: primaryReport.timestamp,
    },
  });
}

function endCascadingErrorTimer(): void {
  debugManager().endTimer('cascading-error-test');
}

async function performCascadingErrorReporting(): Promise<{
  primaryReport: any;
  secondaryReport: any;
}> {
  const { primaryError, secondaryError } = createCascadingErrors();
  startCascadingErrorTimer();

  const primaryReport = generatePrimaryErrorReport(primaryError);
  const secondaryReport = generateSecondaryErrorReport(
    secondaryError,
    primaryError,
    primaryReport
  );

  endCascadingErrorTimer();
  return { primaryReport, secondaryReport };
}

function validateCascadingErrorReports(
  primaryReport: any,
  secondaryReport: any
): void {
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

  const recoveryManager = getRecoveryManager();
  recoveryManager.registerStrategy('TTSError', strategy);

  const operation = async () => {
    return failure(error);
  };

  return { strategy, operation };
}

function startPerformanceRecoveryTimer(): void {
  debugManager().startTimer('performance-recovery-test');
}

async function executeRecoveryWithPerformanceTracking(
  operation: () => Promise<any>
): Promise<any> {
  return executeWithRecovery(operation, 'tts-operation', 3, {
    audioFormat: 'mp3',
    voice: 'default',
  });
}

function endPerformanceRecoveryTimer(result: any): void {
  debugManager().endTimer('performance-recovery-test', {
    audioFormat: 'mp3',
    voice: 'default',
    success: result.success,
  });
}

async function performPerformanceRecoveryTest(
  strategy: any,
  operation: () => Promise<any>
): Promise<any> {
  startPerformanceRecoveryTimer();
  const result = await executeRecoveryWithPerformanceTracking(operation);
  endPerformanceRecoveryTimer(result);
  return result;
}

function validatePerformanceRecoveryResult(result: any): void {
  expect(result.success).toBe(true);
}

function validatePerformanceRecoveryMetrics(): void {
  const metrics = debugManager().getPerformanceMetrics(
    'performance-recovery-test'
  );
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

function takeInitialMemorySnapshot(memoryDebugManager: DebugManager): any {
  return memoryDebugManager.takeMemorySnapshot('initial');
}

function generateTestErrorsForMemoryTracking(): void {
  for (let i = 0; i < 10; i++) {
    const error = new Error(`Test error ${i}`);
    errorReporter().reportError(error, {
      errorIndex: i,
      batch: 'memory-test',
    });
  }
}

function takeFinalMemorySnapshot(memoryDebugManager: DebugManager): any {
  return memoryDebugManager.takeMemorySnapshot('final');
}

async function performMemoryTrackingTest(): Promise<{
  initialSnapshot: any;
  finalSnapshot: any;
  memoryDebugManager: DebugManager;
}> {
  const memoryDebugManager = createMemoryDebugManager();
  const initialSnapshot = takeInitialMemorySnapshot(memoryDebugManager);
  generateTestErrorsForMemoryTracking();
  await createDelay();
  const finalSnapshot = takeFinalMemorySnapshot(memoryDebugManager);

  return { initialSnapshot, finalSnapshot, memoryDebugManager };
}

function validateMemoryTrackingResults(
  memoryDebugManager: DebugManager,
  initialSnapshot: any,
  finalSnapshot: any
): void {
  const snapshots = memoryDebugManager.getMemorySnapshots();
  expect(snapshots).toHaveLength(2);
  expect(finalSnapshot.timestamp).toBeGreaterThan(initialSnapshot.timestamp);
  expect(initialSnapshot.timestamp).toBeDefined();
  expect(finalSnapshot.timestamp).toBeDefined();
  expect(finalSnapshot.heapUsed).toBeGreaterThan(0);
}

describe('Complex Error Scenarios Tests', () => {
  setupErrorHandlingTests();

  describe('complex error scenarios', () => {
    it('should handle cascading errors with context preservation', async () => {
      const { primaryReport, secondaryReport } =
        await performCascadingErrorReporting();

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
      const { initialSnapshot, finalSnapshot, memoryDebugManager } =
        await performMemoryTrackingTest();

      validateMemoryTrackingResults(
        memoryDebugManager,
        initialSnapshot,
        finalSnapshot
      );
    });
  });
});
