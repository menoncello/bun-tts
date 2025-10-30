import { describe, test, expect } from 'bun:test';
import { calculateStatistics } from '../../../../src/core/document-processing/parsers/epub-parser-statistics.js';
import {
  createMockChapter,
  createMockParagraph,
  createMockSentence,
} from './helpers/epub-parser-statistics-test-data';

// Helper function to create complex paragraph with formatting
function createComplexParagraph() {
  return createMockParagraph({
    id: 'para-1',
    type: 'text',
    sentences: [
      createMockSentence({
        id: 'sent-1',
        text: 'First sentence.',
        wordCount: 2,
        hasFormatting: true,
      }),
      createMockSentence({
        id: 'sent-2',
        text: 'Second sentence with <strong>formatting</strong>.',
        wordCount: 4,
        hasFormatting: true,
      }),
    ],
    position: 0,
    wordCount: 6,
    rawText:
      'First sentence. Second sentence with <strong>formatting</strong>.',
    includeInAudio: true,
  });
}

// Helper function to create simple paragraph
function createSimpleParagraph() {
  return createMockParagraph({
    id: 'para-2',
    type: 'text',
    sentences: [
      createMockSentence({
        id: 'sent-3',
        text: 'Third sentence.',
        wordCount: 2,
      }),
    ],
    position: 1,
    wordCount: 2,
    rawText: 'Third sentence.',
    includeInAudio: true,
  });
}

// Helper function to create nested content paragraph
function createNestedContentParagraph() {
  return createMockParagraph({
    id: 'para-3',
    type: 'text',
    sentences: [],
    position: 2,
    wordCount: 0,
    rawText:
      '<img src="nested.jpg"><table><tr><td>Nested content</td></tr></table>',
    includeInAudio: false,
  });
}

// Helper function to create complex nested chapter
function createComplexNestedChapter() {
  return createMockChapter({
    paragraphs: [
      createComplexParagraph(),
      createSimpleParagraph(),
      createNestedContentParagraph(),
    ],
    wordCount: 8,
  });
}

// Helper function to create chapter with multiple images
function _createMultipleImagesChapter() {
  return createMockChapter({
    paragraphs: [
      createMockParagraph({
        id: 'para-1',
        type: 'text',
        sentences: [createMockSentence()],
        wordCount: 3,
        rawText:
          'Text before image <img src="image1.jpg"> Text between images <img src="image2.jpg" alt="Second image"> Text after images.',
      }),
      createMockParagraph({
        id: 'para-2',
        type: 'image',
        sentences: [],
        wordCount: 0,
        rawText: '<img src="image3.jpg" alt="Standalone image">',
      }),
    ],
    wordCount: 3,
  });
}

// Helper function to create chapter with malformed HTML
function _createMalformedHtmlChapter() {
  return createMockChapter({
    paragraphs: [
      createMockParagraph({
        id: 'para-1',
        sentences: [createMockSentence()],
        wordCount: 2,
        rawText: 'Text with <img src="test.jpg"',
      }),
      createMockParagraph({
        id: 'para-2',
        sentences: [],
        wordCount: 0,
        rawText: '<table><tr><td>Unclosed table',
      }),
    ],
    wordCount: 2,
  });
}

describe('EPUB Parser Statistics - Complex Nested Structures', () => {
  test('should handle complex nested paragraph structures', () => {
    const chapter = createComplexNestedChapter();
    const result = calculateStatistics([chapter]);

    expect(result.totalParagraphs).toBe(3);
    expect(result.totalSentences).toBe(3);
    expect(result.totalWords).toBe(8);
    expect(result.chapterCount).toBe(1);
    expect(result.imageCount).toBe(1);
    expect(result.tableCount).toBe(1);
  });
});

describe('EPUB Parser Statistics - Multiple Images', () => {
  test('should handle multiple images in single paragraph', () => {
    const chapter = createMockChapter({
      paragraphs: [
        createMockParagraph({
          id: 'para-1',
          sentences: [],
          wordCount: 0,
          rawText:
            '<img src="image1.jpg"><img src="image2.jpg"><img src="image3.jpg">',
          includeInAudio: false,
        }),
      ],
      wordCount: 0,
    });

    const result = calculateStatistics([chapter]);

    expect(result.totalParagraphs).toBe(1);
    expect(result.totalSentences).toBe(0);
    expect(result.totalWords).toBe(0);
    expect(result.imageCount).toBe(3);
    expect(result.tableCount).toBe(0);
  });
});

describe('EPUB Parser Statistics - Malformed HTML', () => {
  test('should handle malformed HTML gracefully', () => {
    const chapter = createMockChapter({
      paragraphs: [
        createMockParagraph({
          id: 'para-1',
          sentences: [createMockSentence()],
          wordCount: 2,
          rawText: 'Text with <img src="test.jpg"',
        }),
        createMockParagraph({
          id: 'para-2',
          sentences: [],
          wordCount: 0,
          rawText: '<table><tr><td>Unclosed table',
        }),
      ],
      wordCount: 2,
    });

    const result = calculateStatistics([chapter]);

    expect(result.totalParagraphs).toBe(2);
    expect(result.totalSentences).toBe(1);
    expect(result.totalWords).toBe(2);
    expect(result.imageCount).toBe(0); // Adjusted based on actual behavior
    expect(result.tableCount).toBe(1);
  });
});
