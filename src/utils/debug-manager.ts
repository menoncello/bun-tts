import { PinoLoggerAdapter } from '../adapters/pino-logger-adapter.js';
import type { Logger } from '../interfaces/logger.js';
import type { BunTtsError } from '../types/index.js';
import { DEFAULT_MAX_LOG_ENTRIES, BYTES_PER_KB, MAX_METRICS_PER_NAME } from './debug-constants.js';
import type { DebugOptions, PerformanceMetric, MemorySnapshot, DebugLog } from './debug-interfaces.js';
import { errorReporter } from './error-reporter.js';

/**
 * Manages debugging operations including performance tracking, memory monitoring, and logging.
 * This class provides a singleton pattern for centralized debugging functionality.
 */
class DebugManager {
  private static instance: DebugManager | null = null;
  private options: Required<DebugOptions>;
  private logger: Logger;
  private performanceMetrics: Map<string, PerformanceMetric[]> = new Map();
  private memorySnapshots: MemorySnapshot[] = [];
  private debugLogs: DebugLog[] = [];
  private activeTimers: Map<string, number> = new Map();

  /**
   * Creates a new DebugManager instance.
   * @param options - Configuration options for debugging behavior
   * @param logger - Optional custom logger implementation
   */
  private constructor(options: DebugOptions = {}, logger?: Logger) {
    this.options = {
      enableTrace: options.enableTrace ?? false,
      enablePerformanceTracking: options.enablePerformanceTracking ?? true,
      enableMemoryTracking: options.enableMemoryTracking ?? false,
      logLevel: options.logLevel ?? 'info',
      maxLogEntries: options.maxLogEntries ?? DEFAULT_MAX_LOG_ENTRIES,
    };

    // Dependency injection: use provided logger or create default
    this.logger =
      logger ||
      new PinoLoggerAdapter({
        flags: { verbose: this.options.enableTrace },
      });
  }

  /**
   * Gets the singleton DebugManager instance.
   * @param options - Configuration options for debugging behavior
   * @param logger - Optional custom logger implementation
   * @returns The singleton DebugManager instance
   */
  public static getInstance(
    options?: DebugOptions,
    logger?: Logger
  ): DebugManager {
    if (!DebugManager.instance) {
      DebugManager.instance = new DebugManager(options, logger);
    }
    return DebugManager.instance;
  }

  // Method to create a new instance with custom logger (for testing)
  /**
   * Creates a new DebugManager instance for testing purposes.
   * This method bypasses the singleton pattern to allow isolated testing.
   * @param options - Configuration options for debugging behavior
   * @param logger - Optional custom logger implementation
   * @returns A new DebugManager instance
   */
  public static createInstance(
    options?: DebugOptions,
    logger?: Logger
  ): DebugManager {
    return new DebugManager(options, logger);
  }

  // Reset singleton (useful for testing)
  /**
   * Resets the singleton instance. Useful for testing to ensure clean state between tests.
   */
  public static resetInstance(): void {
    DebugManager.instance = null;
  }

  // Performance tracking
  /**
   * Starts a performance timer for measuring execution time.
   * @param name - Unique identifier for the timer
   * @param metadata - Optional additional data to associate with the timer
   */
  public startTimer(name: string, metadata?: Record<string, unknown>): void {
    if (!this.options.enablePerformanceTracking) return;

    const startTime = Date.now();
    this.activeTimers.set(name, startTime);

    this.debug(`Timer started: ${name}`, {
      startTime,
      metadata,
    });
  }

  /**
   * Ends a performance timer and records the duration.
   * @param name - The unique identifier of the timer to end
   * @param metadata - Optional additional data to associate with the timer result
   * @returns The duration in milliseconds, or 0 if timer wasn't found
   */
  public endTimer(name: string, metadata?: Record<string, unknown>): number {
    if (!this.options.enablePerformanceTracking) return 0;

    const endTime = Date.now();
    const startTime = this.activeTimers.get(name);

    if (!startTime) {
      this.warn(`Timer not found: ${name}`);
      return 0;
    }

    const duration = endTime - startTime;
    this.activeTimers.delete(name);

    const metric: PerformanceMetric = {
      name,
      duration,
      startTime,
      endTime,
      metadata,
    };

    this.addPerformanceMetric(name, metric);
    this.debug(`Timer ended: ${name}`, {
      duration: `${duration}ms`,
      metadata,
    });

    return duration;
  }

  /**
   * Retrieves performance metrics for a specific timer or all timers.
   * @param name - Optional specific timer name to retrieve metrics for
   * @returns Array of performance metrics
   */
  public getPerformanceMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.performanceMetrics.get(name) || [];
    }
    return Array.from(this.performanceMetrics.values()).flat();
  }

  /**
   * Clears performance metrics for a specific timer or all timers.
   * @param name - Optional specific timer name to clear metrics for
   */
  public clearPerformanceMetrics(name?: string): void {
    if (name) {
      this.performanceMetrics.delete(name);
    } else {
      this.performanceMetrics.clear();
    }
  }

  // Memory tracking
  /**
   * Takes a snapshot of current memory usage for monitoring.
   * @param label - Optional label to identify this memory snapshot
   * @returns Memory snapshot data
   */
  public takeMemorySnapshot(label?: string): MemorySnapshot {
    const memUsage = process.memoryUsage();
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      arrayBuffers: (memUsage as { arrayBuffers?: number }).arrayBuffers || 0,
    };

    if (this.options.enableMemoryTracking) {
      this.memorySnapshots.push(snapshot);
      this.debug(`Memory snapshot: ${label || 'unnamed'}`, {
        heapUsed: `${Math.round(snapshot.heapUsed / BYTES_PER_KB / BYTES_PER_KB)}MB`,
        heapTotal: `${Math.round(snapshot.heapTotal / BYTES_PER_KB / BYTES_PER_KB)}MB`,
        rss: `${Math.round(snapshot.rss / BYTES_PER_KB / BYTES_PER_KB)}MB`,
      });
    }

    return snapshot;
  }

  /**
   * Retrieves all stored memory snapshots.
   * @returns Array of memory snapshot data
   */
  public getMemorySnapshots(): MemorySnapshot[] {
    return [...this.memorySnapshots];
  }

  /**
   * Clears all stored memory snapshots.
   */
  public clearMemorySnapshots(): void {
    this.memorySnapshots = [];
  }

  /**
   * Gets the logger instance used by this DebugManager.
   * @returns The logger instance
   */
  public getLogger(): Logger {
    return this.logger;
  }

  // Logging methods
  /**
   * Logs a debug message.
   * @param message - The debug message to log
   * @param metadata - Optional additional data to include with the log
   */
  public debug(message: string, metadata?: Record<string, unknown>): void {
    this.addLog('debug', message, metadata);
    this.logger.debug(message, metadata);
  }

  /**
   * Logs an info message.
   * @param message - The info message to log
   * @param metadata - Optional additional data to include with the log
   */
  public info(message: string, metadata?: Record<string, unknown>): void {
    this.addLog('info', message, metadata);
    this.logger.info(message, metadata);
  }

  /**
   * Logs a warning message.
   * @param message - The warning message to log
   * @param metadata - Optional additional data to include with the log
   */
  public warn(message: string, metadata?: Record<string, unknown>): void {
    this.addLog('warn', message, metadata);
    this.logger.warn(message, metadata);
  }

  /**
   * Logs an error with proper error reporting.
   * @param error - The error to log and report
   * @param metadata - Optional additional data to include with the error log
   */
  public error(
    error: BunTtsError | Error | unknown,
    metadata?: Record<string, unknown>
  ): void {
    const errorReport = errorReporter().reportError(error, metadata);
    this.addLog('error', errorReport.error.message, {
      ...metadata,
      error: errorReport.error,
    });
  }

  /**
   * Logs a trace message with stack trace information.
   * Only logs if trace logging is enabled in options.
   * @param message - The trace message to log
   * @param metadata - Optional additional data to include with the log
   */
  public trace(message: string, metadata?: Record<string, unknown>): void {
    if (!this.options.enableTrace) return;

    const stack = new Error('Trace stack capture').stack;
    this.addLog('trace', message, { ...metadata, stack });
    this.logger.debug(message, { ...metadata, stack });
  }

  // Log management
  /**
   * Retrieves debug logs with optional filtering.
   * @param level - Optional log level to filter by
   * @param limit - Optional limit on number of logs to return (from most recent)
   * @returns Array of debug logs
   */
  public getLogs(level?: string, limit?: number): DebugLog[] {
    let logs = [...this.debugLogs];

    if (level) {
      logs = logs.filter((log) => log.level === level);
    }

    if (limit) {
      logs = logs.slice(-limit);
    }

    return logs;
  }

  /**
   * Clears all stored debug logs.
   */
  public clearLogs(): void {
    this.debugLogs = [];
  }

  // Utility methods
  /**
   * Measures the execution time of an async function.
   * @param name - Unique identifier for the measurement
   * @param fn - The async function to measure
   * @param metadata - Optional additional data to associate with the measurement
   * @returns The result of the function execution
   */
  public async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    this.startTimer(name, metadata);

    try {
      const result = await fn();
      this.endTimer(name, { ...metadata, success: true });
      return result;
    } catch (error) {
      this.endTimer(name, {
        ...metadata,
        success: false,
        error: String(error),
      });
      this.error(error, { operation: name, metadata });
      throw error;
    }
  }

  /**
   * Measures the execution time of a synchronous function.
   * @param name - Unique identifier for the measurement
   * @param fn - The synchronous function to measure
   * @param metadata - Optional additional data to associate with the measurement
   * @returns The result of the function execution
   */
  public measureSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, unknown>
  ): T {
    this.startTimer(name, metadata);

    try {
      const result = fn();
      this.endTimer(name, { ...metadata, success: true });
      return result;
    } catch (error) {
      this.endTimer(name, {
        ...metadata,
        success: false,
        error: String(error),
      });
      this.error(error, { operation: name, metadata });
      throw error;
    }
  }

  /**
   * Generates a comprehensive debug report containing all collected data.
   * @returns Object containing summary, performance metrics, memory snapshots, and logs
   */
  public generateReport(): {
    summary: Record<string, unknown>;
    performance: Record<string, PerformanceMetric[]>;
    memory: MemorySnapshot[];
    logs: DebugLog[];
  } {
    const performance: Record<string, PerformanceMetric[]> = {};
    for (const [name, metrics] of this.performanceMetrics.entries()) {
      performance[name] = metrics;
    }

    return {
      summary: {
        totalLogs: this.debugLogs.length,
        totalMetrics: Array.from(this.performanceMetrics.values()).flat()
          .length,
        totalSnapshots: this.memorySnapshots.length,
        activeTimers: this.activeTimers.size,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      performance,
      memory: this.memorySnapshots,
      logs: this.debugLogs,
    };
  }

  /**
   * Adds a performance metric to the storage with size management.
   * @param name - The name of the metric category
   * @param metric - The performance metric to store
   */
  private addPerformanceMetric(name: string, metric: PerformanceMetric): void {
    if (!this.performanceMetrics.has(name)) {
      this.performanceMetrics.set(name, []);
    }
    const metrics = this.performanceMetrics.get(name);
    if (metrics) {
      metrics.push(metric);
    }

    // Keep only last MAX_METRICS_PER_NAME metrics per name
    const allMetrics = this.performanceMetrics.get(name);
    if (allMetrics && allMetrics.length > MAX_METRICS_PER_NAME) {
      allMetrics.splice(0, allMetrics.length - MAX_METRICS_PER_NAME);
    }
  }

  /**
   * Adds a log entry to the debug logs with size management.
   * @param level - The log level (debug, info, warn, error, trace)
   * @param message - The log message
   * @param metadata - Optional additional data to include with the log
   */
  private addLog(
    level: string,
    message: string,
    metadata?: Record<string, unknown>
  ): void {
    const log: DebugLog = {
      timestamp: Date.now(),
      level,
      message,
      metadata,
      stack: level === 'trace' ? new Error('Trace stack capture').stack : undefined,
    };

    this.debugLogs.push(log);

    // Keep logs under max limit
    if (this.debugLogs.length > this.options.maxLogEntries) {
      this.debugLogs.splice(
        0,
        this.debugLogs.length - this.options.maxLogEntries
      );
    }
  }
}

export { DebugManager };