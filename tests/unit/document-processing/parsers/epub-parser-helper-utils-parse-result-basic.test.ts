import { describe, test, expect } from 'bun:test';
import { createParseResult } from '../../../../src/core/document-processing/parsers/epub-parser-helper-utils.js';
import {
  createMockMetadata,
  createMockChapter,
  createMockTableOfContentsItem,
  createMockEmbeddedAssets,
  createMockPerformanceStats,
} from './helpers/epub-parser-test-data';

describe('EPUB Parser Helper Utilities - Parse Result Basic', () => {
  describe('basic merge functionality', () => {
    test('should merge document and content information correctly', () => {
      const chapters = [createMockChapter()];

      const documentInfo = {
        metadata: createMockMetadata(),
        tableOfContents: [createMockTableOfContentsItem()],
        embeddedAssets: createMockEmbeddedAssets(),
      };

      const contentInfo = {
        chapters,
        stats: createMockPerformanceStats(),
        documentStructure: {
          metadata: documentInfo.metadata,
          chapters,
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

      expect(result).toEqual({
        ...documentInfo,
        ...contentInfo,
      });
    });

    test('should preserve document structure integrity', () => {
      const chapters = [createMockChapter()];

      const documentInfo = {
        metadata: createMockMetadata(),
        tableOfContents: [createMockTableOfContentsItem()],
        embeddedAssets: createMockEmbeddedAssets(),
      };

      const contentInfo = {
        chapters,
        stats: createMockPerformanceStats(),
        documentStructure: {
          metadata: documentInfo.metadata,
          chapters,
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

      expect(result.metadata.title).toBe('Test Book');
      expect(result.chapters).toHaveLength(1);
      expect(result.tableOfContents).toHaveLength(1);
      expect(result.embeddedAssets).toBeDefined();
      expect(result.stats.totalWords).toBe(500);
      expect(result.documentStructure).toBeDefined();
    });
  });
});
