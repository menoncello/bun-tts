import {
  BunTtsError,
  BunTtsErrorOptions,
} from '../../../../errors/bun-tts-error.js';

/**
 * Parsed constructor parameters for TTSError.
 */
interface ParsedConstructorParams {
  operation?: string;
  engine?: string;
  requestId?: string;
  details?: Record<string, unknown>;
  context?: Record<string, unknown>;
  cause?: Error;
}

/**
 * Raw constructor parameters before parsing.
 */
interface RawConstructorParams {
  operationOrOptions?: string | TTSErrorOptions;
  engine?: string;
  requestId?: string;
  details?: Record<string, unknown>;
  context?: Record<string, unknown>;
  cause?: Error;
}

/**
 * Legacy constructor parameters for the createLegacy factory method.
 */
interface LegacyConstructorParams {
  operation?: string;
  engine?: string;
  requestId?: string;
  details?: Record<string, unknown>;
  context?: Record<string, unknown>;
  cause?: Error;
}

/**
 * Configuration options for creating a TTSError instance.
 */
export interface TTSErrorOptions {
  /** The TTS operation that failed */
  operation?: string;
  /** The TTS engine that generated the error */
  engine?: string;
  /** The request identifier for tracking */
  requestId?: string;
  /** Additional error context */
  details?: Record<string, unknown>;
  /** Context information for debugging */
  context?: Record<string, unknown>;
  /** Root cause error for error chaining */
  cause?: Error;
}

/**
 * Base error class for all TTS-related errors.
 * Extends BunTtsError with TTS-specific functionality.
 */
export class TTSError extends BunTtsError {
  /** The TTS engine that generated the error */
  public readonly engine?: string;
  /** The TTS operation that failed */
  public readonly operation?: string;
  /** The request identifier for tracking */
  public readonly requestId?: string;
  /** Context information for debugging */
  public readonly context?: Record<string, unknown>;
  /** Root cause error for error chaining */
  public override readonly cause?: Error;

  /**
   * Creates a new TTSError instance.
   * Supports both legacy parameter-based (via createLegacy factory) and modern options-based construction.
   *
   * @param {string} message - Human-readable error message
   * @param {string} code - Unique error code
   * @param {TTSErrorOptions} [options] - TTS error configuration options
   */
  constructor(message: string, code: string, options?: TTSErrorOptions) {
    const constructorParams = TTSError.parseConstructorParametersStatic({
      operationOrOptions: options,
      engine: undefined,
      requestId: undefined,
      details: undefined,
      context: undefined,
      cause: undefined,
    });

    const errorOptions = TTSError.buildErrorOptionsStatic(
      code,
      constructorParams
    );

    super(message, errorOptions);

    this.name = 'TTSError';
    TTSError.initializeTTSPropertiesStatic(this, constructorParams);
    TTSError.setErrorChainStatic(this, constructorParams.cause);
  }

  /**
   * Factory method to create a TTSError using legacy parameter-based construction.
   *
   * @param {string} message - Human-readable error message
   * @param {string} code - Unique error code
   * @param {LegacyConstructorParams} params - Legacy constructor parameters
   * @returns {TTSError} New TTSError instance
   */
  public static createLegacy(
    message: string,
    code: string,
    params?: LegacyConstructorParams
  ): TTSError {
    return new TTSError(message, code, params || {});
  }

  /**
   * Static method to parse constructor parameters to support both legacy and options-based signatures.
   *
   * @param {RawConstructorParams} rawParams - Raw constructor parameters
   * @returns {ParsedConstructorParams} Normalized constructor parameters
   */
  private static parseConstructorParametersStatic(
    rawParams: RawConstructorParams
  ): ParsedConstructorParams {
    const { operationOrOptions, engine, requestId, details, context, cause } =
      rawParams;

    // Check if using options-based constructor
    if (TTSError.isOptionsObjectStatic(operationOrOptions)) {
      return TTSError.parseOptionsParametersStatic(operationOrOptions);
    }

    // Using legacy constructor
    return TTSError.parseLegacyParametersStatic({
      operation: operationOrOptions as string | undefined,
      engine,
      requestId,
      details,
      context,
      cause,
    });
  }

  /**
   * Static method to determine if the parameter is an options object.
   *
   * @param {string | TTSErrorOptions | undefined} param - Parameter to check
   * @returns {boolean} True if parameter is an options object
   */
  private static isOptionsObjectStatic(
    param: string | TTSErrorOptions | undefined
  ): param is TTSErrorOptions {
    return typeof param === 'object' && param !== null;
  }

  /**
   * Static method to parse options-based constructor parameters.
   *
   * @param {TTSErrorOptions} options - Options object
   * @returns {ParsedConstructorParams} Normalized parameters
   */
  private static parseOptionsParametersStatic(
    options: TTSErrorOptions
  ): ParsedConstructorParams {
    return {
      operation: options.operation,
      engine: options.engine,
      requestId: options.requestId,
      details: options.details,
      context: options.context,
      cause: options.cause,
    };
  }

  /**
   * Static method to parse legacy constructor parameters.
   *
   * @param {ParsedConstructorParams} params - Legacy constructor parameters
   * @returns {ParsedConstructorParams} Normalized parameters
   */
  private static parseLegacyParametersStatic(
    params: ParsedConstructorParams
  ): ParsedConstructorParams {
    return params;
  }

  /**
   * Static method to build error options for the base BunTtsError constructor.
   *
   * @param {string} code - Error code
   * @param {ParsedConstructorParams} params - Parsed constructor parameters
   * @returns {BunTtsErrorOptions} Options for base class
   */
  private static buildErrorOptionsStatic(
    code: string,
    params: ParsedConstructorParams
  ): BunTtsErrorOptions {
    return {
      code,
      category: 'tts',
      recoverable: true,
      details: TTSError.buildErrorDetailsFromParamsStatic(params),
    };
  }

  /**
   * Static method to build error details from parsed parameters.
   *
   * @param {ParsedConstructorParams} params - Parsed constructor parameters
   * @returns {Record<string, unknown>} Combined error details
   */
  private static buildErrorDetailsFromParamsStatic(
    params: ParsedConstructorParams
  ): Record<string, unknown> {
    const baseDetails = {
      operation: params.operation,
      engine: params.engine,
      requestId: params.requestId,
    };

    return {
      ...baseDetails,
      ...params.details,
    };
  }

  /**
   * Static method to initialize TTS-specific properties from parsed parameters.
   *
   * @param {TTSError} instance - The TTSError instance to initialize
   * @param {ParsedConstructorParams} params - Parsed constructor parameters
   */
  private static initializeTTSPropertiesStatic(
    instance: TTSError,
    params: ParsedConstructorParams
  ): void {
    TTSError.definePropertyReadOnly(instance, 'engine', params.engine);
    TTSError.definePropertyReadOnly(instance, 'operation', params.operation);
    TTSError.definePropertyReadOnly(instance, 'requestId', params.requestId);
    TTSError.definePropertyReadOnly(instance, 'context', params.context);
    TTSError.definePropertyReadOnly(instance, 'cause', params.cause);
  }

  /**
   * Helper method to define a read-only property on an object.
   *
   * @param {TTSError} instance - The TTSError instance
   * @param {string} propertyName - The property name to define
   * @param {unknown} value - The property value
   */
  protected static definePropertyReadOnly(
    instance: TTSError,
    propertyName: string,
    value: unknown
  ): void {
    Object.defineProperty(instance, propertyName, {
      value,
      enumerable: true,
      configurable: false,
      writable: false,
    });
  }

  /**
   * Static method to set up error chain if a cause is provided.
   *
   * @param {TTSError} instance - The TTSError instance
   * @param {Error | undefined} cause - Root cause error
   */
  private static setErrorChainStatic(instance: TTSError, cause?: Error): void {
    if (cause) {
      instance.stack = `${instance.stack}\nCaused by: ${cause.stack}`;
    }
  }

  /**
   * Builds error details for the base class.
   *
   * @param {TTSErrorOptions} options - TTS error options
   * @returns {Record<string, unknown>} Combined error details
   */
  private static buildErrorDetails(
    options: TTSErrorOptions
  ): Record<string, unknown> {
    const baseDetails = {
      operation: options.operation,
      engine: options.engine,
      requestId: options.requestId,
    };

    return {
      ...baseDetails,
      ...options.details,
    };
  }

  /**
   * Gets a user-friendly error message specific to TTS errors.
   *
   * @returns {string} A formatted error message with TTS context
   */
  public override getUserMessage(): string {
    let message = super.getUserMessage();

    if (this.engine) {
      message += ` (Engine: ${this.engine})`;
    }

    if (this.operation) {
      message += ` (Operation: ${this.operation})`;
    }

    return message;
  }

  /**
   * Determines whether this error should be logged with full details.
   * TTS errors often contain sensitive voice or text data.
   *
   * @returns {boolean} True if the error should be logged with full details
   */
  public override shouldLogDetails(): boolean {
    // Don't log full details for errors containing text content
    const containsTextContent = this.details?.text !== undefined;
    return !containsTextContent;
  }

  /**
   * Serializes the error to a JSON object for logging or API responses.
   * Includes TTS-specific properties.
   *
   * @returns {Record<string, unknown>} A JSON representation of the error
   */
  public override toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      details: this.details,
      recoverable: this.recoverable,
      engine: this.engine,
      operation: this.operation,
      requestId: this.requestId,
      stack: this.stack,
    };
  }

  /**
   * Sanitizes the error for logging by removing sensitive information.
   *
   * @returns {Record<string, unknown>} A sanitized version for logging
   */
  public toLogSafeJSON(): Record<string, unknown> {
    const json = this.toJSON();

    // Remove or truncate sensitive information
    if (
      json.details &&
      typeof json.details === 'object' &&
      json.details !== null
    ) {
      const details = { ...(json.details as Record<string, unknown>) };

      // Sanitize text content
      if (details.text !== undefined) {
        details.text =
          typeof details.text === 'string'
            ? `[${details.text.length} characters]`
            : '[text content]';
      }

      json.details = details;
    }

    return json;
  }
}
