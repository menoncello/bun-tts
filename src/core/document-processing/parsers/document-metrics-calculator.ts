/**
 * Document Metrics Calculator
 * Contains utilities for calculating document metrics and processing information
 */

import type {
  Chapter,
  DocumentStatistics,
  PerformanceStats,
} from '../types.js';
import { createUpdatedPerformanceStats } from './epub-parser-helper-utils.js';

/**
 * Word to character conversion factor for rough text length estimation
 * Average word length in English text for size calculations
 */
const WORD_TO_CHARACTER_RATIO = 5;

/**
 * Calculates document metrics from chapters and statistics
 * @param {Chapter[]} chapters - Array of document chapters
 * @param {DocumentStatistics} _stats - Document statistics
 * @returns {object} object Calculated metrics including word count, chapter count, and duration
 */
export function calculateDocumentMetrics(
  chapters: Chapter[],
  _stats: DocumentStatistics
): {
  totalWordCount: number;
  totalChapters: number;
  estimatedTotalDuration: number;
} {
  // Calculate total word count from chapters, not from stats
  const totalWordCount = chapters.reduce(
    (sum, chapter) => sum + (chapter.wordCount || 0),
    0
  );
  const totalChapters = chapters.length;
  const estimatedTotalDuration = chapters.reduce(
    (sum, chapter) => sum + (chapter.estimatedDuration || 0),
    0
  );

  return {
    totalWordCount,
    totalChapters,
    estimatedTotalDuration,
  };
}

/**
 * Creates processing metrics for the document structure
 * @param {number} totalWordCount - Total word count in the document
 * @param {number} parseTime - Time taken to parse the document
 * @returns {object} object Processing metrics with timestamps and duration
 */
export function createProcessingMetrics(
  totalWordCount: number,
  parseTime: number
): {
  parseStartTime: Date;
  parseEndTime: Date;
  parseDurationMs: number;
  sourceLength: number;
  processingErrors: never[];
} {
  return {
    parseStartTime: new Date(),
    parseEndTime: new Date(),
    parseDurationMs: parseTime,
    sourceLength: totalWordCount * WORD_TO_CHARACTER_RATIO, // Rough estimate
    processingErrors: [],
  };
}

/**
 * Prepares all metrics for document structure
 * @param {Chapter[]} chapters - Array of document chapters
 * @param {DocumentStatistics} stats - Document statistics
 * @param {number} parseTime - Parse time
 * @returns {object} Object containing calculated and processing metrics
 */
export function prepareAllMetrics(
  chapters: Chapter[],
  stats: DocumentStatistics,
  parseTime: number
): {
  calculated: {
    totalWordCount: number;
    totalChapters: number;
    estimatedTotalDuration: number;
  };
  processing: {
    parseStartTime: Date;
    parseEndTime: Date;
    parseDurationMs: number;
    sourceLength: number;
    processingErrors: never[];
  };
} {
  const calculatedMetrics = calculateDocumentMetrics(chapters, stats);
  const processingMetrics = createProcessingMetrics(
    calculatedMetrics.totalWordCount,
    parseTime
  );

  return {
    calculated: calculatedMetrics,
    processing: processingMetrics,
  };
}

/**
 * Creates performance components
 * @param {any} params - Structure parameters
 * @param {any} params.chapters - Array of document chapters
 * @param {any} params.startTime - Parse start time
 * @param {any} params.performanceStats - Performance statistics
 * @returns {unknown} unknown Performance components
 */
export function createPerformanceComponents(params: {
  chapters: Chapter[];
  startTime: number;
  performanceStats: PerformanceStats;
}): {
  parseTime: number;
  chapterCount: number;
  performanceStats: PerformanceStats;
} {
  return {
    parseTime: Date.now() - params.startTime,
    chapterCount: params.chapters.length,
    performanceStats: createUpdatedPerformanceStats(
      params.startTime,
      params.chapters.length,
      params.performanceStats
    ),
  };
}

/**
 * Creates library and performance information
 * @param {number} chapterCount - Number of chapters processed
 * @param {Date} startTime - Parse start time for performance calculation
 * @param {any} performanceStats - Performance statistics object to update
 * @returns {unknown} unknown Library and performance information
 */
export function createPerformanceInfo(
  chapterCount: number,
  startTime: number,
  performanceStats: PerformanceStats
): {
  parseTime: number;
  chapterCount: number;
  performanceStats: PerformanceStats;
} {
  return {
    parseTime: Date.now() - startTime,
    chapterCount,
    performanceStats: createUpdatedPerformanceStats(
      startTime,
      chapterCount,
      performanceStats
    ),
  };
}
