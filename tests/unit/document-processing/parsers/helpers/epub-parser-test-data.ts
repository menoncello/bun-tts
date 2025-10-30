import type {
  DocumentMetadata,
  TableOfContentsItem,
  Chapter,
  EmbeddedAssets,
  PerformanceStats,
} from '../../../../../src/core/document-processing/types.js';

export const createMockMetadata = (
  overrides: Partial<DocumentMetadata> = {}
): DocumentMetadata => ({
  title: 'Test Book',
  author: 'Test Author',
  language: 'en',
  wordCount: 1000,
  customMetadata: { genre: 'fiction' },
  ...overrides,
});

export const createMockChapter = (
  overrides: Partial<Chapter> = {}
): Chapter => ({
  id: 'chapter1',
  title: 'Chapter 1',
  level: 1,
  paragraphs: [],
  position: 0,
  wordCount: 500,
  estimatedDuration: 250,
  startPosition: 0,
  endPosition: 500,
  startIndex: 0,
  ...overrides,
});

export const createMockTableOfContentsItem = (
  overrides: Partial<TableOfContentsItem> = {}
): TableOfContentsItem => ({
  id: 'chapter1',
  title: 'Chapter 1',
  href: 'chapter1',
  level: 1,
  children: [],
  ...overrides,
});

export const createMockEmbeddedAssets = (
  overrides: Partial<EmbeddedAssets> = {}
): EmbeddedAssets => ({
  images: [
    {
      id: 'cover.jpg',
      href: 'cover.jpg',
      mediaType: 'image/jpeg',
      size: 50000,
    },
  ],
  styles: [],
  fonts: [],
  other: [],
  audio: [],
  video: [],
  ...overrides,
});

export const createMockPerformanceStats = (
  overrides: Partial<PerformanceStats> = {}
): PerformanceStats => ({
  // Document content statistics
  totalParagraphs: 10,
  totalSentences: 20,
  totalWords: 500,
  estimatedReadingTime: 3,
  chapterCount: 1,
  imageCount: 0,
  tableCount: 0,
  // Performance metrics
  parseTimeMs: 100,
  memoryUsageMB: 20,
  throughputMBs: 1.5,
  chaptersPerSecond: 10,
  cacheHits: 5,
  cacheMisses: 1,
  ...overrides,
});

export const createEmptyMockMetadata = (): DocumentMetadata => ({
  title: '',
  wordCount: 0,
  customMetadata: {},
});

export const createEmptyMockEmbeddedAssets = (): EmbeddedAssets => ({
  images: [],
  styles: [],
  fonts: [],
  other: [],
  audio: [],
  video: [],
});

export const createEmptyMockPerformanceStats = (): PerformanceStats => ({
  // Document content statistics
  totalParagraphs: 0,
  totalSentences: 0,
  totalWords: 0,
  estimatedReadingTime: 0,
  chapterCount: 0,
  imageCount: 0,
  tableCount: 0,
  // Performance metrics
  parseTimeMs: 0,
  memoryUsageMB: 0,
  throughputMBs: 0,
  chaptersPerSecond: 0,
  cacheHits: 0,
  cacheMisses: 0,
});
