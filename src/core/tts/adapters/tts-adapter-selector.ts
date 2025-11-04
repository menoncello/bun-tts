import type { TtsAdapter } from './itts-adapter.js';
import type { TTSRequest, EngineSelectionCriteria } from './types.js';
import type { SuitabilityResult } from './validation-functions.js';
import { runAllValidationChecks } from './validation-orchestration.js';

/**
 * Performance metrics for an adapter
 */
export interface AdapterMetrics {
  totalRequests: number;
  successfulRequests: number;
  averageResponseTime: number;
  lastUsed: Date;
}

/**
 * Checks if an adapter is suitable for a given request and criteria.
 *
 * @param {TtsAdapter} adapter - Adapter to check
 * @param {string} adapterName - Name of the adapter
 * @param {TTSRequest} request - The synthesis request
 * @param {EngineSelectionCriteria} criteria - Selection criteria
 * @returns {Promise<SuitabilityResult>} Suitability check result
 */
export async function checkAdapterSuitability(
  adapter: TtsAdapter,
  adapterName: string,
  request: TTSRequest,
  criteria?: EngineSelectionCriteria
): Promise<SuitabilityResult> {
  if (!criteria) {
    return { isSuitable: true, validationErrors: [], score: 1 };
  }

  const validationResults = await runAllValidationChecks(
    adapter,
    adapterName,
    request,
    criteria
  );

  return {
    isSuitable: validationResults.isSuitable,
    validationErrors: validationResults.validationErrors,
    score: validationResults.isSuitable ? 1 : 0,
  };
}

/**
 * Filters adapters that can handle a specific request.
 *
 * @param {Map<string, TtsAdapter>} adapters - Map of adapter names to adapter instances
 * @param {string[]} adapterNames - List of adapter names to filter
 * @param {TTSRequest} request - The synthesis request
 * @param {EngineSelectionCriteria} criteria - Selection criteria
 * @returns {Promise<string[]>} Filtered list of suitable adapter names
 */
export async function filterSuitableAdapters(
  adapters: Map<string, TtsAdapter>,
  adapterNames: string[],
  request: TTSRequest,
  criteria?: EngineSelectionCriteria
): Promise<string[]> {
  const suitable: string[] = [];

  for (const adapterName of adapterNames) {
    const adapter = adapters.get(adapterName);
    if (!adapter) {
      continue;
    }

    const suitability = await checkAdapterSuitability(
      adapter,
      adapterName,
      request,
      criteria
    );

    if (suitability.isSuitable) {
      suitable.push(adapterName);
    }
  }

  return suitable;
}

// Re-export selection strategy functions from the dedicated module
export {
  selectRoundRobin,
  selectRoundRobinWithDefault,
  selectByLoad,
} from './selection-strategies.js';
export { selectByQuality } from './selection-strategies.js';
