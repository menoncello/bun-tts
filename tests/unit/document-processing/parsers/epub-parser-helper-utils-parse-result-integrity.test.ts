import { describe, test, expect } from 'bun:test';
import { createParseResult } from '../../../../src/core/document-processing/parsers/epub-parser-helper-utils.js';
import {
  createMockMetadata,
  createMockChapter,
  createMockTableOfContentsItem,
  createMockEmbeddedAssets,
  createMockPerformanceStats,
} from './helpers/epub-parser-test-data';

describe('EPUB Parser Helper Utilities - Parse Result Data Integrity', () => {
  describe('data structure integrity', () => {
    test('should maintain processing metrics structure', () => {
      const documentInfo = {
        metadata: createMockMetadata(),
        tableOfContents: [createMockTableOfContentsItem()],
        embeddedAssets: createMockEmbeddedAssets(),
      };

      const contentInfo = {
        chapters: [createMockChapter()],
        stats: createMockPerformanceStats(),
        documentStructure: {
          metadata: documentInfo.metadata,
          chapters: [createMockChapter()],
          tableOfContents: documentInfo.tableOfContents,
          totalParagraphs: 10,
          totalSentences: 20,
          totalWordCount: 500,
          totalChapters: 1,
          estimatedTotalDuration: 250,
          confidence: 0.9,
          processingMetrics: {
            parseStartTime: new Date('2023-01-01'),
            parseEndTime: new Date('2023-01-01'),
            parseDurationMs: 1000,
            sourceLength: 5000,
            processingErrors: [],
          },
        },
      };

      const result = createParseResult(documentInfo, contentInfo);

      expect(result.documentStructure.processingMetrics).toBeDefined();
      expect(result.documentStructure.processingMetrics.parseDurationMs).toBe(
        1000
      );
      expect(result.documentStructure.processingMetrics.sourceLength).toBe(
        5000
      );
      expect(
        result.documentStructure.processingMetrics.processingErrors
      ).toEqual([]);
    });

    test('should maintain statistics structure', () => {
      const documentInfo = {
        metadata: createMockMetadata(),
        tableOfContents: [createMockTableOfContentsItem()],
        embeddedAssets: createMockEmbeddedAssets(),
      };

      const contentInfo = {
        chapters: [createMockChapter()],
        stats: createMockPerformanceStats(),
        documentStructure: {
          metadata: documentInfo.metadata,
          chapters: [createMockChapter()],
          tableOfContents: documentInfo.tableOfContents,
          totalParagraphs: 10,
          totalSentences: 20,
          totalWordCount: 500,
          totalChapters: 1,
          estimatedTotalDuration: 250,
          confidence: 0.9,
          processingMetrics: {
            parseStartTime: new Date('2023-01-01'),
            parseEndTime: new Date('2023-01-01'),
            parseDurationMs: 1000,
            sourceLength: 5000,
            processingErrors: [],
          },
        },
      };

      const result = createParseResult(documentInfo, contentInfo);

      expect(result.stats).toBeDefined();
      expect(result.stats.totalWords).toBe(500);
      expect(result.stats.totalParagraphs).toBe(10);
      expect(result.stats.totalSentences).toBe(20);
    });
  });
});
