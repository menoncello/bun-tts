import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { type BunTtsConfig, DEFAULT_CONFIG } from '../../../src/types/config';

/**
 * Creates a mock file system for testing
 */
export function createMockFileSystem(): Record<string, string> {
  const tempDir = mkdtempSync(join(tmpdir(), 'bun-tts-mock-'));
  return {
    [join(tempDir, 'default.json')]: JSON.stringify(DEFAULT_CONFIG),
    [join(tempDir, 'user.json')]: JSON.stringify({
      logging: { level: 'debug' },
      tts: { defaultEngine: 'chatterbox' },
    }),
    [join(tempDir, 'invalid.json')]: '{ invalid json }',
    [join(tempDir, 'empty.json')]: '{}',
    // Add paths that tests expect
    ['/config/default.json']: JSON.stringify(DEFAULT_CONFIG),
    ['/config/workflow-test.json']: '', // Will be populated during test
    ['/config/invalid.json']: '{ invalid json }',
    ['/config/empty.json']: '{}',
  };
}

/**
 * Creates a test configuration with custom values
 */
export function createCustomTestConfig(tempDir?: string): BunTtsConfig {
  const testTempDir = tempDir || mkdtempSync(join(tmpdir(), 'bun-tts-test-'));
  return {
    logging: {
      level: 'debug',
      pretty: false,
      file: true,
      filePath: join(testTempDir, 'app.log'),
    },
    tts: {
      defaultEngine: 'chatterbox',
      outputFormat: 'wav',
      sampleRate: 44100,
      quality: 0.9,
      defaultVoice: 'custom-voice',
      rate: 1.2,
      volume: 0.8,
    },
    processing: {
      maxFileSize: 200,
      parallel: false,
      maxWorkers: 2,
      tempDir: join(testTempDir, 'custom'),
    },
    cli: {
      showProgress: false,
      colors: false,
      debug: true,
    },
    cache: {
      enabled: false,
      dir: join(testTempDir, 'custom-cache'),
      maxSize: 2048,
      ttl: 7200,
    },
  };
}

/**
 * Creates a partial configuration for testing
 */
export function createPartialConfig(): Partial<BunTtsConfig> {
  return {
    logging: {
      level: 'warn',
      pretty: true,
      file: false,
    },
    tts: {
      defaultEngine: 'kokoro',
      outputFormat: 'mp3',
      sampleRate: 22050,
      quality: 0.7,
      rate: 1.0,
      volume: 1.0,
    },
  };
}

/**
 * Mock implementation of file system operations
 */
export function createMockFileSystemOperations() {
  const files = createMockFileSystem();

  return {
    readFile: async (path: string): Promise<string | null> =>
      files[path] || null,
    writeFile: async (path: string, content: string): Promise<void> => {
      files[path] = content;
    },
    exists: async (path: string): Promise<boolean> => path in files,
    deleteFile: async (path: string): Promise<void> => {
      delete files[path];
    },
    reset: (): void => {
      Object.assign(files, createMockFileSystem());
    },
  };
}

/**
 * Creates a mock logger for testing
 */
export function createMockLogger() {
  const logs: string[] = [];

  return {
    logs,
    debug: (message: string, metadata?: Record<string, unknown>) => {
      const metaStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
      logs.push(`DEBUG: ${message}${metaStr}`);
    },
    info: (message: string, metadata?: Record<string, unknown>) => {
      const metaStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
      logs.push(`INFO: ${message}${metaStr}`);
    },
    warn: (message: string, metadata?: Record<string, unknown>) => {
      const metaStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
      logs.push(`WARN: ${message}${metaStr}`);
    },
    error: (message: string, metadata?: Record<string, unknown>) => {
      const metaStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
      logs.push(`ERROR: ${message}${metaStr}`);
    },
    fatal: (message: string, metadata?: Record<string, unknown>) => {
      const metaStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
      logs.push(`FATAL: ${message}${metaStr}`);
    },
    trace: (message: string, metadata?: Record<string, unknown>) => {
      const metaStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
      logs.push(`TRACE: ${message}${metaStr}`);
    },
    child: (_bindings: Record<string, unknown>) => createMockLogger(),
    get level(): string {
      return 'mock';
    },
    write: (_chunk: unknown) => {
      // No-op
    },
    clear: () => (logs.length = 0),
  };
}

/**
 * Helper to create test scenarios with different file system states
 */
export function createTestScenarios() {
  return {
    validConfig: {
      fileSystem: createMockFileSystem(),
      expectedConfig: DEFAULT_CONFIG,
      shouldPass: true,
    },
    missingFile: {
      fileSystem: { '/config/default.json': JSON.stringify(DEFAULT_CONFIG) },
      expectedConfig: DEFAULT_CONFIG,
      shouldPass: true,
    },
    invalidJson: {
      fileSystem: {
        '/config/default.json': '{ invalid json }',
        '/config/user.json': JSON.stringify({
          logging: { level: 'debug' },
        }),
      },
      expectedConfig: undefined,
      shouldPass: false,
    },
    emptyConfig: {
      fileSystem: {
        '/config/default.json': '{}',
        '/config/user.json': JSON.stringify({
          logging: { level: 'debug' },
        }),
      },
      expectedConfig: undefined,
      shouldPass: false,
    },
  };
}
