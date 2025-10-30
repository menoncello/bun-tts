import { describe, test, expect } from 'bun:test';
import { createParseResult } from '../../../../src/core/document-processing/parsers/epub-parser-helper-utils.js';
import {
  createEmptyMockMetadata,
  createEmptyMockEmbeddedAssets,
  createEmptyMockPerformanceStats,
} from './helpers/epub-parser-test-data';

describe('EPUB Parser Helper Utilities - Parse Result Empty Data', () => {
  describe('empty data handling', () => {
    test('should handle empty document and content info', () => {
      const documentInfo = {
        metadata: createEmptyMockMetadata(),
        tableOfContents: [],
        embeddedAssets: createEmptyMockEmbeddedAssets(),
      };

      const contentInfo = {
        chapters: [],
        stats: createEmptyMockPerformanceStats(),
        documentStructure: {
          metadata: documentInfo.metadata,
          chapters: [],
          tableOfContents: [],
          totalParagraphs: 0,
          totalSentences: 0,
          totalWordCount: 0,
          totalChapters: 0,
          estimatedTotalDuration: 0,
          confidence: 0.5,
          processingMetrics: {
            parseStartTime: new Date(),
            parseEndTime: new Date(),
            parseDurationMs: 0,
            sourceLength: 0,
            processingErrors: [],
          },
        },
      };

      const result = createParseResult(documentInfo, contentInfo);

      expect(result.chapters).toHaveLength(0);
      expect(result.tableOfContents).toHaveLength(0);
      expect(result.stats.totalWords).toBe(0);
      expect(result.documentStructure.chapters).toHaveLength(0);
    });

    test('should handle empty document info components', () => {
      const documentInfo = {
        metadata: createEmptyMockMetadata(),
        tableOfContents: [],
        embeddedAssets: createEmptyMockEmbeddedAssets(),
      };

      const contentInfo = {
        chapters: [],
        stats: createEmptyMockPerformanceStats(),
        documentStructure: {
          metadata: documentInfo.metadata,
          chapters: [],
          tableOfContents: [],
          totalParagraphs: 0,
          totalSentences: 0,
          totalWordCount: 0,
          totalChapters: 0,
          estimatedTotalDuration: 0,
          confidence: 0.5,
          processingMetrics: {
            parseStartTime: new Date(),
            parseEndTime: new Date(),
            parseDurationMs: 0,
            sourceLength: 0,
            processingErrors: [],
          },
        },
      };

      const result = createParseResult(documentInfo, contentInfo);

      expect(result.tableOfContents).toHaveLength(0);
      expect(result.embeddedAssets.images).toHaveLength(0);
      expect(result.embeddedAssets.styles).toHaveLength(0);
    });

    test('should handle empty content info components', () => {
      const documentInfo = {
        metadata: createEmptyMockMetadata(),
        tableOfContents: [],
        embeddedAssets: createEmptyMockEmbeddedAssets(),
      };

      const contentInfo = {
        chapters: [],
        stats: createEmptyMockPerformanceStats(),
        documentStructure: {
          metadata: documentInfo.metadata,
          chapters: [],
          tableOfContents: [],
          totalParagraphs: 0,
          totalSentences: 0,
          totalWordCount: 0,
          totalChapters: 0,
          estimatedTotalDuration: 0,
          confidence: 0.5,
          processingMetrics: {
            parseStartTime: new Date(),
            parseEndTime: new Date(),
            parseDurationMs: 0,
            sourceLength: 0,
            processingErrors: [],
          },
        },
      };

      const result = createParseResult(documentInfo, contentInfo);

      expect(result.chapters).toHaveLength(0);
      expect(result.stats.totalWords).toBe(0);
      expect(result.stats.totalParagraphs).toBe(0);
      expect(result.stats.totalSentences).toBe(0);
    });
  });
});
