import { BunTtsError } from './bun-tts-error.js';

/** Exit code for validation errors */
const VALIDATION_ERROR_EXIT_CODE = 3;

/**
 * Error thrown when input validation fails.
 * Extends BunTtsError to provide specific handling for validation-related issues.
 */
export class ValidationError extends BunTtsError {
  /**
   * Creates a new ValidationError instance.
   *
   * @param message - Human-readable error message describing the validation issue
   * @param details - Additional context information about the validation error
   */
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, {
      code: 'VALIDATION_ERROR',
      category: 'validation',
      recoverable: false,
      details,
    });
    this.name = 'ValidationError';
  }

  /**
   * Gets the exit code for validation errors.
   *
   * @returns The exit code (3 for validation errors)
   */
  public override getExitCode(): number {
    return VALIDATION_ERROR_EXIT_CODE;
  }
}
