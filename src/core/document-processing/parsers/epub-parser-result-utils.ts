/**
 * EPUB Parser Result Utilities
 * Contains utilities for creating parse results (success and error)
 */

import type { ParseResult, Chapter, DocumentStructure } from '../types.js';
import {
  logSuccess,
  logError,
  normalizeError,
} from './epub-parser-error-handling.js';
import type { DocumentStatistics } from './epub-parser-types.js';

/**
 * Creates a successful parse result
 * @param {string} parserName - Name of the parser for logging
 * @param {Chapter[]} chapters - Array of parsed chapters
 * @param {DocumentStatistics} stats - Document statistics
 * @param {number} parseTime - Time taken to parse in milliseconds
 * @returns {ParseResult} Successful parse result with document data
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
 * @param {Chapter[]} chapters - Array of parsed chapters
 * @param {DocumentStatistics} stats - Document statistics
 * @returns {DocumentStructure} Document structure object
 */
function createDocumentStructure(
  chapters: Chapter[],
  stats: DocumentStatistics
): DocumentStructure {
  const now = new Date();
  return {
    metadata: createDefaultMetadata(),
    chapters,
    tableOfContents: [],
    totalParagraphs: stats.totalParagraphs,
    totalSentences: stats.totalSentences,
    totalWordCount: stats.totalWords,
    totalChapters: chapters.length,
    estimatedTotalDuration: stats.estimatedReadingTime, // Using reading time as estimated duration
    confidence: 1.0,
    processingMetrics: {
      parseStartTime: now,
      parseEndTime: now,
      parseDurationMs: 0,
      sourceLength: 0,
      processingErrors: [],
    },
  };
}

/**
 * Creates default metadata structure
 * @returns {object} Default metadata object with title, author, language, and other fields
 */
function createDefaultMetadata(): {
  title: string;
  author?: string;
  language?: string;
  publisher?: string;
  identifier?: string;
  created?: Date;
  modified?: Date;
  sourceFormat?: string;
  generator?: string;
  description?: string;
  subject?: string[];
  rights?: string;
  coverage?: string;
  wordCount: number;
  customMetadata: Record<string, unknown>;
} {
  return {
    title: 'Unknown Title',
    author: 'Unknown Author',
    language: 'unknown',
    publisher: 'Unknown Publisher',
    identifier: '',
    wordCount: 0,
    customMetadata: {},
  };
}

/**
 * Creates an error parse result
 * @param {string} parserName - Name of the parser for logging
 * @param {unknown} error - The error that occurred during parsing
 * @returns {ParseResult} Error parse result with normalized error information
 */
export function createErrorResult(
  parserName: string,
  error: unknown
): ParseResult {
  logError(parserName, error);
  return { success: false, error: normalizeError(error) };
}
