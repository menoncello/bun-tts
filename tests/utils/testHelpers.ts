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
 * Uses deterministic timing to avoid hard waits in tests
 */
export function wait(ms: number): Promise<void> {
  // Import deterministic timing utility
  const { immediate, tick } = require('../../src/utils/deterministic-timing');

  // For tests, always use immediate resolution to avoid hard waits
  // If specific timing is needed for production behavior, use conditionalDelay
  return ms === 0 ? immediate() : tick();
}

/**
 * Create a test-time delay that can be controlled
 * For tests that need actual timing behavior
 */
export function testDelay(ms: number): Promise<void> {
  const { conditionalDelay } = require('../../src/utils/deterministic-timing');
  return conditionalDelay(ms, true); // Force test environment
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
