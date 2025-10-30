import { describe, test, expect, beforeEach } from 'bun:test';
import { buildCompleteStructure } from '../../../../src/core/document-processing/parsers/epub-parser-structure-builder.js';
import {
  createMockMetadata,
  createMockChapter,
  createMockOptions,
  createChapterWithNoParagraphs,
} from './helpers/epub-parser-structure-test-data';
import { createMockPerformanceStats } from './helpers/epub-parser-test-data.js';

describe('EPUB Parser Structure Builder - Complete Structure', () => {
  let mockMetadata: any;
  let mockChapters: any[];
  let mockOptions: any;
  let mockStartTime: number;

  beforeEach(() => {
    mockMetadata = createMockMetadata();
    mockChapters = [createMockChapter()];
    mockOptions = createMockOptions();
    mockStartTime = Date.now();
  });

  test('should build complete structure with all components', () => {
    const documentData = {
      metadata: mockMetadata,
      tableOfContents: [],
      chapters: mockChapters,
      embeddedAssets: {
        images: [],
        audio: [],
        video: [],
        fonts: [],
        other: [],
        styles: [],
      },
    };
    const performanceStats = createMockPerformanceStats();

    const result = buildCompleteStructure(
      documentData,
      mockOptions,
      mockStartTime,
      performanceStats
    );

    expect(result).toBeDefined();
    expect(result.documentStructure.metadata).toEqual(mockMetadata);
    expect(result.chapters).toEqual(mockChapters);
    expect(result.documentStructure.totalParagraphs).toBeGreaterThan(0);
    expect(result.documentStructure.totalSentences).toBeGreaterThan(0);
    expect(result.documentStructure.totalWordCount).toBeGreaterThan(0);
    expect(result.documentStructure.chapters).toHaveLength(1);
    expect(result.documentStructure.processingMetrics).toBeDefined();
    expect(result.documentStructure.confidence).toBeGreaterThan(0);
  });

  test('should handle empty chapters array', () => {
    const documentData = {
      metadata: mockMetadata,
      tableOfContents: [],
      chapters: [],
      embeddedAssets: {
        images: [],
        audio: [],
        video: [],
        fonts: [],
        other: [],
        styles: [],
      },
    };
    const performanceStats = createMockPerformanceStats();

    const result = buildCompleteStructure(
      documentData,
      mockOptions,
      mockStartTime,
      performanceStats
    );

    expect(result.documentStructure.metadata).toEqual(mockMetadata);
    expect(result.chapters).toEqual([]);
    expect(result.documentStructure.totalParagraphs).toBe(0);
    expect(result.documentStructure.totalSentences).toBe(0);
    expect(result.documentStructure.totalWordCount).toBe(0);
    expect(result.documentStructure.chapters).toHaveLength(0);
  });

  test('should handle chapters with no paragraphs', () => {
    const emptyChapters = [createChapterWithNoParagraphs()];
    const documentData = {
      metadata: mockMetadata,
      chapters: emptyChapters,
      tableOfContents: [],
      embeddedAssets: {
        images: [],
        styles: [],
        fonts: [],
        audio: [],
        video: [],
        other: [],
      },
    };
    const performanceStats = createMockPerformanceStats();

    const result = buildCompleteStructure(
      documentData,
      mockOptions,
      mockStartTime,
      performanceStats
    );

    expect(result.chapters).toHaveLength(1);
    expect(result.documentStructure.totalParagraphs).toBe(0);
    expect(result.documentStructure.totalSentences).toBe(0);
    expect(result.documentStructure.totalWordCount).toBe(0);
    expect(result.documentStructure.chapters).toHaveLength(1);
  });

  test('should handle different options', () => {
    const ttsOptions = createMockOptions({ extractMedia: true });
    const strictOptions = createMockOptions({ verbose: true });
    const documentData = {
      metadata: mockMetadata,
      tableOfContents: [],
      chapters: mockChapters,
      embeddedAssets: {
        images: [],
        audio: [],
        video: [],
        fonts: [],
        other: [],
        styles: [],
      },
    };
    const performanceStats = createMockPerformanceStats();

    const ttsResult = buildCompleteStructure(
      documentData,
      ttsOptions,
      mockStartTime,
      performanceStats
    );

    const strictResult = buildCompleteStructure(
      documentData,
      strictOptions,
      mockStartTime,
      performanceStats
    );

    expect(ttsResult).toBeDefined();
    expect(strictResult).toBeDefined();
    expect(ttsResult.documentStructure.metadata).toEqual(mockMetadata);
    expect(strictResult.documentStructure.metadata).toEqual(mockMetadata);
  });

  test('should calculate correct processing metrics', () => {
    const startTime = Date.now();
    const documentData = {
      metadata: mockMetadata,
      tableOfContents: [],
      chapters: mockChapters,
      embeddedAssets: {
        images: [],
        audio: [],
        video: [],
        fonts: [],
        other: [],
        styles: [],
      },
    };
    const performanceStats = createMockPerformanceStats();

    const result = buildCompleteStructure(
      documentData,
      mockOptions,
      startTime,
      performanceStats
    );

    expect(result.documentStructure.processingMetrics).toBeDefined();
    expect(
      result.documentStructure.processingMetrics.parseStartTime
    ).toBeInstanceOf(Date);
    expect(
      result.documentStructure.processingMetrics.parseEndTime
    ).toBeInstanceOf(Date);
    expect(
      result.documentStructure.processingMetrics.parseDurationMs
    ).toBeGreaterThanOrEqual(0);
  });

  test('should handle single chapter', () => {
    const singleChapter = [
      createMockChapter({
        id: 'single-chapter',
        title: 'Single Chapter',
        wordCount: 1000,
      }),
    ];
    const documentData = {
      metadata: mockMetadata,
      chapters: singleChapter,
      tableOfContents: [],
      embeddedAssets: {
        images: [],
        styles: [],
        fonts: [],
        audio: [],
        video: [],
        other: [],
      },
    };
    const performanceStats = createMockPerformanceStats();

    const result = buildCompleteStructure(
      documentData,
      mockOptions,
      mockStartTime,
      performanceStats
    );

    expect(result.chapters).toHaveLength(1);
    expect(result.documentStructure.chapters).toHaveLength(1);
    expect(result.documentStructure.totalWordCount).toBe(1000);
    expect(result.documentStructure.metadata.title).toBe('Test Book');
  });
});
