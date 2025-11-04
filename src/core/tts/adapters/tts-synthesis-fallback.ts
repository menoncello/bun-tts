import type { Result } from '../../../errors/result.js';
import { TTSError } from './errors/index.js';
import type { TtsAdapter } from './itts-adapter.js';
import { synthesizeWithFallback } from './tts-fallback-handler.js';
import type {
  TTSRequest,
  TTSResponse,
  EngineSelectionCriteria,
} from './types.js';

/**
 * Synthesis context containing all necessary data for speech synthesis
 */
export interface SynthesisContext {
  request: TTSRequest;
  adapter: TtsAdapter;
  registrationName: string;
  fallbackChain: string[];
  criteria?: EngineSelectionCriteria;
}

/**
 * Type alias for metrics update function
 */
export type MetricsUpdater = (
  name: string,
  type: 'request' | 'success' | 'failure',
  responseTime?: number
) => void;

/**
 * Parameters for synthesis fallback handling.
 */
export interface FallbackHandlerParams {
  adapters: Map<string, TtsAdapter>;
  context: SynthesisContext;
  updateMetrics: MetricsUpdater;
  registrationName: string;
}

/**
 * Handles synthesis fallback when retry attempts fail.
 *
 * @param {FallbackHandlerParams} params - Fallback handler parameters
 * @param {Result<TTSResponse, TTSError>} failureResult - Failure result
 * @returns {Promise<Result<TTSResponse, TTSError>>} Fallback result
 */
export async function handleSynthesisFailureFallback(
  params: FallbackHandlerParams,
  failureResult: Result<TTSResponse, TTSError>
): Promise<Result<TTSResponse, TTSError>> {
  const originalError = failureResult.success
    ? undefined
    : (failureResult as { success: false; error: TTSError }).error;

  return synthesizeWithFallback(
    params.adapters,
    {
      request: params.context.request,
      fallbackChain: params.context.fallbackChain,
      criteria: params.context.criteria,
      failedAdapterName: params.registrationName,
      originalError,
    },
    params.updateMetrics
  );
}

/**
 * Adapter registration information
 */
export interface AdapterRegistration {
  /** The adapter instance */
  adapter: TtsAdapter;
  /** Registration timestamp */
  registeredAt: Date;
  /** Whether the adapter is currently available */
  isAvailable: boolean;
  /** Last health check result */
  lastHealthCheck?: HealthCheckResult;
  /** Initialization status */
  isInitialized: boolean;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  engine: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  responseTime: number;
  message?: string;
}

/**
 * Finds the registration name for an adapter instance.
 *
 * @param {TtsAdapter} adapter - The adapter to find
 * @param {Map<string, AdapterRegistration>} adapters - Map of adapter registrations
 * @returns {string} The registration name
 * @throws {TTSError} If adapter is not found in registry
 */
export function findAdapterRegistrationName(
  adapter: TtsAdapter,
  adapters: Map<string, AdapterRegistration>
): string {
  for (const [name, registration] of Array.from(adapters.entries())) {
    if (registration.adapter === adapter) {
      return name;
    }
  }
  throw new TTSError('Adapter not found in registry', 'ADAPTER_NOT_FOUND', {
    operation: 'findAdapterRegistrationName',
  });
}
