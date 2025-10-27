/**
 * Type definitions for debug utilities.
 */

export interface DebugOptions {
  enableTrace?: boolean;
  enablePerformanceTracking?: boolean;
  enableMemoryTracking?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  maxLogEntries?: number;
}

export interface PerformanceMetric {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
  metadata?: Record<string, unknown>;
}

export interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
}

export interface DebugLog {
  timestamp: number;
  level: string;
  message: string;
  metadata?: Record<string, unknown>;
  stack?: string;
}