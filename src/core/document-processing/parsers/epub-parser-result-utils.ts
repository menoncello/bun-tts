/**
 * EPUB Parser Result Utilities
 * Contains utilities for creating parse results (success and error)
 */

import type { ParseResult, Chapter, DocumentStructure } from '../types';
import {
  logSuccess,
  logError,
  normalizeError,
} from './epub-parser-error-handling';
import type { DocumentStatistics } from './epub-parser-types';

/**
 * Creates a successful parse result
 * @param parserName - Name of the parser for logging
 * @param chapters - Array of parsed chapters
 * @param stats - Document statistics
 * @param parseTime - Time taken to parse in milliseconds
 * @returns Successful parse result with document data
 */
export function createSuccessResult(
  parserName: string,
  chapters: Chapter[],
  stats: DocumentStatistics,
  parseTime: number
): ParseResult {
  logSuccess(parserName, chapters, stats, parseTime);

  return {
    success: true,
    data: createDocumentStructure(chapters, stats),
  };
}

/**
 * Creates document structure from chapters and statistics
 * @param chapters - Array of parsed chapters
 * @param stats - Document statistics
 * @returns Document structure object
 */
function createDocumentStructure(
  chapters: Chapter[],
  stats: DocumentStatistics
): DocumentStructure {
  return {
    metadata: createDefaultMetadata(),
    chapters,
    tableOfContents: [],
    embeddedAssets: createDefaultAssets(),
    totalParagraphs: stats.totalParagraphs,
    totalSentences: stats.totalSentences,
    totalWords: stats.totalWords,
    estimatedReadingTime: stats.estimatedReadingTime,
    version: '1.0',
    warnings: [],
  };
}

/**
 * Creates default metadata structure
 * @returns Default metadata object
 */
function createDefaultMetadata(): {
  title: string;
  author: string;
  language: string;
  publisher: string;
  identifier: string;
} {
  return {
    title: 'Unknown Title',
    author: 'Unknown Author',
    language: 'unknown',
    publisher: 'Unknown Publisher',
    identifier: '',
  };
}

/**
 * Creates default embedded assets structure
 * @returns Default embedded assets object
 */
function createDefaultAssets(): {
  images: never[];
  audio: never[];
  video: never[];
  fonts: never[];
  other: never[];
} {
  return {
    images: [],
    audio: [],
    video: [],
    fonts: [],
    other: [],
  };
}

/**
 * Creates an error parse result
 * @param parserName - Name of the parser for logging
 * @param error - The error that occurred during parsing
 * @returns Error parse result with normalized error information
 */
export function createErrorResult(
  parserName: string,
  error: unknown
): ParseResult {
  logError(parserName, error);
  return { success: false, error: normalizeError(error) };
}
