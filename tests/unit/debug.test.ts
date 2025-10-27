import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import {
  DebugManager,
  debugManager,
  startTimer,
  endTimer,
  measureAsync,
  measureSync,
  debugLog,
  traceLog,
} from '../../src/utils/debug.js';
import { createMockLogger } from '../setup.js';

function createDebugManager(): DebugManager {
  DebugManager.resetInstance();
  const mockLogger = createMockLogger();
  return DebugManager.createInstance(
    {
      enableTrace: true,
      enablePerformanceTracking: true,
      enableMemoryTracking: true,
      logLevel: 'debug',
      maxLogEntries: 100,
    },
    mockLogger
  );
}

function waitMs(ms: number): void {
  const start = performance.now();
  while (performance.now() - start < ms) {
    // Wait
  }
}

describe('DebugManager Timer Operations - Basic Operations', () => {
  function setupTimerManager() {
    return createDebugManager();
  }

  function cleanupTimerManager(manager: DebugManager) {
    manager.clearPerformanceMetrics();
  }

  let manager: DebugManager;

  beforeEach(() => {
    manager = setupTimerManager();
  });

  afterEach(() => {
    cleanupTimerManager(manager);
  });

  it('should track timer metrics', () => {
    manager.startTimer('test-operation', { type: 'test' });

    waitMs(5);

    const duration = manager.endTimer('test-operation', {
      result: 'success',
    });

    expect(duration).toBeGreaterThanOrEqual(0);

    const metrics = manager.getPerformanceMetrics('test-operation');
    expect(metrics).toHaveLength(1);
    expect(metrics[0]!.name).toBe('test-operation');
    expect(metrics[0]!.duration).toBe(duration);
    expect(metrics[0]!.metadata).toEqual({ result: 'success' });
  });

  it('should handle multiple timers', () => {
    manager.startTimer('timer1');
    manager.startTimer('timer2');

    manager.endTimer('timer1');
    manager.endTimer('timer2');

    const metrics1 = manager.getPerformanceMetrics('timer1');
    const metrics2 = manager.getPerformanceMetrics('timer2');
    const allMetrics = manager.getPerformanceMetrics();

    expect(metrics1).toHaveLength(1);
    expect(metrics2).toHaveLength(1);
    expect(allMetrics).toHaveLength(2);
  });
});

describe('DebugManager Timer Operations - Error Handling', () => {
  function setupTimerManager() {
    return createDebugManager();
  }

  function cleanupTimerManager(manager: DebugManager) {
    manager.clearPerformanceMetrics();
  }

  let manager: DebugManager;

  beforeEach(() => {
    manager = setupTimerManager();
  });

  afterEach(() => {
    cleanupTimerManager(manager);
  });

  it('should warn when ending non-existent timer', () => {
    let warnMessage: any = null;
    const logger = manager.getLogger();
    const originalWarn = logger.warn;
    logger.warn = (message: string, context: any) => {
      warnMessage = { message, context };
    };

    manager.endTimer('non-existent-timer');

    expect(warnMessage).not.toBeNull();
    expect(warnMessage.message).toBe('Timer not found: non-existent-timer');

    logger.warn = originalWarn;
  });
});

describe('DebugManager Timer Operations - Timer Limits', () => {
  function setupTimerManager() {
    return createDebugManager();
  }

  function cleanupTimerManager(manager: DebugManager) {
    manager.clearPerformanceMetrics();
  }

  let manager: DebugManager;

  beforeEach(() => {
    manager = setupTimerManager();
  });

  afterEach(() => {
    cleanupTimerManager(manager);
  });

  it('should limit metrics history', () => {
    for (let i = 0; i < 120; i++) {
      manager.startTimer('test-timer');
      waitMs(1);
      manager.endTimer('test-timer');
    }

    const metrics = manager.getPerformanceMetrics('test-timer');
    expect(metrics.length).toBeLessThanOrEqual(100);
    expect(metrics.length).toBeGreaterThan(90);
  });
});

describe('DebugManager Memory Tracking', () => {
  let manager: DebugManager;

  beforeEach(() => {
    manager = createDebugManager();
  });

  afterEach(() => {
    manager.clearMemorySnapshots();
  });

  describe('Memory Snapshots', () => {
    it('should take memory snapshots', () => {
      const snapshot = manager.takeMemorySnapshot('test-snapshot');

      expect(snapshot.timestamp).toBeDefined();
      expect(snapshot.heapUsed).toBeGreaterThan(0);
      expect(snapshot.heapTotal).toBeGreaterThan(0);
      expect(snapshot.rss).toBeGreaterThan(0);
    });

    it('should store multiple snapshots', () => {
      manager.takeMemorySnapshot('snapshot1');
      manager.takeMemorySnapshot('snapshot2');

      const snapshots = manager.getMemorySnapshots();
      expect(snapshots).toHaveLength(2);
    });

    it('should clear memory snapshots', () => {
      manager.takeMemorySnapshot('test');
      expect(manager.getMemorySnapshots()).toHaveLength(1);

      manager.clearMemorySnapshots();
      expect(manager.getMemorySnapshots()).toHaveLength(0);
    });
  });
});

describe('DebugManager Logging Operations - Basic Logging', () => {
  function setupLoggingManager() {
    return createDebugManager();
  }

  function cleanupLoggingManager(manager: DebugManager) {
    manager.clearLogs();
  }

  let manager: DebugManager;

  beforeEach(() => {
    manager = setupLoggingManager();
  });

  afterEach(() => {
    cleanupLoggingManager(manager);
  });

  it('should log debug messages', () => {
    let debugCall: any = null;
    const logger = manager.getLogger();
    const originalDebug = logger.debug;
    logger.debug = (message: string, context: any) => {
      debugCall = { message, context };
    };

    manager.debug('Test debug message', { key: 'value' });

    expect(debugCall).not.toBeNull();
    expect(debugCall.context).toEqual({ key: 'value' });
    expect(debugCall.message).toBe('Test debug message');

    const logs = manager.getLogs('debug');
    expect(logs).toHaveLength(1);
    expect(logs[0]!.message).toBe('Test debug message');
    expect(logs[0]!.level).toBe('debug');
    expect(logs[0]!.metadata).toEqual({ key: 'value' });

    logger.debug = originalDebug;
  });

  it('should log info messages', () => {
    manager.info('Test info message');

    const logs = manager.getLogs('info');
    expect(logs).toHaveLength(1);
    expect(logs[0]!.level).toBe('info');
    expect(logs[0]!.message).toBe('Test info message');
  });

  it('should log warning messages', () => {
    manager.warn('Test warning message');

    const logs = manager.getLogs('warn');
    expect(logs).toHaveLength(1);
    expect(logs[0]!.level).toBe('warn');
    expect(logs[0]!.message).toBe('Test warning message');
  });
});

describe('DebugManager Logging Operations - Trace Logging', () => {
  function setupLoggingManager() {
    return createDebugManager();
  }

  function cleanupLoggingManager(manager: DebugManager) {
    manager.clearLogs();
  }

  let manager: DebugManager;

  beforeEach(() => {
    manager = setupLoggingManager();
  });

  afterEach(() => {
    cleanupLoggingManager(manager);
  });

  it('should log trace messages when enabled', () => {
    manager.trace('Test trace message');

    const logs = manager.getLogs('trace');
    expect(logs).toHaveLength(1);
    expect(logs[0]!.level).toBe('trace');
    expect(logs[0]!.stack).toBeDefined();
  });

  it('should not log trace messages when disabled', () => {
    DebugManager.resetInstance();
    const disabledManager = DebugManager.getInstance({
      enableTrace: false,
      logLevel: 'debug',
    });

    disabledManager.trace('Test trace message');

    const logs = disabledManager.getLogs('trace');
    expect(logs).toHaveLength(0);
  });
});

describe('DebugManager Logging Operations - Log Limits', () => {
  function setupLoggingManager() {
    return createDebugManager();
  }

  function cleanupLoggingManager(manager: DebugManager) {
    manager.clearLogs();
  }

  let manager: DebugManager;

  beforeEach(() => {
    manager = setupLoggingManager();
  });

  afterEach(() => {
    cleanupLoggingManager(manager);
  });

  it('should limit log entries', () => {
    for (let i = 0; i < 150; i++) {
      manager.debug(`Message ${i}`);
    }

    const logs = manager.getLogs();
    expect(logs.length).toBeLessThanOrEqual(100);
    expect(logs.length).toBeGreaterThan(90);
  });
});

describe('DebugManager Performance Measurement - Async Measurement', () => {
  function setupPerformanceManager() {
    return createDebugManager();
  }

  function cleanupPerformanceManager(manager: DebugManager) {
    manager.clearPerformanceMetrics();
  }

  let manager: DebugManager;

  beforeEach(() => {
    manager = setupPerformanceManager();
  });

  afterEach(() => {
    cleanupPerformanceManager(manager);
  });

  it('should measure async operations', async () => {
    const asyncFn = async () => {
      // Use deterministic timing instead of hard wait
      const { tick } = require('../../src/utils/deterministic-timing');
      await tick();
      return 'result';
    };

    const result = await manager.measureAsync('async-test', asyncFn, {
      test: true,
    });

    expect(result).toBe('result');

    const metrics = manager.getPerformanceMetrics('async-test');
    expect(metrics).toHaveLength(1);
    expect(metrics[0]!.metadata).toEqual({ test: true, success: true });
  });

  it('should handle async operation errors', async () => {
    const asyncFn = async () => {
      // Use deterministic timing instead of hard wait
      const { tick } = require('../../src/utils/deterministic-timing');
      await tick();
      throw new Error('Test error');
    };

    await expect(
      manager.measureAsync('async-error-test', asyncFn)
    ).rejects.toThrow('Test error');

    const metrics = manager.getPerformanceMetrics('async-error-test');
    expect(metrics).toHaveLength(1);
    expect(metrics[0]!.metadata?.success).toBe(false);
  });
});

describe('DebugManager Performance Measurement - Sync Measurement', () => {
  function setupPerformanceManager() {
    return createDebugManager();
  }

  function cleanupPerformanceManager(manager: DebugManager) {
    manager.clearPerformanceMetrics();
  }

  let manager: DebugManager;

  beforeEach(() => {
    manager = setupPerformanceManager();
  });

  afterEach(() => {
    cleanupPerformanceManager(manager);
  });

  it('should measure sync operations', () => {
    const syncFn = () => {
      let sum = 0;
      for (let i = 0; i < 1000; i++) {
        sum += i;
      }
      return sum;
    };

    const result = manager.measureSync('sync-test', syncFn, {
      iterations: 1000,
    });

    expect(result).toBe(499500); // Sum of 0 to 999

    const metrics = manager.getPerformanceMetrics('sync-test');
    expect(metrics).toHaveLength(1);
    expect(metrics[0]!.metadata).toEqual({ iterations: 1000, success: true });
  });

  it('should handle sync operation errors', () => {
    const syncFn = () => {
      throw new Error('Sync error');
    };

    expect(() => manager.measureSync('sync-error-test', syncFn)).toThrow(
      'Sync error'
    );

    const metrics = manager.getPerformanceMetrics('sync-error-test');
    expect(metrics).toHaveLength(1);
    expect(metrics[0]!.metadata?.success).toBe(false);
  });
});

describe('DebugManager Report Generation', () => {
  let manager: DebugManager;

  beforeEach(() => {
    manager = createDebugManager();
  });

  afterEach(() => {
    manager.clearLogs();
    manager.clearPerformanceMetrics();
    manager.clearMemorySnapshots();
  });

  it('should generate comprehensive debug report', () => {
    manager.startTimer('test-timer');
    manager.endTimer('test-timer');
    manager.takeMemorySnapshot('test-memory');
    manager.debug('Test message');

    const report = manager.generateReport();

    expect(report.summary).toBeDefined();
    expect(report.summary.totalLogs).toBe(4); // startTimer, endTimer, memorySnapshot, debug
    expect(report.summary.totalMetrics).toBe(1);
    expect(report.summary.totalSnapshots).toBe(1);
    expect(report.performance).toHaveProperty('test-timer');
    expect(report.memory).toHaveLength(1);
    expect(report.logs).toHaveLength(4);
  });
});

describe('DebugManager Singleton Behavior', () => {
  it('should return the same instance', () => {
    DebugManager.resetInstance();
    const manager1 = DebugManager.getInstance();
    const manager2 = DebugManager.getInstance();

    expect(manager1).toBe(manager2);
  });
});

describe('Global Convenience Functions', () => {
  beforeEach(() => {
    DebugManager.resetInstance();
  });

  describe('Global Timer Functions', () => {
    it('should use global debug manager instance', () => {
      startTimer('global-timer');
      const duration = endTimer('global-timer');

      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Global Measurement Functions', () => {
    it('should use global async measurement', async () => {
      const result = await measureAsync('global-async', async () => {
        return 'test-result';
      });

      expect(result).toBe('test-result');
    });

    it('should use global sync measurement', () => {
      const result = measureSync('global-sync', () => 42);

      expect(result).toBe(42);
    });
  });

  describe('Global Logging Functions', () => {
    it('should use global debug logging', () => {
      expect(() => debugLog('Global debug message')).not.toThrow();
    });

    it('should use global trace logging', () => {
      const traceManager = DebugManager.getInstance({ enableTrace: true });
      expect(() => traceLog('Global trace message')).not.toThrow();
    });
  });
});
