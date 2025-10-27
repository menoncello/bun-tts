import type { Logger } from '../../src/interfaces/logger.js';

/**
 * Silent Logger implementation for testing - outputs nothing
 */
export class SilentLogger implements Logger {
  debug(message: string, metadata?: Record<string, unknown>): void {
    // Silent - no output
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    // Silent - no output
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    // Silent - no output
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    // Silent - no output
  }

  fatal(message: string, metadata?: Record<string, unknown>): void {
    // Silent - no output
  }

  child(_bindings: Record<string, unknown>): Logger {
    return new SilentLogger();
  }

  get level(): string {
    return 'silent';
  }

  write(_chunk: unknown): void {
    // Silent - no output
  }
}

/**
 * Initialize the call tracking object for mock logger
 */
const initializeCallTracking = () => ({
  debug: [] as Array<[string, any?]>,
  info: [] as Array<[string, any?]>,
  warn: [] as Array<[string, any?]>,
  error: [] as Array<[string, any?]>,
  fatal: [] as Array<[string, any?]>,
});

/**
 * Create logging method for specific level
 */
const createLoggingMethod = (calls: Record<string, Array<[string, any?]>>, level: string) => {
  return (message: string, metadata?: Record<string, unknown>) => {
    if (calls[level]) {
      calls[level].push([message, metadata]);
    }
  };
};

/**
 * Create helper methods for call tracking
 */
const createHelperMethods = (calls: Record<string, Array<[string, any?]>>) => ({
  getCalls: (level: keyof typeof calls) => calls[level] || [],
  getAllCalls: () => ({ ...calls }),
  clearCalls: () => {
    Object.keys(calls).forEach((key) => {
      calls[key as keyof typeof calls] = [];
    });
  },
  wasCalledWith: (level: keyof typeof calls, message: string) => {
    const levelCalls = calls[level];
    return levelCalls ? levelCalls.some(([msg]) => msg === message) : false;
  },
});

/**
 * Create a mock logger with tracking capabilities
 */
export const createMockLogger = () => {
  const calls = initializeCallTracking();

  return {
    debug: createLoggingMethod(calls, 'debug'),
    info: createLoggingMethod(calls, 'info'),
    warn: createLoggingMethod(calls, 'warn'),
    error: createLoggingMethod(calls, 'error'),
    fatal: createLoggingMethod(calls, 'fatal'),
    child: (_bindings: Record<string, unknown>) => {
      return createMockLogger();
    },
    get level(): string {
      return 'mock';
    },
    write: (_chunk: unknown) => {
      // No-op
    },
    ...createHelperMethods(calls),
  };
};

/**
 * Create a silent logger instance for tests
 */
export const createSilentLogger = (): Logger => {
  return new SilentLogger();
};
