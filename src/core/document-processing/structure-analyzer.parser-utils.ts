/**
 * Parser utilities for StructureAnalyzerCore.
 * Contains methods for converting between different result types and validating document structures.
 */

import type { Result } from '../../errors/index';
import type { DocumentStructure, ParseResult } from './types';

/**
 * Parser utilities for StructureAnalyzerCore.
 */
export class StructureAnalyzerParserUtils {
  /**
   * Converts ParseResult to Result type.
   * @param {ParseResult<unknown>} parseResult - The ParseResult to convert
   * @returns {Result<DocumentStructure, Error>} The converted Result
   */
  static convertParseResultToResult(
    parseResult: ParseResult<unknown>
  ): Result<DocumentStructure, Error> {
    if (
      parseResult.success &&
      parseResult.data &&
      this.isValidDocumentStructure(parseResult.data)
    ) {
      return {
        success: true,
        data: parseResult.data as DocumentStructure,
      };
    }

    const error =
      parseResult.error instanceof Error
        ? parseResult.error
        : new Error(parseResult.error?.message || 'Unknown parsing error');

    return {
      success: false,
      error,
    };
  }

  /**
   * Validates if the unknown data is a valid DocumentStructure.
   * @param {unknown} data - The data to validate
   * @returns {boolean} True if the data is a valid DocumentStructure
   */
  static isValidDocumentStructure(data: unknown): boolean {
    return (
      data != null &&
      typeof data === 'object' &&
      'metadata' in data &&
      'chapters' in data &&
      'totalParagraphs' in data &&
      'totalSentences' in data &&
      'totalWordCount' in data &&
      'confidence' in data &&
      'processingMetrics' in data
    );
  }
}
