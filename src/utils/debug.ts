// Re-export interfaces and constants
export type {
  DebugOptions,
  PerformanceMetric,
  MemorySnapshot,
  DebugLog,
} from './debug-interfaces.js';

export {
  DEFAULT_MAX_LOG_ENTRIES,
  BYTES_PER_KB,
  MAX_METRICS_PER_NAME,
} from './debug-constants.js';

// Re-export the main class
export { DebugManager } from './debug-manager.js';

// Re-export convenience functions
export {
  debugManager,
  startTimer,
  endTimer,
  measureAsync,
  measureSync,
  debugLog,
  traceLog,
} from './debug-convenience.js';
