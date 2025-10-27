import { BunTtsError } from './bun-tts-error.js';

/** Exit code for configuration errors */
const CONFIG_ERROR_EXIT_CODE = 2;

/**
 * Error thrown when configuration is invalid or missing.
 * Extends BunTtsError to provide specific handling for configuration-related issues.
 */
export class ConfigurationError extends BunTtsError {
  /**
   * Creates a new ConfigurationError instance.
   *
   * @param message - Human-readable error message describing the configuration issue
   * @param details - Additional context information about the configuration error
   */
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, {
      code: 'CONFIG_ERROR',
      category: 'configuration',
      recoverable: false,
      details
    });
    this.name = 'ConfigurationError';
  }

  /**
   * Gets the exit code for configuration errors.
   *
   * @returns The exit code (2 for configuration errors)
   */
  public override getExitCode(): number {
    return CONFIG_ERROR_EXIT_CODE;
  }
}
