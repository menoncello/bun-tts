/**
 * EPUB Parser Initialization Utilities
 * Contains utilities for initializing parser options and performance statistics
 */

import type { PerformanceStats } from '../types.js';
import type { EPUBParseOptions } from './epub-parser-types.js';

/**
 * Initializes default parser options with provided overrides
 * @param {any} options - User-provided options to merge with defaults
 * @returns {EPUBParseOptions} Complete options configuration with defaults applied
 */
export function initializeOptions(options: EPUBParseOptions): EPUBParseOptions {
  return {
    extractMedia: true,
    preserveHTML: false,
    chapterSensitivity: 0.8,
    ...options,
  };
}

/**
 * Initializes performance statistics with default values
 * @returns {PerformanceStats} Performance statistics object with default values
 */
export function initializePerformanceStats(): PerformanceStats {
  return {
    // Document content statistics
    totalParagraphs: 0,
    totalSentences: 0,
    totalWords: 0,
    estimatedReadingTime: 0,
    chapterCount: 0,
    imageCount: 0,
    tableCount: 0,
    // Performance metrics
    parseTimeMs: 0,
    parseTime: 0, // For backward compatibility
    memoryUsageMB: 0,
    memoryUsage: 0, // For backward compatibility
    throughputMBs: 0,
    validationTimeMs: 0,
    chaptersPerSecond: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };
}
