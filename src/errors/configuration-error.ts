import { BunTtsError } from './bun-tts-error.js';

/** Exit code for configuration errors */
const CONFIG_ERROR_EXIT_CODE = 2;

/**
 * Error thrown when configuration is invalid or missing.
 * Extends BunTtsError to provide specific handling for configuration-related issues.
 */
export class ConfigurationError extends BunTtsError {
  /**
   * Error path (dot-notation for nested properties)
   */
  path?: string;

  /**
   * Suggestions for fixing the error
   */
  suggestions?: string[];

  /**
   * Creates a new ConfigurationError instance.
   *
   * @param {string} message - Human-readable error message describing the configuration issue
   * @param {Record<string, unknown>} details - Additional context information about the configuration error
   */
  constructor(message: string, details?: Record<string, unknown>) {
    const code = (details?.code as string) || 'CONFIG_ERROR';
    super(message, {
      code,
      category: 'configuration',
      recoverable: false,
      details,
    });
    this.name = 'ConfigurationError';
    this.path = details?.path as string | undefined;
    this.suggestions = details?.suggestions as string[] | undefined;
  }

  /**
   * Gets the exit code for configuration errors.
   *
   * @returns {any} The exit code (2 for configuration errors)
   */
  public override getExitCode(): number {
    return CONFIG_ERROR_EXIT_CODE;
  }
}
