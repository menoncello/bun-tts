/**
 * EPUB Parser Structure Builder Utilities
 * Contains utility functions for building document structures
 */

import type { Chapter, PerformanceStats } from '../types.js';
import type { DocumentStatistics } from './epub-parser-types.js';

// Constants for structure calculations
export const AVERAGE_CHARACTERS_PER_WORD = 6;
export const WORDS_PER_MINUTE_READING_RATE = 200;
export const EMPTY_DOCUMENT_CONFIDENCE = 0.5;
export const NO_WORDS_CONFIDENCE = 0.3;
export const WORDS_PER_PARAGRAPH_TARGET = 20;
export const SUBSTANTIAL_CONTENT_THRESHOLD = 1000;
export const SUBSTANTIAL_CONTENT_CONFIDENCE_BOOST = 0.2;
export const MINIMAL_CONTENT_THRESHOLD = 100;
export const MINIMAL_CONTENT_CONFIDENCE_BOOST = 0.1;
export const MINIMUM_CONFIDENCE_THRESHOLD = 0.3;

/**
 * Creates document statistics from chapters
 * @param {any} chapters - Array of document chapters
 * @returns {any} Document statistics object
 */
export function createDocumentStatistics(
  chapters: Chapter[]
): DocumentStatistics {
  return {
    totalParagraphs: chapters.reduce(
      (sum, ch) => sum + ch.paragraphs.length,
      0
    ),
    totalSentences: chapters.reduce(
      (sum, ch) =>
        sum + ch.paragraphs.reduce((pSum, p) => pSum + p.sentences.length, 0),
      0
    ),
    totalWords: chapters.reduce((sum, ch) => sum + ch.wordCount, 0),
    estimatedReadingTime:
      chapters.reduce((sum, ch) => sum + ch.wordCount, 0) /
      WORDS_PER_MINUTE_READING_RATE,
    chapterCount: chapters.length,
    imageCount: 0,
    tableCount: 0,
  };
}

/**
 * Creates default performance statistics
 * @param {any} chapters - Array of document chapters
 * @param {any} stats - Document statistics
 * @returns {any} Default performance statistics object
 */
export function createDefaultPerformanceStats(
  chapters: Chapter[],
  stats: DocumentStatistics
): PerformanceStats {
  return {
    parseTimeMs: 0,
    chapterCount: chapters.length,
    parseTime: 0,
    chaptersPerSecond: 0,
    memoryUsageMB: 0,
    memoryUsage: 0,
    throughputMBs: 0,
    validationTimeMs: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalParagraphs: stats.totalParagraphs,
    totalSentences: stats.totalSentences,
    totalWords: stats.totalWords,
    estimatedReadingTime: stats.estimatedReadingTime,
    imageCount: 0,
    tableCount: 0,
  };
}

/**
 * Calculates document confidence based on chapter content
 * @param {any} chapters - Array of document chapters
 * @returns {any} Confidence score between 0 and 1
 */
export function calculateDocumentConfidence(chapters: Chapter[]): number {
  if (chapters.length === 0) {
    return EMPTY_DOCUMENT_CONFIDENCE;
  }

  // Calculate confidence based on content quality
  const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
  const totalParagraphs = chapters.reduce(
    (sum, ch) => sum + ch.paragraphs.length,
    0
  );

  if (totalWords === 0) {
    return NO_WORDS_CONFIDENCE;
  }

  // Base confidence on paragraph density (words per paragraph)
  const avgWordsPerParagraph = totalWords / totalParagraphs;
  let confidence = Math.min(
    avgWordsPerParagraph / WORDS_PER_PARAGRAPH_TARGET,
    1.0
  );

  // Adjust based on content completeness
  if (totalWords >= SUBSTANTIAL_CONTENT_THRESHOLD) {
    confidence = Math.min(
      confidence + SUBSTANTIAL_CONTENT_CONFIDENCE_BOOST,
      1.0
    );
  } else if (totalWords >= MINIMAL_CONTENT_THRESHOLD) {
    confidence = Math.min(confidence + MINIMAL_CONTENT_CONFIDENCE_BOOST, 1.0);
  }

  return Math.max(confidence, MINIMUM_CONFIDENCE_THRESHOLD);
}

/**
 * Calculates document totals for structure
 * @param {any} chapters - Array of document chapters
 * @param {any} stats - Document statistics
 * @param {any} performanceInfo - Performance information
 * @param {any} performanceInfo.chapterCount - Number of chapters
 * @returns {any} Document totals object
 */
export function calculateDocumentTotals(
  chapters: Chapter[],
  stats: DocumentStatistics,
  performanceInfo: { chapterCount: number }
): {
  totalParagraphs: number;
  totalSentences: number;
  totalWordCount: number;
  totalChapters: number;
} {
  return {
    totalParagraphs: stats?.totalParagraphs || 0,
    totalSentences: stats?.totalSentences || 0,
    totalWordCount: stats?.totalWords || 0,
    totalChapters: performanceInfo.chapterCount,
  };
}

/**
 * Calculates estimated total duration from chapters
 * @param {any} chapters - Array of document chapters
 * @returns {any} Total estimated duration
 */
export function calculateEstimatedDuration(chapters: Chapter[]): number {
  return chapters.reduce((sum, ch) => sum + ch.estimatedDuration, 0);
}

/**
 * Creates default processing metrics
 * @returns {any} Default processing metrics object
 */
export function createDefaultProcessingMetrics(): {
  parseStartTime: Date;
  parseEndTime: Date;
  parseDurationMs: number;
  sourceLength: number;
  processingErrors: string[];
} {
  const now = new Date();
  return {
    parseStartTime: now,
    parseEndTime: now,
    parseDurationMs: 0,
    sourceLength: 0,
    processingErrors: [],
  };
}

/**
 * Creates processing metrics for document structure
 * @param {any} params - Structure parameters
 * @param {object} params.stats - Document statistics
 * @param {number} params.startTime - Parse start time
 * @param {any} performanceInfo - Performance information
 * @param {number} performanceInfo.parseTimeMs - Time taken to parse in milliseconds
 * @returns {any} Processing metrics object
 */
export function createProcessingMetrics(
  params: {
    stats: DocumentStatistics;
    startTime: number;
  },
  performanceInfo: {
    parseTimeMs: number;
  }
): {
  parseStartTime: Date;
  parseEndTime: Date;
  parseDurationMs: number;
  sourceLength: number;
  processingErrors: string[];
} {
  const parseStartTime = new Date(params.startTime);
  const parseEndTime = new Date(params.startTime + performanceInfo.parseTimeMs);

  return {
    parseStartTime,
    parseEndTime,
    parseDurationMs: performanceInfo.parseTimeMs,
    sourceLength: (params.stats?.totalWords || 0) * AVERAGE_CHARACTERS_PER_WORD,
    processingErrors: [],
  };
}
