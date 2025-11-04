/**
 * TTS Adapter Manager operations - extracted methods to reduce main file size
 */

import { Logger } from './tts-adapter-logger.js';
import type { AdapterRegistration } from './tts-adapter-types.js';
import { validateAdapterOptions } from './tts-adapter-validator.js';
import { validateVoiceAcrossAdapters } from './tts-adapter-voice-validation.js';
import {
  aggregateCapabilities,
  getDefaultCapabilities,
} from './tts-capabilities-aggregator.js';
import type {
  TTSOptions,
  VoiceInfo,
  TTSCapabilities,
  VoiceConfig,
  ValidationResult,
} from './types.js';

/**
 * Handles TTS adapter operations
 */
export class TTSAdapterOperations {
  /**
   * Gets supported voices from all available adapters.
   *
   * @param {() => Promise<string[]>} getAvailableAdapters - Function to get available adapters
   * @param {Map<string, AdapterRegistration>} adapters - Adapter registrations map
   * @returns {Promise<VoiceInfo[]>} Combined list of all available voices
   */
  static async getSupportedVoices(
    getAvailableAdapters: () => Promise<string[]>,
    adapters: Map<string, AdapterRegistration>
  ): Promise<VoiceInfo[]> {
    const allVoices: VoiceInfo[] = [];
    const availableAdapters = await getAvailableAdapters();

    for (const adapterName of availableAdapters) {
      try {
        const adapter = adapters.get(adapterName)?.adapter;
        if (adapter) {
          const voices = await adapter.getSupportedVoices();
          // Add adapter name to voice info for tracking
          const voicesWithSource = voices.map((voice: VoiceInfo) => ({
            ...voice,
            metadata: {
              ...voice.metadata,
              adapterName,
            },
          }));
          allVoices.push(...voicesWithSource);
        }
      } catch (error) {
        Logger.error(
          `Error getting voices from adapter '${adapterName}':`,
          error
        );
      }
    }

    return allVoices;
  }

  /**
   * Finds a voice by ID or language across all available adapters.
   *
   * @param {string} query - Voice ID, name, or language code
   * @param {() => Promise<VoiceInfo[]>} getSupportedVoices - Function to get supported voices
   * @returns {Promise<VoiceInfo | undefined>} Voice information or undefined if not found
   */
  static async getVoice(
    query: string,
    getSupportedVoices: () => Promise<VoiceInfo[]>
  ): Promise<VoiceInfo | undefined> {
    const allVoices = await getSupportedVoices();
    return allVoices.find(
      (voice) =>
        voice.id === query ||
        voice.name.toLowerCase().includes(query.toLowerCase()) ||
        voice.language === query
    );
  }

  /**
   * Gets combined capabilities from all available adapters.
   *
   * @param {() => Promise<string[]>} getAvailableAdapters - Function to get available adapters
   * @param {Map<string, AdapterRegistration>} adapters - Adapter registrations map
   * @returns {Promise<TTSCapabilities>} Aggregated capabilities
   */
  static async getAggregatedCapabilities(
    getAvailableAdapters: () => Promise<string[]>,
    adapters: Map<string, AdapterRegistration>
  ): Promise<TTSCapabilities> {
    const availableAdapters = await getAvailableAdapters();
    if (availableAdapters.length === 0) {
      return getDefaultCapabilities();
    }

    const capabilitiesList: TTSCapabilities[] = [];
    for (const adapterName of availableAdapters) {
      try {
        const adapter = adapters.get(adapterName)?.adapter;
        if (adapter) {
          const capabilities = await adapter.getCapabilities();
          capabilitiesList.push(capabilities);
        }
      } catch (error) {
        Logger.error(
          `Error getting capabilities from adapter '${adapterName}':`,
          error
        );
      }
    }

    return aggregateCapabilities(capabilitiesList);
  }

  /**
   * Validates options against all available adapters.
   *
   * @param {TTSOptions} options - Options to validate
   * @param {() => Promise<string[]>} getAvailableAdapters - Function to get available adapters
   * @param {Map<string, AdapterRegistration>} adapters - Adapter registrations map
   * @returns {Promise<ValidationResult>} Combined validation result
   */
  static async validateOptions(
    options: TTSOptions,
    getAvailableAdapters: () => Promise<string[]>,
    adapters: Map<string, AdapterRegistration>
  ): Promise<ValidationResult> {
    const availableAdapters = await getAvailableAdapters();
    if (availableAdapters.length === 0) {
      return TTSAdapterOperations.createNoAdaptersValidationResult();
    }

    return TTSAdapterOperations.validateAgainstAllAdapters(
      availableAdapters,
      adapters,
      options
    );
  }

  /**
   * Creates a validation result for when no adapters are available.
   *
   * @returns {ValidationResult} Validation result indicating no adapters available
   */
  private static createNoAdaptersValidationResult(): ValidationResult {
    return {
      isValid: false,
      errors: ['No adapters available for validation'],
      warnings: [],
    };
  }

  /**
   * Validates options against multiple adapters and aggregates results.
   *
   * @param {string[]} availableAdapters - List of available adapter names
   * @param {Map<string, AdapterRegistration>} adapters - Adapter registrations map
   * @param {TTSOptions} options - Options to validate
   * @returns {ValidationResult} Aggregated validation result
   */
  private static validateAgainstAllAdapters(
    availableAdapters: string[],
    adapters: Map<string, AdapterRegistration>,
    options: TTSOptions
  ): ValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    let isValid = true;

    for (const adapterName of availableAdapters) {
      const adapter = adapters.get(adapterName)?.adapter;
      if (adapter) {
        const result = validateAdapterOptions(adapter, options, adapterName);
        if (!result.isValid) {
          isValid = false;
        }
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
      }
    }

    return {
      isValid,
      errors: allErrors,
      warnings: allWarnings,
    };
  }

  /**
   * Validates voice configuration against all available adapters.
   *
   * @param {VoiceConfig} voice - Voice configuration to validate
   * @param {() => Promise<string[]>} getAvailableAdapters - Function to get available adapters
   * @param {Map<string, AdapterRegistration>} adapters - Adapter registrations map
   * @returns {Promise<ValidationResult>} Combined validation result
   */
  static async validateVoice(
    voice: VoiceConfig,
    getAvailableAdapters: () => Promise<string[]>,
    adapters: Map<string, AdapterRegistration>
  ): Promise<ValidationResult> {
    const availableAdapters = await getAvailableAdapters();
    return validateVoiceAcrossAdapters(voice, availableAdapters, adapters);
  }
}
