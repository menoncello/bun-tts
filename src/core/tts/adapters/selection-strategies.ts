import type { AdapterMetrics } from './tts-adapter-selector.js';
import type { TTSRequest, EngineSelectionCriteria } from './types.js';
import {
  filterAndValidateAdapters,
  findAdapterWithMinimumRequests,
  findAdapterWithMinimumRequestsWithDefault,
  findAdapterWithMinimumLoad,
  findAdapterWithHighestQuality,
} from './validation-functions.js';

/**
 * Selection strategy parameters
 */
export interface SelectionStrategyParams {
  suitableAdapters: string[];
  request: TTSRequest;
  criteria?: EngineSelectionCriteria;
  adapterMetrics: Map<string, AdapterMetrics>;
  defaultAdapter?: string;
}

/**
 * Selects adapter using round-robin strategy.
 *
 * @param {string[]} suitableAdapters - List of suitable adapter names
 * @param {Map<string, AdapterMetrics>} adapterMetrics - Performance metrics for adapters
 * @returns {string} Selected adapter name
 * @throws {Error} If no suitable adapters are available
 */
export function selectRoundRobin(
  suitableAdapters: string[],
  adapterMetrics: Map<string, AdapterMetrics>
): string {
  const validAdapters = filterAndValidateAdapters(
    suitableAdapters,
    'selectRoundRobin'
  );
  return findAdapterWithMinimumRequests(validAdapters, adapterMetrics);
}

/**
 * Selects adapter using round-robin strategy with default adapter preference.
 *
 * @param {string[]} suitableAdapters - List of suitable adapter names
 * @param {Map<string, AdapterMetrics>} adapterMetrics - Performance metrics for adapters
 * @param {string} defaultAdapter - Default adapter to prefer
 * @returns {string} Selected adapter name
 * @throws {Error} If no suitable adapters are available
 */
export function selectRoundRobinWithDefault(
  suitableAdapters: string[],
  adapterMetrics: Map<string, AdapterMetrics>,
  defaultAdapter?: string
): string {
  const validAdapters = filterAndValidateAdapters(
    suitableAdapters,
    'selectRoundRobin'
  );
  return findAdapterWithMinimumRequestsWithDefault(
    validAdapters,
    adapterMetrics,
    defaultAdapter
  );
}

/**
 * Selects adapter with lowest current load.
 *
 * @param {string[]} suitableAdapters - List of suitable adapter names
 * @param {Map<string, AdapterMetrics>} adapterMetrics - Performance metrics for adapters
 * @returns {string} Selected adapter name
 * @throws {Error} If no suitable adapters are available
 */
export function selectByLoad(
  suitableAdapters: string[],
  adapterMetrics: Map<string, AdapterMetrics>
): string {
  const validAdapters = filterAndValidateAdapters(
    suitableAdapters,
    'selectByLoad'
  );
  return findAdapterWithMinimumLoad(validAdapters, adapterMetrics);
}

/**
 * Selects adapter with best quality score.
 *
 * @param {SelectionStrategyParams} params - Selection parameters
 * @returns {Promise<string>} Selected adapter name
 * @throws {Error} If no suitable adapters are available
 */
export async function selectByQuality(
  params: SelectionStrategyParams
): Promise<string> {
  const validAdapters = filterAndValidateAdapters(
    params.suitableAdapters,
    'selectByQuality'
  );

  return findAdapterWithHighestQuality({
    validAdapters,
    adapterMetrics: params.adapterMetrics,
    request: params.request,
    criteria: params.criteria,
    defaultAdapter: params.defaultAdapter,
  });
}
