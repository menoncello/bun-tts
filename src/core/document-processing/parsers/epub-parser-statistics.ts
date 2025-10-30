/**
 * EPUB Parser Statistics Module
 *
 * Contains statistics calculation and performance tracking logic.
 */

import type {
  Chapter,
  PerformanceStats,
  DocumentStatistics,
} from '../types.js';
import { MILLISECONDS_PER_SECOND } from './epub-parser-utils.js';

// Constants for calculations
const WORDS_PER_MINUTE = 200;
const BYTES_PER_KILOBYTE = 1024;
const KILOBYTES_PER_MEGABYTE = 1024;
const BYTES_PER_MEGABYTE = BYTES_PER_KILOBYTE * KILOBYTES_PER_MEGABYTE;

/**
 * Count basic content metrics across all chapters
 * @param {Chapter[]} chapters - Array of chapters
 * @returns {object} Object containing paragraph, sentence, and word counts
 */
function countBasicContentMetrics(chapters: Chapter[]): {
  totalParagraphs: number;
  totalSentences: number;
  totalWords: number;
} {
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

  return {
    totalParagraphs,
    totalSentences,
    totalWords,
  };
}

// Pre-compiled regex patterns for better performance
const IMAGE_REGEX = /<img[^>]*>/gi;
const TABLE_REGEX = /<table[^>]*>/gi;

/**
 * Count media elements (images and tables) across all chapters
 * @param {Chapter[]} chapters - Array of chapters
 * @returns {object} Object containing image and table counts
 */
function countMediaElements(chapters: Chapter[]): {
  imageCount: number;
  tableCount: number;
} {
  let imageCount = 0;
  let tableCount = 0;

  for (const chapter of chapters) {
    for (const paragraph of chapter.paragraphs) {
      if (paragraph.rawText) {
        // Use pre-compiled regex patterns for better performance
        // Reset lastIndex to ensure consistent matching across iterations
        IMAGE_REGEX.lastIndex = 0;
        TABLE_REGEX.lastIndex = 0;

        // Count images using pre-compiled regex
        const imageMatches = paragraph.rawText.match(IMAGE_REGEX);
        imageCount += imageMatches ? imageMatches.length : 0;

        // Count tables using pre-compiled regex - match opening table tags
        const tableMatches = paragraph.rawText.match(TABLE_REGEX);
        tableCount += tableMatches ? tableMatches.length : 0;
      }
    }
  }

  return {
    imageCount,
    tableCount,
  };
}

/**
 * Calculate document statistics
 * @param {Chapter[]} chapters - Array of chapters
 * @returns {unknown} unknown Document statistics
 */
export function calculateStatistics(chapters: Chapter[]): DocumentStatistics {
  const { totalParagraphs, totalSentences, totalWords } =
    countBasicContentMetrics(chapters);
  const { imageCount, tableCount } = countMediaElements(chapters);

  const estimatedReadingTime = totalWords / WORDS_PER_MINUTE;

  return {
    totalParagraphs,
    totalSentences,
    totalWords,
    estimatedReadingTime,
    chapterCount: chapters.length, // Set actual chapter count
    imageCount,
    tableCount,
  };
}

/**
 * Update performance statistics
 * @param {Date} startTime - Start time in milliseconds
 * @param {number} chapterCount - Number of chapters processed
 * @param {any} currentStats - Current performance stats to update
 * @returns {unknown} unknown Updated performance stats
 */
export function updatePerformanceStats(
  startTime: number,
  chapterCount: number,
  currentStats: PerformanceStats
): PerformanceStats {
  const parseTime = Date.now() - startTime;
  const memoryUsage = process.memoryUsage().heapUsed;

  return {
    // Document content statistics
    totalParagraphs: currentStats.totalParagraphs,
    totalSentences: currentStats.totalSentences,
    totalWords: currentStats.totalWords,
    estimatedReadingTime: currentStats.estimatedReadingTime,
    chapterCount,
    imageCount: currentStats.imageCount,
    tableCount: currentStats.tableCount,
    // Performance metrics
    parseTimeMs: parseTime,
    parseTime, // For backward compatibility
    memoryUsageMB: memoryUsage / BYTES_PER_MEGABYTE,
    memoryUsage, // For backward compatibility
    throughputMBs: 0, // Will be calculated if needed
    validationTimeMs: currentStats.validationTimeMs,
    chaptersPerSecond:
      chapterCount > 0
        ? (chapterCount / parseTime) * MILLISECONDS_PER_SECOND
        : 0,
    cacheHits: currentStats.cacheHits,
    cacheMisses: currentStats.cacheMisses,
  };
}
