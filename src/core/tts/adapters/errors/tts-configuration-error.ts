import { TTSError, type TTSErrorOptions } from './tts-error.js';

/**
 * Configuration error details interface
 */
interface ConfigurationDetails {
  /** List of invalid configuration fields */
  invalidFields?: string[];
  /** List of missing required fields */
  missingFields?: string[];
  /** Array of validation errors with field and message */
  validationErrors?: Array<{ field: string; message: string }>;
  /** Environment-specific configuration issues */
  environmentConfig?: {
    missingEnvVars?: string[];
    invalidConfigFiles?: string[];
  };
}

/**
 * Fix suggestion interface for configuration errors
 */
interface FixSuggestion {
  /** The configuration field that needs fixing */
  field: string;
  /** The action to take to fix the issue */
  action: string;
  /** Priority level for the fix */
  priority?: 'high' | 'medium' | 'low';
}

/**
 * Configuration error parameters interface
 */
interface TTSConfigurationErrorParams {
  /** The TTS engine name */
  engine?: string;
  /** The configuration property that caused the error */
  property?: string;
  /** The invalid value that was provided */
  invalidValue?: unknown;
  /** Expected value or format description */
  expected?: string;
  /** Detailed configuration validation information */
  configDetails?: ConfigurationDetails;
  /** Array of fix suggestions for the configuration issues */
  fixSuggestions?: FixSuggestion[];
  /** Additional error context information */
  details?: Record<string, unknown>;
}

/**
 * Error thrown when TTS configuration is invalid.
 * Occurs during adapter initialization or configuration validation.
 */
export class TTSConfigurationError extends TTSError {
  /** The configuration property that caused the error */
  public readonly property?: string;
  /** The invalid value that was provided */
  public readonly invalidValue?: unknown;
  /** Expected value or format */
  public readonly expected?: string;
  /** Detailed configuration information */
  public readonly configDetails?: ConfigurationDetails;
  /** Fix suggestions */
  public readonly fixSuggestions?: FixSuggestion[];

  /**
   * Creates a new TTSConfigurationError instance.
   * Supports both modern object-based parameters and legacy parameter format.
   *
   * @param {string} message - Human-readable error message
   * @param {TTSConfigurationErrorParams | string} [paramsOrEngine] - Parameters object (modern) or engine name (legacy)
   * @param {...(string | unknown | ConfigurationDetails | FixSuggestion[] | Record<string, unknown>)} args - Additional arguments for legacy constructor format
   * @deprecated When using legacy format, prefer the object parameter constructor
   */

  /**
   * Creates TTS error options from resolved parameters.
   *
   * @param {TTSConfigurationErrorParams} params - Resolved parameters
   * @returns {TTSErrorOptions} TTS error options
   */
  private static createTTSOptions(
    params: TTSConfigurationErrorParams
  ): TTSErrorOptions {
    return {
      operation: 'configure',
      engine: params.engine,
      details: {
        property: params.property,
        invalidValue: params.invalidValue,
        expected: params.expected,
        configDetails: params.configDetails,
        fixSuggestions: params.fixSuggestions,
        ...params.details,
      },
    };
  }

  /**
   * Checks if constructor is called with legacy format parameters.
   *
   * @param {TTSConfigurationErrorParams | string} [paramsOrEngine] - Parameters object or engine name
   * @param {unknown[]} args - Additional arguments
   * @returns {boolean} True if using legacy format
   */
  private static isLegacyConstructorCall(
    paramsOrEngine?: TTSConfigurationErrorParams | string,
    ...args: unknown[]
  ): boolean {
    return (
      typeof paramsOrEngine === 'string' ||
      (typeof paramsOrEngine === 'undefined' && args.length > 0)
    );
  }

  /**
   * Resolves parameters from legacy constructor format.
   *
   * @param {string} engine - The TTS engine name
   * @param {Array} args - Legacy constructor arguments
   * @returns {TTSConfigurationErrorParams} Resolved parameters object
   */
  private static resolveLegacyParameters(
    engine: string,
    args: [
      string?, // property
      unknown?, // invalidValue
      string?, // expected
      ConfigurationDetails?, // configDetails
      FixSuggestion[]?, // fixSuggestions
      Record<string, unknown>?, // details
    ]
  ): TTSConfigurationErrorParams {
    const [
      property,
      invalidValue,
      expected,
      configDetails,
      fixSuggestions,
      details,
    ] = args;

    return {
      engine,
      property,
      invalidValue,
      expected,
      configDetails,
      fixSuggestions,
      details,
    };
  }

  /**
   * Resolves constructor parameters from overloaded signatures.
   *
   * @param {TTSConfigurationErrorParams | string} [paramsOrEngine] - Parameters object or engine name
   * @param {...(string | unknown | ConfigurationDetails | FixSuggestion[] | Record<string, unknown>)} args - Additional arguments for legacy constructor format
   * @returns {TTSConfigurationErrorParams} Resolved parameters object
   */
  private static resolveConstructorParameters(
    paramsOrEngine?: TTSConfigurationErrorParams | string,
    ...args: [
      string?, // property
      unknown?, // invalidValue
      string?, // expected
      ConfigurationDetails?, // configDetails
      FixSuggestion[]?, // fixSuggestions
      Record<string, unknown>?, // details
    ]
  ): TTSConfigurationErrorParams {
    if (this.isLegacyConstructorCall(paramsOrEngine, ...args)) {
      const engine =
        typeof paramsOrEngine === 'string' ? paramsOrEngine : undefined;
      return this.resolveLegacyParameters(engine || '', args);
    }

    // New format: constructor(message, params?)
    return (paramsOrEngine as TTSConfigurationErrorParams) || {};
  }

  /**
   * Constructor implementation with parameter overloading support.
   *
   * @param {string} message - Human-readable error message
   * @param {TTSConfigurationErrorParams | string} [paramsOrEngine] - Parameters object or engine name
   * @param {...(string | unknown | ConfigurationDetails | FixSuggestion[] | Record<string, unknown>)} args - Additional arguments for legacy constructor format
   */
  constructor(
    message: string,
    paramsOrEngine?: TTSConfigurationErrorParams | string,
    ...args: [
      string?, // property
      unknown?, // invalidValue
      string?, // expected
      ConfigurationDetails?, // configDetails
      FixSuggestion[]?, // fixSuggestions
      Record<string, unknown>?, // details
    ]
  ) {
    const params = TTSConfigurationError.resolveConstructorParameters(
      paramsOrEngine,
      ...args
    );

    const ttsOptions = TTSConfigurationError.createTTSOptions(params);

    super(message, 'TTS_CONFIGURATION_ERROR', ttsOptions);

    this.name = 'TTSConfigurationError';
    this.property = params.property;
    this.invalidValue = params.invalidValue;
    this.expected = params.expected;
    this.configDetails = params.configDetails;
    this.fixSuggestions = params.fixSuggestions;
  }

  /**
   * Gets whether this error is recoverable.
   * Configuration errors are typically not recoverable without fixing the config.
   *
   * @returns {boolean} True if the error is potentially recoverable
   */
  public isRecoverable(): boolean {
    // Configuration errors usually require fixing the configuration
    return false;
  }

  /**
   * Gets suggested fixes for configuration errors.
   *
   * @returns {string[]} List of suggested fixes
   */
  public getFixSuggestions(): string[] {
    const suggestions: string[] = [];

    if (this.property && this.expected) {
      suggestions.push(`Fix "${this.property}" property: ${this.expected}`);
    }

    if (this.property) {
      suggestions.push(
        `Check configuration documentation for "${this.property}"`
      );
    }

    suggestions.push('Verify all required configuration properties are set');
    suggestions.push('Check for typos in property names or values');
    suggestions.push('Validate configuration against schema');

    return suggestions;
  }
}
