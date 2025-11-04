import { TTSError, type TTSErrorOptions } from './tts-error.js';

/**
 * Configuration interface for TTSSynthesisError constructor parameters.
 * Groups related parameters to reduce constructor parameter count.
 */
export interface TTSSynthesisErrorConfig {
  /** The text that failed to synthesize */
  text?: string;
  /** The voice configuration that was used */
  voice?: string;
  /** Additional error context */
  details?: Record<string, unknown>;
  /** Detailed synthesis information */
  synthesisDetails?: {
    stage?: string;
    partialResult?: boolean;
    processedCharacters?: number;
    totalCharacters?: number;
    partialAudioAvailable?: boolean;
    qualityScore?: number;
    engineVersion?: string;
  };
  /** Recovery suggestions */
  recoverySuggestions?: string[];
}

/** Maximum text length before suggesting shorter segments */
const MAX_TEXT_LENGTH_FOR_SUGGESTION = 1000;

/**
 * Error thrown when TTS synthesis fails.
 * Occurs during the actual audio generation process.
 */
export class TTSSynthesisError extends TTSError {
  /** The text that failed to synthesize */
  public readonly text?: string;
  /** The voice configuration that was used */
  public readonly voice?: string;
  /** Length of the text that failed */
  public readonly textLength?: number;
  /** Detailed synthesis information */
  public readonly synthesisDetails?: {
    stage?: string;
    partialResult?: boolean;
    processedCharacters?: number;
    totalCharacters?: number;
    partialAudioAvailable?: boolean;
    qualityScore?: number;
    engineVersion?: string;
  };
  /** Recovery suggestions */
  public readonly recoverySuggestions?: string[];

  /**
   * Creates a new TTSSynthesisError instance.
   *
   * @param {string} message - Human-readable error message
   * @param {string} engine - The TTS engine that failed
   * @param {string} requestId - The request identifier
   * @param {TTSSynthesisErrorConfig} config - Configuration object containing optional parameters
   */
  constructor(
    message: string,
    engine: string,
    requestId: string,
    config: TTSSynthesisErrorConfig = {}
  ) {
    const { text, voice, details, synthesisDetails, recoverySuggestions } =
      config;

    const ttsOptions: TTSErrorOptions = {
      operation: 'synthesize',
      engine,
      requestId,
      details: {
        text,
        voice,
        textLength: text?.length,
        synthesisDetails,
        recoverySuggestions,
        ...details,
      },
    };

    super(message, 'TTS_SYNTHESIS_ERROR', ttsOptions);

    this.name = 'TTSSynthesisError';
    this.text = text;
    this.voice = voice;
    this.textLength = text?.length;
    this.synthesisDetails = synthesisDetails;
    this.recoverySuggestions = recoverySuggestions;
  }

  /**
   * Gets whether this error is recoverable.
   * Synthesis errors are often recoverable with different settings.
   *
   * @returns {boolean} True if the error is potentially recoverable
   */
  public isRecoverable(): boolean {
    // Synthesis errors are often recoverable by:
    // - Using a different voice
    // - Adjusting text length
    // - Changing synthesis options
    return true;
  }

  /**
   * Gets suggested recovery actions for synthesis errors.
   *
   * @returns {string[]} List of suggested recovery actions
   */
  public getRecoverySuggestions(): string[] {
    const suggestions: string[] = [];

    if (this.textLength && this.textLength > MAX_TEXT_LENGTH_FOR_SUGGESTION) {
      suggestions.push('Try synthesizing shorter text segments');
    }

    if (this.voice) {
      suggestions.push(`Try using a different voice than "${this.voice}"`);
    }

    suggestions.push('Check text for unsupported characters or formats');
    suggestions.push('Verify voice compatibility with selected engine');
    suggestions.push('Try adjusting synthesis options (rate, pitch, volume)');

    return suggestions;
  }
}
