import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type { BunTtsConfig } from '../../../src/types/config';

/**
 * Creates a test configuration with all required properties
 */
export function createTestConfig(tempDir?: string): BunTtsConfig {
  const testTempDir = tempDir || mkdtempSync(join(tmpdir(), 'bun-tts-test-'));
  return {
    logging: {
      level: 'info',
      pretty: true,
      file: false,
      filePath: './test.log',
    },
    tts: {
      defaultEngine: 'kokoro',
      outputFormat: 'mp3',
      sampleRate: 22050,
      quality: 0.8,
      defaultVoice: 'default',
      rate: 1.0,
      volume: 1.0,
    },
    processing: {
      maxFileSize: 100,
      parallel: true,
      maxWorkers: 4,
      tempDir: testTempDir,
    },
    cli: {
      showProgress: true,
      colors: true,
      debug: false,
    },
    cache: {
      enabled: true,
      dir: join(testTempDir, 'cache'),
      maxSize: 1024,
      ttl: 3600,
    },
  };
}

/**
 * Creates a partial configuration for testing with missing logging section
 */
export function createConfigWithUndefinedLogging(tempDir?: string): any {
  const testTempDir = tempDir || mkdtempSync(join(tmpdir(), 'bun-tts-test-'));
  return {
    tts: {
      defaultEngine: 'kokoro',
      outputFormat: 'mp3',
      sampleRate: 22050,
      quality: 0.8,
      rate: 1.0,
      volume: 1.0,
    },
    processing: {
      maxFileSize: 100,
      parallel: true,
      maxWorkers: 4,
      tempDir: testTempDir,
    },
    cli: {
      showProgress: true,
      colors: true,
      debug: false,
    },
    cache: {
      enabled: true,
      dir: join(testTempDir, 'cache'),
      maxSize: 1024,
      ttl: 3600,
    },
  };
}

/**
 * Creates a test configuration with null logging section
 */
export function createConfigWithNullLogging(tempDir?: string): any {
  const testTempDir = tempDir || mkdtempSync(join(tmpdir(), 'bun-tts-test-'));
  return {
    logging: null,
    tts: {
      defaultEngine: 'kokoro',
      outputFormat: 'mp3',
      sampleRate: 22050,
      quality: 0.8,
      rate: 1.0,
      volume: 1.0,
    },
    processing: {
      maxFileSize: 100,
      parallel: true,
      maxWorkers: 4,
      tempDir: testTempDir,
    },
    cli: {
      showProgress: true,
      colors: true,
      debug: false,
    },
    cache: {
      enabled: true,
      dir: join(testTempDir, 'cache'),
      maxSize: 1024,
      ttl: 3600,
    },
  };
}

/**
 * Creates a test configuration with test array property
 */
export function createConfigWithTestArray(): any {
  const baseConfig = createTestConfig();
  return {
    ...baseConfig,
    testArray: ['item1', 'item2', 'item3'],
  };
}
