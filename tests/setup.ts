// Bun Test setup file for global test configuration

// Set environment for testing
process.env.NODE_ENV = 'test';
process.env.NO_COLOR = 'true';

// Import DI components for testing
import { MockLogger } from '../src/interfaces/logger.js';
import { DebugManager } from '../src/utils/debug.js';
import { ErrorReporter } from '../src/utils/error-reporter.js';
import { createSilentLogger } from './mocks/logger-mock.js';

// Global test utilities
declare global {
  namespace Bun {
    interface TestGlobals {
      // Test utilities for logger injection
      createMockLogger(): MockLogger;
      createDebugManager(options?: any, logger?: MockLogger): DebugManager;
      createErrorReporter(options?: any, logger?: MockLogger): ErrorReporter;
      resetSingletons(): void;
    }
  }
}

// Initialize silent singleton instances for testing
const silentLogger = createSilentLogger();
const silentErrorReporter = ErrorReporter.createInstance(
  {
    environment: 'test',
    enableConsoleReporting: false,
    enableFileReporting: false,
  },
  silentLogger
);

const silentDebugManager = DebugManager.createInstance(
  {
    enableTrace: false,
    enablePerformanceTracking: false,
    enableMemoryTracking: false,
    logLevel: 'error',
  },
  silentLogger
);

// Create global test utilities
(globalThis as any).BunTestGlobals = {
  createMockLogger: (): MockLogger => {
    return new MockLogger();
  },

  createDebugManager: (options?: any, logger?: MockLogger): DebugManager => {
    return DebugManager.createInstance(options, logger || silentLogger);
  },

  createErrorReporter: (options?: any, logger?: MockLogger): ErrorReporter => {
    return ErrorReporter.createInstance(options, logger || silentLogger);
  },

  resetSingletons: (): void => {
    DebugManager.resetInstance();
    ErrorReporter.resetInstance();
  },

  // Access to silent instances for testing
  getSilentLogger: () => silentLogger,
  getSilentErrorReporter: () => silentErrorReporter,
  getSilentDebugManager: () => silentDebugManager,
};

// Test utilities are available via exports from this setup file

// Global helper functions for backward compatibility
export const createMockLogger = (globalThis as any).BunTestGlobals
  .createMockLogger;
export const createDebugManager = (globalThis as any).BunTestGlobals
  .createDebugManager;
export const createErrorReporter = (globalThis as any).BunTestGlobals
  .createErrorReporter;
export const resetSingletons = (globalThis as any).BunTestGlobals
  .resetSingletons;
