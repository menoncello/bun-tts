import type { Logger } from '../../src/interfaces/logger.js';

/**
 * Simple mock function for type definitions
 * @param {T} fn - Function to mock
 * @returns {T} Mocked function
 * @template T
 */
function _mock<T extends (...args: any[]) => any>(fn: T): T {
  return fn;
}

/**
 * Silent Logger implementation for testing - outputs nothing
 */
export class SilentLogger implements Logger {
  /**
   * Log debug message (silent)
   * @param {string} _message - The debug message to log
   * @param {Record<string, unknown>} [_metadata] - Optional metadata to include with the message
   */
  debug(_message: string, _metadata?: Record<string, unknown>): void {
    // Silent - no output
  }

  /**
   * Log info message (silent)
   * @param {string} _message - The info message to log
   * @param {Record<string, unknown>} [_metadata] - Optional metadata to include with the message
   */
  info(_message: string, _metadata?: Record<string, unknown>): void {
    // Silent - no output
  }

  /**
   * Log warning message (silent)
   * @param {string} _message - The warning message to log
   * @param {Record<string, unknown>} [_metadata] - Optional metadata to include with the message
   */
  warn(_message: string, _metadata?: Record<string, unknown>): void {
    // Silent - no output
  }

  /**
   * Log error message (silent)
   * @param {string} _message - The error message to log
   * @param {Record<string, unknown>} [_metadata] - Optional metadata to include with the message
   */
  error(_message: string, _metadata?: Record<string, unknown>): void {
    // Silent - no output
  }

  /**
   * Log fatal message (silent)
   * @param {string} _message - The fatal message to log
   * @param {Record<string, unknown>} [_metadata] - Optional metadata to include with the message
   */
  fatal(_message: string, _metadata?: Record<string, unknown>): void {
    // Silent - no output
  }

  /**
   * Create a child logger with additional bindings (silent)
   * @param {Record<string, unknown>} _bindings - The bindings to add to the child logger
   * @returns {Logger} A new SilentLogger instance
   */
  child(_bindings: Record<string, unknown>): Logger {
    return new SilentLogger();
  }

  /**
   * Get the log level
   * @returns {string} The string 'silent'
   */
  get level(): string {
    return 'silent';
  }

  /**
   * Write a chunk of data (silent)
   * @param {unknown} _chunk - The chunk of data to write
   */
  write(_chunk: unknown): void {
    // Silent - no output
  }
}

/**
 * Initialize the call tracking object for mock logger
 * @returns {object} Object with arrays to track calls for each log level
 */
const initializeCallTracking = (): {
  debug: Array<[string, any?]>;
  info: Array<[string, any?]>;
  warn: Array<[string, any?]>;
  error: Array<[string, any?]>;
  fatal: Array<[string, any?]>;
} => ({
  debug: [] as Array<[string, any?]>,
  info: [] as Array<[string, any?]>,
  warn: [] as Array<[string, any?]>,
  error: [] as Array<[string, any?]>,
  fatal: [] as Array<[string, any?]>,
});

/**
 * Create logging method for specific level
 * @param {Record<string, Array<[string, any?]>>} calls - The call tracking object
 * @param {string} level - The log level for this method
 * @returns {function} A logging function that tracks calls
 */
const createLoggingMethod = (
  calls: Record<string, Array<[string, any?]>>,
  level: string
): ((message: string, metadata?: Record<string, unknown>) => void) => {
  return (message: string, metadata?: Record<string, unknown>) => {
    if (calls[level]) {
      calls[level].push([message, metadata]);
    }
  };
};

/**
 * Create helper methods for call tracking
 * @param {Record<string, Array<[string, any?]>>} calls - The call tracking object
 * @returns {object} Object with helper methods for accessing and managing call data
 */
const createHelperMethods = (
  calls: Record<string, Array<[string, any?]>>
): {
  getCalls: (level: keyof typeof calls) => Array<[string, any?]>;
  getAllCalls: () => Record<string, Array<[string, any?]>>;
  clearCalls: () => void;
  wasCalledWith: (level: keyof typeof calls, message: string) => boolean;
} => ({
  getCalls: (level: keyof typeof calls) => calls[level] || [],
  getAllCalls: () => ({ ...calls }),
  clearCalls: () => {
    for (const key of Object.keys(calls)) {
      calls[key as keyof typeof calls] = [];
    }
  },
  wasCalledWith: (level: keyof typeof calls, message: string) => {
    const levelCalls = calls[level];
    return levelCalls ? levelCalls.some(([msg]) => msg === message) : false;
  },
});

/**
 * Create a mock logger with tracking capabilities
 * @returns {object} A mock logger object with call tracking functionality
 */
export const createMockLogger = (): Logger & {
  debug: ReturnType<typeof _mock>;
  info: ReturnType<typeof _mock>;
  warn: ReturnType<typeof _mock>;
  error: ReturnType<typeof _mock>;
  fatal: ReturnType<typeof _mock>;
  child: ReturnType<typeof _mock>;
  level: string;
  write: ReturnType<typeof _mock>;
  getCalls: (level: string) => Array<[string, any?]>;
  getAllCalls: () => Record<string, Array<[string, any?]>>;
  clearCalls: () => void;
  wasCalledWith: (level: string, message: string) => boolean;
} => {
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
 * @returns {Logger} A SilentLogger instance
 */
export const createSilentLogger = (): Logger => {
  return new SilentLogger();
};
