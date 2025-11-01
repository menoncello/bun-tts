/**
 * Utility functions for PDF parsing errors
 */

import type { ErrorLocation } from './pdf-parse-error-types.js';

/**
 * Utility class for PDF parse error operations
 */
export class PdfParseErrorUtils {
  /**
   * Format error message with location information
   * @param {string} message - Base error message
   * @param {ErrorLocation} [location] - Location where error occurred
   * @returns {string} Formatted error message with location information
   */
  static formatErrorMessage(message: string, location?: ErrorLocation): string {
    if (!location) {
      return message;
    }

    const locationParts: string[] = [];
    if (location.page !== undefined) {
      locationParts.push(`Page ${location.page}`);
    }
    if (location.line !== undefined) {
      locationParts.push(`Line ${location.line}`);
    }
    if (location.column !== undefined) {
      locationParts.push(`Column ${location.column}`);
    }
    const locationString =
      locationParts.length > 0 ? ` (${locationParts.join(', ')})` : '';
    return `${message}${locationString}`;
  }

  /**
   * Validate and normalize confidence score
   * @param {number} confidence - Confidence score to validate
   * @returns {number} Normalized confidence score between 0 and 1
   */
  static normalizeConfidence(confidence: number): number {
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Create error location object
   * @param {number} [page] - Page number
   * @param {number} [line] - Line number
   * @param {number} [column] - Column number
   * @param {string} [context] - Context information
   * @returns {ErrorLocation} Location object
   */
  static createLocation(
    page?: number,
    line?: number,
    column?: number,
    context?: string
  ): ErrorLocation {
    const location: ErrorLocation = {};
    if (page !== undefined) location.page = page;
    if (line !== undefined) location.line = line;
    if (column !== undefined) location.column = column;
    if (context !== undefined) location.context = context;
    return location;
  }
}
