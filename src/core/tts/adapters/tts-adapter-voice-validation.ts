import type { TtsAdapter } from './itts-adapter.js';
import type { AdapterRegistration } from './tts-adapter-types.js';
import { validateAdapterVoice } from './tts-adapter-validator.js';
import type { VoiceConfig, ValidationResult } from './types.js';

// Re-export AdapterRegistration for other modules
export type { AdapterRegistration } from './tts-adapter-types.js';

/**
 * Creates a validation result for no available adapters
 *
 * @returns {ValidationResult} Validation result indicating no adapters available
 */
function createNoAdaptersResult(): ValidationResult {
  return {
    isValid: false,
    errors: ['No adapters available for validation'],
    warnings: [],
  };
}

/**
 * Creates an empty validation result accumulator
 *
 * @returns {{
 *   errors: string[];
 *   warnings: string[];
 *   isValid: boolean;
 *   hasMatchingAdapter: boolean;
 * }} Empty accumulator for collecting validation results
 */
function createValidationAccumulator(): {
  errors: string[];
  warnings: string[];
  isValid: boolean;
  hasMatchingAdapter: boolean;
} {
  return {
    errors: [],
    warnings: [],
    isValid: true,
    hasMatchingAdapter: false,
  };
}

/**
 * Validates voice against a single adapter and updates the accumulator
 *
 * @param {TtsAdapter} adapter - The adapter to validate against
 * @param {VoiceConfig} voice - Voice configuration to validate
 * @param {string} adapterName - Name of the adapter being validated
 * @param {ReturnType<typeof createValidationAccumulator>} accumulator - Accumulator to store results
 */
function validateSingleAdapter(
  adapter: TtsAdapter,
  voice: VoiceConfig,
  adapterName: string,
  accumulator: ReturnType<typeof createValidationAccumulator>
): void {
  const result = validateAdapterVoice(adapter, voice, adapterName);

  if (result.isValid) {
    accumulator.hasMatchingAdapter = true;
  }

  accumulator.errors.push(...result.errors);
  accumulator.warnings.push(...result.warnings);
}

/**
 * Processes all available adapters for validation
 *
 * @param {string[]} availableAdapters - List of available adapter names
 * @param {Map<string, AdapterRegistration>} adapters - Map of adapter registrations
 * @param {VoiceConfig} voice - Voice configuration to validate
 * @param {ReturnType<typeof createValidationAccumulator>} accumulator - Accumulator to store results
 */
function processAllAdapters(
  availableAdapters: string[],
  adapters: Map<string, AdapterRegistration>,
  voice: VoiceConfig,
  accumulator: ReturnType<typeof createValidationAccumulator>
): void {
  for (const adapterName of availableAdapters) {
    const adapter = adapters.get(adapterName)?.adapter;
    if (adapter) {
      validateSingleAdapter(adapter, voice, adapterName, accumulator);
    }
  }
}

/**
 * Handles the case when no adapter supports the voice configuration
 *
 * @param {ReturnType<typeof createValidationAccumulator>} accumulator - Accumulator to update
 */
function handleNoMatchingAdapter(
  accumulator: ReturnType<typeof createValidationAccumulator>
): void {
  if (!accumulator.hasMatchingAdapter && accumulator.errors.length === 0) {
    accumulator.errors.push('No adapter supports this voice configuration');
    accumulator.isValid = false;
  }
}

/**
 * Creates the final validation result from the accumulator
 *
 * @param {ReturnType<typeof createValidationAccumulator>} accumulator - Accumulator with collected results
 * @returns {ValidationResult} Final validation result
 */
function createFinalResult(
  accumulator: ReturnType<typeof createValidationAccumulator>
): ValidationResult {
  return {
    isValid: accumulator.isValid && accumulator.hasMatchingAdapter,
    errors: accumulator.errors,
    warnings: accumulator.warnings,
  };
}

/**
 * Validates voice configuration against all available adapters.
 *
 * @param {VoiceConfig} voice - Voice configuration to validate
 * @param {string[]} availableAdapters - List of available adapter names
 * @param {Map<string, AdapterRegistration>} adapters - Map of adapter registrations
 * @returns {Promise<ValidationResult>} Combined validation result
 */
export async function validateVoiceAcrossAdapters(
  voice: VoiceConfig,
  availableAdapters: string[],
  adapters: Map<string, AdapterRegistration>
): Promise<ValidationResult> {
  if (availableAdapters.length === 0) {
    return createNoAdaptersResult();
  }

  const accumulator = createValidationAccumulator();

  processAllAdapters(availableAdapters, adapters, voice, accumulator);
  handleNoMatchingAdapter(accumulator);

  return createFinalResult(accumulator);
}
