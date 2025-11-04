import type { Result } from '../../../errors/result.js';
import { TTSError } from './errors/tts-error.js';
import type { TtsAdapter } from './itts-adapter.js';
import { DEFAULT_SELECTION_STRATEGY } from './tts-adapter-constants.js';
import { AdapterLifecycleManager } from './tts-adapter-lifecycle.js';
import { AdapterMetricsManager } from './tts-adapter-metrics.js';
import { TTSAdapterOperations } from './tts-adapter-operations.js';
import { TTSAdapterRegistry } from './tts-adapter-registry.js';
import { AdapterSelectionStrategy } from './tts-adapter-selection-strategy.js';
import { performSynthesis } from './tts-adapter-synthesis.js';
import type {
  AdapterPerformanceMetrics,
  TTSAdapterManagerOptions,
  EngineSelectionResult,
  AdapterRegistration,
} from './tts-adapter-types.js';
import { findAdapterRegistrationName } from './tts-synthesis-fallback.js';
import type {
  TTSRequest,
  TTSResponse,
  TTSOptions,
  VoiceInfo,
  TTSCapabilities,
  VoiceConfig,
  EngineSelectionCriteria,
  ValidationResult,
  HealthCheckResult,
} from './types.js';

/**
 * Manager for TTS adapter registration, selection, and orchestration.
 * Provides factory pattern for managing multiple TTS engines with automatic fallback.
 */
export class TTSAdapterManager {
  /** Registry for adapter management */
  private readonly registry: TTSAdapterRegistry;

  /** Default adapter name */
  private defaultAdapter?: string;

  /** Fallback adapter chain */
  private fallbackChain: string[] = [];

  /** Adapter selection strategy */
  private selectionStrategy: 'round-robin' | 'best-quality' | 'least-load' =
    DEFAULT_SELECTION_STRATEGY;

  /** Metrics manager for performance tracking */
  private readonly metricsManager: AdapterMetricsManager;

  /** Lifecycle manager for adapter operations */
  private readonly lifecycleManager: AdapterLifecycleManager;

  /** Selection strategy manager */
  private selectionStrategyManager!: AdapterSelectionStrategy;

  /**
   * Direct access to adapters map for internal operations
   *
   * @returns {Map<string, AdapterRegistration>} The adapters map
   */
  private get adapters(): Map<string, AdapterRegistration> {
    return this.registry.getAdapters();
  }

  /**
   * Creates a new TTSAdapterManager instance.
   *
   * @param {TTSAdapterManagerOptions} options - Configuration options
   */
  constructor(options?: TTSAdapterManagerOptions) {
    this.defaultAdapter = options?.defaultAdapter;
    this.fallbackChain = options?.fallbackChain || [];
    this.selectionStrategy =
      options?.selectionStrategy || DEFAULT_SELECTION_STRATEGY;

    // Initialize managers
    this.registry = new TTSAdapterRegistry(new Map());
    this.metricsManager = new AdapterMetricsManager();

    // We need to initialize the lifecycle and selection managers after adapters map is created
    // but we need a temporary adapters map for their constructors
    this.lifecycleManager = new AdapterLifecycleManager(
      this.adapters,
      this.metricsManager.getAllMetrics()
    );

    this.updateSelectionStrategyManager();
  }

  /**
   * Registers a TTS adapter with the manager.
   *
   * @param {string} name - Unique identifier for the adapter
   * @param {TtsAdapter} adapter - The adapter instance to register
   * @throws {TTSConfigurationError} If adapter validation fails
   */
  async registerAdapter(name: string, adapter: TtsAdapter): Promise<void> {
    await this.registry.registerAdapter(
      name,
      adapter,
      this.lifecycleManager.initializeAdapter.bind(this.lifecycleManager),
      this.metricsManager.initializeAdapterMetrics.bind(this.metricsManager)
    );

    // Update selection strategy manager with new metrics
    this.updateSelectionStrategyManager();
  }

  /**
   * Unregisters an adapter from the manager.
   *
   * @param {string} name - The adapter name to unregister
   * @returns {Promise<boolean>} True if adapter was found and removed
   */
  async unregisterAdapter(name: string): Promise<boolean> {
    const result = await this.registry.unregisterAdapter(
      name,
      this.lifecycleManager.cleanupAdapter.bind(this.lifecycleManager),
      this.metricsManager.removeAdapterMetrics.bind(this.metricsManager)
    );

    if (result) {
      // Update selection strategy manager
      this.updateSelectionStrategyManager();

      // Update default adapter if needed
      this.defaultAdapter = this.registry.updateDefaultAdapter(
        this.defaultAdapter,
        name
      );
    }

    return result;
  }

  /**
   * Gets a registered adapter by name.
   *
   * @param {string} name - The adapter name
   * @returns {TtsAdapter | undefined} The adapter or undefined if not found
   */
  getAdapter(name: string): TtsAdapter | undefined {
    return this.registry.getAdapter(name);
  }

  /**
   * Gets all registered adapter names.
   *
   * @returns {string[]} Array of registered adapter names
   */
  getRegisteredAdapters(): string[] {
    return this.registry.getRegisteredAdapters();
  }

  /**
   * Gets all available (initialized and healthy) adapter names.
   *
   * @returns {Promise<string[]>} Array of available adapter names
   */
  async getAvailableAdapters(): Promise<string[]> {
    return this.lifecycleManager.getAvailableAdapters();
  }

  /**
   * Selects the best adapter for a given synthesis request.
   *
   * @param {TTSRequest} request - The synthesis request
   * @param {EngineSelectionCriteria} criteria - Optional selection criteria
   * @returns {Promise<EngineSelectionResult>} Selected adapter with metadata
   */
  async selectBestAdapter(
    request: TTSRequest,
    criteria?: EngineSelectionCriteria
  ): Promise<EngineSelectionResult> {
    const availableAdapters = await this.getAvailableAdapters();
    return this.selectionStrategyManager.selectBestAdapter(
      request,
      availableAdapters,
      criteria
    );
  }

  /**
   * Synthesizes speech using the best available adapter with fallback.
   *
   * @param {TTSRequest} request - The synthesis request
   * @param {EngineSelectionCriteria} criteria - Optional selection criteria
   * @returns {Promise<Result<TTSResponse, TTSError>>} Synthesis result or error
   */
  async synthesize(
    request: TTSRequest,
    criteria?: EngineSelectionCriteria
  ): Promise<Result<TTSResponse, TTSError>> {
    const selectionResult = await this.selectBestAdapter(request, criteria);
    const { adapter, fallbackChain } = selectionResult;

    // Find the registration name for this adapter
    const registrationName = findAdapterRegistrationName(
      adapter,
      this.adapters
    );

    // Transform adapters map from AdapterRegistration to TtsAdapter
    const adaptersMap = new Map<string, TtsAdapter>();
    for (const [name, registration] of Array.from(this.adapters.entries())) {
      adaptersMap.set(name, registration.adapter);
    }

    // Perform synthesis with fallback
    return performSynthesis(
      {
        request,
        adapter,
        registrationName,
        fallbackChain,
        criteria,
      },
      adaptersMap,
      this.metricsManager.updateAdapterMetrics.bind(this.metricsManager)
    );
  }

  /**
   * Gets supported voices from all available adapters.
   *
   * @returns {Promise<VoiceInfo[]>} Combined list of all available voices
   */
  async getSupportedVoices(): Promise<VoiceInfo[]> {
    return TTSAdapterOperations.getSupportedVoices(
      this.getAvailableAdapters.bind(this),
      this.adapters
    );
  }

  /**
   * Finds a voice by ID or language across all available adapters.
   *
   * @param {string} query - Voice ID, name, or language code
   * @returns {Promise<VoiceInfo | undefined>} Voice information or undefined if not found
   */
  async getVoice(query: string): Promise<VoiceInfo | undefined> {
    return TTSAdapterOperations.getVoice(
      query,
      this.getSupportedVoices.bind(this)
    );
  }

  /**
   * Gets combined capabilities from all available adapters.
   *
   * @returns {Promise<TTSCapabilities>} Aggregated capabilities
   */
  async getAggregatedCapabilities(): Promise<TTSCapabilities> {
    return TTSAdapterOperations.getAggregatedCapabilities(
      this.getAvailableAdapters.bind(this),
      this.adapters
    );
  }

  /**
   * Performs health checks on all registered adapters.
   *
   * @returns {Promise<HealthCheckResult[]>} Health check results for all adapters
   */
  async healthCheckAll(): Promise<HealthCheckResult[]> {
    return this.lifecycleManager.healthCheckAll();
  }

  /**
   * Initializes all registered adapters.
   *
   * @returns {Promise<void>} Promise that resolves when all adapters are initialized
   */
  async initializeAll(): Promise<void> {
    return this.lifecycleManager.initializeAll();
  }

  /**
   * Cleans up all registered adapters.
   *
   * @returns {Promise<void>} Promise that resolves when all adapters are cleaned up
   */
  async cleanupAll(): Promise<void> {
    return this.lifecycleManager.cleanupAll();
  }

  /**
   * Validates options against all available adapters.
   *
   * @param {TTSOptions} options - Options to validate
   * @returns {Promise<ValidationResult>} Combined validation result
   */
  async validateOptions(options: TTSOptions): Promise<ValidationResult> {
    return TTSAdapterOperations.validateOptions(
      options,
      this.getAvailableAdapters.bind(this),
      this.adapters
    );
  }

  /**
   * Validates voice configuration against all available adapters.
   *
   * @param {VoiceConfig} voice - Voice configuration to validate
   * @returns {Promise<ValidationResult>} Combined validation result
   */
  async validateVoice(voice: VoiceConfig): Promise<ValidationResult> {
    return TTSAdapterOperations.validateVoice(
      voice,
      this.getAvailableAdapters.bind(this),
      this.adapters
    );
  }

  /**
   * Gets performance metrics for all adapters.
   *
   * @returns {Record<string, AdapterPerformanceMetrics>} Performance metrics by adapter name
   */
  getPerformanceMetrics(): Record<string, AdapterPerformanceMetrics> {
    return this.metricsManager.getPerformanceMetrics(this.adapters);
  }

  /**
   * Updates the selection strategy manager with current state.
   *
   * @private
   */
  private updateSelectionStrategyManager(): void {
    this.selectionStrategyManager = new AdapterSelectionStrategy(
      this.adapters,
      this.metricsManager.getAllMetrics(),
      this.selectionStrategy,
      this.defaultAdapter
    );
  }
}
