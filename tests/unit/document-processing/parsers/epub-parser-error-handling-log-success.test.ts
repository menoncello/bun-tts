import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { logSuccess } from '../../../../src/core/document-processing/parsers/epub-parser-error-handling.js';
import type { Chapter } from '../../../../src/core/document-processing/types.js';
import {
  setupMockLogger,
  restoreMockLogger,
  createTestChapter,
  createTestStatistics,
} from './epub-parser-error-handling-test-utils';

// Common setup and teardown for tests
let mockLogger: any;

beforeEach(() => {
  mockLogger = setupMockLogger();
});

afterEach(() => {
  restoreMockLogger(mockLogger);
});

describe('EPUB Parser Error Handling - logSuccess - Basic Logging', () => {
  test('should log successful parsing with correct details', () => {
    const parserName = 'EPUBParser';
    const chapters: Chapter[] = [
      createTestChapter('chapter1', 'Chapter 1', 500),
      createTestChapter('chapter2', 'Chapter 2', 750),
    ];
    const stats = createTestStatistics(1250, 2);
    const parseTimeMs = 1500;

    logSuccess(parserName, chapters, stats, parseTimeMs);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'EPUB parsing completed successfully',
      {
        parser: 'EPUBParser',
        chapters: 2,
        words: 1250,
        parseTime: 1500,
      }
    );
  });
});

describe('EPUB Parser Error Handling - logSuccess - Edge Cases', () => {
  test('should log success with empty chapters', () => {
    const parserName = 'TestParser';
    const chapters: Chapter[] = [];
    const stats = createTestStatistics(0, 0);
    const parseTimeMs = 100;

    logSuccess(parserName, chapters, stats, parseTimeMs);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'EPUB parsing completed successfully',
      {
        parser: 'TestParser',
        chapters: 0,
        words: 0,
        parseTime: 100,
      }
    );
  });

  test('should log success with single chapter', () => {
    const parserName = 'SingleChapterParser';
    const chapters: Chapter[] = [
      createTestChapter('only-chapter', 'Only Chapter', 1000),
    ];
    const stats = {
      ...createTestStatistics(1000, 1),
      imageCount: 2,
      tableCount: 1,
    };
    const parseTimeMs = 800;

    logSuccess(parserName, chapters, stats, parseTimeMs);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'EPUB parsing completed successfully',
      {
        parser: 'SingleChapterParser',
        chapters: 1,
        words: 1000,
        parseTime: 800,
      }
    );
  });
});

describe('EPUB Parser Error Handling - logSuccess - Performance Scenarios', () => {
  test('should handle large parse times', () => {
    const parserName = 'SlowParser';
    const chapters: Chapter[] = [];
    const stats = createTestStatistics(5000, 0);
    const parseTimeMs = 10000;

    logSuccess(parserName, chapters, stats, parseTimeMs);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'EPUB parsing completed successfully',
      {
        parser: 'SlowParser',
        chapters: 0,
        words: 5000,
        parseTime: 10000,
      }
    );
  });

  test('should handle zero parse time', () => {
    const parserName = 'InstantParser';
    const chapters: Chapter[] = [];
    const stats = createTestStatistics(100, 1);
    const parseTimeMs = 0;

    logSuccess(parserName, chapters, stats, parseTimeMs);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'EPUB parsing completed successfully',
      {
        parser: 'InstantParser',
        chapters: 0,
        words: 100,
        parseTime: 0,
      }
    );
  });
});
