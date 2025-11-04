import type { TtsAdapter } from './itts-adapter.js';
import type { AdapterMetrics } from './tts-adapter-selector.js';
import { getAdapterCapabilitiesSafely } from './tts-adapter-validator.js';
import type { TTSRequest, EngineSelectionCriteria } from './types.js';

/**
 * Performance validation parameters
 */
interface PerformanceValidationParams {
  maxResponseTime?: number;
  minQuality?: number;
  maxCostPerRequest?: number;
  minSynthesisRate?: number;
  maxInitTime?: number;
  maxMemoryUsage?: number;
}

/**
 * Adapter scoring parameters
 */
interface AdapterScoringParams {
  adapterName: string;
  suitableAdapters: string[];
  request: TTSRequest;
  criteria: EngineSelectionCriteria | undefined;
  adapterMetrics: Map<string, AdapterMetrics>;
  defaultAdapter: string | undefined;
}

/**
 * Selection reason parameters
 */
interface SelectionReasonParams {
  selectedAdapter: string;
  suitableAdapters: string[];
  criteria: EngineSelectionCriteria | undefined;
  adapterMetrics: Map<string, AdapterMetrics>;
  defaultAdapter: string | undefined;
  selectionStrategy: string;
}

/**
 * Validates response time requirement
 *
 * @param {PerformanceValidationParams} params - Performance validation parameters
 * @param {number} avgResponseTime - Average response time from adapter
 * @returns {{ isValid: boolean; error?: string }} Validation result
 */
function validateResponseTime(
  params: PerformanceValidationParams,
  avgResponseTime: number
): { isValid: boolean; error?: string } {
  if (!params.maxResponseTime) {
    return { isValid: true };
  }

  if (avgResponseTime > params.maxResponseTime) {
    return {
      isValid: false,
      error: `Response time ${avgResponseTime}ms exceeds limit ${params.maxResponseTime}ms`,
    };
  }

  return { isValid: true };
}

/**
 * Validates quality requirement
 *
 * @param {PerformanceValidationParams} params - Performance validation parameters
 * @param {number} quality - Quality score from adapter
 * @returns {{ isValid: boolean; error?: string }} Validation result
 */
function validateQuality(
  params: PerformanceValidationParams,
  quality: number
): { isValid: boolean; error?: string } {
  if (!params.minQuality) {
    return { isValid: true };
  }

  if (quality < params.minQuality) {
    return {
      isValid: false,
      error: `Quality score ${quality} below minimum ${params.minQuality}`,
    };
  }

  return { isValid: true };
}

/**
 * Validates cost requirement
 *
 * @param {PerformanceValidationParams} params - Performance validation parameters
 * @param {number} cost - Cost per request from adapter
 * @returns {{ isValid: boolean; error?: string }} Validation result
 */
function validateCost(
  params: PerformanceValidationParams,
  cost: number
): { isValid: boolean; error?: string } {
  if (!params.maxCostPerRequest) {
    return { isValid: true };
  }

  if (cost > params.maxCostPerRequest) {
    return {
      isValid: false,
      error: `Cost ${cost} exceeds limit ${params.maxCostPerRequest}`,
    };
  }

  return { isValid: true };
}

/**
 * Gets performance metrics from adapter capabilities
 *
 * @param {TtsAdapter} adapter - The adapter to get metrics from
 * @returns {Promise<{ avgResponseTime: number; quality: number; cost: number }>} Performance metrics
 */
async function getPerformanceMetrics(adapter: TtsAdapter): Promise<{
  avgResponseTime: number;
  quality: number;
  cost: number;
}> {
  const capabilities = await getAdapterCapabilitiesSafely(adapter);

  if (!capabilities) {
    return {
      avgResponseTime: 0,
      quality: 0,
      cost: 0,
    };
  }

  return {
    avgResponseTime: capabilities.performance?.averageResponseTime ?? 0,
    quality: capabilities.quality?.averageScore ?? 0,
    cost: capabilities.pricing?.costPerRequest ?? 0,
  };
}

/**
 * Validates all performance requirements and collects errors
 *
 * @param {PerformanceValidationParams} perfReq - Performance requirements
 * @param {number} avgResponseTime - Average response time
 * @param {number} quality - Quality score
 * @param {number} cost - Cost per request
 * @returns {string[]} Array of validation errors
 */
function validateAllPerformanceRequirements(
  perfReq: PerformanceValidationParams,
  avgResponseTime: number,
  quality: number,
  cost: number
): string[] {
  const errors: string[] = [];

  // Validate each performance requirement
  const responseTimeValidation = validateResponseTime(perfReq, avgResponseTime);
  if (!responseTimeValidation.isValid && responseTimeValidation.error) {
    errors.push(responseTimeValidation.error);
  }

  const qualityValidation = validateQuality(perfReq, quality);
  if (!qualityValidation.isValid && qualityValidation.error) {
    errors.push(qualityValidation.error);
  }

  const costValidation = validateCost(perfReq, cost);
  if (!costValidation.isValid && costValidation.error) {
    errors.push(costValidation.error);
  }

  return errors;
}

/**
 * Validates performance requirements for adapter
 *
 * @param {TtsAdapter} adapter - The adapter to validate
 * @param {EngineSelectionCriteria} criteria - Selection criteria
 * @returns {Promise<{ isValid: boolean; errors: string[] }>} Validation result
 */
export async function validatePerformanceRequirements(
  adapter: TtsAdapter,
  criteria: EngineSelectionCriteria
): Promise<{ isValid: boolean; errors: string[] }> {
  if (!criteria.performanceRequirements) {
    return { isValid: true, errors: [] };
  }

  // Constants for performance validation
  const INIT_TIME_TO_RESPONSE_TIME_MULTIPLIER = 2;

  // Map EngineSelectionCriteria.performanceRequirements to PerformanceValidationParams
  const perfReq: PerformanceValidationParams = {
    maxInitTime: criteria.performanceRequirements.maxInitTime,
    maxMemoryUsage: criteria.performanceRequirements.maxMemoryUsage,
    // Note: These properties are not available in EngineSelectionCriteria but expected by validation
    // Using sensible defaults
    maxResponseTime: criteria.performanceRequirements.maxInitTime
      ? criteria.performanceRequirements.maxInitTime *
        INIT_TIME_TO_RESPONSE_TIME_MULTIPLIER
      : undefined,
    minQuality: criteria.qualityRequirements?.minOverallQuality,
    maxCostPerRequest: undefined, // Not available in EngineSelectionCriteria
    minSynthesisRate: criteria.performanceRequirements.minSynthesisRate,
  };

  const metrics = await getPerformanceMetrics(adapter);
  const errors = validateAllPerformanceRequirements(
    perfReq,
    metrics.avgResponseTime,
    metrics.quality,
    metrics.cost
  );

  return { isValid: errors.length === 0, errors };
}

/**
 * Calculates success rate bonus for adapter
 *
 * @param {AdapterMetrics} metrics - Adapter metrics
 * @returns {number} Success rate bonus
 */
function calculateSuccessRateBonus(metrics: AdapterMetrics): number {
  const SUCCESS_RATE_BONUS = 20;

  if (metrics.totalRequests > 0) {
    const successRate = metrics.successfulRequests / metrics.totalRequests;
    return successRate * SUCCESS_RATE_BONUS;
  }

  return 0;
}

/**
 * Calculates load balancing bonus for adapter
 *
 * @param {AdapterMetrics} metrics - Adapter metrics
 * @returns {number} Load balancing bonus
 */
function calculateLoadBalancingBonus(metrics: AdapterMetrics): number {
  const LOAD_BALANCING_BONUS = 10;

  const loadFactor =
    1 - metrics.totalRequests / Math.max(metrics.totalRequests, 1);
  return loadFactor * LOAD_BALANCING_BONUS;
}

/**
 * Calculates uniqueness bonus for adapter
 *
 * @param {string} adapterName - Adapter name
 * @param {string[]} suitableAdapters - All suitable adapters
 * @returns {number} Uniqueness bonus
 */
function calculateUniquenessBonus(
  adapterName: string,
  suitableAdapters: string[]
): number {
  const UNIQUENESS_MULTIPLIER = 2;

  return (
    (suitableAdapters.length - suitableAdapters.indexOf(adapterName)) *
    UNIQUENESS_MULTIPLIER
  );
}

/**
 * Calculates quality bonus for adapter
 *
 * @param {string} adapterName - Adapter name
 * @param {EngineSelectionCriteria} criteria - Selection criteria
 * @param {string} defaultAdapter - Default adapter name
 * @returns {number} Quality bonus
 */
function calculateQualityBonus(
  adapterName: string,
  criteria: EngineSelectionCriteria | undefined,
  defaultAdapter: string | undefined
): number {
  const DEFAULT_ADAPTER_BONUS = 15;
  const DEFAULT_ADAPTER_ALWAYS_BONUS = 10;

  // Always give preference to the default adapter, even without quality requirements
  if (adapterName === defaultAdapter) {
    // If there are quality requirements, give extra bonus
    if (criteria?.qualityRequirements) {
      return DEFAULT_ADAPTER_BONUS;
    }
    // Always give some bonus to default adapter
    return DEFAULT_ADAPTER_ALWAYS_BONUS;
  }

  return 0;
}

/**
 * Calculates voice compatibility score for an adapter.
 *
 * @param {AdapterScoringParams} params - Scoring parameters
 * @returns {Promise<{ score: number; errors: string[] }>} Voice compatibility score and errors
 */
async function calculateVoiceCompatibilityScore(
  params: AdapterScoringParams
): Promise<{ score: number; errors: string[] }> {
  const VOICE_COMPATIBILITY_BONUS = 25;
  const VOICE_INCOMPATIBILITY_PENALTY = 50;

  try {
    // Find the adapter instance from the adapters map (we need access to it)
    // This is a limitation of the current architecture - we need the adapter instance
    // For now, we'll assume voice compatibility based on naming convention
    const voiceId = params.request.voice.id;
    const adapterName = params.adapterName;

    // Check if voice ID matches adapter type (e.g., 'azure-' voice with 'azure' adapter)
    const voicePrefix = voiceId.split('-')[0];
    const isVoiceCompatible = voicePrefix === adapterName;

    if (isVoiceCompatible) {
      return { score: VOICE_COMPATIBILITY_BONUS, errors: [] };
    }
    return {
      score: -VOICE_INCOMPATIBILITY_PENALTY,
      errors: [
        `Voice '${voiceId}' is not compatible with adapter '${adapterName}'`,
      ],
    };
  } catch (error) {
    return {
      score: -VOICE_INCOMPATIBILITY_PENALTY,
      errors: [
        `Voice validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    };
  }
}

/**
 * Calculates a quality score for an adapter.
 *
 * @param {AdapterScoringParams} params - Scoring parameters
 * @returns {Promise<number>} Quality score (higher is better)
 */
export async function calculateAdapterScore(
  params: AdapterScoringParams
): Promise<number> {
  const BASE_SCORE = 10;

  let score = BASE_SCORE;
  const metrics = params.adapterMetrics.get(params.adapterName);

  // Voice compatibility score (this should be the dominant factor)
  const voiceScore = await calculateVoiceCompatibilityScore(params);
  score += voiceScore.score;

  // Success rate bonus
  if (metrics) {
    score += calculateSuccessRateBonus(metrics);

    // Load balancing bonus
    score += calculateLoadBalancingBonus(metrics);
  }

  // Always give quality bonus (even without criteria) to default adapter
  score += calculateQualityBonus(
    params.adapterName,
    params.criteria,
    params.defaultAdapter
  );

  // Uniqueness bonus
  score += calculateUniquenessBonus(
    params.adapterName,
    params.suitableAdapters
  );

  return score;
}

/**
 * Formats success rate for display
 *
 * @param {AdapterMetrics} metrics - Adapter metrics
 * @returns {string} Formatted success rate
 */
function formatSuccessRate(metrics: AdapterMetrics): string {
  const SUCCESS_RATE_PERCENTAGE = 100;

  return (
    (metrics.successfulRequests / metrics.totalRequests) *
    SUCCESS_RATE_PERCENTAGE
  ).toFixed(1);
}

/**
 * Gets basic selection reasons
 *
 * @param {SelectionReasonParams} params - Selection reason parameters
 * @returns {string[]} Array of basic selection reasons
 */
function getBasicSelectionReasons(params: SelectionReasonParams): string[] {
  const reasons: string[] = [];

  if (
    params.criteria?.preferredEngine &&
    params.selectedAdapter === params.criteria.preferredEngine
  ) {
    reasons.push('preferred engine');
  }

  if (params.selectedAdapter === params.defaultAdapter) {
    reasons.push('default adapter');
  }

  return reasons;
}

/**
 * Gets performance-based selection reasons
 *
 * @param {SelectionReasonParams} params - Selection reason parameters
 * @returns {string[]} Array of performance-based selection reasons
 */
function getPerformanceSelectionReasons(
  params: SelectionReasonParams
): string[] {
  const reasons: string[] = [];
  const metrics = params.adapterMetrics.get(params.selectedAdapter);

  if (metrics && metrics.totalRequests > 0) {
    reasons.push(`${formatSuccessRate(metrics)}% success rate`);
  }

  return reasons;
}

/**
 * Gets selection reason for debugging.
 *
 * @param {SelectionReasonParams} params - Selection reason parameters
 * @returns {string} Human-readable selection reason
 */
export function getSelectionReason(params: SelectionReasonParams): string {
  const reasons: string[] = [];

  // Basic reasons
  reasons.push(...getBasicSelectionReasons(params));

  // Performance reasons
  reasons.push(...getPerformanceSelectionReasons(params));

  // Strategy reason
  if (params.suitableAdapters.length > 1) {
    reasons.push(`${params.selectionStrategy} selection`);
  }

  return reasons.join(', ') || 'selected by availability';
}
