import { describe, test, expect } from 'bun:test';
import { createStatsStructure } from '../../../../src/core/document-processing/parsers/epub-parser-helper-utils.js';
import {
  createMockPerformanceStats,
  createEmptyMockPerformanceStats,
} from './helpers/epub-parser-test-data';

describe('EPUB Parser Helper Utilities - Stats Structure', () => {
  test('should create stats structure from document statistics', () => {
    const stats = createMockPerformanceStats();

    const result = createStatsStructure(stats);

    expect(result).toEqual({
      totalParagraphs: 10,
      totalSentences: 20,
      totalWords: 500,
      estimatedReadingTime: 3,
    });

    expect(typeof result.totalParagraphs).toBe('number');
    expect(typeof result.totalSentences).toBe('number');
    expect(typeof result.totalWords).toBe('number');
    expect(typeof result.estimatedReadingTime).toBe('number');
  });

  test('should handle empty statistics', () => {
    const stats = createEmptyMockPerformanceStats();

    const result = createStatsStructure(stats);

    expect(result.totalParagraphs).toBe(0);
    expect(result.totalSentences).toBe(0);
    expect(result.totalWords).toBe(0);
    expect(result.estimatedReadingTime).toBe(0);
  });

  test('should handle large statistics values', () => {
    const stats = {
      totalParagraphs: 1000,
      totalSentences: 2000,
      totalWords: 10000,
      estimatedReadingTime: 50,
      chapterCount: 20,
      imageCount: 100,
      tableCount: 25,
    };

    const result = createStatsStructure(stats);

    expect(result.totalParagraphs).toBe(1000);
    expect(result.totalSentences).toBe(2000);
    expect(result.totalWords).toBe(10000);
    expect(result.estimatedReadingTime).toBe(50);
  });
});
