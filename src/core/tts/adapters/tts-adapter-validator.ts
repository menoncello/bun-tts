import { TTSConfigurationError } from './errors/index.js';
import type { TtsAdapter } from './itts-adapter.js';
import type {
  TTSOptions,
  VoiceConfig,
  ValidationResult,
  TTSCapabilities,
} from './types.js';

// Constants for ESLint compliance
const UNKNOWN_ERROR_MESSAGE = 'Unknown error';

/**
 * List of required methods that all TTS adapters must implement.
 */
const REQUIRED_ADAPTER_METHODS = [
  'synthesize',
  'getSupportedVoices',
  'getCapabilities',
  'validateOptions',
  'validateVoice',
  'initialize',
  'cleanup',
  'healthCheck',
  'supportsFeature',
  'getVoice',
] as const;

/**
 * Validates that an adapter implements all required methods.
 *
 * @param {TtsAdapter} adapter - Adapter to validate
 * @throws {TTSConfigurationError} If adapter is missing required methods
 */
function validateAdapterMethods(adapter: TtsAdapter): void {
  for (const method of REQUIRED_ADAPTER_METHODS) {
    if (
      typeof (adapter as unknown as Record<string, unknown>)[method] !==
      'function'
    ) {
      throw new TTSConfigurationError(
        `Adapter must implement method: ${method}`,
        'TTSAdapterManager',
        'adapter',
        adapter,
        'TtsAdapter interface implementation'
      );
    }
  }
}

/**
 * Validates that an adapter has a proper name property.
 *
 * @param {TtsAdapter} adapter - Adapter to validate
 * @throws {TTSConfigurationError} If adapter name is invalid
 */
function validateAdapterName(adapter: TtsAdapter): void {
  if (typeof adapter.name !== 'string') {
    throw new TTSConfigurationError(
      'Adapter must have a name property',
      'TTSAdapterManager',
      'name',
      adapter.name,
      'string'
    );
  }
}

/**
 * Validates that an adapter has a proper version property.
 *
 * @param {TtsAdapter} adapter - Adapter to validate
 * @throws {TTSConfigurationError} If adapter version is invalid
 */
function validateAdapterVersion(adapter: TtsAdapter): void {
  if (typeof adapter.version !== 'string') {
    throw new TTSConfigurationError(
      'Adapter must have a version property',
      'TTSAdapterManager',
      'version',
      adapter.version,
      'string'
    );
  }
}

/**
 * Validates that an object implements the TtsAdapter interface.
 *
 * @param {TtsAdapter} adapter - Adapter to validate
 * @throws {TTSConfigurationError} If adapter does not implement required interface
 */
export function validateAdapterInterface(adapter: TtsAdapter): void {
  validateAdapterMethods(adapter);
  validateAdapterName(adapter);
  validateAdapterVersion(adapter);
}

/**
 * Validates options against a single adapter.
 *
 * @param {TtsAdapter} adapter - Adapter to validate against
 * @param {TTSOptions} options - Options to validate
 * @param {string} adapterName - Name of the adapter for error reporting
 * @returns {ValidationResult} Validation result with adapter-specific errors
 */
export function validateAdapterOptions(
  adapter: TtsAdapter,
  options: TTSOptions,
  adapterName: string
): ValidationResult {
  try {
    const result = adapter.validateOptions(options);
    return {
      ...result,
      errors: result.errors.map((error: string) => `[${adapterName}] ${error}`),
      warnings: result.warnings.map(
        (warning: string) => `[${adapterName}] ${warning}`
      ),
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [
        `[${adapterName}] Validation failed: ${error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE}`,
      ],
      warnings: [],
    };
  }
}

/**
 * Validates voice configuration against a single adapter.
 *
 * @param {TtsAdapter} adapter - Adapter to validate against
 * @param {VoiceConfig} voice - Voice configuration to validate
 * @param {string} adapterName - Name of the adapter for error reporting
 * @returns {ValidationResult} Validation result with adapter-specific errors
 */
export function validateAdapterVoice(
  adapter: TtsAdapter,
  voice: VoiceConfig,
  adapterName: string
): ValidationResult {
  try {
    const result = adapter.validateVoice(voice);
    return {
      ...result,
      errors: result.errors.map((error: string) => `[${adapterName}] ${error}`),
      warnings: result.warnings.map(
        (warning: string) => `[${adapterName}] ${warning}`
      ),
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [
        `[${adapterName}] Validation failed: ${error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE}`,
      ],
      warnings: [],
    };
  }
}

/**
 * Checks if an adapter supports a specific feature.
 *
 * @param {TtsAdapter} adapter - Adapter to check
 * @param {string} feature - Feature to check
 * @returns {Promise<boolean>} Whether the adapter supports the feature
 */
export async function checkAdapterFeature(
  adapter: TtsAdapter,
  feature: string
): Promise<boolean> {
  try {
    return await adapter.supportsFeature(feature);
  } catch {
    return false;
  }
}

/**
 * Gets adapter capabilities safely.
 *
 * @param {TtsAdapter} adapter - Adapter to get capabilities from
 * @returns {Promise<TTSCapabilities | null>} Capabilities or null if error
 */
export async function getAdapterCapabilitiesSafely(
  adapter: TtsAdapter
): Promise<TTSCapabilities | null> {
  try {
    return await adapter.getCapabilities();
  } catch {
    return null;
  }
}
