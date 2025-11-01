import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { success, failure, BunTtsBaseError } from '../../src/errors/index.js';
import type { ConfigOptions } from '../../src/types/index.js';
import {
  immediate,
  tick,
  _conditionalDelay,
} from '../../src/utils/deterministic-timing.js';

/**
 * Create a temporary directory for testing
 * @param {string} prefix - The prefix for the temporary directory name
 * @returns {Promise<string>} Promise that resolves to the path of the created temporary directory
 */
export async function createTempDir(prefix = 'bun-tts-test-'): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix));
}

/**
 * Clean up a temporary directory
 * @param {string} dir - The path to the directory to clean up
 * @returns {Promise<void>} Promise that resolves when the directory has been removed
 */
export async function cleanupTempDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}

/**
 * Create a mock configuration for testing
 * @param {Partial<ConfigOptions>} overrides - Partial configuration options to override defaults
 * @returns {ConfigOptions} A complete mock configuration object
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
 * @returns {{logs: string[], errors: string[], warns: string[], restore: () => void}} Object containing mocked console methods and restore function
 */
export function mockConsole(): {
  logs: string[];
  errors: string[];
  warns: string[];
  restore: () => void;
} {
  // Store references to original console methods
  const originalConsole = {
    log: globalThis.console?.log,
    error: globalThis.console?.error,
    warn: globalThis.console?.warn,
  };

  const logs: string[] = [];
  const errors: string[] = [];
  const warns: string[] = [];

  // Create mock methods
  const mockLog = (...args: unknown[]): void => {
    logs.push(args.map(String).join(' '));
  };

  const mockError = (...args: unknown[]): void => {
    errors.push(args.map(String).join(' '));
  };

  const mockWarn = (...args: unknown[]): void => {
    warns.push(args.map(String).join(' '));
  };

  // Replace console methods on globalThis
  if (globalThis.console) {
    globalThis.console.log = mockLog;
    globalThis.console.error = mockError;
    globalThis.console.warn = mockWarn;
  }

  const restore = (): void => {
    // Restore original console methods
    if (globalThis.console && originalConsole.log) {
      globalThis.console.log = originalConsole.log;
    }
    if (globalThis.console && originalConsole.error) {
      globalThis.console.error = originalConsole.error;
    }
    if (globalThis.console && originalConsole.warn) {
      globalThis.console.warn = originalConsole.warn;
    }
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
 * @param {number} ms - The number of milliseconds to wait
 * @returns {Promise<void>} Promise that resolves immediately for testing purposes
 */
export function wait(ms: number): Promise<void> {
  // For tests, always use immediate resolution to avoid hard waits
  // If specific timing is needed for production behavior, use conditionalDelay
  return ms === 0 ? immediate() : tick();
}

/**
 * Create a test-time delay that can be controlled
 * For tests that need actual timing behavior
 * @param {number} ms - The number of milliseconds to delay
 * @returns {Promise<void>} Promise that resolves after the specified delay in test environment
 */
export function testDelay(ms: number): Promise<void> {
  return _conditionalDelay(ms, true); // Force test environment
}

/**
 * Create a simple counter for tracking function calls (replaces jest.fn())
 * @returns {{count: number, lastArgs: unknown[], call: (...args: unknown[]) => void, reset: () => void}} Object with count, lastArgs, call, and reset methods
 */
export function createCounter(): {
  count: number;
  lastArgs: unknown[];
  call: (...args: unknown[]) => void;
  reset: () => void;
} {
  let count = 0;
  let lastArgs: unknown[] = [];

  return {
    get count(): number {
      return count;
    },
    get lastArgs(): unknown[] {
      return lastArgs;
    },
    call(...args: unknown[]): void {
      count++;
      lastArgs = args;
    },
    reset(): void {
      count = 0;
      lastArgs = [];
    },
  };
}

/**
 * Create a mock function that returns a value (replaces jest.fn().mockReturnValue())
 * @template T
 * @param {T} returnValue - The value that the mock function should return
 * @returns {{count: number, lastArgs: unknown[], call: (...args: unknown[]) => void, reset: () => void, fn: (...args: unknown[]) => T}} Mock function object with counter functionality
 */
export function createMockFn<T>(returnValue: T): {
  count: number;
  lastArgs: unknown[];
  call: (...args: unknown[]) => void;
  reset: () => void;
  fn: (...args: unknown[]) => T;
} {
  const counter = createCounter();

  return {
    ...counter,
    fn: (...args: unknown[]) => {
      counter.call(...args);
      return returnValue;
    },
  };
}

/**
 * Create a recovery strategy that tracks multiple attempts
 * @param {{count: number, call: (...args: unknown[]) => void}} attemptCounter - Counter for tracking attempts
 * @returns {{canRecover: () => boolean, recover: (error: any, context?: any) => Promise<any>, maxRetries: number, retryDelay: number}} Mock recovery strategy
 */
export function createRecoveryStrategyWithMultipleAttempts(attemptCounter: {
  count: number;
  call: (...args: unknown[]) => void;
}): {
  canRecover: () => boolean;
  recover: (error: any, context?: any) => Promise<any>;
  maxRetries: number;
  retryDelay: number;
} {
  return {
    canRecover: () => true,
    recover: async (error: any, context?: any) => {
      attemptCounter.call();
      if (attemptCounter.count < 3) {
        // Fail for first 3 attempts
        return Promise.resolve(
          failure(
            new BunTtsBaseError(
              `Recovery attempt ${attemptCounter.count} failed`,
              'RECOVERY_FAILED',
              'configuration'
            )
          )
        );
      }
      // Succeed on 4th attempt
      return Promise.resolve(
        success({
          recovered: true,
          attempts: attemptCounter.count,
          context,
        })
      );
    },
    maxRetries: 5,
    retryDelay: 10,
  };
}

/**
 * Create a failing operation that tracks attempts
 * @param {{count: number, call: (...args: unknown[]) => void}} attemptCounter - Counter for tracking attempts
 * @returns {() => Promise<any>} Mock failing operation
 */
export function createFailingOperationWithAttempts(attemptCounter: {
  count: number;
  call: (...args: unknown[]) => void;
}): () => Promise<any> {
  return () => {
    attemptCounter.call();
    return Promise.resolve(
      failure(
        new BunTtsBaseError(
          `Operation attempt ${attemptCounter.count} failed`,
          'OPERATION_FAILED',
          'configuration'
        )
      )
    );
  };
}
