import { validateAdapterList } from './adapter-validation-helpers.js';
import type { TtsAdapter } from './itts-adapter.js';
import type { AdapterMetrics } from './tts-adapter-selector.js';
import type { TTSRequest, EngineSelectionCriteria } from './types.js';

// Error message constants to avoid duplication
const NO_VALID_ADAPTERS_ERROR = 'No valid adapters provided';

/**
 * Adapter suitability check result
 */
export interface SuitabilityResult {
  /** Whether the adapter is suitable for the request */
  isSuitable: boolean;
  /** Validation errors that make the adapter unsuitable */
  validationErrors: string[];
  /** Adapter-specific score for ranking */
  score: number;
}

/**
 * Basic validation parameters
 */
export interface BasicValidationParams {
  adapter: TtsAdapter;
  adapterName: string;
  request: TTSRequest;
  criteria: EngineSelectionCriteria;
}

/**
 * Validation state accumulator
 */
export interface ValidationState {
  validationErrors: string[];
  isSuitable: boolean;
}

/**
 * Feature and performance validation parameters
 */
export interface FeatureValidationParams {
  adapter: TtsAdapter;
  criteria: EngineSelectionCriteria;
}

/**
 * Validates preferred engine criteria
 *
 * @param {string} adapterName - The adapter name to validate
 * @param {EngineSelectionCriteria} criteria - Selection criteria
 * @returns {{ isValid: boolean; errors: string[] }} Validation result
 */
export function validatePreferredEngine(
  adapterName: string,
  criteria: EngineSelectionCriteria
): { isValid: boolean; errors: string[] } {
  if (criteria.preferredEngine && adapterName !== criteria.preferredEngine) {
    return {
      isValid: false,
      errors: [`Not preferred engine: ${criteria.preferredEngine}`],
    };
  }
  return { isValid: true, errors: [] };
}

/**
 * Validates language support for adapter
 *
 * @param {TtsAdapter} adapter - The adapter to validate
 * @param {TTSRequest} request - The TTS request
 * @param {EngineSelectionCriteria} criteria - Selection criteria
 * @returns {{ isValid: boolean; errors: string[] }} Validation result
 */
export function validateLanguageSupport(
  adapter: TtsAdapter,
  request: TTSRequest,
  criteria: EngineSelectionCriteria
): { isValid: boolean; errors: string[] } {
  if (!criteria.language) {
    return { isValid: true, errors: [] };
  }

  try {
    const voiceValidation = adapter.validateVoice(request.voice);
    if (!voiceValidation.isValid) {
      return {
        isValid: false,
        errors: voiceValidation.errors,
      };
    }
    return { isValid: true, errors: [] };
  } catch (error) {
    return {
      isValid: false,
      errors: [
        `Language validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    };
  }
}

/**
 * Validates required features for adapter
 *
 * @param {TtsAdapter} adapter - The adapter to validate
 * @param {EngineSelectionCriteria} criteria - Selection criteria
 * @returns {Promise<{ isValid: boolean; errors: string[] }>} Validation result
 */
export async function validateRequiredFeatures(
  adapter: TtsAdapter,
  criteria: EngineSelectionCriteria
): Promise<{ isValid: boolean; errors: string[] }> {
  if (!criteria.requiredFeatures) {
    return { isValid: true, errors: [] };
  }

  const errors: string[] = [];
  let isValid = true;

  // Import checkAdapterFeature to avoid circular dependency
  const { checkAdapterFeature } = await import('./tts-adapter-validator.js');

  for (const feature of criteria.requiredFeatures) {
    const supports = await checkAdapterFeature(adapter, feature);
    if (!supports) {
      isValid = false;
      errors.push(`Missing required feature: ${feature}`);
    }
  }

  return { isValid, errors };
}

/**
 * Validates preferred engine for adapter
 *
 * @param {BasicValidationParams} params - Basic validation parameters
 * @param {ValidationState} state - Current validation state
 * @returns {Promise<ValidationState>} Updated validation state
 */
export async function validatePreferredEngineForAdapter(
  params: BasicValidationParams,
  state: ValidationState
): Promise<ValidationState> {
  const engineValidation = validatePreferredEngine(
    params.adapterName,
    params.criteria
  );
  if (!engineValidation.isValid) {
    state.validationErrors.push(...engineValidation.errors);
    state.isSuitable = false;
  }

  return state;
}

/**
 * Validates language support for adapter
 *
 * @param {BasicValidationParams} params - Basic validation parameters
 * @param {ValidationState} state - Current validation state
 * @returns {Promise<ValidationState>} Updated validation state
 */
export async function validateLanguageSupportForAdapter(
  params: BasicValidationParams,
  state: ValidationState
): Promise<ValidationState> {
  const languageValidation = validateLanguageSupport(
    params.adapter,
    params.request,
    params.criteria
  );
  if (!languageValidation.isValid) {
    state.validationErrors.push(...languageValidation.errors);
    state.isSuitable = false;
  }

  return state;
}

/**
 * Validates required features for adapter
 *
 * @param {FeatureValidationParams} params - Feature validation parameters
 * @param {ValidationState} state - Current validation state
 * @returns {Promise<ValidationState>} Updated validation state
 */
export async function validateRequiredFeaturesForAdapter(
  params: FeatureValidationParams,
  state: ValidationState
): Promise<ValidationState> {
  const featuresValidation = await validateRequiredFeatures(
    params.adapter,
    params.criteria
  );
  if (!featuresValidation.isValid) {
    state.validationErrors.push(...featuresValidation.errors);
    state.isSuitable = false;
  }

  return state;
}

/**
 * Validates performance requirements for adapter
 *
 * @param {FeatureValidationParams} params - Feature validation parameters
 * @param {ValidationState} state - Current validation state
 * @returns {Promise<ValidationState>} Updated validation state
 */
export async function validatePerformanceRequirementsForAdapter(
  params: FeatureValidationParams,
  state: ValidationState
): Promise<ValidationState> {
  // Import validatePerformanceRequirements to avoid circular dependency
  const { validatePerformanceRequirements } = await import(
    './adapter-selection-helpers.js'
  );

  const performanceValidation = await validatePerformanceRequirements(
    params.adapter,
    params.criteria
  );
  if (!performanceValidation.isValid) {
    state.validationErrors.push(...performanceValidation.errors);
    state.isSuitable = false;
  }

  return state;
}

/**
 * Validates adapter list and filters out invalid values
 *
 * @param {string[]} suitableAdapters - List of suitable adapter names
 * @param {string} functionName - Function name for error context
 * @returns {string[]} Filtered and validated list of adapter names
 */
export function filterAndValidateAdapters(
  suitableAdapters: string[],
  functionName: string
): string[] {
  // Filter out undefined values and ensure array is not empty
  const validAdapters = suitableAdapters.filter(
    (adapter): adapter is string => adapter !== undefined
  );
  validateAdapterList(validAdapters, functionName);

  return validAdapters;
}

/**
 * Finds the adapter with the minimum request count
 *
 * @param {string[]} validAdapters - List of valid adapter names
 * @param {Map<string, AdapterMetrics>} adapterMetrics - Performance metrics for adapters
 * @returns {string} Adapter name with minimum requests
 */
export function findAdapterWithMinimumRequests(
  validAdapters: string[],
  adapterMetrics: Map<string, AdapterMetrics>
): string {
  return findAdapterWithMinimumRequestsWithDefault(
    validAdapters,
    adapterMetrics
  );
}

/**
 * Gets the request count for an adapter.
 *
 * @param {string} adapterName - Adapter name
 * @param {Map<string, AdapterMetrics>} adapterMetrics - Performance metrics for adapters
 * @returns {number} Request count (0 if no metrics available)
 */
function getAdapterRequestCount(
  adapterName: string,
  adapterMetrics: Map<string, AdapterMetrics>
): number {
  const metrics = adapterMetrics.get(adapterName);
  return metrics?.totalRequests ?? 0;
}

/**
 * Finds adapters with the minimum request count.
 *
 * @param {string[]} validAdapters - List of valid adapter names
 * @param {Map<string, AdapterMetrics>} adapterMetrics - Performance metrics for adapters
 * @returns {string[]} Adapters with minimum request count
 */
function findAdaptersWithMinRequests(
  validAdapters: string[],
  adapterMetrics: Map<string, AdapterMetrics>
): string[] {
  if (validAdapters.length === 0) {
    return [];
  }

  // Find minimum request count
  const requestCounts = validAdapters.map((name) => ({
    name,
    count: getAdapterRequestCount(name, adapterMetrics),
  }));

  const minRequests = Math.min(...requestCounts.map((r) => r.count));

  return requestCounts
    .filter((r) => r.count === minRequests)
    .map((r) => r.name);
}

/**
 * Sorts adapters with default adapter preference.
 *
 * @param {string[]} adapters - Adapter names to sort
 * @param {string} defaultAdapter - Default adapter to prefer
 * @returns {string[]} Sorted adapter names
 */
function sortAdaptersWithDefaultPreference(
  adapters: string[],
  defaultAdapter?: string
): string[] {
  return [...adapters].sort((a, b) => {
    // If default adapter is available, prioritize it
    if (defaultAdapter) {
      if (a === defaultAdapter) return -1;
      if (b === defaultAdapter) return 1;
    }
    // Otherwise use alphabetical ordering
    return a.localeCompare(b);
  });
}

/**
 * Finds the adapter with the minimum request count, with preference for default adapter
 *
 * @param {string[]} validAdapters - List of valid adapter names
 * @param {Map<string, AdapterMetrics>} adapterMetrics - Performance metrics for adapters
 * @param {string} defaultAdapter - Default adapter to prefer when request counts are equal
 * @returns {string} Adapter name with minimum requests
 */
export function findAdapterWithMinimumRequestsWithDefault(
  validAdapters: string[],
  adapterMetrics: Map<string, AdapterMetrics>,
  defaultAdapter?: string
): string {
  // Default to the first adapter if no metrics are available
  if (validAdapters.length === 0) {
    throw new Error(NO_VALID_ADAPTERS_ERROR);
  }

  const leastUsed = validAdapters[0] ?? ''; // Safe fallback

  // Find adapters with minimum requests
  const adaptersWithMinRequests = findAdaptersWithMinRequests(
    validAdapters,
    adapterMetrics
  );

  // Sort with default adapter preference
  const sortedAdapters = sortAdaptersWithDefaultPreference(
    adaptersWithMinRequests,
    defaultAdapter
  );

  return sortedAdapters[0] || leastUsed;
}

/**
 * Finds the adapter with the minimum load
 *
 * @param {string[]} validAdapters - List of valid adapter names
 * @param {Map<string, AdapterMetrics>} adapterMetrics - Performance metrics for adapters
 * @returns {string} Adapter name with minimum load
 */
export function findAdapterWithMinimumLoad(
  validAdapters: string[],
  adapterMetrics: Map<string, AdapterMetrics>
): string {
  // Default to the first adapter if no metrics are available
  if (validAdapters.length === 0) {
    throw new Error(NO_VALID_ADAPTERS_ERROR);
  }

  let leastLoaded = validAdapters[0] ?? ''; // Safe fallback
  let minLoad = Infinity;

  for (const adapterName of validAdapters) {
    const metrics = adapterMetrics.get(adapterName);
    if (metrics) {
      const load = metrics.totalRequests - metrics.successfulRequests;
      if (load < minLoad) {
        minLoad = load;
        leastLoaded = adapterName;
      }
    }
  }

  return leastLoaded;
}

/**
 * Quality scoring parameters
 */
interface QualityScoringParams {
  validAdapters: string[];
  adapterMetrics: Map<string, AdapterMetrics>;
  request: TTSRequest;
  criteria?: EngineSelectionCriteria;
  defaultAdapter?: string;
}

/**
 * Finds the adapter with the highest quality score
 *
 * @param {QualityScoringParams} params - Quality scoring parameters
 * @returns {Promise<string>} Adapter name with highest quality score
 */
export async function findAdapterWithHighestQuality(
  params: QualityScoringParams
): Promise<string> {
  // Import calculateAdapterScore to avoid circular dependency
  const { calculateAdapterScore } = await import(
    './adapter-selection-helpers.js'
  );

  // Default to the first adapter if no metrics are available
  if (params.validAdapters.length === 0) {
    throw new Error(NO_VALID_ADAPTERS_ERROR);
  }

  let bestAdapter = params.validAdapters[0] ?? ''; // Safe fallback
  let bestScore = -1;

  for (const adapterName of params.validAdapters) {
    const score = await calculateAdapterScore({
      adapterName,
      suitableAdapters: params.validAdapters,
      request: params.request,
      criteria: params.criteria,
      adapterMetrics: params.adapterMetrics,
      defaultAdapter: params.defaultAdapter,
    });
    if (score > bestScore) {
      bestScore = score;
      bestAdapter = adapterName;
    }
  }

  return bestAdapter;
}
