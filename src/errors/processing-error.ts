import { BunTtsError } from './bun-tts-error.js';

/** Exit code for processing errors */
const PROCESSING_ERROR_EXIT_CODE = 4;

/**
 * Error thrown during document or audio processing.
 * Extends BunTtsError to provide specific handling for processing-related issues.
 */
export class ProcessingError extends BunTtsError {
  /**
   * Creates a new ProcessingError instance.
   *
   * @param message - Human-readable error message describing the processing issue
   * @param details - Additional context information about the processing error
   */
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, {
      code: 'PROCESSING_ERROR',
      category: 'tts',
      recoverable: true,
      details
    });
    this.name = 'ProcessingError';
  }

  /**
   * Determines whether this processing error should be logged with full details.
   *
   * @returns Always returns true for processing errors
   */
  public override shouldLogDetails(): boolean {
    return true;
  }

  /**
   * Gets the exit code for processing errors.
   *
   * @returns The exit code (4 for processing errors)
   */
  public override getExitCode(): number {
    return PROCESSING_ERROR_EXIT_CODE;
  }
}
