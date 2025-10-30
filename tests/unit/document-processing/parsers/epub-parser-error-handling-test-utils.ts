import { spyOn } from 'bun:test';
import { logger } from '../../../../src/utils/logger.js';

/**
 * Setup mock logger for testing
 */
export function setupMockLogger() {
  return {
    info: spyOn(logger, 'info'),
    error: spyOn(logger, 'error'),
  };
}

/**
 * Restore mock logger
 */
export function restoreMockLogger(mockLogger: any) {
  mockLogger?.info?.mockRestore?.();
  mockLogger?.error?.mockRestore?.();
}

/**
 * Create test chapter data
 */
export function createTestChapter(id: string, title: string, wordCount = 500) {
  return {
    id,
    title,
    level: 1,
    paragraphs: [],
    position: 0,
    wordCount,
    estimatedDuration: wordCount / 2,
    startPosition: 0,
    endPosition: wordCount,
    startIndex: 0,
  };
}

/**
 * Create test statistics data
 */
export function createTestStatistics(words = 1250, chapters = 2) {
  return {
    totalWords: words,
    totalParagraphs: Math.floor(words / 50),
    totalSentences: Math.floor(words / 25),
    estimatedReadingTime: Math.floor(words / 250),
    chapterCount: chapters,
    imageCount: 0,
    tableCount: 0,
  };
}
