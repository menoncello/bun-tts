import { describe, test, expect, beforeEach } from 'bun:test';
import {
  buildDocumentStructure,
  createBaseDocumentStructure,
} from '../../../../src/core/document-processing/parsers/epub-parser-structure-builder.js';
import {
  createMockMetadata,
  createMockChapter,
  createMockOptions,
} from './helpers/epub-parser-structure-test-data';

describe('EPUB Parser Structure Builder - Document Structure', () => {
  let mockMetadata: any;
  let mockChapters: any[];
  let mockOptions: any;

  beforeEach(() => {
    mockMetadata = createMockMetadata();
    mockChapters = [createMockChapter()];
    mockOptions = createMockOptions();
  });

  test('should build document structure with correct properties', () => {
    const result = buildDocumentStructure({
      metadata: mockMetadata,
      chapters: mockChapters,
      tableOfContents: [],
      embeddedAssets: {
        images: [],
        styles: [],
        fonts: [],
        audio: [],
        video: [],
        other: [],
      },
      stats: {
        totalParagraphs: 0,
        totalSentences: 0,
        totalWords: 0,
        estimatedReadingTime: 0,
        chapterCount: 0,
        imageCount: 0,
        tableCount: 0,
      },
      options: mockOptions,
      startTime: Date.now(),
      performanceStats: {
        totalParagraphs: 0,
        totalSentences: 0,
        totalWords: 0,
        estimatedReadingTime: 0,
        chapterCount: 0,
        imageCount: 0,
        tableCount: 0,
        parseTimeMs: 0,
        memoryUsageMB: 0,
        throughputMBs: 0,
        chaptersPerSecond: 0,
        cacheHits: 0,
        cacheMisses: 0,
      },
    });

    expect(result).toBeDefined();
    expect(result.metadata).toEqual(mockMetadata);
    expect(result.chapters).toEqual(mockChapters);
    expect(result.tableOfContents).toBeDefined();
    expect(typeof result.totalParagraphs).toBe('number');
    expect(typeof result.totalSentences).toBe('number');
    expect(typeof result.totalWordCount).toBe('number');
    expect(typeof result.totalChapters).toBe('number');
    expect(typeof result.estimatedTotalDuration).toBe('number');
    expect(typeof result.confidence).toBe('number');
    expect(result.processingMetrics).toBeDefined();
  });

  test('should create base document structure correctly', () => {
    const result = createBaseDocumentStructure(mockMetadata, mockChapters, [], {
      images: [],
      styles: [],
      fonts: [],
      audio: [],
      video: [],
      other: [],
    });

    expect(result.metadata).toEqual(mockMetadata);
    expect(result.chapters).toEqual(mockChapters);
    expect(result.tableOfContents).toEqual([]);
    expect(result.embeddedAssets).toBeDefined();
  });

  test('should handle empty chapters in document structure', () => {
    const result = buildDocumentStructure({
      metadata: mockMetadata,
      chapters: [],
      tableOfContents: [],
      embeddedAssets: {
        images: [],
        styles: [],
        fonts: [],
        audio: [],
        video: [],
        other: [],
      },
      stats: {
        totalParagraphs: 0,
        totalSentences: 0,
        totalWords: 0,
        estimatedReadingTime: 0,
        chapterCount: 0,
        imageCount: 0,
        tableCount: 0,
      },
      options: mockOptions,
      startTime: Date.now(),
      performanceStats: {
        totalParagraphs: 0,
        totalSentences: 0,
        totalWords: 0,
        estimatedReadingTime: 0,
        chapterCount: 0,
        imageCount: 0,
        tableCount: 0,
        parseTimeMs: 0,
        memoryUsageMB: 0,
        throughputMBs: 0,
        chaptersPerSecond: 0,
        cacheHits: 0,
        cacheMisses: 0,
      },
    });

    expect(result.chapters).toEqual([]);
    expect(result.totalChapters).toBe(0);
    expect(result.totalParagraphs).toBe(0);
    expect(result.totalSentences).toBe(0);
    expect(result.totalWordCount).toBe(0);
    expect(result.estimatedTotalDuration).toBe(0);
  });

  test('should calculate correct word counts across chapters', () => {
    const chapters = [
      createMockChapter({ id: 'chapter-1', wordCount: 500 }),
      createMockChapter({
        id: 'chapter-2',
        position: 1,
        wordCount: 300,
        estimatedDuration: 75,
      }),
      createMockChapter({
        id: 'chapter-3',
        position: 2,
        wordCount: 200,
        estimatedDuration: 50,
      }),
    ];

    const result = buildDocumentStructure({
      metadata: mockMetadata,
      chapters: chapters,
      tableOfContents: [],
      embeddedAssets: {
        images: [],
        styles: [],
        fonts: [],
        audio: [],
        video: [],
        other: [],
      },
      stats: {
        totalParagraphs: 0,
        totalSentences: 0,
        totalWords: 0,
        estimatedReadingTime: 0,
        chapterCount: 0,
        imageCount: 0,
        tableCount: 0,
      },
      options: mockOptions,
      startTime: Date.now(),
      performanceStats: {
        totalParagraphs: 0,
        totalSentences: 0,
        totalWords: 0,
        estimatedReadingTime: 0,
        chapterCount: 0,
        imageCount: 0,
        tableCount: 0,
        parseTimeMs: 0,
        memoryUsageMB: 0,
        throughputMBs: 0,
        chaptersPerSecond: 0,
        cacheHits: 0,
        cacheMisses: 0,
      },
    });

    expect(result.totalWordCount).toBe(1000);
    expect(result.totalChapters).toBe(3);
    expect(result.estimatedTotalDuration).toBe(250); // Sum of all chapters (125 + 75 + 50)
  });

  test('should handle chapters with different confidence levels', () => {
    const highQualityChapter = createMockChapter({
      id: 'high-quality',
      wordCount: 1000,
    });

    const lowQualityChapter = createMockChapter({
      id: 'low-quality',
      position: 1,
      wordCount: 100,
      paragraphs: [], // No paragraphs = lower confidence
    });

    const result = buildDocumentStructure({
      metadata: mockMetadata,
      chapters: [highQualityChapter, lowQualityChapter],
      tableOfContents: [],
      embeddedAssets: {
        images: [],
        styles: [],
        fonts: [],
        audio: [],
        video: [],
        other: [],
      },
      stats: {
        totalParagraphs: 0,
        totalSentences: 0,
        totalWords: 0,
        estimatedReadingTime: 0,
        chapterCount: 0,
        imageCount: 0,
        tableCount: 0,
      },
      options: mockOptions,
      startTime: Date.now(),
      performanceStats: {
        totalParagraphs: 0,
        totalSentences: 0,
        totalWords: 0,
        estimatedReadingTime: 0,
        chapterCount: 0,
        imageCount: 0,
        tableCount: 0,
        parseTimeMs: 0,
        memoryUsageMB: 0,
        throughputMBs: 0,
        chaptersPerSecond: 0,
        cacheHits: 0,
        cacheMisses: 0,
      },
    });

    expect(result.totalChapters).toBe(2);
    expect(result.totalWordCount).toBe(1100);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  test('should include processing metrics in document structure', () => {
    const result = buildDocumentStructure({
      metadata: mockMetadata,
      chapters: mockChapters,
      tableOfContents: [],
      embeddedAssets: {
        images: [],
        styles: [],
        fonts: [],
        audio: [],
        video: [],
        other: [],
      },
      stats: {
        totalParagraphs: 0,
        totalSentences: 0,
        totalWords: 0,
        estimatedReadingTime: 0,
        chapterCount: 0,
        imageCount: 0,
        tableCount: 0,
      },
      options: mockOptions,
      startTime: Date.now(),
      performanceStats: {
        totalParagraphs: 0,
        totalSentences: 0,
        totalWords: 0,
        estimatedReadingTime: 0,
        chapterCount: 0,
        imageCount: 0,
        tableCount: 0,
        parseTimeMs: 0,
        memoryUsageMB: 0,
        throughputMBs: 0,
        chaptersPerSecond: 0,
        cacheHits: 0,
        cacheMisses: 0,
      },
    });

    expect(result.processingMetrics).toBeDefined();
    expect(result.processingMetrics.parseStartTime).toBeInstanceOf(Date);
    expect(result.processingMetrics.parseEndTime).toBeInstanceOf(Date);
    expect(typeof result.processingMetrics.parseDurationMs).toBe('number');
    expect(typeof result.processingMetrics.sourceLength).toBe('number');
    expect(Array.isArray(result.processingMetrics.processingErrors)).toBe(true);
  });
});
