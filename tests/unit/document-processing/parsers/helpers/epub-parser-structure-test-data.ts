import type { EPUBParseOptions } from '../../../../../src/core/document-processing/parsers/epub-parser-types.js';
import type {
  DocumentMetadata,
  Chapter,
  PerformanceStats,
} from '../../../../../src/core/document-processing/types.js';

export const createMockMetadata = (
  overrides: Partial<DocumentMetadata> = {}
): DocumentMetadata => ({
  title: 'Test Book',
  author: 'Test Author',
  publisher: 'Test Publisher',
  language: 'en',
  identifier: 'test-book-123',
  description: 'A test book for unit testing',
  date: '2023-01-01',
  version: '1.0',
  wordCount: 1000,
  created: new Date('2023-01-01'),
  modified: new Date('2023-01-02'),
  customMetadata: {
    genre: 'fiction',
    format: 'epub',
    source: 'test-source',
    rights: '© 2023 Test Author',
    subjects: ['Fiction', 'Testing'],
    creators: ['Test Author'],
    contributors: ['Test Contributor'],
    coverImage: 'cover.jpg',
    series: 'Test Series',
    seriesIndex: 1,
  },
  ...overrides,
});

export const createMockChapter = (
  overrides: Partial<Chapter> = {}
): Chapter => ({
  id: 'chapter-1',
  title: 'Chapter 1',
  level: 1,
  position: 0,
  wordCount: 500,
  estimatedDuration: 125,
  startPosition: 0,
  endPosition: 500,
  startIndex: 0,
  paragraphs: [
    {
      id: 'para-1',
      type: 'text',
      sentences: [
        {
          id: 'sent-1',
          text: 'First sentence.',
          position: 0,
          wordCount: 2,
          estimatedDuration: 0.5,
          hasFormatting: false,
        },
      ],
      position: 0,
      wordCount: 2,
      rawText: 'First sentence.',
      includeInAudio: true,
      confidence: 1.0,
      text: 'First sentence.',
    },
  ],
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

export const createMockOptions = (
  overrides: Partial<EPUBParseOptions> = {}
): EPUBParseOptions => ({
  verbose: false,
  config: {},
  extractMedia: false,
  preserveHTML: false,
  chapterSensitivity: 0.5,
  ...overrides,
});

export const createEmptyMockChapter = (): Chapter => ({
  id: 'empty-chapter',
  title: 'Empty Chapter',
  level: 1,
  position: 0,
  wordCount: 0,
  estimatedDuration: 0,
  startPosition: 0,
  endPosition: 0,
  startIndex: 0,
  paragraphs: [],
});

export const createChapterWithNoParagraphs = (): Chapter => ({
  id: 'no-para-chapter',
  title: 'Chapter No Paragraphs',
  level: 1,
  position: 0,
  wordCount: 0,
  estimatedDuration: 0,
  startPosition: 0,
  endPosition: 0,
  startIndex: 0,
  paragraphs: [],
});
