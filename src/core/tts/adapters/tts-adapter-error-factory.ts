/**
 * Factory for creating standardized TTS adapter errors
 */

import { TTSError } from './errors/index.js';
import { MAX_TEXT_PREVIEW_LENGTH } from './tts-adapter-constants.js';
import type { TTSRequest } from './types.js';

/**
 * Factory for creating adapter-related errors
 */
export class TTSAdapterErrorFactory {
  /**
   * Creates an error for when no adapters are available.
   *
   * @returns {TTSError} The configured error
   */
  static createNoAdaptersAvailableError(): TTSError {
    return new TTSError(
      'No TTS adapters are currently available',
      'NO_ADAPTERS_AVAILABLE',
      {
        operation: 'selectAdapter',
      }
    );
  }

  /**
   * Creates an error for when no suitable adapters are found.
   *
   * @param {TTSRequest} request - The request that failed
   * @param {number} availableCount - Number of available adapters
   * @returns {TTSError} The configured error
   */
  static createNoSuitableAdaptersError(
    request: TTSRequest,
    availableCount: number
  ): TTSError {
    return new TTSError(
      'No TTS adapters can handle this request',
      'NO_SUITABLE_ADAPTERS',
      {
        operation: 'selectAdapter',
        requestId: request.requestId || 'unknown',
        details: {
          request: {
            text: request.text.substring(0, MAX_TEXT_PREVIEW_LENGTH),
            voiceId: request.voice.id,
            language: request.voice.language,
          },
          availableAdapters: availableCount,
        },
      }
    );
  }

  /**
   * Creates an error for when a selected adapter is not found.
   *
   * @param {string} adapterName - The adapter name that was not found
   * @returns {TTSError} The configured error
   */
  static createAdapterNotFoundError(adapterName: string): TTSError {
    return new TTSError(
      `Selected adapter '${adapterName}' not found`,
      'ADAPTER_NOT_FOUND',
      {
        operation: 'selectAdapter',
        details: {
          adapterName,
        },
      }
    );
  }

  /**
   * Creates an error for when no suitable adapters are found for specific strategies.
   *
   * @param {string} strategy - The strategy that failed
   * @returns {TTSError} The configured error
   */
  static createNoSuitableAdaptersForStrategyError(strategy: string): TTSError {
    return new TTSError(
      'No suitable adapters available',
      'NO_SUITABLE_ADAPTERS',
      {
        operation: strategy,
        details: {
          strategy,
        },
      }
    );
  }
}
