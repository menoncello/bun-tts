/**
 * EPUB Parser Statistics Module
 *
 * Contains statistics calculation and performance tracking logic.
 */

import type { Chapter, PerformanceStats, DocumentStatistics } from '../types';
import { MILLISECONDS_PER_SECOND } from './epub-parser-utils';

// Constants for calculations
const WORDS_PER_MINUTE = 200;

/**
 * Calculate document statistics
 * @param chapters - Array of chapters
 * @returns Document statistics
 */
export function calculateStatistics(chapters: Chapter[]): DocumentStatistics {
  let totalParagraphs = 0;
  let totalSentences = 0;
  let totalWords = 0;

  for (const chapter of chapters) {
    totalParagraphs += chapter.paragraphs.length;
    totalSentences += chapter.paragraphs.reduce(
      (sum, p) => sum + p.sentences.length,
      0
    );
    totalWords += chapter.wordCount;
  }

  const estimatedReadingTime = Math.ceil(totalWords / WORDS_PER_MINUTE);

  return {
    totalParagraphs,
    totalSentences,
    totalWords,
    estimatedReadingTime,
  };
}

/**
 * Update performance statistics
 * @param startTime - Start time in milliseconds
 * @param chapterCount - Number of chapters processed
 * @param currentStats - Current performance stats to update
 * @returns Updated performance stats
 */
export function updatePerformanceStats(
  startTime: number,
  chapterCount: number,
  currentStats: PerformanceStats
): PerformanceStats {
  const parseTime = Date.now() - startTime;

  return {
    parseTime,
    chaptersPerSecond:
      chapterCount > 0
        ? (chapterCount / parseTime) * MILLISECONDS_PER_SECOND
        : 0,
    memoryUsage: process.memoryUsage().heapUsed,
    cacheHits: currentStats.cacheHits,
    cacheMisses: currentStats.cacheMisses,
  };
}
