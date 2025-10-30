import type {
  Chapter,
  PerformanceStats,
} from '../../../../../src/core/document-processing/types.js';

export const createMockSentence = (overrides: any = {}) => ({
  id: 'sent-1',
  text: 'First sentence.',
  position: 0,
  wordCount: 2,
  estimatedDuration: 0.8,
  hasFormatting: false,
  ...overrides,
});

export const createMockParagraph = (overrides: any = {}) => ({
  id: 'para-1',
  type: 'text' as const,
  sentences: [createMockSentence()],
  position: 0,
  wordCount: 4,
  rawText: 'First sentence. Second sentence.',
  includeInAudio: true,
  confidence: 1.0,
  text: 'First sentence. Second sentence.',
  ...overrides,
});

export const createMockChapter = (
  overrides: Partial<Chapter> = {}
): Chapter => ({
  id: 'chapter-1',
  title: 'Test Chapter',
  level: 1,
  position: 0,
  wordCount: 100,
  estimatedDuration: 30,
  startPosition: 0,
  endPosition: 500,
  startIndex: 0,
  paragraphs: [createMockParagraph()],
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

export const createComplexMockChapter = (): Chapter => ({
  id: 'complex-chapter',
  title: 'Complex Chapter',
  level: 1,
  position: 0,
  wordCount: 50,
  estimatedDuration: 15,
  startPosition: 0,
  endPosition: 250,
  startIndex: 0,
  paragraphs: [
    {
      id: 'para-1',
      type: 'text',
      sentences: [
        createMockSentence({ id: 'sent-1', text: 'First sentence.' }),
        createMockSentence({ id: 'sent-2', text: 'Second sentence.' }),
      ],
      position: 0,
      wordCount: 4,
      rawText: 'First sentence. Second sentence.',
      includeInAudio: true,
      confidence: 1.0,
      text: 'First sentence. Second sentence.',
    },
    {
      id: 'para-2',
      type: 'text',
      sentences: [
        createMockSentence({
          id: 'sent-3',
          text: 'Third sentence with image.',
        }),
      ],
      position: 1,
      wordCount: 4,
      rawText: 'Third sentence with <img src="test.jpg"> image.',
      includeInAudio: true,
      confidence: 1.0,
      text: 'Third sentence with <img src="test.jpg"> image.',
    },
  ],
});

export const createChapterWithTable = (): Chapter => ({
  id: 'table-chapter',
  title: 'Chapter with Table',
  level: 1,
  position: 0,
  wordCount: 3,
  estimatedDuration: 6,
  startPosition: 0,
  endPosition: 100,
  startIndex: 0,
  paragraphs: [
    {
      id: 'para-1',
      type: 'text',
      sentences: [
        createMockSentence({ id: 'sent-1', text: 'Text before table.' }),
      ],
      position: 0,
      wordCount: 3,
      rawText: 'Text before table.',
      includeInAudio: true,
      confidence: 1.0,
      text: 'Text before table.',
    },
    {
      id: 'para-2',
      type: 'text',
      sentences: [],
      position: 1,
      wordCount: 0,
      rawText: '<table><tr><td>Cell 1</td><td>Cell 2</td></tr></table>',
      includeInAudio: false,
      confidence: 1.0,
      text: '<table><tr><td>Cell 1</td><td>Cell 2</td></tr></table>',
    },
  ],
});
