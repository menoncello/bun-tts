import type { TTSCapabilities, AudioFormat } from './types.js';

// Constant for decimal precision calculations
const DECIMAL_PRECISION_MULTIPLIER = 100;

/**
 * Aggregates capabilities from multiple adapters.
 *
 * @param {TTSCapabilities[]} capabilitiesList - List of adapter capabilities
 * @returns {TTSCapabilities} Aggregated capabilities
 */
export function aggregateCapabilities(
  capabilitiesList: TTSCapabilities[]
): TTSCapabilities {
  if (capabilitiesList.length === 0) {
    return getDefaultCapabilities();
  }

  return {
    engineName: 'Aggregated',
    engineVersion: '1.0.0',
    supportedLanguages: aggregateSupportedLanguages(capabilitiesList),
    availableVoices: [],
    supportedFormats: aggregateSupportedFormats(capabilitiesList),
    supportedSampleRates: aggregateSupportedSampleRates(capabilitiesList),
    maxTextLength: getMinimumNumericField(capabilitiesList, 'maxTextLength'),
    features: aggregateFeatures(capabilitiesList),
    performance: aggregatePerformanceMetrics(capabilitiesList),
    quality: aggregateQualityMetrics(capabilitiesList),
    pricing: aggregatePricingMetrics(capabilitiesList),
    limitations: aggregateLimitations(capabilitiesList),
  };
}

/**
 * Aggregates language fields by combining unique values from all capabilities.
 *
 * @param {TTSCapabilities[]} capabilitiesList - List of capabilities
 * @returns {string[]} Array of unique languages
 */
function aggregateSupportedLanguages(
  capabilitiesList: TTSCapabilities[]
): string[] {
  const values = capabilitiesList.flatMap((cap) => cap.supportedLanguages);
  return Array.from(new Set(values));
}

/**
 * Aggregates audio format fields by combining unique values from all capabilities.
 *
 * @param {TTSCapabilities[]} capabilitiesList - List of capabilities
 * @returns {AudioFormat[]} Array of unique formats
 */
function aggregateSupportedFormats(
  capabilitiesList: TTSCapabilities[]
): AudioFormat[] {
  const values = capabilitiesList.flatMap((cap) => cap.supportedFormats);
  return Array.from(new Set(values));
}

/**
 * Aggregates sample rate fields by combining unique values from all capabilities.
 *
 * @param {TTSCapabilities[]} capabilitiesList - List of capabilities
 * @returns {number[]} Array of unique sample rates
 */
function aggregateSupportedSampleRates(
  capabilitiesList: TTSCapabilities[]
): number[] {
  const values = capabilitiesList.flatMap((cap) => cap.supportedSampleRates);
  return Array.from(new Set(values));
}

/**
 * Gets the minimum value of a numeric field across all capabilities.
 *
 * @param {TTSCapabilities[]} capabilitiesList - List of capabilities
 * @param {string} fieldName - Name of the numeric field
 * @returns {number} Minimum value
 */
function getMinimumNumericField(
  capabilitiesList: TTSCapabilities[],
  fieldName: 'maxTextLength'
): number {
  return Math.min(...capabilitiesList.map((cap) => cap[fieldName]));
}

/**
 * Aggregates feature flags by OR-ing them across all capabilities.
 *
 * @param {TTSCapabilities[]} capabilitiesList - List of capabilities
 * @returns {TTSCapabilities['features']} Aggregated features
 */
function aggregateFeatures(
  capabilitiesList: TTSCapabilities[]
): TTSCapabilities['features'] {
  return {
    ssml: anyCapabilityHasFeature(capabilitiesList, 'ssml'),
    voiceCloning: anyCapabilityHasFeature(capabilitiesList, 'voiceCloning'),
    realtime: anyCapabilityHasFeature(capabilitiesList, 'realtime'),
    batch: anyCapabilityHasFeature(capabilitiesList, 'batch'),
    prosodyControl: anyCapabilityHasFeature(capabilitiesList, 'prosodyControl'),
    customPronunciation: anyCapabilityHasFeature(
      capabilitiesList,
      'customPronunciation'
    ),
  };
}

/**
 * Checks if any capability has the specified feature enabled.
 *
 * @param {TTSCapabilities[]} capabilitiesList - List of capabilities
 * @param {string} featureName - Name of the feature to check
 * @returns {boolean} True if any capability has the feature
 */
function anyCapabilityHasFeature(
  capabilitiesList: TTSCapabilities[],
  featureName: keyof TTSCapabilities['features']
): boolean {
  return capabilitiesList.some((cap) => cap.features[featureName]);
}

/**
 * Aggregates performance metrics from all capabilities.
 *
 * @param {TTSCapabilities[]} capabilitiesList - List of capabilities
 * @returns {TTSCapabilities['performance']} Aggregated performance metrics
 */
function aggregatePerformanceMetrics(
  capabilitiesList: TTSCapabilities[]
): TTSCapabilities['performance'] {
  return {
    synthesisRate: Math.max(
      ...capabilitiesList.map((cap) => cap.performance.synthesisRate)
    ),
    maxConcurrentRequests: Math.min(
      ...capabilitiesList.map((cap) => cap.performance.maxConcurrentRequests)
    ),
    memoryPerRequest: Math.min(
      ...capabilitiesList.map((cap) => cap.performance.memoryPerRequest)
    ),
    initTime: Math.min(
      ...capabilitiesList.map((cap) => cap.performance.initTime)
    ),
    averageResponseTime: Math.min(
      ...capabilitiesList.map((cap) => cap.performance.averageResponseTime)
    ),
  };
}

/**
 * Aggregates limitations from all capabilities.
 *
 * @param {TTSCapabilities[]} capabilitiesList - List of capabilities
 * @returns {TTSCapabilities['limitations']} Aggregated limitations
 */
function aggregateLimitations(
  capabilitiesList: TTSCapabilities[]
): TTSCapabilities['limitations'] {
  return {
    maxDuration: Math.min(
      ...capabilitiesList.map((cap) => cap.limitations.maxDuration)
    ),
    maxFileSize: Math.min(
      ...capabilitiesList.map((cap) => cap.limitations.maxFileSize)
    ),
    rateLimit: Math.min(
      ...capabilitiesList.map((cap) => cap.limitations.rateLimit)
    ),
  };
}

/**
 * Aggregates quality metrics from all capabilities.
 *
 * @param {TTSCapabilities[]} capabilitiesList - List of capabilities
 * @returns {TTSCapabilities['quality']} Aggregated quality metrics
 */
function aggregateQualityMetrics(
  capabilitiesList: TTSCapabilities[]
): TTSCapabilities['quality'] {
  const averageScores = capabilitiesList.map((cap) => cap.quality.averageScore);
  const averageScore =
    averageScores.reduce((sum, score) => sum + score, 0) / averageScores.length;

  return {
    averageScore:
      Math.round(averageScore * DECIMAL_PRECISION_MULTIPLIER) /
      DECIMAL_PRECISION_MULTIPLIER, // Round to 2 decimal places
  };
}

/**
 * Aggregates pricing metrics from all capabilities.
 *
 * @param {TTSCapabilities[]} capabilitiesList - List of capabilities
 * @returns {TTSCapabilities['pricing']} Aggregated pricing metrics
 */
function aggregatePricingMetrics(
  capabilitiesList: TTSCapabilities[]
): TTSCapabilities['pricing'] {
  const costs = capabilitiesList.map((cap) => cap.pricing.costPerRequest);
  const minCost = Math.min(...costs);

  return {
    costPerRequest: minCost, // Use the minimum cost for best pricing
  };
}

/**
 * Gets default feature flags when no adapters are available.
 *
 * @returns {TTSCapabilities['features']} Default disabled features
 */
function getDefaultFeatures(): TTSCapabilities['features'] {
  return {
    ssml: false,
    voiceCloning: false,
    realtime: false,
    batch: false,
    prosodyControl: false,
    customPronunciation: false,
  };
}

/**
 * Gets default performance metrics when no adapters are available.
 *
 * @returns {TTSCapabilities['performance']} Default zeroed performance
 */
function getDefaultPerformance(): TTSCapabilities['performance'] {
  return {
    synthesisRate: 0,
    maxConcurrentRequests: 0,
    memoryPerRequest: 0,
    initTime: 0,
    averageResponseTime: 0,
  };
}

/**
 * Gets default limitations when no adapters are available.
 *
 * @returns {TTSCapabilities['limitations']} Default zeroed limitations
 */
function getDefaultLimitations(): TTSCapabilities['limitations'] {
  return {
    maxDuration: 0,
    maxFileSize: 0,
    rateLimit: 0,
  };
}

/**
 * Gets default capabilities when no adapters are available.
 *
 * @returns {TTSCapabilities} Default empty capabilities
 */
export function getDefaultCapabilities(): TTSCapabilities {
  return {
    engineName: 'None',
    engineVersion: '0.0.0',
    supportedLanguages: [],
    availableVoices: [],
    supportedFormats: [],
    supportedSampleRates: [],
    maxTextLength: 0,
    features: getDefaultFeatures(),
    performance: getDefaultPerformance(),
    quality: {
      averageScore: 0,
    },
    pricing: {
      costPerRequest: 0,
    },
    limitations: getDefaultLimitations(),
  };
}
