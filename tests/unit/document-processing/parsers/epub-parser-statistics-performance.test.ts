import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { updatePerformanceStats } from '../../../../src/core/document-processing/parsers/epub-parser-statistics.js';
import { createMockPerformanceStats } from './helpers/epub-parser-statistics-test-data.js';

describe('EPUB Parser Statistics - Performance Updates', () => {
  let originalMemoryUsage: any;

  beforeEach(() => {
    // Mock process.memoryUsage to return consistent values for testing
    originalMemoryUsage = process.memoryUsage;
    (process.memoryUsage as any) = () => ({
      rss: 50000000,
      heapTotal: 30000000,
      heapUsed: 20000000,
      external: 1000000,
      arrayBuffers: 500000,
    });
  });

  afterEach(() => {
    // Restore original process.memoryUsage
    (process.memoryUsage as any) = originalMemoryUsage;
  });

  test('should update performance stats with valid inputs', () => {
    const baseStats = createMockPerformanceStats();
    const startTime = Date.now(); // Use timestamp instead of Date object
    const chapterCount = 1;

    // Simulate some processing time
    const originalDateNow = Date.now;
    Date.now = () => startTime + 100; // 100ms passed

    const result = updatePerformanceStats(startTime, chapterCount, baseStats);

    // Restore original Date.now
    Date.now = originalDateNow;

    expect(result.totalParagraphs).toBe(baseStats.totalParagraphs);
    expect(result.totalSentences).toBe(baseStats.totalSentences);
    expect(result.totalWords).toBe(baseStats.totalWords);
    expect(result.chapterCount).toBe(chapterCount);
    expect(result.imageCount).toBe(baseStats.imageCount);
    expect(result.tableCount).toBe(baseStats.tableCount);
    expect(result.estimatedReadingTime).toBe(baseStats.estimatedReadingTime);
    expect(result.parseTimeMs).toBe(100);
    expect(result.memoryUsageMB).toBeGreaterThan(0);
    expect(result.chaptersPerSecond).toBeGreaterThanOrEqual(0);
  });

  test('should handle zero chapter count', () => {
    const baseStats = createMockPerformanceStats({ chapterCount: 0 });
    const startTime = Date.now();
    const chapterCount = 0;

    const result = updatePerformanceStats(startTime, chapterCount, baseStats);

    expect(result.chapterCount).toBe(0);
    expect(result.totalWords).toBe(baseStats.totalWords);
    expect(result.chaptersPerSecond).toBe(0);
  });

  test('should handle very large source length', () => {
    const baseStats = createMockPerformanceStats();
    const startTime = Date.now();
    const chapterCount = 10;

    const result = updatePerformanceStats(startTime, chapterCount, baseStats);

    expect(result.totalWords).toBe(baseStats.totalWords);
    expect(result.chapterCount).toBe(chapterCount);
    expect(result.chaptersPerSecond).toBeGreaterThan(0);
  });

  test('should handle minimal processing time', () => {
    const baseStats = createMockPerformanceStats();
    const startTime = Date.now();
    const chapterCount = 1;

    // Mock a very fast processing time by manipulating Date.now
    const originalDateNow = Date.now;
    Date.now = () => startTime + 1; // Only 1ms passed

    const result = updatePerformanceStats(startTime, chapterCount, baseStats);

    // Restore original Date.now
    Date.now = originalDateNow;

    expect(result.totalWords).toBe(baseStats.totalWords);
    expect(result.parseTimeMs).toBe(1);
    expect(result.chaptersPerSecond).toBeGreaterThan(0);
  });
});
