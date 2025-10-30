import { describe, test, expect, mock, beforeEach } from 'bun:test';
import {
  calculateDocumentMetrics,
  createProcessingMetrics,
  prepareAllMetrics,
  createPerformanceComponents,
  createPerformanceInfo,
} from '../../../../src/core/document-processing/parsers/document-metrics-calculator.js';
import type {
  Chapter,
  DocumentStatistics,
  PerformanceStats,
} from '../../../../src/core/document-processing/types.js';

// Mock the helper utils module
const mockCreateUpdatedPerformanceStats = mock(() => ({}) as PerformanceStats);
mock.module(
  '../../../../src/core/document-processing/parsers/epub-parser-helper-utils.js',
  () => ({
    createUpdatedPerformanceStats: mockCreateUpdatedPerformanceStats,
  })
);

describe('Document Metrics Calculator', () => {
  beforeEach(() => {
    mockCreateUpdatedPerformanceStats.mockClear();
  });

  describe('calculateDocumentMetrics', () => {
    test('should calculate metrics for chapters with word counts and durations', () => {
      const chapters: Chapter[] = [
        {
          id: 'chapter-1',
          title: 'Chapter 1',
          level: 1,
          paragraphs: [],
          position: 0,
          wordCount: 100,
          estimatedDuration: 240,
          startPosition: 0,
          endPosition: 1000,
          startIndex: 0,
        },
        {
          id: 'chapter-2',
          title: 'Chapter 2',
          level: 1,
          paragraphs: [],
          position: 1,
          wordCount: 150,
          estimatedDuration: 360,
          startPosition: 1000,
          endPosition: 2000,
          startIndex: 0,
        },
        {
          id: 'chapter-3',
          title: 'Chapter 3',
          level: 1,
          paragraphs: [],
          position: 2,
          wordCount: 75,
          estimatedDuration: 180,
          startPosition: 2000,
          endPosition: 3000,
          startIndex: 0,
        },
      ];

      const stats: DocumentStatistics = {
        totalWords: 325,
        totalParagraphs: 10,
        totalSentences: 25,
        estimatedReadingTime: 5,
        chapterCount: 2,
        imageCount: 0,
        tableCount: 0,
      };

      const result = calculateDocumentMetrics(chapters, stats);

      expect(result).toEqual({
        totalWordCount: 325, // 100 + 150 + 75
        totalChapters: 3,
        estimatedTotalDuration: 780, // 240 + 360 + 180
      });
    });

    test('should handle chapters with missing word counts', () => {
      const chapters: Chapter[] = [
        {
          id: 'chapter-1',
          title: 'Chapter 1',
          level: 1,
          paragraphs: [],
          position: 0,
          wordCount: 100,
          estimatedDuration: 240,
          startPosition: 0,
          endPosition: 1000,
          startIndex: 0,
        },
        {
          id: 'chapter-2',
          title: 'Chapter 2',
          level: 1,
          paragraphs: [],
          position: 1,
          wordCount: undefined as any,
          estimatedDuration: 360,
          startPosition: 1000,
          endPosition: 2000,
          startIndex: 0,
        },
        {
          id: 'chapter-3',
          title: 'Chapter 3',
          level: 1,
          paragraphs: [],
          position: 2,
          wordCount: null as any,
          estimatedDuration: 180,
          startPosition: 2000,
          endPosition: 3000,
          startIndex: 0,
        },
      ];

      const stats: DocumentStatistics = {
        totalWords: 100,
        totalParagraphs: 5,
        totalSentences: 10,
        estimatedReadingTime: 2,
        chapterCount: 1,
        imageCount: 0,
        tableCount: 0,
      };

      const result = calculateDocumentMetrics(chapters, stats);

      expect(result).toEqual({
        totalWordCount: 100, // Only count defined wordCount (100 + 0 + 0)
        totalChapters: 3,
        estimatedTotalDuration: 780, // 240 + 360 + 180
      });
    });

    test('should handle chapters with missing estimated durations', () => {
      const chapters: Chapter[] = [
        {
          id: 'chapter-1',
          title: 'Chapter 1',
          level: 1,
          paragraphs: [],
          position: 0,
          wordCount: 100,
          estimatedDuration: undefined as any,
          startPosition: 0,
          endPosition: 1000,
          startIndex: 0,
        },
        {
          id: 'chapter-2',
          title: 'Chapter 2',
          level: 1,
          paragraphs: [],
          position: 1,
          wordCount: 150,
          estimatedDuration: 360,
          startPosition: 1000,
          endPosition: 2000,
          startIndex: 0,
        },
        {
          id: 'chapter-3',
          title: 'Chapter 3',
          level: 1,
          paragraphs: [],
          position: 2,
          wordCount: 75,
          estimatedDuration: null as any,
          startPosition: 2000,
          endPosition: 3000,
          startIndex: 0,
        },
      ];

      const stats: DocumentStatistics = {
        totalWords: 325,
        totalParagraphs: 10,
        totalSentences: 25,
        estimatedReadingTime: 5,
        chapterCount: 2,
        imageCount: 0,
        tableCount: 0,
      };

      const result = calculateDocumentMetrics(chapters, stats);

      expect(result).toEqual({
        totalWordCount: 325,
        totalChapters: 3,
        estimatedTotalDuration: 360, // Only count defined duration (0 + 360 + 0)
      });
    });

    test('should handle empty chapters array', () => {
      const chapters: Chapter[] = [];
      const stats: DocumentStatistics = {
        totalWords: 0,
        totalParagraphs: 0,
        totalSentences: 0,
        estimatedReadingTime: 0,
        chapterCount: 0,
        imageCount: 0,
        tableCount: 0,
      };

      const result = calculateDocumentMetrics(chapters, stats);

      expect(result).toEqual({
        totalWordCount: 0,
        totalChapters: 0,
        estimatedTotalDuration: 0,
      });
    });

    test('should handle zero word counts and durations', () => {
      const chapters: Chapter[] = [
        {
          id: 'chapter-1',
          title: 'Chapter 1',
          level: 1,
          paragraphs: [],
          position: 0,
          wordCount: 0,
          estimatedDuration: 0,
          startPosition: 0,
          endPosition: 0,
          startIndex: 0,
        },
        {
          id: 'chapter-2',
          title: 'Chapter 2',
          level: 1,
          paragraphs: [],
          position: 1,
          wordCount: 0,
          estimatedDuration: 0,
          startPosition: 0,
          endPosition: 0,
          startIndex: 0,
        },
      ];

      const stats: DocumentStatistics = {
        totalWords: 0,
        totalParagraphs: 0,
        totalSentences: 0,
        estimatedReadingTime: 0,
        chapterCount: 0,
        imageCount: 0,
        tableCount: 0,
      };

      const result = calculateDocumentMetrics(chapters, stats);

      expect(result).toEqual({
        totalWordCount: 0,
        totalChapters: 2,
        estimatedTotalDuration: 0,
      });
    });

    test('should ignore stats parameter and calculate from chapters', () => {
      const chapters: Chapter[] = [
        {
          id: 'chapter-1',
          title: 'Chapter 1',
          level: 1,
          paragraphs: [],
          position: 0,
          wordCount: 200,
          estimatedDuration: 480,
          startPosition: 0,
          endPosition: 1000,
          startIndex: 0,
        },
      ];

      const stats: DocumentStatistics = {
        totalWords: 1000, // This should be ignored
        totalParagraphs: 50, // This should be ignored
        totalSentences: 100, // This should be ignored
        estimatedReadingTime: 15,
        chapterCount: 5,
        imageCount: 0,
        tableCount: 0,
      };

      const result = calculateDocumentMetrics(chapters, stats);

      expect(result).toEqual({
        totalWordCount: 200, // From chapter, not from stats
        totalChapters: 1,
        estimatedTotalDuration: 480, // From chapter, not from stats
      });
    });
  });

  describe('createProcessingMetrics', () => {
    test('should create processing metrics with current timestamps', () => {
      const totalWordCount = 1000;
      const parseTime = 2500;

      const result = createProcessingMetrics(totalWordCount, parseTime);

      expect(result).toEqual({
        parseStartTime: expect.any(Date),
        parseEndTime: expect.any(Date),
        parseDurationMs: 2500,
        sourceLength: 5000, // 1000 * 5 (WORD_TO_CHARACTER_RATIO)
        processingErrors: [],
      });

      // Check that timestamps are current (within a reasonable range)
      const now = Date.now();
      expect(result.parseStartTime.getTime()).toBeGreaterThan(now - 1000);
      expect(result.parseStartTime.getTime()).toBeLessThan(now + 1000);
      expect(result.parseEndTime.getTime()).toBeGreaterThan(now - 1000);
      expect(result.parseEndTime.getTime()).toBeLessThan(now + 1000);
    });

    test('should calculate source length correctly', () => {
      const testCases = [
        { wordCount: 0, expectedLength: 0 },
        { wordCount: 1, expectedLength: 5 },
        { wordCount: 10, expectedLength: 50 },
        { wordCount: 100, expectedLength: 500 },
        { wordCount: 1000, expectedLength: 5000 },
      ];

      for (const { wordCount, expectedLength } of testCases) {
        const result = createProcessingMetrics(wordCount, 1000);
        expect(result.sourceLength).toBe(expectedLength);
      }
    });

    test('should handle zero word count', () => {
      const result = createProcessingMetrics(0, 1500);

      expect(result.sourceLength).toBe(0);
      expect(result.parseDurationMs).toBe(1500);
      expect(result.processingErrors).toEqual([]);
    });

    test('should handle zero parse time', () => {
      const result = createProcessingMetrics(500, 0);

      expect(result.parseDurationMs).toBe(0);
      expect(result.sourceLength).toBe(2500);
    });

    test('should always return empty processing errors array', () => {
      const result1 = createProcessingMetrics(100, 1000);
      const result2 = createProcessingMetrics(200, 2000);

      expect(result1.processingErrors).toEqual([]);
      expect(result2.processingErrors).toEqual([]);
      expect(result1.processingErrors).not.toBe(result2.processingErrors); // Should be different instances
    });
  });

  describe('prepareAllMetrics', () => {
    test('should prepare all metrics combining calculated and processing metrics', () => {
      const chapters: Chapter[] = [
        {
          id: 'chapter-1',
          title: 'Chapter 1',
          level: 1,
          paragraphs: [],
          position: 0,
          wordCount: 200,
          estimatedDuration: 480,
          startPosition: 0,
          endPosition: 1000,
          startIndex: 0,
        },
        {
          id: 'chapter-2',
          title: 'Chapter 2',
          level: 1,
          paragraphs: [],
          position: 1,
          wordCount: 300,
          estimatedDuration: 720,
          startPosition: 1000,
          endPosition: 2000,
          startIndex: 0,
        },
      ];

      const stats: DocumentStatistics = {
        totalWords: 500,
        totalParagraphs: 20,
        totalSentences: 40,
        estimatedReadingTime: 8,
        chapterCount: 3,
        imageCount: 0,
        tableCount: 0,
      };

      const parseTime = 3500;

      const result = prepareAllMetrics(chapters, stats, parseTime);

      expect(result).toEqual({
        calculated: {
          totalWordCount: 500, // 200 + 300
          totalChapters: 2,
          estimatedTotalDuration: 1200, // 480 + 720
        },
        processing: {
          parseStartTime: expect.any(Date),
          parseEndTime: expect.any(Date),
          parseDurationMs: 3500,
          sourceLength: 2500, // 500 * 5
          processingErrors: [],
        },
      });
    });

    test('should work with empty chapters', () => {
      const chapters: Chapter[] = [];
      const stats: DocumentStatistics = {
        totalWords: 0,
        totalParagraphs: 0,
        totalSentences: 0,
        estimatedReadingTime: 0,
        chapterCount: 0,
        imageCount: 0,
        tableCount: 0,
      };
      const parseTime = 1000;

      const result = prepareAllMetrics(chapters, stats, parseTime);

      expect(result.calculated).toEqual({
        totalWordCount: 0,
        totalChapters: 0,
        estimatedTotalDuration: 0,
      });
      expect(result.processing.sourceLength).toBe(0);
    });

    test('should use calculated word count for processing metrics source length', () => {
      const chapters: Chapter[] = [
        {
          id: 'chapter-1',
          title: 'Chapter 1',
          level: 1,
          paragraphs: [],
          position: 0,
          wordCount: 150,
          estimatedDuration: 360,
          startPosition: 0,
          endPosition: 1000,
          startIndex: 0,
        },
      ];

      const stats: DocumentStatistics = {
        totalWords: 1000, // Different from actual chapter word count
        totalParagraphs: 10,
        totalSentences: 20,
        estimatedReadingTime: 15,
        chapterCount: 5,
        imageCount: 0,
        tableCount: 0,
      };

      const result = prepareAllMetrics(chapters, stats, 2000);

      // Should use calculated word count (150) not stats word count (1000)
      expect(result.processing.sourceLength).toBe(750); // 150 * 5
      expect(result.calculated.totalWordCount).toBe(150);
    });
  });

  describe('createPerformanceComponents', () => {
    test('should create performance components with calculated parse time', () => {
      const chapters: Chapter[] = [
        {
          id: 'chapter-1',
          title: 'Chapter 1',
          level: 1,
          paragraphs: [],
          position: 0,
          wordCount: 100,
          estimatedDuration: 240,
          startPosition: 0,
          endPosition: 1000,
          startIndex: 0,
        },
        {
          id: 'chapter-2',
          title: 'Chapter 2',
          level: 1,
          paragraphs: [],
          position: 1,
          wordCount: 200,
          estimatedDuration: 480,
          startPosition: 1000,
          endPosition: 2000,
          startIndex: 0,
        },
      ];

      const startTime = Date.now() - 5000; // 5 seconds ago
      const performanceStats: PerformanceStats = {
        totalWords: 0,
        totalParagraphs: 0,
        totalSentences: 0,
        estimatedReadingTime: 0,
        chapterCount: 0,
        imageCount: 0,
        tableCount: 0,
        parseTimeMs: 3000,
        memoryUsageMB: 1,
        throughputMBs: 1,
        chaptersPerSecond: 0,
        cacheHits: 0,
        cacheMisses: 0,
      };

      const mockUpdatedStats: PerformanceStats = {
        totalWords: 0,
        totalParagraphs: 0,
        totalSentences: 0,
        estimatedReadingTime: 0,
        chapterCount: 0,
        imageCount: 0,
        tableCount: 0,
        parseTimeMs: 3000,
        memoryUsageMB: 1,
        throughputMBs: 1,
        chaptersPerSecond: 2,
        cacheHits: 0,
        cacheMisses: 0,
      } as any;

      mockCreateUpdatedPerformanceStats.mockReturnValue(mockUpdatedStats);

      const result = createPerformanceComponents({
        chapters,
        startTime,
        performanceStats,
      });

      expect(result.parseTime).toBeGreaterThan(4000); // Should be around 5000ms
      expect(result.parseTime).toBeLessThan(6000);
      expect(result.chapterCount).toBe(2);
      expect(result.performanceStats).toBe(mockUpdatedStats);
      expect(mockCreateUpdatedPerformanceStats).toHaveBeenCalledWith(
        startTime,
        2,
        performanceStats
      );
    });

    test('should handle empty chapters array', () => {
      const chapters: Chapter[] = [];
      const startTime = Date.now() - 1000;
      const performanceStats: PerformanceStats = {
        totalWords: 0,
        totalParagraphs: 0,
        totalSentences: 0,
        estimatedReadingTime: 0,
        chapterCount: 0,
        imageCount: 0,
        tableCount: 0,
        parseTimeMs: 1000,
        memoryUsageMB: 0.5,
        throughputMBs: 1,
        chaptersPerSecond: 0,
        cacheHits: 0,
        cacheMisses: 0,
      };

      const mockUpdatedStats: PerformanceStats = {
        totalWords: 0,
        totalParagraphs: 0,
        totalSentences: 0,
        estimatedReadingTime: 0,
        chapterCount: 0,
        imageCount: 0,
        tableCount: 0,
        parseTimeMs: 1000,
        memoryUsageMB: 0.5,
        throughputMBs: 1,
        chaptersPerSecond: 0,
        cacheHits: 0,
        cacheMisses: 0,
      } as any;

      mockCreateUpdatedPerformanceStats.mockReturnValue(mockUpdatedStats);

      const result = createPerformanceComponents({
        chapters,
        startTime,
        performanceStats,
      });

      expect(result.chapterCount).toBe(0);
      expect(result.performanceStats).toBe(mockUpdatedStats);
      expect(mockCreateUpdatedPerformanceStats).toHaveBeenCalledWith(
        startTime,
        0,
        performanceStats
      );
    });

    test('should calculate accurate parse time', () => {
      const chapters: Chapter[] = [
        {
          id: 'chapter-1',
          title: 'Chapter 1',
          level: 1,
          paragraphs: [],
          position: 0,
          wordCount: 100,
          estimatedDuration: 240,
          startPosition: 0,
          endPosition: 1000,
          startIndex: 0,
        },
      ];

      const startTime = Date.now();
      const performanceStats: PerformanceStats = {
        totalWords: 0,
        totalParagraphs: 0,
        totalSentences: 0,
        estimatedReadingTime: 0,
        chapterCount: 0,
        imageCount: 0,
        tableCount: 0,
        parseTimeMs: 500,
        memoryUsageMB: 0.25,
        throughputMBs: 1,
        chaptersPerSecond: 0,
        cacheHits: 0,
        cacheMisses: 0,
      };

      mockCreateUpdatedPerformanceStats.mockReturnValue(performanceStats);

      const result = createPerformanceComponents({
        chapters,
        startTime,
        performanceStats,
      });

      // Expected parse time is calculated but not directly used in assertions
      expect(result.parseTime).toBeGreaterThanOrEqual(0);
      expect(result.parseTime).toBeLessThan(100); // Should be very small since we just called Date.now()
    });
  });

  describe('createPerformanceInfo', () => {
    test('should create performance info with calculated parse time', () => {
      const chapterCount = 3;
      const startTime = Date.now() - 3000; // 3 seconds ago
      const performanceStats: PerformanceStats = {
        totalWords: 0,
        totalParagraphs: 0,
        totalSentences: 0,
        estimatedReadingTime: 0,
        chapterCount: 0,
        imageCount: 0,
        tableCount: 0,
        parseTimeMs: 2500,
        memoryUsageMB: 2,
        throughputMBs: 1,
        chaptersPerSecond: 0,
        cacheHits: 0,
        cacheMisses: 0,
      };

      const mockUpdatedStats: PerformanceStats = {
        totalWords: 0,
        totalParagraphs: 0,
        totalSentences: 0,
        estimatedReadingTime: 0,
        chapterCount: 0,
        imageCount: 0,
        tableCount: 0,
        parseTimeMs: 2500,
        memoryUsageMB: 2,
        throughputMBs: 1,
        chaptersPerSecond: 3,
        cacheHits: 0,
        cacheMisses: 0,
      } as any;

      mockCreateUpdatedPerformanceStats.mockReturnValue(mockUpdatedStats);

      const result = createPerformanceInfo(
        chapterCount,
        startTime,
        performanceStats
      );

      expect(result.parseTime).toBeGreaterThan(2500); // Should be around 3000ms
      expect(result.parseTime).toBeLessThan(3500);
      expect(result.chapterCount).toBe(3);
      expect(result.performanceStats).toBe(mockUpdatedStats);
      expect(mockCreateUpdatedPerformanceStats).toHaveBeenCalledWith(
        startTime,
        3,
        performanceStats
      );
    });

    test('should handle zero chapter count', () => {
      const chapterCount = 0;
      const startTime = Date.now() - 500;
      const performanceStats: PerformanceStats = {
        totalWords: 0,
        totalParagraphs: 0,
        totalSentences: 0,
        estimatedReadingTime: 0,
        chapterCount: 0,
        imageCount: 0,
        tableCount: 0,
        parseTimeMs: 200,
        memoryUsageMB: 0.125,
        throughputMBs: 1,
        chaptersPerSecond: 0,
        cacheHits: 0,
        cacheMisses: 0,
      };

      const mockUpdatedStats: PerformanceStats = {
        totalWords: 0,
        totalParagraphs: 0,
        totalSentences: 0,
        estimatedReadingTime: 0,
        chapterCount: 0,
        imageCount: 0,
        tableCount: 0,
        parseTimeMs: 200,
        memoryUsageMB: 0.125,
        throughputMBs: 1,
        chaptersPerSecond: 0,
        cacheHits: 0,
        cacheMisses: 0,
      } as any;

      mockCreateUpdatedPerformanceStats.mockReturnValue(mockUpdatedStats);

      const result = createPerformanceInfo(
        chapterCount,
        startTime,
        performanceStats
      );

      expect(result.chapterCount).toBe(0);
      expect(result.performanceStats).toBe(mockUpdatedStats);
      expect(mockCreateUpdatedPerformanceStats).toHaveBeenCalledWith(
        startTime,
        0,
        performanceStats
      );
    });

    test('should handle large chapter counts', () => {
      const chapterCount = 100;
      const startTime = Date.now() - 10000; // 10 seconds ago
      const performanceStats: PerformanceStats = {
        totalWords: 0,
        totalParagraphs: 0,
        totalSentences: 0,
        estimatedReadingTime: 0,
        chapterCount: 0,
        imageCount: 0,
        tableCount: 0,
        parseTimeMs: 8000,
        memoryUsageMB: 4,
        throughputMBs: 1,
        chaptersPerSecond: 0,
        cacheHits: 0,
        cacheMisses: 0,
      };

      const mockUpdatedStats: PerformanceStats = {
        totalWords: 0,
        totalParagraphs: 0,
        totalSentences: 0,
        estimatedReadingTime: 0,
        chapterCount: 0,
        imageCount: 0,
        tableCount: 0,
        parseTimeMs: 8000,
        memoryUsageMB: 4,
        throughputMBs: 1,
        chaptersPerSecond: 100,
        cacheHits: 0,
        cacheMisses: 0,
      } as any;

      mockCreateUpdatedPerformanceStats.mockReturnValue(mockUpdatedStats);

      const result = createPerformanceInfo(
        chapterCount,
        startTime,
        performanceStats
      );

      expect(result.chapterCount).toBe(100);
      expect(result.performanceStats).toBe(mockUpdatedStats);
      expect(mockCreateUpdatedPerformanceStats).toHaveBeenCalledWith(
        startTime,
        100,
        performanceStats
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle negative word counts gracefully', () => {
      const chapters: Chapter[] = [
        {
          id: 'chapter-1',
          title: 'Chapter 1',
          level: 1,
          paragraphs: [],
          position: 0,
          wordCount: -100, // Negative word count
          estimatedDuration: 240,
          startPosition: 0,
          endPosition: 1000,
          startIndex: 0,
        },
      ];

      const stats: DocumentStatistics = {
        totalWords: 100,
        totalParagraphs: 5,
        totalSentences: 10,
        estimatedReadingTime: 2,
        chapterCount: 1,
        imageCount: 0,
        tableCount: 0,
      };

      const result = calculateDocumentMetrics(chapters, stats);

      expect(result.totalWordCount).toBe(-100); // Should not prevent negative values
      expect(result.totalChapters).toBe(1);
    });

    test('should handle negative parse times', () => {
      const result = createProcessingMetrics(100, -1000);

      expect(result.parseDurationMs).toBe(-1000);
      expect(result.sourceLength).toBe(500);
    });

    test('should handle negative chapter counts', () => {
      const result = createPerformanceInfo(-5, Date.now() - 1000, {
        totalWords: 0,
        totalParagraphs: 0,
        totalSentences: 0,
        estimatedReadingTime: 0,
        chapterCount: 0,
        imageCount: 0,
        tableCount: 0,
        parseTimeMs: 500,
        memoryUsageMB: 0.5,
        throughputMBs: 1,
        chaptersPerSecond: 0,
        cacheHits: 0,
        cacheMisses: 0,
      });

      expect(result.chapterCount).toBe(-5);
    });

    test('should handle very large numbers', () => {
      const chapters: Chapter[] = [
        {
          id: 'chapter-1',
          title: 'Chapter 1',
          level: 1,
          paragraphs: [],
          position: 0,
          wordCount: Number.MAX_SAFE_INTEGER,
          estimatedDuration: Number.MAX_SAFE_INTEGER,
          startPosition: 0,
          endPosition: Number.MAX_SAFE_INTEGER,
          startIndex: 0,
        },
      ];

      const stats: DocumentStatistics = {
        totalWords: Number.MAX_SAFE_INTEGER,
        totalParagraphs: Number.MAX_SAFE_INTEGER,
        totalSentences: Number.MAX_SAFE_INTEGER,
        estimatedReadingTime: Number.MAX_SAFE_INTEGER,
        chapterCount: 1,
        imageCount: 0,
        tableCount: 0,
      };

      const result = calculateDocumentMetrics(chapters, stats);

      expect(result.totalWordCount).toBe(Number.MAX_SAFE_INTEGER);
      expect(result.totalChapters).toBe(1);
      expect(result.estimatedTotalDuration).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  describe('Integration Tests', () => {
    test('should work end-to-end with realistic document structure', () => {
      const chapters: Chapter[] = [
        {
          id: 'chapter-1',
          title: 'Introduction',
          level: 1,
          paragraphs: [
            {
              id: 'para-1',
              type: 'text',
              sentences: [],
              position: 0,
              wordCount: 150,
              rawText: 'Introduction paragraph...',
              text: 'Introduction paragraph...',
              includeInAudio: true,
              confidence: 0.9,
            },
            {
              id: 'para-2',
              type: 'text',
              sentences: [],
              position: 1,
              wordCount: 200,
              rawText: 'Second paragraph...',
              text: 'Second paragraph...',
              includeInAudio: true,
              confidence: 0.85,
            },
          ],
          position: 0,
          wordCount: 350,
          estimatedDuration: 840,
          startPosition: 0,
          endPosition: 5000,
          startIndex: 0,
        },
        {
          id: 'chapter-2',
          title: 'Main Content',
          level: 1,
          paragraphs: [
            {
              id: 'para-3',
              type: 'text',
              sentences: [],
              position: 0,
              wordCount: 300,
              rawText: 'Main content paragraph...',
              text: 'Main content paragraph...',
              includeInAudio: true,
              confidence: 0.95,
            },
          ],
          position: 1,
          wordCount: 300,
          estimatedDuration: 720,
          startPosition: 5000,
          endPosition: 10000,
          startIndex: 0,
        },
        {
          id: 'chapter-3',
          title: 'Conclusion',
          level: 1,
          paragraphs: [
            {
              id: 'para-4',
              type: 'text',
              sentences: [],
              position: 0,
              wordCount: 100,
              rawText: 'Conclusion paragraph...',
              text: 'Conclusion paragraph...',
              includeInAudio: true,
              confidence: 0.9,
            },
          ],
          position: 2,
          wordCount: 100,
          estimatedDuration: 240,
          startPosition: 10000,
          endPosition: 12000,
          startIndex: 0,
        },
      ];

      const stats: DocumentStatistics = {
        totalWords: 750,
        totalParagraphs: 4,
        totalSentences: 12,
        estimatedReadingTime: 12,
        chapterCount: 3,
        imageCount: 0,
        tableCount: 0,
      };

      const parseTime = 4500;

      // Test all functions work together
      const documentMetrics = calculateDocumentMetrics(chapters, stats);
      const processingMetrics = createProcessingMetrics(
        documentMetrics.totalWordCount,
        parseTime
      );
      const allMetrics = prepareAllMetrics(chapters, stats, parseTime);
      const performanceComponents = createPerformanceComponents({
        chapters,
        startTime: Date.now() - parseTime,
        performanceStats: {
          totalWords: 0,
          totalParagraphs: 0,
          totalSentences: 0,
          estimatedReadingTime: 0,
          chapterCount: 0,
          imageCount: 0,
          tableCount: 0,
          parseTimeMs: parseTime,
          memoryUsageMB: 2,
          throughputMBs: 1,
          chaptersPerSecond: 0,
          cacheHits: 0,
          cacheMisses: 0,
        },
      });
      const performanceInfo = createPerformanceInfo(
        chapters.length,
        Date.now() - parseTime,
        {
          totalWords: 0,
          totalParagraphs: 0,
          totalSentences: 0,
          estimatedReadingTime: 0,
          chapterCount: 0,
          imageCount: 0,
          tableCount: 0,
          parseTimeMs: parseTime,
          memoryUsageMB: 2,
          throughputMBs: 1,
          chaptersPerSecond: 0,
          cacheHits: 0,
          cacheMisses: 0,
        }
      );

      // Verify consistency
      expect(documentMetrics.totalWordCount).toBe(750);
      expect(documentMetrics.totalChapters).toBe(3);
      expect(documentMetrics.estimatedTotalDuration).toBe(1800);

      expect(processingMetrics.sourceLength).toBe(3750); // 750 * 5
      expect(processingMetrics.parseDurationMs).toBe(4500);

      expect(allMetrics.calculated).toEqual(documentMetrics);
      expect(allMetrics.processing.sourceLength).toBe(3750);

      expect(performanceComponents.chapterCount).toBe(3);
      expect(performanceComponents.parseTime).toBeGreaterThan(4000);

      expect(performanceInfo.chapterCount).toBe(3);
      expect(performanceInfo.parseTime).toBeGreaterThan(4000);
    });

    test('should handle different performance scenarios', () => {
      const slowPerformanceStats: PerformanceStats = {
        totalWords: 0,
        totalParagraphs: 0,
        totalSentences: 0,
        estimatedReadingTime: 0,
        chapterCount: 0,
        imageCount: 0,
        tableCount: 0,
        parseTimeMs: 10000,
        memoryUsageMB: 8,
        throughputMBs: 1,
        chaptersPerSecond: 0,
        cacheHits: 0,
        cacheMisses: 0,
      };

      const fastPerformanceStats: PerformanceStats = {
        totalWords: 0,
        totalParagraphs: 0,
        totalSentences: 0,
        estimatedReadingTime: 0,
        chapterCount: 0,
        imageCount: 0,
        tableCount: 0,
        parseTimeMs: 500,
        memoryUsageMB: 0.25,
        throughputMBs: 1,
        chaptersPerSecond: 0,
        cacheHits: 0,
        cacheMisses: 0,
      };

      // Define chapters data structure for context (commented to avoid unused variable)
      /*
        {
          id: 'chapter-1',
          title: 'Test Chapter',
          level: 1,
          paragraphs: [],
          position: 0,
          wordCount: 1000,
          estimatedDuration: 2400,
          startPosition: 0,
          endPosition: 10000,
          startIndex: 0,
        }
      */ // Mock performance stats updates
      const mockSlowUpdated = {
        ...slowPerformanceStats,
        chaptersProcessed: 1,
        parseTimeMs: 10000,
      };

      const mockFastUpdated = {
        ...fastPerformanceStats,
        chaptersProcessed: 1,
        parseTimeMs: 500,
      };

      mockCreateUpdatedPerformanceStats
        .mockReturnValueOnce(mockSlowUpdated)
        .mockReturnValueOnce(mockFastUpdated);

      const slowStartTime = Date.now() - 10000;
      const fastStartTime = Date.now() - 500;

      const slowResult = createPerformanceInfo(
        1,
        slowStartTime,
        slowPerformanceStats
      );
      const fastResult = createPerformanceInfo(
        1,
        fastStartTime,
        fastPerformanceStats
      );

      expect(slowResult.performanceStats.parseTimeMs).toBe(10000);
      expect(fastResult.performanceStats.parseTimeMs).toBe(500);
    });
  });
});
