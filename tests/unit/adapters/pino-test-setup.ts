/**
 * Test setup utilities for PinoLoggerAdapter tests
 */

export interface PinoTestEnvironment {
  originalEnv: NodeJS.ProcessEnv;
  originalStdout: any;
}

/**
 * Sets up test environment for PinoLoggerAdapter tests
 */
export function setupPinoTestEnvironment(): PinoTestEnvironment {
  const originalEnv = { ...process.env };
  const originalStdout = process.stdout.isTTY;

  // Ensure test environment settings
  process.env.NODE_ENV = 'test';
  process.env.NO_COLOR = 'true';

  return { originalEnv, originalStdout };
}

/**
 * Restores test environment after PinoLoggerAdapter tests
 */
export function restorePinoTestEnvironment(env: PinoTestEnvironment): void {
  process.env = env.originalEnv;
  (process.stdout as any).isTTY = env.originalStdout;
}
