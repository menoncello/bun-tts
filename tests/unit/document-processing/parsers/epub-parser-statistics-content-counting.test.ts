import { describe, test, expect } from 'bun:test';
import { calculateStatistics } from '../../../../src/core/document-processing/parsers/epub-parser-statistics.js';
import {
  createMockChapter,
  createMockParagraph,
  createMockSentence,
  createChapterWithTable,
} from './helpers/epub-parser-statistics-test-data';

describe('EPUB Parser Statistics - Content Counting', () => {
  test('should count images in paragraph text', () => {
    const chapter = createMockChapter({
      paragraphs: [
        createMockParagraph({
          id: 'para-1',
          sentences: [
            createMockSentence({
              text: 'Text with <img src="test.jpg"> image.',
              wordCount: 4,
            }),
          ],
          rawText: 'Text with <img src="test.jpg"> image.',
          wordCount: 4,
        }),
        createMockParagraph({
          id: 'para-2',
          sentences: [
            createMockSentence({
              id: 'sent-2',
              text: 'Another image: <img src="test2.jpg">',
              wordCount: 3,
            }),
          ],
          rawText: 'Another image: <img src="test2.jpg">',
          wordCount: 3,
        }),
      ],
      wordCount: 7,
    });

    const result = calculateStatistics([chapter]);

    expect(result.totalParagraphs).toBe(2);
    expect(result.totalSentences).toBe(2);
    expect(result.totalWords).toBe(7);
    expect(result.imageCount).toBe(2);
    expect(result.tableCount).toBe(0);
  });

  test('should count tables in paragraph text', () => {
    const chapter = createChapterWithTable();

    const result = calculateStatistics([chapter]);

    expect(result.totalParagraphs).toBe(2);
    expect(result.totalSentences).toBe(1);
    expect(result.totalWords).toBe(3);
    expect(result.imageCount).toBe(0);
    expect(result.tableCount).toBe(1);
  });

  test('should handle mixed images and tables', () => {
    const chapter = createMockChapter({
      paragraphs: [
        createMockParagraph({
          id: 'para-1',
          sentences: [createMockSentence()],
          wordCount: 2,
          rawText: 'Text before picture.',
        }),
        createMockParagraph({
          id: 'para-2',
          sentences: [],
          wordCount: 0,
          rawText: '<img src="image.jpg">',
        }),
        createMockParagraph({
          id: 'para-3',
          sentences: [],
          wordCount: 0,
          rawText: '<table><tr><td>Cell</td></tr></table>',
        }),
      ],
      wordCount: 2,
    });

    const result = calculateStatistics([chapter]);

    expect(result.totalParagraphs).toBe(3);
    expect(result.totalSentences).toBe(1);
    expect(result.totalWords).toBe(2);
    expect(result.imageCount).toBe(1);
    expect(result.tableCount).toBe(1);
  });
});
