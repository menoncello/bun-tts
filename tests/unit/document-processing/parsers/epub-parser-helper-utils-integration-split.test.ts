import { describe, test, expect } from 'bun:test';
import {
  createCompatibilityConfig,
  createParseResult,
  createLibraryInfo,
  createBaseStructure,
  createStatsStructure,
  createMetaStructure,
} from '../../../../src/core/document-processing/parsers/epub-parser-helper-utils.js';
import {
  createMockMetadata,
  createMockChapter,
  createMockEmbeddedAssets,
  createMockPerformanceStats,
} from './helpers/epub-parser-test-data';

// Helper functions for creating test data
function createTestMetadata() {
  return createMockMetadata({
    title: 'Complete Test Book',
    version: '2.0',
    wordCount: 1500,
    customMetadata: { genre: 'technical' },
  });
}

function createTestChapters() {
  return [
    createMockChapter({
      id: 'chapter1',
      title: 'Introduction',
      wordCount: 500,
      estimatedDuration: 250,
    }),
    createMockChapter({
      id: 'chapter2',
      title: 'Main Content',
      position: 1,
      wordCount: 1000,
      estimatedDuration: 500,
      startPosition: 500,
      endPosition: 1500,
      startIndex: 500,
    }),
  ];
}

function createTestAssets() {
  return createMockEmbeddedAssets({
    styles: [
      {
        id: 'main.css',
        href: 'main.css',
        mediaType: 'text/css',
        size: 1024,
      },
    ],
  });
}

function createTestStats() {
  return createMockPerformanceStats({
    totalParagraphs: 25,
    totalSentences: 50,
    totalWords: 1500,
    estimatedReadingTime: 8,
    chapterCount: 2,
    imageCount: 1,
  });
}

function createTestOptions() {
  return {
    strictMode: false,
    config: { setting: 'value' },
  };
}

function createDocumentInfo(metadata: any, assets: any) {
  return {
    metadata,
    tableOfContents: [],
    embeddedAssets: assets,
  };
}

function createContentInfo(chapters: any[], stats: any, metadata: any) {
  return {
    chapters,
    stats,
    documentStructure: {
      metadata,
      chapters,
      tableOfContents: [],
      totalParagraphs: 25,
      totalSentences: 50,
      totalWordCount: 1500,
      totalChapters: chapters.length,
      estimatedTotalDuration: 750,
      confidence: 0.9,
      processingMetrics: {
        parseStartTime: new Date(),
        parseEndTime: new Date(),
        parseDurationMs: 1000,
        sourceLength: 5000,
        processingErrors: [],
      },
    },
  };
}

describe('EPUB Parser Helper Utilities - Configuration and Library Info', () => {
  test('should create compatibility config correctly', () => {
    const options = createTestOptions();
    const config = createCompatibilityConfig(options);

    expect(config.strictMode).toBe(false);
    expect(config.enableFallbacks).toBe(true);
    expect(config.logCompatibilityWarnings).toBe(true);
  });

  test('should create library info correctly', () => {
    const libraryInfo = createLibraryInfo();

    expect(libraryInfo.name).toBe('@smoores/epub');
    expect(libraryInfo.version).toBeDefined();
  });
});

describe('EPUB Parser Helper Utilities - Parse Result Creation', () => {
  test('should create parse result with correct structure', () => {
    const metadata = createTestMetadata();
    const chapters = createTestChapters();
    const assets = createTestAssets();
    const stats = createTestStats();

    const documentInfo = createDocumentInfo(metadata, assets);
    const contentInfo = createContentInfo(chapters, stats, metadata);
    const parseResult = createParseResult(documentInfo, contentInfo);

    expect(parseResult.metadata.title).toBeDefined();
    expect(parseResult.chapters).toHaveLength(2);
    expect(parseResult.embeddedAssets.images).toHaveLength(1);
    expect(parseResult.stats.totalWords).toBe(1500);
  });

  test('should create base structure correctly', () => {
    const metadata = createTestMetadata();
    const chapters = createTestChapters();
    const assets = createTestAssets();
    const stats = createTestStats();

    const documentInfo = createDocumentInfo(metadata, assets);
    const contentInfo = createContentInfo(chapters, stats, metadata);
    const parseResult = createParseResult(documentInfo, contentInfo);

    const baseStructure = createBaseStructure(
      parseResult.metadata,
      parseResult.chapters,
      parseResult.tableOfContents,
      parseResult.embeddedAssets
    );

    expect(baseStructure.chapters).toHaveLength(2);
    expect(baseStructure.metadata.title).toBe('Complete Test Book');
    expect(baseStructure.embeddedAssets.styles).toHaveLength(1);
  });
});

describe('EPUB Parser Helper Utilities - Stats and Meta Structure Creation', () => {
  test('should create stats structure correctly', () => {
    const stats = createTestStats();
    const statsStructure = createStatsStructure(stats);

    expect(statsStructure.totalWords).toBe(1500);
    expect(statsStructure.totalParagraphs).toBe(25);
    expect(statsStructure.totalSentences).toBe(50);
    expect(statsStructure.estimatedReadingTime).toBe(8);
    // chapterCount is not included in the returned stats structure
  });

  test('should create meta structure correctly', () => {
    const metadata = createTestMetadata();
    const options = createTestOptions();
    const metaStructure = createMetaStructure(metadata, options);

    expect(metaStructure.version).toBe('2.0');
    expect(metaStructure.configApplied.setting).toBe('value');
  });
});
