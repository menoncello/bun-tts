/**
 * Performance Integration for TTS Adapter System
 * Integrates performance monitoring with existing TTSAdapterManager
 */

import {
  performanceMonitor,
  extendedPerformanceMonitor,
} from './performance-monitor-wrapper.js';

// Export performance monitoring utilities
export { performanceMonitor, extendedPerformanceMonitor };

// Re-export performance tracking utilities for backward compatibility
export {
  PerformanceTracker,
  BatchPerformanceCollector,
  withPerformanceMonitoring,
} from './performance-tracking.js';
