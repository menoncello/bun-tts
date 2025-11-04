import type { Result } from '../../../errors/result.js';
import type { TTSError } from './errors/tts-error.js';
import type {
  TTSRequest,
  TTSOptions,
  VoiceConfig,
  TTSResponse,
  VoiceInfo,
  TTSCapabilities,
  ValidationResult,
  HealthCheckResult,
} from './types.js';

/**
 * Interface for TTS (Text-to-Speech) adapters.
 * Provides a standardized contract for all TTS engine implementations.
 *
 * Implementations should:
 * - Be thread-safe and stateless where possible
 * - Validate all inputs before processing
 * - Provide comprehensive error information
 * - Support performance monitoring and metrics collection
 * - Follow the Result pattern for error propagation
 */
export interface TtsAdapter {
  /**
   * Gets the unique name of this adapter/engine.
   *
   * @returns {string} The adapter name (e.g., 'kokoro', 'chatterbox')
   */
  readonly name: string;

  /**
   * Gets the version of this adapter.
   *
   * @returns {string} The adapter version (e.g., '1.0.0')
   */
  readonly version: string;

  /**
   * Gets whether the adapter is currently initialized and ready for use.
   *
   * @returns {boolean} True if the adapter is initialized
   */
  readonly isInitialized: boolean;

  /**
   * Synthesizes speech from the given text request.
   * This is the core TTS operation.
   *
   * @param {TTSRequest} request - The synthesis request containing text and voice configuration
   * @returns {Promise<Result<TTSResponse, TTSError>>} Result containing audio data or error
   *
   * @example
   * ```typescript
   * const request: TTSRequest = {
   *   text: "Hello, world!",
   *   voice: { id: "en-US-Jenny", name: "Jenny", language: "en-US", gender: "female" },
   *   options: { rate: 1.0, pitch: 1.0, volume: 1.0 }
   * };
   *
   * const result = await adapter.synthesize(request);
   * if (result.success) {
   *   const audioData = result.data.audio;
   *   console.log(`Synthesized ${audioData.duration}s of audio`);
   * } else {
   *   console.error(`Synthesis failed: ${result.error.message}`);
   * }
   * ```
   */
  synthesize: (request: TTSRequest) => Promise<Result<TTSResponse, TTSError>>;

  /**
   * Gets a list of all available voices from this engine.
   *
   * @returns {Promise<VoiceInfo[]>} Array of available voice information
   *
   * @example
   * ```typescript
   * const voices = await adapter.getSupportedVoices();
   * const englishVoices = voices.filter(v => v.language.startsWith('en'));
   * console.log(`Found ${englishVoices.length} English voices`);
   * ```
   */
  getSupportedVoices: () => Promise<VoiceInfo[]>;

  /**
   * Gets the capabilities and features supported by this engine.
   * Includes performance characteristics, supported formats, and limitations.
   *
   * @returns {Promise<TTSCapabilities>} Complete engine capabilities
   *
   * @example
   * ```typescript
   * const capabilities = await adapter.getCapabilities();
   * console.log(`Engine supports ${capabilities.supportedLanguages.length} languages`);
   * console.log(`SSML support: ${capabilities.features.ssml}`);
   * console.log(`Synthesis rate: ${capabilities.performance.synthesisRate} words/sec`);
   * ```
   */
  getCapabilities: () => Promise<TTSCapabilities>;

  /**
   * Validates TTS synthesis options for compatibility with this engine.
   * Checks for supported formats, sample rates, and option values.
   *
   * @param {TTSOptions} options - Options to validate
   * @returns {ValidationResult} Validation result with errors/warnings
   *
   * @example
   * ```typescript
   * const validation = adapter.validateOptions({
   *   rate: 2.0,
   *   format: 'PCM16',
   *   sampleRate: 48000
   * });
   *
   * if (!validation.isValid) {
   *   console.error('Invalid options:', validation.errors);
   * }
   * ```
   */
  validateOptions: (options: TTSOptions) => ValidationResult;

  /**
   * Validates voice configuration for compatibility with this engine.
   * Checks for supported languages, voices, and voice properties.
   *
   * @param {VoiceConfig} voice - Voice configuration to validate
   * @returns {ValidationResult} Validation result with errors/warnings
   *
   * @example
   * ```typescript
   * const validation = adapter.validateVoice({
   *   id: 'custom-voice',
   *   name: 'Custom Voice',
   *   language: 'en-US',
   *   gender: 'female'
   * });
   *
   * if (validation.warnings.length > 0) {
   *   console.warn('Voice warnings:', validation.warnings);
   * }
   * ```
   */
  validateVoice: (voice: VoiceConfig) => ValidationResult;

  /**
   * Initializes the adapter with the given configuration.
   * Must be called before any synthesis operations.
   *
   * @param {Record<string, unknown>} config - Engine-specific configuration
   * @returns {Promise<void>} Promise that resolves when initialization is complete
   *
   * @throws {TTSConfigurationError} If configuration is invalid
   *
   * @example
   * ```typescript
   * await adapter.initialize({
   *   apiKey: 'your-api-key',
   *   model: 'high-quality',
   *   endpoint: 'https://api.tts-service.com'
   * });
   * console.log('Adapter initialized successfully');
   * ```
   */
  initialize: (config?: Record<string, unknown>) => Promise<void>;

  /**
   * Performs cleanup and releases resources.
   * Should be called when the adapter is no longer needed.
   *
   * @returns {Promise<void>} Promise that resolves when cleanup is complete
   *
   * @example
   * ```typescript
   * await adapter.cleanup();
   * console.log('Adapter cleaned up');
   * ```
   */
  cleanup: () => Promise<void>;

  /**
   * Performs a health check on the adapter.
   * Useful for monitoring and detecting service degradation.
   *
   * @returns {Promise<HealthCheckResult>} Health check result with status and metrics
   *
   * @example
   * ```typescript
   * const health = await adapter.healthCheck();
   * if (health.status === 'healthy') {
   *   console.log(`Adapter healthy, response time: ${health.responseTime}ms`);
   * } else {
   *   console.warn(`Adapter ${health.status}: ${health.message}`);
   * }
   * ```
   */
  healthCheck: () => Promise<HealthCheckResult>;

  /**
   * Checks if the adapter supports a specific feature.
   * Convenience method for checking capabilities without full capability lookup.
   *
   * @param {string} feature - Feature name to check
   * @returns {Promise<boolean>} True if the feature is supported
   *
   * @example
   * ```typescript
   * const supportsSSML = await adapter.supportsFeature('ssml');
   * const supportsRealtime = await adapter.supportsFeature('realtime');
   * ```
   */
  supportsFeature: (feature: string) => Promise<boolean>;

  /**
   * Gets a voice by its ID or language.
   * Convenience method for finding specific voices.
   *
   * @param {string} query - Voice ID, name, or language code
   * @returns {Promise<VoiceInfo | undefined>} Voice information or undefined if not found
   *
   * @example
   * ```typescript
   * const englishVoice = await adapter.getVoice('en-US');
   * const specificVoice = await adapter.getVoice('en-US-Jenny');
   * ```
   */
  getVoice: (query: string) => Promise<VoiceInfo | undefined>;
}

/**
 * Required properties for TtsAdapter interface
 */
const REQUIRED_TTS_ADAPTER_PROPERTIES = [
  'name',
  'version',
  'isInitialized',
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
 * Type guard to check if an object implements TtsAdapter
 *
 * @param {unknown} obj - Object to check (defaults to undefined)
 * @returns {boolean} True if the object implements TtsAdapter
 */
export function isTtsAdapter(obj: unknown = undefined): obj is TtsAdapter {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  const objRecord = obj as Record<string, unknown>;
  return REQUIRED_TTS_ADAPTER_PROPERTIES.every((prop) => prop in objRecord);
}
