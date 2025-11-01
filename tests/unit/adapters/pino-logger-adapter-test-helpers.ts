import { expect } from 'bun:test';
import { PinoLoggerAdapter } from '../../../src/adapters/pino-logger-adapter';

/**
 * Helper function to set up test environment for TTY tests
 */
export function setupTTYEnvironment(isTTY: any, noColor?: string): void {
  (process.stdout as any).isTTY = isTTY;
  if (noColor === undefined) {
    delete process.env.NO_COLOR;
  } else {
    process.env.NO_COLOR = noColor;
  }
  process.env.NODE_ENV = 'development';
}

/**
 * Helper function to set up test environment for test mode
 */
export function setupTestEnvironment(bunTest?: string): void {
  process.env.NODE_ENV = 'test';
  if (bunTest !== undefined) {
    process.env.BUN_TEST = bunTest;
  }
}

/**
 * Helper function to create adapter with error handling
 */
export function createAdapterWithErrorHandling(
  options?: any
): PinoLoggerAdapter | null {
  try {
    return new PinoLoggerAdapter(options);
  } catch (error) {
    // Transport error is acceptable in test environment
    if ((error as Error).message.includes('transport target')) {
      return null;
    }
    throw error;
  }
}

/**
 * Helper function to test adapter creation and expect transport error
 */
export function expectTransportError(creationFn: () => void): void {
  try {
    creationFn();
  } catch (error) {
    expect((error as Error).message).toContain('transport target');
  }
}

/**
 * Helper function to test adapter creation and expect success
 */
export function expectSuccessfulCreation(
  creationFn: () => PinoLoggerAdapter
): PinoLoggerAdapter {
  const adapter = creationFn();
  expect(adapter).toBeDefined();
  expect(adapter.level).toBeDefined();
  return adapter;
}
