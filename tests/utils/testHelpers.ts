import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import type { ConfigOptions } from '../../src/types/index.js';

/**
 * Create a temporary directory for testing
 */
export async function createTempDir(prefix = 'bun-tts-test-'): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix));
}

/**
 * Clean up a temporary directory
 */
export async function cleanupTempDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}

/**
 * Create a mock configuration for testing
 */
export function createMockConfig(
  overrides: Partial<ConfigOptions> = {}
): ConfigOptions {
  return {
    ttsEngine: 'kokoro',
    voiceSettings: {
      speed: 1.0,
      pitch: 1.0,
      volume: 1.0,
      emotion: {
        enabled: false,
        engine: 'ai',
        intensity: 0.5,
      },
    },
    outputFormat: 'mp3',
    sampleRate: 22050,
    channels: 1,
    bitrate: 128,
    ...overrides,
  };
}

/**
 * Mock console methods for testing (Bun-compatible)
 */
export function mockConsole() {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  const logs: string[] = [];
  const errors: string[] = [];
  const warns: string[] = [];

  console.log = (...args: unknown[]) => {
    logs.push(args.map(String).join(' '));
  };

  console.error = (...args: unknown[]) => {
    errors.push(args.map(String).join(' '));
  };

  console.warn = (...args: unknown[]) => {
    warns.push(args.map(String).join(' '));
  };

  const restore = () => {
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
  };

  return {
    logs,
    errors,
    warns,
    restore,
  };
}

/**
 * Wait for a specified amount of time (for async testing)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Create a simple counter for tracking function calls (replaces jest.fn())
 */
export function createCounter() {
  let count = 0;
  let lastArgs: unknown[] = [];

  return {
    get count() {
      return count;
    },
    get lastArgs() {
      return lastArgs;
    },
    call(...args: unknown[]) {
      count++;
      lastArgs = args;
    },
    reset() {
      count = 0;
      lastArgs = [];
    },
  };
}

/**
 * Create a mock function that returns a value (replaces jest.fn().mockReturnValue())
 */
export function createMockFn<T>(returnValue: T) {
  const counter = createCounter();

  return {
    ...counter,
    fn: (...args: unknown[]) => {
      counter.call(...args);
      return returnValue;
    },
  };
}
