import { describe, test, expect } from 'bun:test';
import { calculateStatistics } from '../../../../src/core/document-processing/parsers/epub-parser-statistics.js';
import {
  createMockChapter,
  createMockParagraph,
  createMockSentence,
} from './helpers/epub-parser-statistics-test-data';

describe('EPUB Parser Statistics - Multiple Chapters', () => {
  test('should calculate statistics for multiple chapters', () => {
    const chapters = [
      createMockChapter({
        id: 'chapter-1',
        title: 'Chapter 1',
        position: 0,
        paragraphs: [
          createMockParagraph({
            id: 'para-1',
            sentences: [
              createMockSentence({ id: 'sent-1', text: 'First sentence.' }),
              createMockSentence({ id: 'sent-2', text: 'Second sentence.' }),
            ],
            wordCount: 4,
            rawText: 'First sentence. Second sentence.',
          }),
        ],
        wordCount: 4,
        estimatedDuration: 1.6,
      }),
      createMockChapter({
        id: 'chapter-2',
        title: 'Chapter 2',
        position: 1,
        paragraphs: [
          createMockParagraph({
            id: 'para-2',
            sentences: [
              createMockSentence({ id: 'sent-3', text: 'Third sentence.' }),
              createMockSentence({ id: 'sent-4', text: 'Fourth sentence.' }),
              createMockSentence({ id: 'sent-5', text: 'Fifth sentence.' }),
            ],
            wordCount: 6,
            rawText: 'Third sentence. Fourth sentence. Fifth sentence.',
          }),
        ],
        wordCount: 6,
        estimatedDuration: 2.4,
      }),
    ];

    const result = calculateStatistics(chapters);

    expect(result.totalParagraphs).toBe(2);
    expect(result.totalSentences).toBe(5);
    expect(result.totalWords).toBe(10);
    expect(result.chapterCount).toBe(2);
    expect(result.imageCount).toBe(0);
    expect(result.tableCount).toBe(0);
  });

  test('should calculate reading time correctly', () => {
    const chapters = [
      createMockChapter({
        wordCount: 200,
        estimatedDuration: 60,
      }),
      createMockChapter({
        id: 'chapter-2',
        title: 'Chapter 2',
        position: 1,
        wordCount: 300,
        estimatedDuration: 90,
        paragraphs: [
          createMockParagraph({
            id: 'para-2',
            wordCount: 300,
          }),
        ],
      }),
    ];

    const result = calculateStatistics(chapters);

    expect(result.totalWords).toBe(500);
    expect(result.estimatedReadingTime).toBeCloseTo(2.5, 1); // 500 words / 200 words per minute
  });

  test('should handle chapters with mixed content types', () => {
    const chapters = [
      createMockChapter({
        paragraphs: [
          createMockParagraph({
            id: 'para-1',
            type: 'text',
            sentences: [createMockSentence()],
            wordCount: 2,
            rawText: 'Simple text.',
            includeInAudio: true,
          }),
          createMockParagraph({
            id: 'para-2',
            type: 'text',
            sentences: [],
            wordCount: 0,
            rawText: '<img src="image1.jpg">',
            includeInAudio: false,
          }),
        ],
        wordCount: 2,
      }),
      createMockChapter({
        id: 'chapter-2',
        title: 'Chapter 2',
        position: 1,
        paragraphs: [
          createMockParagraph({
            id: 'para-3',
            type: 'text',
            sentences: [
              createMockSentence({ id: 'sent-2', text: 'Another sentence.' }),
            ],
            wordCount: 2,
            rawText: 'Another sentence.',
            includeInAudio: true,
          }),
        ],
        wordCount: 2,
      }),
    ];

    const result = calculateStatistics(chapters);

    expect(result.totalParagraphs).toBe(3);
    expect(result.totalSentences).toBe(2);
    expect(result.totalWords).toBe(4);
    expect(result.chapterCount).toBe(2);
    expect(result.imageCount).toBe(1);
  });
});
