import type { Result } from '../../../errors/result.js';
import { createTTSError, TTSError } from './errors/index.js';
import type { TtsAdapter } from './itts-adapter.js';
import {
  DEFAULT_RETRY_CONFIG,
  calculateBackoffDelay,
  shouldRetryError,
  sleep,
} from './tts-adapter-retry.js';
import { synthesizeWithFallback } from './tts-fallback-handler.js';
import {
  handleSynthesisFailureFallback,
  type FallbackHandlerParams,
} from './tts-synthesis-fallback.js';
import type {
  TTSRequest,
  TTSResponse,
  EngineSelectionCriteria,
} from './types.js';

/**
 * Synthesis context containing all necessary data for speech synthesis
 */
interface SynthesisContext {
  request: TTSRequest;
  adapter: TtsAdapter;
  registrationName: string;
  fallbackChain: string[];
  criteria?: EngineSelectionCriteria;
}

/**
 * Type alias for metrics update function
 */
type MetricsUpdater = (
  name: string,
  type: 'request' | 'success' | 'failure',
  responseTime?: number
) => void;

/**
 * Parameters for synthesis failure handling
 */
interface SynthesisFailureParams {
  adapters: Map<string, TtsAdapter>;
  context: SynthesisContext;
  updateMetrics: MetricsUpdater;
  registrationName: string;
}

/**
 * Parameters for synthesis result failure handling
 */
interface SynthesisResultFailureParams {
  adapters: Map<string, TtsAdapter>;
  context: SynthesisContext;
  updateMetrics: MetricsUpdater;
  registrationName: string;
  error: TTSError;
}

/**
 * Handles synthesis failure by delegating to fallback chain with proper error handling.
 *
 * @param {SynthesisFailureParams} params - Failure handling parameters
 * @param {unknown} error - The error that caused the failure
 * @returns {Promise<Result<TTSResponse, TTSError>>} Fallback synthesis result
 */
async function handleSynthesisFailure(
  params: SynthesisFailureParams,
  error: unknown
): Promise<Result<TTSResponse, TTSError>> {
  const { adapters, context, updateMetrics, registrationName } = params;

  updateMetrics(registrationName, 'failure');

  const ttsError = createTTSError(
    error,
    context.adapter.name,
    'synthesize',
    context.request.requestId || 'unknown'
  );

  return synthesizeWithFallback(
    adapters,
    {
      request: context.request,
      fallbackChain: context.fallbackChain,
      criteria: context.criteria,
      failedAdapterName: registrationName,
      originalError: ttsError,
    },
    updateMetrics
  );
}

/**
 * Processes successful synthesis result and updates metrics.
 *
 * @param {Result<TTSResponse, TTSError>} result - Successful synthesis result
 * @param {string} registrationName - Adapter registration name
 * @param {MetricsUpdater} updateMetrics - Metrics updater
 * @param {number} responseTime - Measured response time in milliseconds
 * @returns {Result<TTSResponse, TTSError>} The result with updated metrics
 */
function processSuccessfulSynthesis(
  result: Result<TTSResponse, TTSError>,
  registrationName: string,
  updateMetrics: MetricsUpdater,
  responseTime: number
): Result<TTSResponse, TTSError> {
  updateMetrics(registrationName, 'success', responseTime);
  return result;
}

/**
 * Handles synthesis result failure by delegating to fallback chain.
 *
 * @param {SynthesisResultFailureParams} params - Failure handling parameters
 * @returns {Promise<Result<TTSResponse, TTSError>>} Fallback synthesis result
 */
async function _handleSynthesisResultFailure(
  params: SynthesisResultFailureParams
): Promise<Result<TTSResponse, TTSError>> {
  const { adapters, context, updateMetrics, registrationName, error } = params;

  updateMetrics(registrationName, 'failure');

  return synthesizeWithFallback(
    adapters,
    {
      request: context.request,
      fallbackChain: context.fallbackChain,
      criteria: context.criteria,
      failedAdapterName: registrationName,
      originalError: error,
    },
    updateMetrics
  );
}

/**
 * Creates base parameters for failure handling.
 *
 * @param {Map<string, TtsAdapter>} adapters - Available adapters
 * @param {SynthesisContext} context - Original synthesis context
 * @param {MetricsUpdater} updateMetrics - Metrics updater
 * @param {string} registrationName - Adapter registration name
 * @returns {SynthesisFailureParams} Base parameters for failure handling
 */
export function createBaseFailureParams(
  adapters: Map<string, TtsAdapter>,
  context: SynthesisContext,
  updateMetrics: MetricsUpdater,
  registrationName: string
): SynthesisFailureParams {
  return {
    adapters,
    context,
    updateMetrics,
    registrationName,
  };
}

/**
 * Parameters for synthesis exception handling
 */
interface ExceptionHandlingParams {
  adapters: Map<string, TtsAdapter>;
  context: SynthesisContext;
  updateMetrics: MetricsUpdater;
  registrationName: string;
}

/**
 * Attempts synthesis with the primary adapter and delegates to fallback chain on failure.
 *
 * @param {SynthesisContext} context - Synthesis context with all necessary data
 * @param {Map<string, TtsAdapter>} adapters - Map of adapter names to adapter instances
 * @param {MetricsUpdater} updateMetrics - Function to update adapter metrics
 * @returns {Promise<Result<TTSResponse, TTSError>>} Synthesis result or error
 */
export async function performSynthesis(
  context: SynthesisContext,
  adapters: Map<string, TtsAdapter>,
  updateMetrics: MetricsUpdater
): Promise<Result<TTSResponse, TTSError>> {
  const { registrationName } = context;
  updateMetrics(registrationName, 'request');

  try {
    return handleSynthesisSuccessOrFallback(
      context,
      adapters,
      updateMetrics,
      registrationName
    );
  } catch (error) {
    const exceptionParams: ExceptionHandlingParams = {
      adapters,
      context,
      updateMetrics,
      registrationName,
    };
    return handleSynthesisException(exceptionParams, error);
  }
}

/**
 * Creates failure parameters for synthesis result failure.
 *
 * @param {SynthesisFailureParams} baseParams - Base failure parameters
 * @param {TTSError | undefined} error - The synthesis error
 * @returns {SynthesisResultFailureParams} Result failure parameters
 */
function _createSynthesisResultFailureParams(
  baseParams: SynthesisFailureParams,
  error: TTSError | undefined
): SynthesisResultFailureParams {
  return {
    adapters: baseParams.adapters,
    context: baseParams.context,
    updateMetrics: baseParams.updateMetrics,
    registrationName: baseParams.registrationName,
    error: error || new TTSError('Unknown synthesis error', 'UNKNOWN_ERROR'),
  };
}

/**
 * Attempts synthesis with a single adapter.
 *
 * @param {SynthesisContext} context - Synthesis context
 * @param {MetricsUpdater} updateMetrics - Metrics updater function
 * @param {string} registrationName - Adapter registration name
 * @returns {Promise<{ success: boolean; result: Result<TTSResponse, TTSError> }>} Attempt result
 */
async function attemptSynthesis(
  context: SynthesisContext,
  updateMetrics: MetricsUpdater,
  registrationName: string
): Promise<{ success: boolean; result: Result<TTSResponse, TTSError> }> {
  const startTime = Date.now();
  const result = await context.adapter.synthesize(context.request);
  const endTime = Date.now();
  const responseTime = endTime - startTime;

  if (result.success) {
    const processedResult = processSuccessfulSynthesis(
      result,
      registrationName,
      updateMetrics,
      responseTime
    );
    return { success: true, result: processedResult };
  }

  return { success: false, result };
}

/**
 * Determines if synthesis should be retried based on error type.
 *
 * @param {Result<TTSResponse, TTSError>} result - Synthesis result
 * @returns {boolean} True if should retry
 */
function shouldRetrySynthesis(result: Result<TTSResponse, TTSError>): boolean {
  if (!result.success) {
    const errorResult = result as { success: false; error: TTSError };
    return shouldRetryError(errorResult.error?.code || 'UNKNOWN_ERROR');
  }
  return false;
}

/**
 * Checks if synthesis attempt should trigger fallback.
 *
 * @param {number} attempt - Current attempt number
 * @param {number} maxAttempts - Maximum number of attempts
 * @param {Result<TTSResponse, TTSError>} result - Synthesis result
 * @returns {boolean} Whether fallback should be triggered
 */
function shouldTriggerFallback(
  attempt: number,
  maxAttempts: number,
  result: Result<TTSResponse, TTSError>
): boolean {
  return attempt === maxAttempts - 1 || !shouldRetrySynthesis(result);
}

/**
 * Executes a single synthesis attempt with backoff delay.
 *
 * @param {SynthesisContext} context - Synthesis context
 * @param {MetricsUpdater} updateMetrics - Metrics updater function
 * @param {string} registrationName - Adapter registration name
 * @param {number} attempt - Current attempt number
 * @returns {Promise<{success: boolean, result: Result<TTSResponse, TTSError>}>} Attempt result
 */
async function executeSingleSynthesisAttempt(
  context: SynthesisContext,
  updateMetrics: MetricsUpdater,
  registrationName: string,
  attempt: number
): Promise<{
  success: boolean;
  result: Result<TTSResponse, TTSError>;
}> {
  // Apply exponential backoff delay before retry (except for first attempt)
  if (attempt > 0) {
    await sleep(calculateBackoffDelay(attempt - 1, DEFAULT_RETRY_CONFIG));
  }

  return attemptSynthesis(context, updateMetrics, registrationName);
}

/**
 * Creates a result for max retry attempts exceeded.
 *
 * @returns {{success: boolean, result: Result<TTSResponse, TTSError>, shouldFallback: boolean}} Max retry result
 */
function createMaxRetryExceededResult(): {
  success: boolean;
  result: Result<TTSResponse, TTSError>;
  shouldFallback: boolean;
} {
  return {
    success: false,
    result: {
      success: false,
      error: new TTSError(
        'Max retry attempts exceeded',
        'MAX_RETRIES_EXCEEDED'
      ),
    },
    shouldFallback: true,
  };
}

/**
 * Executes the retry loop for synthesis attempts.
 *
 * @param {SynthesisContext} context - Synthesis context
 * @param {MetricsUpdater} updateMetrics - Metrics updater function
 * @param {string} registrationName - Adapter registration name
 * @param {number} maxAttempts - Maximum number of attempts
 * @returns {Promise<{success: boolean, result: Result<TTSResponse, TTSError>, shouldFallback: boolean}>} Retry result
 */
async function executeSynthesisRetryLoop(
  context: SynthesisContext,
  updateMetrics: MetricsUpdater,
  registrationName: string,
  maxAttempts: number
): Promise<{
  success: boolean;
  result: Result<TTSResponse, TTSError>;
  shouldFallback: boolean;
}> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { success, result } = await executeSingleSynthesisAttempt(
      context,
      updateMetrics,
      registrationName,
      attempt
    );

    if (success) {
      return { success: true, result, shouldFallback: false };
    }

    if (shouldTriggerFallback(attempt, maxAttempts, result)) {
      return { success: false, result, shouldFallback: true };
    }
  }

  // Max attempts exceeded
  return createMaxRetryExceededResult();
}

/**
 * Handles synthesis result, either processing success or delegating to fallback chain.
 *
 * @param {SynthesisContext} context - Synthesis context
 * @param {Map<string, TtsAdapter>} adapters - Available adapters
 * @param {MetricsUpdater} updateMetrics - Metrics updater function
 * @param {string} registrationName - Adapter registration name
 * @returns {Promise<Result<TTSResponse, TTSError>>} Synthesis result
 */
async function handleSynthesisSuccessOrFallback(
  context: SynthesisContext,
  adapters: Map<string, TtsAdapter>,
  updateMetrics: MetricsUpdater,
  registrationName: string
): Promise<Result<TTSResponse, TTSError>> {
  const maxAttempts = DEFAULT_RETRY_CONFIG.maxRetries + 1;
  const retryResult = await executeSynthesisRetryLoop(
    context,
    updateMetrics,
    registrationName,
    maxAttempts
  );

  if (retryResult.success) {
    return retryResult.result;
  }

  if (retryResult.shouldFallback) {
    const params: FallbackHandlerParams = {
      adapters,
      context,
      updateMetrics,
      registrationName,
    };
    return handleSynthesisFailureFallback(params, retryResult.result);
  }

  return retryResult.result;
}

/**
 * Handles synthesis exceptions by delegating to fallback chain.
 *
 * @param {ExceptionHandlingParams} params - Exception handling parameters
 * @param {unknown} error - The exception that occurred
 * @returns {Promise<Result<TTSResponse, TTSError>>} Fallback synthesis result
 */
async function handleSynthesisException(
  params: ExceptionHandlingParams,
  error: unknown
): Promise<Result<TTSResponse, TTSError>> {
  const { adapters, context, updateMetrics, registrationName } = params;
  const failureParams = createBaseFailureParams(
    adapters,
    context,
    updateMetrics,
    registrationName
  );
  return handleSynthesisFailure(failureParams, error);
}
