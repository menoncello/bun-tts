import { TTSError, type TTSErrorOptions } from './tts-error.js';

/** Union type for cost options */
type CostType = 'free' | 'paid' | 'freemium';

/** Union type for effort options */
type EffortType = 'low' | 'medium' | 'high';

/**
 * Internal type for capability configuration data.
 */
interface CapabilityConfig {
  capability?: string;
  requestedValue?: unknown;
  alternatives?: string[];
  capabilityDetails?: {
    requestedCapability?: string;
    requestedFormat?: string;
    alternatives?: Array<{ format: string; qualityImpact: string }>;
    alternativeAdapters?: string[];
  };
  upgradeInfo?: {
    recommendedAdapter?: string;
    benefits?: string[];
    cost?: CostType;
    effort?: EffortType;
  };
}

/**
 * Configuration options for creating a TTSCapabilityError instance.
 */
export interface TTSCapabilityErrorConfig extends CapabilityConfig {
  /** Additional error details */
  details?: Record<string, unknown>;
}

/**
 * Error thrown when TTS engine doesn't support a requested capability.
 * Occurs when trying to use unsupported features, voices, or formats.
 */
export class TTSCapabilityError extends TTSError {
  /** The capability that is not supported */
  public readonly capability?: string;
  /** The requested value that is not supported */
  public readonly requestedValue?: unknown;
  /** List of supported alternatives */
  public readonly alternatives?: string[];
  /** Detailed capability information */
  public readonly capabilityDetails?: {
    requestedCapability?: string;
    requestedFormat?: string;
    alternatives?: Array<{ format: string; qualityImpact: string }>;
    alternativeAdapters?: string[];
  };
  /** Upgrade information */
  public readonly upgradeInfo?: {
    recommendedAdapter?: string;
    benefits?: string[];
    cost?: CostType;
    effort?: EffortType;
  };

  /**
   * Creates a new TTSCapabilityError instance.
   *
   * @param {string} message - Human-readable error message
   * @param {string} engine - The TTS engine
   * @param {string | TTSCapabilityErrorConfig} [capabilityOrConfig] - The capability that is not supported (legacy) or configuration object (modern)
   */
  constructor(
    message: string,
    engine: string,
    capabilityOrConfig?: string | TTSCapabilityErrorConfig
  ) {
    const finalConfig =
      TTSCapabilityError.createConfigFromParameters(capabilityOrConfig);

    const { ttsOptions, capabilityConfig } =
      TTSCapabilityError.prepareErrorData(engine, finalConfig);

    super(message, 'TTS_CAPABILITY_ERROR', ttsOptions);

    this.name = 'TTSCapabilityError';

    TTSCapabilityError.initializeReadOnlyProperties(this, capabilityConfig);
  }

  /**
   * Creates configuration object from constructor parameters.
   *
   * @param {string | TTSCapabilityErrorConfig | undefined} capabilityOrConfig - The capability or config object
   * @returns {TTSCapabilityErrorConfig} Configuration object
   */
  private static createConfigFromParameters(
    capabilityOrConfig?: string | TTSCapabilityErrorConfig
  ): TTSCapabilityErrorConfig {
    return typeof capabilityOrConfig === 'string'
      ? { capability: capabilityOrConfig }
      : capabilityOrConfig || {};
  }

  /**
   * Initializes readonly properties on the instance.
   *
   * @param {TTSCapabilityError} instance - The instance to initialize
   * @param {CapabilityConfig} capabilityConfig - The capability configuration
   */
  private static initializeReadOnlyProperties(
    instance: TTSCapabilityError,
    capabilityConfig: CapabilityConfig
  ): void {
    TTSError.definePropertyReadOnly(
      instance,
      'capability',
      capabilityConfig.capability
    );
    TTSError.definePropertyReadOnly(
      instance,
      'requestedValue',
      capabilityConfig.requestedValue
    );
    TTSError.definePropertyReadOnly(
      instance,
      'alternatives',
      capabilityConfig.alternatives
    );
    TTSError.definePropertyReadOnly(
      instance,
      'capabilityDetails',
      capabilityConfig.capabilityDetails
    );
    TTSError.definePropertyReadOnly(
      instance,
      'upgradeInfo',
      capabilityConfig.upgradeInfo
    );
  }

  /**
   * Prepares error data by separating capability configuration from TTS options.
   *
   * @param {string} engine - The TTS engine
   * @param {TTSCapabilityErrorConfig} config - Configuration object
   * @returns {object} Separated TTS options and capability configuration
   */
  private static prepareErrorData(
    engine: string,
    config: TTSCapabilityErrorConfig
  ): { ttsOptions: TTSErrorOptions; capabilityConfig: CapabilityConfig } {
    const {
      capability,
      requestedValue,
      alternatives,
      capabilityDetails,
      upgradeInfo,
      details,
    } = config;

    const capabilityConfig = {
      capability,
      requestedValue,
      alternatives,
      capabilityDetails,
      upgradeInfo,
    };

    const ttsOptions: TTSErrorOptions = {
      operation: 'validate',
      engine,
      details: {
        ...capabilityConfig,
        ...details,
      },
    };

    return { ttsOptions, capabilityConfig };
  }

  /**
   * Gets whether this error is recoverable.
   * Capability errors are recoverable by using supported alternatives.
   *
   * @returns {boolean} True if the error is potentially recoverable
   */
  public isRecoverable(): boolean {
    // Capability errors are recoverable by using supported alternatives
    return true;
  }

  /**
   * Gets suggested alternatives for capability errors.
   *
   * @returns {string[]} List of suggested alternatives
   */
  public getAlternativeSuggestions(): string[] {
    const suggestions: string[] = [];

    if (this.alternatives && this.alternatives.length > 0) {
      suggestions.push(
        `Try one of these alternatives: ${this.alternatives.join(', ')}`
      );
    }

    if (this.capability) {
      suggestions.push(
        `Check engine documentation for supported ${this.capability} options`
      );
    }

    suggestions.push(
      'Use engine capabilities detection to find supported features'
    );
    suggestions.push(
      'Consider switching to a different engine that supports this capability'
    );

    return suggestions;
  }
}
