import { describe, test, expect } from 'bun:test';
import { calculateStatistics } from '../../../../src/core/document-processing/parsers/epub-parser-statistics.js';
import {
  createMockChapter,
  createEmptyMockChapter,
  createMockParagraph,
  createMockSentence,
} from './helpers/epub-parser-statistics-test-data';

describe('EPUB Parser Statistics - Basic Calculations', () => {
  test('should calculate statistics for single chapter', () => {
    const chapter = createMockChapter({
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
    });

    const result = calculateStatistics([chapter]);

    expect(result.totalParagraphs).toBe(1);
    expect(result.totalSentences).toBe(2);
    expect(result.totalWords).toBe(4);
    expect(result.chapterCount).toBe(1);
    expect(result.imageCount).toBe(0);
    expect(result.tableCount).toBe(0);
  });

  test('should handle empty chapters array', () => {
    const result = calculateStatistics([]);

    expect(result.totalParagraphs).toBe(0);
    expect(result.totalSentences).toBe(0);
    expect(result.totalWords).toBe(0);
    expect(result.chapterCount).toBe(0);
    expect(result.imageCount).toBe(0);
    expect(result.tableCount).toBe(0);
  });

  test('should handle chapters with no paragraphs', () => {
    const chapter = createEmptyMockChapter();

    const result = calculateStatistics([chapter]);

    expect(result.totalParagraphs).toBe(0);
    expect(result.totalSentences).toBe(0);
    expect(result.totalWords).toBe(0);
    expect(result.chapterCount).toBe(1);
    expect(result.imageCount).toBe(0);
    expect(result.tableCount).toBe(0);
  });

  test('should handle chapters with paragraphs but no sentences', () => {
    const chapter = createMockChapter({
      paragraphs: [
        createMockParagraph({
          sentences: [],
          wordCount: 0,
          rawText: '',
        }),
      ],
      wordCount: 0,
    });

    const result = calculateStatistics([chapter]);

    expect(result.totalParagraphs).toBe(1);
    expect(result.totalSentences).toBe(0);
    expect(result.totalWords).toBe(0);
    expect(result.chapterCount).toBe(1);
    expect(result.imageCount).toBe(0);
    expect(result.tableCount).toBe(0);
  });
});
