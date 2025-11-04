import { TTSError } from './errors/index.js';

// Constants for ESLint compliance
const NO_ADAPTERS_ERROR_MESSAGE = 'No suitable adapters available';

/**
 * Validates adapter list and throws error if empty
 *
 * @param {string[]} adapters - List of adapter names
 * @param {string} functionName - Function name for error context
 * @throws {TTSError} If no suitable adapters are available
 */
export function validateAdapterList(
  adapters: string[],
  functionName: string
): void {
  if (adapters.length === 0) {
    throw new TTSError(NO_ADAPTERS_ERROR_MESSAGE, 'NO_SUITABLE_ADAPTERS', {
      operation: functionName,
    });
  }
}
