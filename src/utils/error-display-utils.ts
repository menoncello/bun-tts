/**
 * Error display utilities for the ErrorReporter.
 * Contains console formatting and display functions.
 */

import type { Logger } from '../interfaces/logger.js';
import type { BunTtsError } from '../types/index.js';

// Constants for magic numbers
const CONSOLE_SEPARATOR_LENGTH = 50;

export interface ErrorReport {
  error: BunTtsError;
  timestamp: string;
  context: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  environment: string;
  version: string;
}

/**
 * Display error information to the console.
 * In development mode, shows detailed error information.
 * In production mode, shows a simplified error message.
 * @param {ErrorReport} report - The error report to display
 * @param {string} environment - The environment mode
 * @param {Logger} logger - Logger instance
 */
export function consoleError(
  report: ErrorReport,
  environment: string,
  logger: Logger
): void {
  if (environment === 'development') {
    displayDetailedError(report, logger);
  } else {
    displaySimpleError(report, logger);
  }
}

/**
 * Display detailed error information for development environment.
 * @param {ErrorReport} report - The error report to display
 * @param {Logger} logger - Logger instance
 */
function displayDetailedError(report: ErrorReport, logger: Logger): void {
  logger.error(`\n🚨 ${report.error.name} [${report.error.code}]`);
  logger.error(`📋 Message: ${report.error.message}`);
  logger.error(`🏷️  Category: ${report.error.category}`);
  logger.error(`🔄 Recoverable: ${report.error.recoverable ? 'Yes' : 'No'}`);

  displayErrorDetails(report.error.details, logger);
  displayContext(report.context, logger);

  logger.error(`⏰ Time: ${report.timestamp}`);
  logger.error(`🔧 Environment: ${report.environment}`);
  logger.error(`📦 Version: ${report.version}`);

  if (report.error.stack) {
    logger.error('📚 Stack trace:');
    logger.error(report.error.stack);
  }

  logger.error('─'.repeat(CONSOLE_SEPARATOR_LENGTH));
}

/**
 * Display simple error information for production environment.
 * @param {ErrorReport} report - The error report to display
 * @param {Logger} logger - Logger instance
 */
function displaySimpleError(report: ErrorReport, logger: Logger): void {
  logger.error(
    `[${report.error.category.toUpperCase()}] ${report.error.message}`
  );
}

/**
 * Display error details if they exist.
 * @param {unknown} details - The error details to display
 * @param {Logger} logger - Logger instance
 */
function displayErrorDetails(details: unknown, logger: Logger): void {
  if (
    details &&
    typeof details === 'object' &&
    details !== null &&
    Object.keys(details).length > 0
  ) {
    logger.error('📊 Details:');
    for (const [key, value] of Object.entries(details)) {
      logger.error(`   ${key}: ${JSON.stringify(value)}`);
    }
  }
}

/**
 * Display context information if it exists.
 * @param {unknown} context - The context information to display
 * @param {Logger} logger - Logger instance
 */
function displayContext(context: unknown, logger: Logger): void {
  if (
    context &&
    typeof context === 'object' &&
    context !== null &&
    Object.keys(context).length > 0
  ) {
    logger.error('🌍 Context:');
    for (const [key, value] of Object.entries(context)) {
      logger.error(`   ${key}: ${JSON.stringify(value)}`);
    }
  }
}
