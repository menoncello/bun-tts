/**
 * Simple logger utility to avoid console statements in production code
 *
 * This class provides a centralized logging mechanism that can be easily
 * replaced with a proper logging system in production.
 */
export class Logger {
  /**
   * Logs an error message.
   *
   * @param {string} message - The error message to log
   * @param {unknown[]} args - Additional arguments to log
   */
  static error(message: string, ...args: unknown[]): void {
    // In production, this would log to a proper logging system
    // For now, we'll use console.error but this allows for easy replacement
    // eslint-disable-next-line no-console
    console.error(message, ...args);
  }

  /**
   * Logs a warning message.
   *
   * @param {string} message - The warning message to log
   * @param {unknown[]} args - Additional arguments to log
   */
  static warn(message: string, ...args: unknown[]): void {
    // In production, this would log to a proper logging system
    // eslint-disable-next-line no-console
    console.warn(message, ...args);
  }
}
