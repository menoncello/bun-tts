/**
 * Performance Monitoring Types for TTS Adapter System
 * Defines shared types used across performance monitoring components
 */

/**
 * Performance alert levels
 */
export type AlertLevel = 'normal' | 'warning' | 'critical';

/**
 * Performance alert data structure
 */
export interface PerformanceAlert {
  id: string;
  timestamp: Date;
  level: AlertLevel;
  metric: string;
  value: number;
  threshold: number;
  message: string;
  adapter?: string;
  recommendations: string[];
}

/**
 * Performance statistics snapshot
 */
export interface PerformanceSnapshot {
  timestamp: Date;
  adapter: string;
  synthesisRate: number; // words per second
  responseTime: number; // milliseconds
  memoryUsage: number; // MB
  errorRate: number; // percentage
  totalRequests: number;
  successfulRequests: number;
  averageQuality?: number;
  alertLevel: AlertLevel;
}
