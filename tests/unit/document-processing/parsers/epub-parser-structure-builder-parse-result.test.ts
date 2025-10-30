import { describe, test, expect } from 'bun:test';
import { createParseResultData } from '../../../../src/core/document-processing/parsers/epub-parser-structure-builder.js';
import {
  createMockMetadata,
  createMockChapter,
  createMockPerformanceStats,
} from './helpers/epub-parser-structure-test-data';

describe('EPUB Parser Structure Builder - Parse Result Data', () => {
  describe('Basic Document Info Merging', () => {
    test('should merge document info and content info correctly', () => {
      const documentInfo = createBasicDocumentInfo();
      const contentInfo = createBasicContentInfo();

      const result = createParseResultData(documentInfo, contentInfo);

      expect(result).toEqual({
        ...documentInfo,
        ...contentInfo,
      });

      expect(result.metadata.title).toBe('Test Book');
      expect(result.chapters).toHaveLength(1);
      expect(result.tableOfContents).toHaveLength(1);
      expect(result.stats.totalWords).toBe(500);
      expect(result.documentStructure).toBeDefined();
      expect(result.documentStructure.metadata).toEqual(documentInfo.metadata);
    });
  });

  describe('Minimal Document Info Handling', () => {
    test('should handle minimal document info', () => {
      const minimalDocumentInfo = createMinimalDocumentInfo();
      const minimalContentInfo = createMinimalContentInfo();

      const result = createParseResultData(
        minimalDocumentInfo,
        minimalContentInfo
      );

      expect(result.chapters).toHaveLength(0);
      expect(result.tableOfContents).toHaveLength(0);
      expect(result.stats.totalWords).toBe(0);
      expect(result.documentStructure.totalChapters).toBe(0);
      expect(result.metadata.title).toBe('Minimal Book');
    });
  });

  describe('Complex Document Structure Handling', () => {
    test('should handle complex document structure', () => {
      const complexDocumentInfo = createComplexDocumentInfo();
      const complexContentInfo = createComplexContentInfo();

      const result = createParseResultData(
        complexDocumentInfo,
        complexContentInfo
      );

      expect(result.metadata.title).toBe('Complex Book');
      expect(result.metadata.customMetadata.subjects).toHaveLength(3);
      expect(result.metadata.customMetadata.creators).toHaveLength(2);
      expect(result.chapters).toHaveLength(2);
      expect(result.tableOfContents).toHaveLength(2);
      expect(result.tableOfContents[0]?.children).toHaveLength(1);
      expect(result.embeddedAssets.images).toHaveLength(1);
      expect(result.embeddedAssets.styles).toHaveLength(1);
      expect(result.stats.totalWords).toBe(1000);
      expect(result.documentStructure.totalChapters).toBe(2);
      expect(result.documentStructure.confidence).toBe(0.95);
    });
  });
});

// Helper functions to create test data
function createBasicDocumentInfo() {
  return {
    metadata: createMockMetadata(),
    tableOfContents: [
      {
        id: 'chapter-1',
        title: 'Chapter 1',
        href: 'chapter-1.xhtml',
        level: 1,
        children: [],
      },
    ],
    embeddedAssets: {
      images: [],
      styles: [],
      fonts: [],
      other: [],
      audio: [],
      video: [],
    },
  };
}

function createBasicContentInfo() {
  return {
    chapters: [createMockChapter()],
    stats: createMockPerformanceStats(),
    documentStructure: {
      metadata: createMockMetadata(),
      chapters: [createMockChapter()],
      tableOfContents: [
        {
          id: 'chapter-1',
          title: 'Chapter 1',
          href: 'chapter-1.xhtml',
          level: 1,
          children: [],
        },
      ],
      totalParagraphs: 5,
      totalSentences: 10,
      totalWordCount: 500,
      totalChapters: 1,
      estimatedTotalDuration: 125,
      confidence: 0.9,
      processingMetrics: {
        parseStartTime: new Date('2023-01-01T10:00:00Z'),
        parseEndTime: new Date('2023-01-01T10:01:00Z'),
        parseDurationMs: 60000,
        sourceLength: 10000,
        processingErrors: [],
      },
    },
  };
}

function createMinimalDocumentInfo() {
  return {
    metadata: {
      title: 'Minimal Book',
      wordCount: 0,
      customMetadata: {},
    },
    tableOfContents: [],
    embeddedAssets: {
      images: [],
      styles: [],
      fonts: [],
      other: [],
      audio: [],
      video: [],
    },
  };
}

function createMinimalContentInfo() {
  return {
    chapters: [],
    stats: {
      totalParagraphs: 0,
      totalSentences: 0,
      totalWords: 0,
      estimatedReadingTime: 0,
      chapterCount: 0,
      imageCount: 0,
      tableCount: 0,
    },
    documentStructure: {
      metadata: {
        title: 'Minimal Book',
        wordCount: 0,
        customMetadata: {},
      },
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
}

function createComplexDocumentInfo() {
  return {
    metadata: createMockMetadata({
      title: 'Complex Book',
      customMetadata: {
        ...createMockMetadata().customMetadata,
        subjects: ['Fiction', 'Science', 'Philosophy'],
        creators: ['Author One', 'Author Two'],
        contributors: ['Contributor One', 'Contributor Two'],
      },
    }),
    tableOfContents: [
      {
        id: 'chapter-1',
        title: 'Chapter 1',
        href: 'chapter-1.xhtml',
        level: 1,
        children: [
          {
            id: 'section-1-1',
            title: 'Section 1.1',
            href: 'chapter-1.xhtml#section-1-1',
            level: 2,
            children: [],
          },
        ],
      },
      {
        id: 'chapter-2',
        title: 'Chapter 2',
        href: 'chapter-2.xhtml',
        level: 1,
        children: [],
      },
    ],
    embeddedAssets: {
      images: [
        {
          id: 'cover.jpg',
          href: 'cover.jpg',
          mediaType: 'image/jpeg',
          size: 50000,
        },
      ],
      styles: [
        {
          id: 'styles.css',
          href: 'styles.css',
          mediaType: 'text/css',
          size: 10000,
        },
      ],
      fonts: [],
      other: [],
      audio: [],
      video: [],
    },
  };
}

function createComplexContentInfo() {
  const complexDocumentInfo = createComplexDocumentInfo();

  return {
    chapters: [
      createMockChapter({ id: 'chapter-1' }),
      createMockChapter({ id: 'chapter-2', position: 1 }),
    ],
    stats: createMockPerformanceStats({
      totalWords: 1000,
      chapterCount: 2,
    }),
    documentStructure: {
      metadata: complexDocumentInfo.metadata,
      chapters: [
        createMockChapter({ id: 'chapter-1' }),
        createMockChapter({ id: 'chapter-2', position: 1 }),
      ],
      tableOfContents: complexDocumentInfo.tableOfContents,
      totalParagraphs: 20,
      totalSentences: 40,
      totalWordCount: 1000,
      totalChapters: 2,
      estimatedTotalDuration: 250,
      confidence: 0.95,
      processingMetrics: {
        parseStartTime: new Date('2023-01-01T10:00:00Z'),
        parseEndTime: new Date('2023-01-01T10:02:00Z'),
        parseDurationMs: 120000,
        sourceLength: 25000,
        processingErrors: [],
      },
    },
  };
}
