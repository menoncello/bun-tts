/**
 * Logger utility for quality gates validation
 * Replaces console statements with centralized logging
 */

// Constants for magic numbers
const CONSOLE_LINE_LENGTH = 60;

/**
 * Logger utility to replace console statements
 */
export class Logger {
  /**
   * Logs a message to console
   * @param {string} message - The message to log
   */
  static log(message: string): void {
    // eslint-disable-next-line no-console
    console.log(message);
  }

  /**
   * Logs an error message to console error
   * @param {string} message - The error message to log
   */
  static error(message: string): void {
    // eslint-disable-next-line no-console
    console.error(message);
  }

  /**
   * Logs a header with title and separator line
   * @param {string} title - The title to display
   */
  static logHeader(title: string): void {
    Logger.log(title);
    Logger.log('='.repeat(CONSOLE_LINE_LENGTH));
  }

  /**
   * Logs quality gate execution information
   * @param {string} name - The quality gate name
   * @param {string} description - The quality gate description
   */
  static logQualityGate(name: string, description: string): void {
    Logger.log(`\n🔍 Running quality gate: ${name}`);
    Logger.log(`📝 ${description}`);
  }

  /**
   * Logs the result of a quality gate execution
   * @param {string} name - The quality gate name
   * @param {boolean} passed - Whether the gate passed
   * @param {string} [errorMessage] - Optional error message if failed
   * @param {string} [error] - Optional error details
   */
  static logGateResult(name: string, passed: boolean, errorMessage?: string, error?: string): void {
    if (passed) {
      Logger.log(`✅ ${name}: PASSED`);
    } else {
      Logger.log(`❌ ${name}: FAILED`);
      Logger.log(`🚨 ${errorMessage}`);
      Logger.log(`📋 Error: ${error}`);
    }
  }

  /**
   * Logs forbidden pattern check information
   * @param {string} description - The pattern description being checked
   */
  static logForbiddenPatternCheck(description: string): void {
    Logger.log(`\n📝 Checking for: ${description}`);
  }

  /**
   * Logs the validation header with enforcement warnings
   */
  static logValidationHeader(): void {
    Logger.log('🚀 QUALITY GATES VALIDATION - MANDATORY ENFORCEMENT');
    Logger.log('===================================================');
    Logger.log('⚠️  ANY failure will BLOCK story completion');
    Logger.log('⚠️  NO exceptions, NO workarounds permitted\n');
  }

  /**
   * Logs a summary line with newline prefix
   * @param {string} message - The message to log
   */
  static logSummaryLine(message: string): void {
    Logger.log(`\n${message}`);
  }
}