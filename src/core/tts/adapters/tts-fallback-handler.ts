import type { Result } from '../../../errors/result.js';
import { TTSError, createTTSError } from './errors/index.js';
import type { TtsAdapter } from './itts-adapter.js';
import type {
  TTSRequest,
  TTSResponse,
  EngineSelectionCriteria,
} from './types.js';

/**
 * Type alias for adapter validation result
 */
type AdapterValidationResult = Result<TTSResponse, TTSError> | null;

/**
 * Type alias for metrics update function
 */
type MetricsUpdater = (
  name: string,
  type: 'request' | 'success' | 'failure',
  responseTime?: number
) => void;

/**
 * Fallback synthesis context
 */
interface FallbackContext {
  request: TTSRequest;
  fallbackChain: string[];
  criteria?: EngineSelectionCriteria;
  failedAdapterName?: string;
  originalError?: TTSError;
}

/**
 * Creates a failure result when all adapters are exhausted.
 *
 * @param {TTSError} originalError - The original error from the failed synthesis
 * @param {string} requestId - The request ID for tracking
 * @returns {Result<TTSResponse, TTSError>} A failure result with appropriate error information
 */
function createAllAdaptersFailedResult(
  originalError?: TTSError,
  requestId?: string
): Result<TTSResponse, TTSError> {
  return {
    success: false,
    error:
      originalError ||
      new TTSError(
        'All TTS adapters failed to synthesize',
        'ALL_ADAPTERS_FAILED',
        {
          operation: 'synthesize',
          requestId: requestId || 'unknown',
        }
      ),
  };
}

/**
 * Validates if a result is successful and has data.
 *
 * @param {Result<TTSResponse, TTSError>} result - The result to validate
 * @returns {boolean} True if the result is successful and has data
 */
function isValidSuccessfulResult(
  result: Result<TTSResponse, TTSError>
): boolean {
  return result.success && result.data !== undefined;
}

/**
 * Extracts additional metadata properties, excluding reserved keys.
 *
 * @param {Record<string, unknown>} existingMetadata - The existing metadata object
 * @returns {Record<string, unknown>} Additional metadata properties
 */
function extractAdditionalMetadata(
  existingMetadata: Record<string, unknown> = {}
): Record<string, unknown> {
  const reservedKeys = ['synthesisTime', 'engine', 'voice', 'requestId'];

  return Object.fromEntries(
    Object.entries(existingMetadata).filter(
      ([key]) => !reservedKeys.includes(key)
    )
  );
}

/**
 * Creates fallback metadata object with required fields.
 *
 * @param {Record<string, unknown>} existingMetadata - The existing metadata from the response
 * @param {string} originalAdapter - The name of the original adapter that failed
 * @param {string} fallbackAdapter - The name of the fallback adapter that succeeded
 * @returns {TTSResponse['metadata']} The enriched metadata object
 */
function createFallbackMetadata(
  existingMetadata: Record<string, unknown> = {},
  originalAdapter: string,
  fallbackAdapter: string
): TTSResponse['metadata'] {
  const additionalMetadata = extractAdditionalMetadata(existingMetadata);

  return {
    synthesisTime: (existingMetadata.synthesisTime as number) ?? 0,
    engine: (existingMetadata.engine as string) ?? fallbackAdapter,
    voice: (existingMetadata.voice as string) ?? 'unknown',
    requestId: (existingMetadata.requestId as string) ?? 'unknown',
    fallbackUsed: true,
    originalAdapter,
    fallbackAdapter,
    ...additionalMetadata,
  };
}

/**
 * Creates a new result with enriched metadata.
 *
 * @param {Result<TTSResponse, TTSError>} result - The original successful result
 * @param {TTSResponse} originalData - The original response data
 * @param {TTSResponse['metadata']} enrichedMetadata - The enriched metadata
 * @returns {Result<TTSResponse, TTSError>} The result with enriched metadata
 */
function createEnrichedResult(
  result: Result<TTSResponse, TTSError>,
  originalData: TTSResponse,
  enrichedMetadata: TTSResponse['metadata']
): Result<TTSResponse, TTSError> {
  return {
    success: true,
    data: {
      ...originalData,
      metadata: enrichedMetadata,
    },
  };
}

/**
 * Enriches successful response with fallback metadata.
 *
 * @param {Result<TTSResponse, TTSError>} result - The successful synthesis result to enrich
 * @param {string} originalAdapter - The name of the original adapter that failed
 * @param {string} fallbackAdapter - The name of the fallback adapter that succeeded
 * @returns {Result<TTSResponse, TTSError>} The enriched result with fallback metadata
 */
function enrichWithFallbackMetadata(
  result: Result<TTSResponse, TTSError>,
  originalAdapter: string,
  fallbackAdapter: string
): Result<TTSResponse, TTSError> {
  // Early return for invalid results
  if (!isValidSuccessfulResult(result)) {
    return result;
  }

  // Safe access to data with type guard
  if (!result.success) {
    return result;
  }

  const originalData = result.data;
  const existingMetadata = originalData.metadata || {};
  const enrichedMetadata = createFallbackMetadata(
    existingMetadata,
    originalAdapter,
    fallbackAdapter
  );

  return createEnrichedResult(result, originalData, enrichedMetadata);
}

/**
 * Validates adapter existence and creates error result if not found.
 *
 * @param {Map<string, TtsAdapter>} adapters - Map of available adapters
 * @param {string} adapterName - Name of the adapter to validate
 * @param {TTSRequest} request - The current TTS request
 * @returns {AdapterValidationResult} Error result if adapter not found, null if valid
 */
function validateAdapter(
  adapters: Map<string, TtsAdapter>,
  adapterName: string,
  request: TTSRequest
): AdapterValidationResult {
  const adapter = adapters.get(adapterName);

  if (!adapter) {
    return {
      success: false,
      error: new TTSError(
        `Adapter '${adapterName}' not found`,
        'ADAPTER_NOT_FOUND',
        {
          operation: 'synthesize',
          engine: adapterName,
          requestId: request.requestId || 'unknown',
        }
      ),
    };
  }

  return null;
}

/**
 * Updates metrics based on synthesis result.
 *
 * @param {Result<TTSResponse, TTSError>} result - The synthesis result
 * @param {string} adapterName - Name of the adapter that performed the synthesis
 * @param {MetricsUpdater} updateMetrics - Function to update adapter metrics
 * @param {number} responseTime - Optional response time in milliseconds
 * @returns {Result<TTSResponse, TTSError>} The synthesis result unchanged
 */
function updateMetricsForResult(
  result: Result<TTSResponse, TTSError>,
  adapterName: string,
  updateMetrics: MetricsUpdater,
  responseTime?: number
): Result<TTSResponse, TTSError> {
  updateMetrics(
    adapterName,
    result.success ? 'success' : 'failure',
    responseTime
  );
  return result;
}

/**
 * Performs the actual synthesis with an adapter and handles exceptions.
 *
 * @param {TtsAdapter} adapter - The adapter instance to use
 * @param {string} adapterName - Name of the adapter
 * @param {TTSRequest} request - The TTS request
 * @param {MetricsUpdater} updateMetrics - Function to update metrics
 * @returns {Promise<Result<TTSResponse, TTSError>>} Promise resolving to the synthesis result
 */
async function performSynthesis(
  adapter: TtsAdapter,
  adapterName: string,
  request: TTSRequest,
  updateMetrics: MetricsUpdater
): Promise<Result<TTSResponse, TTSError>> {
  try {
    // Time the synthesis operation
    const startTime = Date.now();
    const result = await adapter.synthesize(request);
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return updateMetricsForResult(
      result,
      adapterName,
      updateMetrics,
      responseTime
    );
  } catch (error) {
    updateMetrics(adapterName, 'failure');
    return {
      success: false,
      error: createTTSError(
        error,
        adapterName,
        'synthesize',
        request.requestId || 'unknown'
      ),
    };
  }
}

/**
 * Attempts to synthesize with a specific adapter and handles its response.
 *
 * @param {Map<string, TtsAdapter>} adapters - Map of adapter names to adapter instances
 * @param {string} adapterName - Name of the adapter to use for synthesis
 * @param {TTSRequest} request - The TTS request to synthesize
 * @param {MetricsUpdater} updateMetrics - Function to update adapter metrics
 * @returns {Promise<Result<TTSResponse, TTSError>>} Promise resolving to the synthesis result
 */
async function attemptAdapterSynthesis(
  adapters: Map<string, TtsAdapter>,
  adapterName: string,
  request: TTSRequest,
  updateMetrics: MetricsUpdater
): Promise<Result<TTSResponse, TTSError>> {
  const validationError = validateAdapter(adapters, adapterName, request);
  if (validationError) {
    return validationError;
  }

  updateMetrics(adapterName, 'request');

  const adapter = adapters.get(adapterName);
  if (!adapter) {
    return {
      success: false,
      error: new TTSError(
        `Adapter '${adapterName}' not found`,
        'ADAPTER_NOT_FOUND',
        {
          operation: 'synthesize',
          engine: adapterName,
          requestId: request.requestId || 'unknown',
        }
      ),
    };
  }

  return performSynthesis(adapter, adapterName, request, updateMetrics);
}

/**
 * Gets the next adapter in the fallback chain.
 *
 * @param {string[]} fallbackChain - The current fallback chain
 * @returns {{ next: string; remaining: string[] } | null} Object containing the next adapter name and remaining adapters, or null if exhausted
 */
function getNextAdapter(
  fallbackChain: string[]
): { next: string; remaining: string[] } | null {
  const remainingAdapters = fallbackChain.slice(1);

  if (remainingAdapters.length === 0) {
    return null;
  }

  const nextAdapter = remainingAdapters[0];
  if (!nextAdapter) {
    return null;
  }

  return {
    next: nextAdapter,
    remaining: remainingAdapters,
  };
}

/**
 * Processes successful synthesis with fallback metadata.
 *
 * @param {Result<TTSResponse, TTSError>} result - The successful synthesis result
 * @param {string[]} fallbackChain - The original fallback chain
 * @returns {Result<TTSResponse, TTSError>} The enriched result with fallback information
 */
function processSuccessfulFallback(
  result: Result<TTSResponse, TTSError>,
  fallbackChain: string[]
): Result<TTSResponse, TTSError> {
  const originalAdapter = fallbackChain[0];
  const fallbackAdapter = fallbackChain[1]; // The next adapter that succeeded

  // Ensure both adapters exist before processing
  if (!originalAdapter || !fallbackAdapter) {
    return {
      success: false,
      error: new TTSError(
        'Invalid fallback chain: missing adapter names',
        'INVALID_FALLBACK_CHAIN',
        {
          operation: 'processSuccessfulFallback',
          details: {
            fallbackChain: fallbackChain.join(', '),
          },
        }
      ),
    };
  }

  return enrichWithFallbackMetadata(result, originalAdapter, fallbackAdapter);
}

/**
 * Continues fallback chain recursion after a failed attempt.
 *
 * @param {Map<string, TtsAdapter>} adapters - Map of adapter names to adapter instances
 * @param {FallbackContext} context - Current fallback context
 * @param {Result<TTSResponse, TTSError>} result - The failed result from the current adapter
 * @param {MetricsUpdater} updateMetrics - Function to update adapter metrics
 * @returns {Promise<Result<TTSResponse, TTSError>>} Promise resolving to the next fallback attempt result
 */
function continueFallbackChain(
  adapters: Map<string, TtsAdapter>,
  context: FallbackContext,
  result: Result<TTSResponse, TTSError>,
  updateMetrics: MetricsUpdater
): Promise<Result<TTSResponse, TTSError>> {
  const originalError = result.success
    ? undefined
    : (result as { success: false; error: TTSError }).error;

  return synthesizeWithFallback(
    adapters,
    {
      ...context,
      fallbackChain: context.fallbackChain.slice(1),
      originalError,
    },
    updateMetrics
  );
}

/**
 * Attempts synthesis with fallback adapters.
 *
 * @param {Map<string, TtsAdapter>} adapters - Map of adapter names to adapter instances
 * @param {FallbackContext} context - Fallback synthesis context
 * @param {MetricsUpdater} updateMetrics - Function to update adapter metrics
 * @returns {Promise<Result<TTSResponse, TTSError>>} Promise resolving to the synthesis result or original error
 */
export async function synthesizeWithFallback(
  adapters: Map<string, TtsAdapter>,
  context: FallbackContext,
  updateMetrics: MetricsUpdater
): Promise<Result<TTSResponse, TTSError>> {
  const { request, fallbackChain, originalError } = context;

  const nextAdapterInfo = getNextAdapter(fallbackChain);
  if (!nextAdapterInfo) {
    return createAllAdaptersFailedResult(originalError, request.requestId);
  }

  const result = await attemptAdapterSynthesis(
    adapters,
    nextAdapterInfo.next,
    request,
    updateMetrics
  );

  if (result.success) {
    return processSuccessfulFallback(result, fallbackChain);
  }

  return continueFallbackChain(adapters, context, result, updateMetrics);
}
