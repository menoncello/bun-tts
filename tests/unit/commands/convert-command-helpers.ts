import {
  createMockLogger,
  createMockConfigManager,
  createTestCliContext,
} from '../di/test-utils';

export interface MockConsole {
  logs: Array<[string]>;
  errors: Array<[string]>;
  restore: () => void;
}

/**
 * Creates a mock console for testing output
 */
export function mockConsoleLog(): MockConsole {
  const originalConsoleLog = globalThis.console.log;
  const originalConsoleError = globalThis.console.error;
  const logs: Array<[string]> = [];
  const errors: Array<[string]> = [];

  globalThis.console.log = (...args: any[]) => {
    logs.push([args.join(' ')]);
  };

  globalThis.console.error = (...args: any[]) => {
    errors.push([args.join(' ')]);
  };

  const restore = () => {
    globalThis.console.log = originalConsoleLog;
    globalThis.console.error = originalConsoleError;
  };

  return { logs, errors, restore };
}

/**
 * Creates test data for convert command tests
 */
export function createConvertTestData() {
  return {
    inputFile: '/path/to/input.md',
    outputFile: '/path/to/output.mp3',
    format: 'mp3',
    voice: 'default',
    rate: 1.0,
    volume: 1.0,
    sampleRate: 22050,
    quality: 0.8,
  };
}

/**
 * Creates mock document processor for testing
 */
export function createMockDocumentProcessor() {
  const calls: any[] = [];
  const fn = (...args: any[]) => {
    calls.push(args);
    return { success: true };
  };
  fn.calls = calls;
  fn.mockClear = () => (calls.length = 0);
  fn.mockCalls = () => [...calls];

  const fn2: any = (...args: any[]) => {
    calls.push(args);
    return true;
  };
  fn2.calls = calls;
  fn2.mockClear = () => (calls.length = 0);
  fn2.mockCalls = () => [...calls];

  const fn3: any = (...args: any[]) => {
    calls.push(args);
    return 'mp3';
  };
  fn3.calls = calls;
  fn3.mockClear = () => (calls.length = 0);
  fn3.mockCalls = () => [...calls];

  return {
    processDocument: fn,
    validateInput: fn2,
    getFormat: fn3,
  };
}

/**
 * Creates mock TTS engine for testing
 */
export function createMockTTSEngine() {
  const calls: any[] = [];
  const fn = (...args: any[]) => {
    calls.push(args);
    return { success: true };
  };
  fn.calls = calls;
  fn.mockClear = () => (calls.length = 0);
  fn.mockCalls = () => [...calls];

  const fn2: any = (...args: any[]) => {
    calls.push(args);
    return ['default', 'voice1', 'voice2'];
  };
  fn2.calls = calls;
  fn2.mockClear = () => (calls.length = 0);
  fn2.mockCalls = () => [...calls];

  const fn3: any = (...args: any[]) => {
    calls.push(args);
  };
  fn3.calls = calls;
  fn3.mockClear = () => (calls.length = 0);
  fn3.mockCalls = () => [...calls];

  return {
    synthesize: fn,
    getVoices: fn2,
    setVoice: fn3,
    setRate: fn3,
    setVolume: fn3,
  };
}

/**
 * Creates test context with all necessary mocks
 */
export function createConvertCommandTestContext() {
  const mockLogger = createMockLogger();
  const mockConfigManager = createMockConfigManager();
  const mockConsole = mockConsoleLog();
  const testData = createConvertTestData();
  const mockProcessor = createMockDocumentProcessor();
  const mockTTS = createMockTTSEngine();
  const cliContext = createTestCliContext();

  return {
    mockLogger,
    mockConfigManager,
    mockConsole,
    testData,
    mockProcessor,
    mockTTS,
    cliContext,
  };
}

/**
 * Cleans up test context after tests
 */
export function cleanupConvertCommandTestContext(
  context: ReturnType<typeof createConvertCommandTestContext>
) {
  context.mockConsole.restore();
}
