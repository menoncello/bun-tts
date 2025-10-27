/**
 * EPUB Parser Initialization Utilities
 * Contains utilities for initializing parser options and performance statistics
 */

import type { PerformanceStats } from '../types';
import type { EPUBParseOptions } from './epub-parser-types';

/**
 * Initializes default parser options with provided overrides
 * @param options - User-provided options to merge with defaults
 * @returns Complete options configuration with defaults applied
 */
export function initializeOptions(options: EPUBParseOptions): EPUBParseOptions {
  return {
    mode: 'full',
    streaming: true,
    strictMode: true,
    enableProfiling: false,
    extractMedia: true,
    preserveHTML: false,
    chapterSensitivity: 0.8,
    ...options,
  };
}

/**
 * Initializes performance statistics with default values
 * @returns Performance statistics object with default values
 */
export function initializePerformanceStats(): PerformanceStats {
  return {
    parseTime: 0,
    chaptersPerSecond: 0,
    memoryUsage: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };
}
