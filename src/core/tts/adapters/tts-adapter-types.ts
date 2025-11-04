/**
 * Internal type definitions for TTS Adapter Manager
 */

import type { TtsAdapter } from './itts-adapter.js';
import type {
  TTSRequest,
  HealthCheckResult,
  EngineSelectionCriteria,
} from './types.js';

/**
 * Adapter registration information
 */
export interface AdapterRegistration {
  /** The adapter instance */
  adapter: TtsAdapter;
  /** When the adapter was registered */
  registeredAt: Date;
  /** Whether the adapter is available for use */
  isAvailable: boolean;
  /** Whether the adapter has been initialized */
  isInitialized: boolean;
  /** Last health check result */
  lastHealthCheck?: HealthCheckResult;
}

/**
 * Engine selection result with metadata
 */
export interface EngineSelectionResult {
  /** Selected adapter */
  adapter: TtsAdapter;
  /** Selection reason */
  reason: string;
  /** Selection score (higher is better) */
  score: number;
  /** Fallback chain attempted */
  fallbackChain: string[];
}

/**
 * Performance metrics for an adapter
 */
export interface AdapterPerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  averageResponseTime: number;
  lastUsed: Date;
  isInitialized: boolean;
  isAvailable: boolean;
  lastHealthCheck?: HealthCheckResult;
  registeredAt: Date;
  successRate: number;
}

/**
 * Internal adapter metrics tracking
 */
export interface InternalAdapterMetrics {
  totalRequests: number;
  successfulRequests: number;
  averageResponseTime: number;
  lastUsed: Date;
}

/**
 * Parameters for creating an engine selection result
 */
export interface CreateEngineSelectionResultParams {
  adapter: TtsAdapter;
  selectedName: string;
  suitableAdapters: string[];
  request: TTSRequest;
  criteria?: EngineSelectionCriteria;
}

/**
 * Manager configuration options
 */
export interface TTSAdapterManagerOptions {
  defaultAdapter?: string;
  fallbackChain?: string[];
  selectionStrategy?: 'round-robin' | 'best-quality' | 'least-load';
}
