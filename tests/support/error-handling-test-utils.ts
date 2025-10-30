import { beforeEach, afterEach } from 'bun:test';
import {
  ConfigurationError,
  FileNotFoundError,
  TTSError,
  success,
  failure,
} from '../../src/errors/index.js';
import { debugManager, DebugManager } from '../../src/utils/debug.js';

export function setupErrorHandlingTests(): void {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
    cleanupDebugManager();
  });
}

export function createTraceEnabledManager(): DebugManager {
  (DebugManager as any).instance = null;
  return DebugManager.getInstance({
    enableTrace: true,
    logLevel: 'debug',
  });
}

export function createTraceDisabledManager(): DebugManager {
  (DebugManager as any).instance = null;
  return DebugManager.getInstance({
    enableTrace: false,
    logLevel: 'debug',
  });
}

export function resetDebugManagerInstance(): void {
  (DebugManager as any).instance = null;
}

export function cleanupDebugManager(): void {
  const dm = debugManager();
  dm.clearLogs();
  dm.clearPerformanceMetrics();
  dm.clearMemorySnapshots();
}

export async function createDelay(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1));
}

export function createConfigurationError(): ConfigurationError {
  return new ConfigurationError('Configuration file is corrupted', {
    filePath: '/invalid/config.json',
    line: 15,
    column: 5,
  });
}

export function createCascadingErrors(): {
  primaryError: ConfigurationError;
  secondaryError: FileNotFoundError;
} {
  const primaryError = new ConfigurationError('Primary config error');
  const secondaryError = new FileNotFoundError('Secondary file error');
  return { primaryError, secondaryError };
}

export function createMultiStrategyError(): ConfigurationError {
  return new ConfigurationError('Complex config error');
}

export function createMemoryDebugManager(): DebugManager {
  DebugManager.resetInstance();
  return DebugManager.getInstance({
    enableMemoryTracking: true,
    logLevel: 'debug',
  });
}

export function createUserContextTestErrors(): {
  configError: ConfigurationError;
  fileError: FileNotFoundError;
  ttsError: TTSError;
} {
  return {
    configError: new ConfigurationError('Config error'),
    fileError: new FileNotFoundError('File error'),
    ttsError: new TTSError('TTS error'),
  };
}

export function createRecoveryOperations(error: FileNotFoundError) {
  let _fallbackCalled = false;

  const failingOperation = async () => {
    return failure(error);
  };

  const fallbackOperation = async () => {
    _fallbackCalled = true;
    return success('fallback-success');
  };

  return { failingOperation, fallbackOperation };
}
