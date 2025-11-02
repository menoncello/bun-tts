import { promises as fs } from 'fs';
import { join } from 'path';
import { ConfigurationError } from '../errors/configuration-error.js';
import { Result, Ok } from '../errors/result.js';

/**
 * Helper functions for configuration export operations
 */

/**
 * Ensure export directory exists
 *
 * @param {string} directory - The directory to ensure exists
 * @returns {Promise<void>}
 */
export async function ensureDirectoryExists(directory: string): Promise<void> {
  await fs.mkdir(directory, { recursive: true });
}

/**
 * Initialize export statistics object
 *
 * @returns {{ successful: number; failed: number; errors: Array<{ name: string; error: string }> }} Statistics object with initial zero values
 */
export function initializeExportStats(): {
  successful: number;
  failed: number;
  errors: Array<{ name: string; error: string }>;
} {
  return {
    successful: 0,
    failed: 0,
    errors: [],
  };
}

/**
 * Process configuration exports for all configs
 *
 * @param {Array<{ name: string; data: Record<string, unknown> }>} configs - Array of configurations to export
 * @param {string} directory - The directory where configurations should be exported
 * @param {{ successful: number; failed: number; errors: Array<{ name: string; error: string }> }} stats - Export statistics to update
 * @param {number} stats.successful - Counter for successful exports
 * @param {number} stats.failed - Counter for failed exports
 * @param {Array<{ name: string; error: string }>} stats.errors - Array of error details for failed exports
 * @param {(config: Record<string, unknown>, filePath: string, format: string) => Promise<Result<unknown, ConfigurationError>>} exportFunction - Export function to use
 * @returns {Promise<void>}
 */
export async function processConfigExports(
  configs: Array<{ name: string; data: Record<string, unknown> }>,
  directory: string,
  stats: {
    successful: number;
    failed: number;
    errors: Array<{ name: string; error: string }>;
  },
  exportFunction: (
    config: Record<string, unknown>,
    filePath: string,
    format: string
  ) => Promise<Result<unknown, ConfigurationError>>
): Promise<void> {
  for (const config of configs) {
    await exportSingleConfig(config, directory, stats, exportFunction);
  }
}

/**
 * Validate configuration name for export
 *
 * @param {{ name: string; data: Record<string, unknown> }} config - Configuration to validate
 * @param {string} config.name - Name of the configuration
 * @param {Record<string, unknown>} config.data - Configuration data
 * @returns {string | null} Error message if validation fails, null if valid
 */
function validateConfigName(config: {
  name: string;
  data: Record<string, unknown>;
}): string | null {
  if (!config.name || config.name.trim().length === 0) {
    return 'Configuration name is required and cannot be empty';
  }
  return null;
}

/**
 * Handle validation error for export
 *
 * @param {{ name: string; data: Record<string, unknown> }} config - Configuration that failed validation
 * @param {string} config.name - Name of the configuration
 * @param {Record<string, unknown>} config.data - Configuration data
 * @param {string} error - The validation error message
 * @param {{ successful: number; failed: number; errors: Array<{ name: string; error: string }> }} stats - Export statistics to update
 * @param {number} stats.successful - Counter for successful exports
 * @param {number} stats.failed - Counter for failed exports
 * @param {Array<{ name: string; error: string }>} stats.errors - Array of error details for failed exports
 */
function handleValidationError(
  config: { name: string; data: Record<string, unknown> },
  error: string,
  stats: {
    successful: number;
    failed: number;
    errors: Array<{ name: string; error: string }>;
  }
): void {
  stats.failed++;
  stats.errors.push({
    name: config.name || '(empty)',
    error,
  });
}

/**
 * Handle export result and update statistics
 *
 * @param {{ name: string; data: Record<string, unknown> }} config - Configuration that was exported
 * @param {string} config.name - Name of the configuration
 * @param {Record<string, unknown>} config.data - Configuration data
 * @param {Result<unknown, ConfigurationError>} exportResult - The export result
 * @param {{ successful: number; failed: number; errors: Array<{ name: string; error: string }> }} stats - Export statistics to update
 * @param {number} stats.successful - Counter for successful exports
 * @param {number} stats.failed - Counter for failed exports
 * @param {Array<{ name: string; error: string }>} stats.errors - Array of error details for failed exports
 */
function handleExportResult(
  config: { name: string; data: Record<string, unknown> },
  exportResult: Result<unknown, ConfigurationError>,
  stats: {
    successful: number;
    failed: number;
    errors: Array<{ name: string; error: string }>;
  }
): void {
  if (exportResult.success) {
    stats.successful++;
  } else {
    stats.failed++;
    stats.errors.push({
      name: config.name,
      error: (exportResult as { success: false; error: ConfigurationError })
        .error.message,
    });
  }
}

/**
 * Export a single configuration and update statistics
 *
 * @param {{ name: string; data: Record<string, unknown> }} config - Configuration to export
 * @param {string} config.name - Name of the configuration file
 * @param {Record<string, unknown>} config.data - Configuration data to export
 * @param {string} directory - The directory where the configuration should be exported
 * @param {{ successful: number; failed: number; errors: Array<{ name: string; error: string }> }} stats - Export statistics to update
 * @param {number} stats.successful - Counter for successful exports
 * @param {number} stats.failed - Counter for failed exports
 * @param {Array<{ name: string; error: string }>} stats.errors - Array of error details for failed exports
 * @param {(config: Record<string, unknown>, filePath: string, format: string) => Promise<Result<unknown, ConfigurationError>>} exportFunction - Export function to use
 */
export async function exportSingleConfig(
  config: { name: string; data: Record<string, unknown> },
  directory: string,
  stats: {
    successful: number;
    failed: number;
    errors: Array<{ name: string; error: string }>;
  },
  exportFunction: (
    config: Record<string, unknown>,
    filePath: string,
    format: string
  ) => Promise<Result<unknown, ConfigurationError>>
): Promise<void> {
  // Validate configuration name
  const validationError = validateConfigName(config);
  if (validationError) {
    handleValidationError(config, validationError, stats);
    return;
  }

  const filePath = join(directory, `${config.name}.json`);
  const exportResult = await exportFunction(config.data, filePath, 'json');

  handleExportResult(config, exportResult, stats);
}

/**
 * Format export statistics as a Result
 *
 * @param {{ successful: number; failed: number; errors: Array<{ name: string; error: string }> }} stats - Export statistics
 * @param {number} stats.successful - Number of successful exports
 * @param {number} stats.failed - Number of failed exports
 * @param {Array<{ name: string; error: string }>} stats.errors - Array of error details for failed exports
 * @returns {Result<{ successful: number; failed: number; errors?: Array<{ name: string; error: string }> }, ConfigurationError>} Promise containing formatted statistics or error
 */
export function formatExportResult(stats: {
  successful: number;
  failed: number;
  errors: Array<{ name: string; error: string }>;
}): Result<
  {
    successful: number;
    failed: number;
    errors?: Array<{ name: string; error: string }>;
  },
  ConfigurationError
> {
  return Ok({
    successful: stats.successful,
    failed: stats.failed,
    errors: stats.errors.length > 0 ? stats.errors : undefined,
  });
}
