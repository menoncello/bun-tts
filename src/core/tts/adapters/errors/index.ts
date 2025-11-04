// Import classes for type guards to avoid circular dependencies
import { TTSCapabilityError } from './tts-capability-error.js';
import { TTSConfigurationError } from './tts-configuration-error.js';
import { TTSError } from './tts-error.js';
import { TTSSynthesisError } from './tts-synthesis-error.js';

/**
 * TTS adapter error hierarchy exports
 */

export { TTSError, type TTSErrorOptions } from './tts-error.js';
export {
  TTSSynthesisError,
  type TTSSynthesisErrorConfig,
} from './tts-synthesis-error.js';
export { TTSConfigurationError } from './tts-configuration-error.js';
export { TTSCapabilityError } from './tts-capability-error.js';

/**
 * Type guard to check if an error is a TTSError
 *
 * @param {unknown} error - The error to check
 * @returns {boolean} True if the error is a TTSError
 */
export function isTTSError(error: unknown): error is TTSError {
  return error instanceof TTSError;
}

/**
 * Type guard to check if an error is a TTSSynthesisError
 *
 * @param {unknown} error - The error to check
 * @returns {boolean} True if the error is a TTSSynthesisError
 */
export function isTTSSynthesisError(
  error: unknown
): error is TTSSynthesisError {
  return error instanceof TTSSynthesisError;
}

/**
 * Type guard to check if an error is a TTSConfigurationError
 *
 * @param {unknown} error - The error to check
 * @returns {boolean} True if the error is a TTSConfigurationError
 */
export function isTTSConfigurationError(
  error: unknown
): error is TTSConfigurationError {
  return error instanceof TTSConfigurationError;
}

/**
 * Type guard to check if an error is a TTSCapabilityError
 *
 * @param {unknown} error - The error to check
 * @returns {boolean} True if the error is a TTSCapabilityError
 */
export function isTTSCapabilityError(
  error: unknown
): error is TTSCapabilityError {
  return error instanceof TTSCapabilityError;
}

/**
 * Creates a standardized TTSError from an unknown error
 *
 * @param {unknown} error - The error to convert
 * @param {string} engine - The TTS engine name
 * @param {string} operation - The operation that failed
 * @param {string} requestId - The request identifier
 * @returns {TTSError} A standardized TTSError
 */
export function createTTSError(
  error: unknown,
  engine: string,
  operation: string,
  requestId?: string
): TTSError {
  if (isTTSError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new TTSError(error.message, 'TTS_UNKNOWN_ERROR', {
      operation,
      engine,
      requestId,
      details: { originalError: error.name, stack: error.stack },
      cause: error,
    });
  }

  return new TTSError(String(error), 'TTS_UNKNOWN_ERROR', {
    operation,
    engine,
    requestId,
    details: { originalError: error },
  });
}

/**
 * Factory function to create TTSSynthesisError for common scenarios
 * @param {string} message - The error message
 * @param {string} engine - The TTS engine name
 * @param {string} requestId - The request identifier
 * @param {object} [synthesisContext] - Additional synthesis context
 * @param {string} [synthesisContext.text] - The text that failed to synthesize
 * @param {string} [synthesisContext.voice] - The voice that failed to synthesize
 * @returns {TTSSynthesisError} A new TTSSynthesisError instance
 */
export function createSynthesisError(
  message: string,
  engine: string,
  requestId: string,
  synthesisContext?: {
    text?: string;
    voice?: string;
  }
): TTSSynthesisError {
  return new TTSSynthesisError(message, engine, requestId, synthesisContext);
}

/**
 * Factory function to create TTSConfigurationError for common scenarios
 * @param {string} message - The error message
 * @param {string} engine - The TTS engine name
 * @param {string} property - The configuration property name
 * @param {unknown} [invalidValue] - The invalid value that was provided
 * @returns {TTSConfigurationError} A new TTSConfigurationError instance
 */
export function createConfigurationError(
  message: string,
  engine: string,
  property: string,
  invalidValue?: unknown
): TTSConfigurationError {
  const configDetails = {
    invalidFields: [property],
    missingFields: [],
    validationErrors: [{ field: property, message }],
  };

  const fixSuggestions = [
    {
      field: property,
      action: `Fix "${property}" configuration value`,
      priority: 'high' as const,
    },
  ];

  return new TTSConfigurationError(
    message,
    engine,
    property,
    invalidValue,
    undefined,
    configDetails,
    fixSuggestions
  );
}

/**
 * Factory function to create TTSCapabilityError for common scenarios
 * @param {string} message - The error message
 * @param {string} engine - The TTS engine name
 * @param {string} capability - The capability that is not supported
 * @param {unknown} [requestedValue] - The requested value that is not supported
 * @returns {TTSCapabilityError} A new TTSCapabilityError instance
 */
export function createCapabilityError(
  message: string,
  engine: string,
  capability: string,
  requestedValue?: unknown
): TTSCapabilityError {
  return new TTSCapabilityError(message, engine, {
    capability,
    requestedValue,
  });
}
