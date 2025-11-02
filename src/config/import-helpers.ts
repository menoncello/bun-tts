import { promises as fs } from 'fs';
import { ConfigurationError } from '../errors/configuration-error.js';
import { Result, Ok } from '../errors/result.js';
import type { BunTtsConfig } from '../types/config.js';

/**
 * Helper functions for configuration import operations
 */

/**
 * Read file content with error handling
 *
 * @param {string} filePath - The path to the configuration file to read
 * @returns {Promise<{ content: string; error?: ConfigurationError }>} Promise containing file content or error
 */
export async function readFileContent(
  filePath: string
): Promise<{ content: string; error?: ConfigurationError }> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { content };
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      const notFoundError = new ConfigurationError(
        `Configuration file not found: ${filePath}`,
        { filePath }
      );
      return { content: '', error: notFoundError };
    }

    const readError = new ConfigurationError(
      `Failed to read configuration file: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { filePath, error }
    );
    return { content: '', error: readError };
  }
}

/**
 * Parse JSON content with error handling
 *
 * @param {string} content - The content to parse
 * @param {string} filePath - The file path for error context
 * @returns {Promise<{ content: Record<string, unknown>; error?: ConfigurationError }>} Promise containing parsed JSON or error
 */
export async function parseJsonContent(
  content: string,
  filePath: string
): Promise<{ content: Record<string, unknown>; error?: ConfigurationError }> {
  try {
    const parsed = JSON.parse(content);
    return { content: parsed };
  } catch (parseError) {
    const parseErrorObj = new ConfigurationError(
      `Failed to parse JSON configuration: ${
        parseError instanceof Error ? parseError.message : String(parseError)
      }`,
      { filePath, error: parseError }
    );
    return { content: {}, error: parseErrorObj };
  }
}

/**
 * Validate configuration and return as Result
 *
 * @param {Record<string, unknown>} config - The configuration to validate
 * @param {(config: Record<string, unknown>) => Result<true, ConfigurationError>} validator - Validation function
 * @returns {Promise<Result<BunTtsConfig, ConfigurationError>>} Promise containing validation result
 */
export async function validateAndReturnConfig(
  config: Record<string, unknown>,
  validator: (
    config: Record<string, unknown>
  ) => Result<true, ConfigurationError>
): Promise<Result<BunTtsConfig, ConfigurationError>> {
  const validation = validator(config);
  if (!validation.success) {
    return validation as Result<BunTtsConfig, ConfigurationError>;
  }

  return Ok(config as unknown as BunTtsConfig);
}
