/**
 * Adapter selection strategies implementation
 */

import {
  calculateAdapterScore,
  getSelectionReason,
} from './adapter-selection-helpers.js';
import type { TtsAdapter } from './itts-adapter.js';
import { TTSAdapterErrorFactory } from './tts-adapter-error-factory.js';
import {
  filterSuitableAdapters,
  selectRoundRobinWithDefault,
  selectByLoad,
  selectByQuality,
} from './tts-adapter-selector.js';
import type {
  CreateEngineSelectionResultParams,
  EngineSelectionResult,
  InternalAdapterMetrics,
} from './tts-adapter-types.js';
import type { AdapterRegistration } from './tts-adapter-voice-validation.js';
import type { TTSRequest, EngineSelectionCriteria } from './types.js';

/**
 * Manages adapter selection strategies
 */
export class AdapterSelectionStrategy {
  /**
   * Creates a new adapter selection strategy instance.
   *
   * @param {Map<string, AdapterRegistration>} adapters - Map of registered adapters
   * @param {Map<string, InternalAdapterMetrics>} adapterMetrics - Adapter performance metrics
   * @param {'round-robin' | 'best-quality' | 'least-load'} selectionStrategy - Selection strategy to use
   * @param {string} defaultAdapter - Default adapter name
   */
  constructor(
    private readonly adapters: Map<string, AdapterRegistration>,
    private readonly adapterMetrics: Map<string, InternalAdapterMetrics>,
    private readonly selectionStrategy:
      | 'round-robin'
      | 'best-quality'
      | 'least-load',
    private readonly defaultAdapter?: string
  ) {}

  /**
   * Selects the best adapter for a given synthesis request.
   *
   * @param {TTSRequest} request - The synthesis request
   * @param {string[]} availableAdapters - List of available adapters
   * @param {EngineSelectionCriteria} criteria - Optional selection criteria
   * @returns {Promise<EngineSelectionResult>} Selected adapter with metadata
   * @throws {TTSError} If no suitable adapter is found
   */
  async selectBestAdapter(
    request: TTSRequest,
    availableAdapters: string[],
    criteria?: EngineSelectionCriteria
  ): Promise<EngineSelectionResult> {
    this.validateAvailableAdapters(availableAdapters);

    const suitableAdapters = await this.getSuitableAdapters(
      availableAdapters,
      request,
      criteria
    );

    const selectedName = await this.selectAdapterByStrategy(
      suitableAdapters,
      request,
      criteria
    );
    const adapter = this.getAdapterOrThrow(selectedName);

    return this.createEngineSelectionResult({
      adapter,
      selectedName,
      suitableAdapters,
      request,
      criteria,
    });
  }

  /**
   * Validates that there are available adapters.
   *
   * @param {string[]} availableAdapters - List of available adapters
   * @throws {TTSError} If no adapters are available
   */
  private validateAvailableAdapters(availableAdapters: string[]): void {
    if (availableAdapters.length === 0) {
      throw TTSAdapterErrorFactory.createNoAdaptersAvailableError();
    }
  }

  /**
   * Gets suitable adapters for a request.
   *
   * @param {string[]} availableAdapters - List of available adapters
   * @param {TTSRequest} request - The synthesis request
   * @param {EngineSelectionCriteria} criteria - Selection criteria
   * @returns {Promise<string[]>} List of suitable adapter names
   * @throws {TTSError} If no suitable adapters are found
   */
  private async getSuitableAdapters(
    availableAdapters: string[],
    request: TTSRequest,
    criteria?: EngineSelectionCriteria
  ): Promise<string[]> {
    // Transform adapters map from AdapterRegistration to TtsAdapter
    const adaptersMap = new Map<string, TtsAdapter>();
    for (const [name, registration] of Array.from(this.adapters.entries())) {
      adaptersMap.set(name, registration.adapter);
    }

    const suitableAdapters = await filterSuitableAdapters(
      adaptersMap,
      availableAdapters,
      request,
      criteria
    );

    if (suitableAdapters.length === 0) {
      throw TTSAdapterErrorFactory.createNoSuitableAdaptersError(
        request,
        availableAdapters.length
      );
    }

    return suitableAdapters;
  }

  /**
   * Selects an adapter based on the configured strategy.
   *
   * @param {string[]} suitableAdapters - List of suitable adapter names
   * @param {TTSRequest} request - The synthesis request
   * @param {EngineSelectionCriteria} criteria - Selection criteria
   * @returns {Promise<string>} Selected adapter name
   */
  private async selectAdapterByStrategy(
    suitableAdapters: string[],
    request: TTSRequest,
    criteria?: EngineSelectionCriteria
  ): Promise<string> {
    switch (this.selectionStrategy) {
      case 'round-robin':
        return selectRoundRobinWithDefault(
          suitableAdapters,
          this.adapterMetrics,
          this.defaultAdapter
        );
      case 'least-load':
        return selectByLoad(suitableAdapters, this.adapterMetrics);
      case 'best-quality':
      default:
        return selectByQuality({
          suitableAdapters,
          request,
          criteria,
          adapterMetrics: this.adapterMetrics,
          defaultAdapter: this.defaultAdapter,
        });
    }
  }

  /**
   * Gets an adapter by name or throws an error if not found.
   *
   * @param {string} adapterName - The adapter name to get
   * @returns {TtsAdapter} The adapter instance
   * @throws {TTSError} If adapter is not found
   */
  private getAdapterOrThrow(adapterName: string): TtsAdapter {
    const adapter = this.adapters.get(adapterName)?.adapter;
    if (!adapter) {
      throw TTSAdapterErrorFactory.createAdapterNotFoundError(adapterName);
    }
    return adapter;
  }

  /**
   * Creates an engine selection result.
   *
   * @param {CreateEngineSelectionResultParams} params - The selection parameters
   * @returns {Promise<EngineSelectionResult>} The selection result
   */
  private async createEngineSelectionResult(
    params: CreateEngineSelectionResultParams
  ): Promise<EngineSelectionResult> {
    const { adapter, selectedName, suitableAdapters, request, criteria } =
      params;

    return {
      adapter,
      reason: getSelectionReason({
        selectedAdapter: selectedName,
        suitableAdapters,
        criteria,
        adapterMetrics: this.adapterMetrics,
        defaultAdapter: this.defaultAdapter,
        selectionStrategy: this.selectionStrategy,
      }),
      score: await calculateAdapterScore({
        adapterName: selectedName,
        suitableAdapters,
        request,
        criteria,
        adapterMetrics: this.adapterMetrics,
        defaultAdapter: this.defaultAdapter,
      }),
      fallbackChain: suitableAdapters,
    };
  }
}
