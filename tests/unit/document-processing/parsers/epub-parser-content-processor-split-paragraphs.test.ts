import { describe, test, expect } from 'bun:test';
import { splitIntoParagraphs } from '../../../../src/core/document-processing/parsers/epub-parser-content-processor.js';
import {
  createParagraphContent,
  createMultipleParagraphs,
} from './epub-parser-content-processor-test-utils';

// Additional test content creators
function createMultipleParagraphContent(): string {
  return 'First paragraph.\nSecond paragraph.\nThird paragraph.';
}

function createEmptyLinesContent(): string {
  return 'First paragraph.\n\n\nSecond paragraph.';
}

function createEmptyParagraphsContent(): string {
  return 'First paragraph.\n\n   \n\nSecond paragraph.';
}

function createWhitespaceOnlyContent(): string {
  return '   \n\n  \n   ';
}

function createMultipleSentencesContent(): string {
  return 'First sentence. Second sentence! Third sentence?';
}

function createNoSentenceEndingsContent(): string {
  return 'Text without sentence endings';
}

function createMixedPunctuationContent(): string {
  return 'First sentence... Second sentence? Third sentence! Fourth sentence.';
}

function createWordCountContent(): string {
  return 'This paragraph has exactly six words in it.';
}

function createComplexWordPatternsContent(): string {
  return 'Word-count-test with-hyphens and "quotes" and numbers 123.';
}

function createSpecialCharactersContent(): string {
  return 'Café résumé naïve — these are words with accents!';
}

function createNumbersAndPunctuationContent(): string {
  return 'In 2023, we processed 1,234.56 items. Did it work? Yes!';
}

function createEmojisContent(): string {
  return 'This paragraph has emojis 🎉📚 and works great!';
}

function createURLsContent(): string {
  return 'Visit https://example.com/path for more information.';
}

function createWellFormedContent(): string {
  return 'This is a well-formed paragraph with proper punctuation.';
}

function createShortParagraphContent(): string {
  return 'Short.';
}

// Test assertion helpers
function assertBasicParagraphProperties(
  result: any[],
  _expectedWordCount: number,
  _expectedText: string
) {
  expect(result).toHaveLength(1);
  expect(result[0]?.id).toBe('paragraph-1');
  expect(result[0]?.type).toBe('text');
  expect(result[0]?.position).toBe(0);
}

function assertContentProperties(
  result: any[],
  expectedWordCount: number,
  expectedText: string
) {
  expect(result[0]?.wordCount).toBe(expectedWordCount);
  expect(result[0]?.rawText).toBe(expectedText);
  expect(result[0]?.text).toBe(expectedText);
}

function assertAudioProperties(result: any[]) {
  expect(result[0]?.includeInAudio).toBe(true);
  expect(result[0]?.confidence).toBe(0.8);
}

function assertSentenceStructure(result: any[], expectedText: string) {
  expect(result[0]?.sentences).toHaveLength(1);
  expect(result[0]?.sentences[0]?.text).toBe(expectedText);
}

function assertSingleParagraphStructure(
  result: any[],
  expectedWordCount: number,
  expectedText: string
) {
  assertBasicParagraphProperties(result, expectedWordCount, expectedText);
  assertContentProperties(result, expectedWordCount, expectedText);
  assertAudioProperties(result);
  assertSentenceStructure(result, expectedText);
}

function assertMultipleParagraphStructure(
  result: any[],
  expectedLength: number
) {
  expect(result).toHaveLength(expectedLength);

  for (let i = 0; i < expectedLength; i++) {
    expect(result[i]?.id).toBe(`paragraph-${i + 1}`);
    expect(result[i]?.position).toBe(i);
  }
}

function assertParagraphTextContent(
  result: any[],
  index: number,
  expectedText: string
) {
  expect(result[index]?.rawText).toBe(expectedText);
  expect(result[index]?.text).toBe(expectedText);
}

function assertSentenceCount(
  result: any[],
  paragraphIndex: number,
  expectedCount: number
) {
  expect(result[paragraphIndex]?.sentences).toHaveLength(expectedCount);
}

function assertSentenceText(
  result: any[],
  paragraphIndex: number,
  sentenceIndex: number,
  expectedText: string
) {
  expect(result[paragraphIndex]?.sentences[sentenceIndex]?.text).toBe(
    expectedText
  );
}

function assertWordCountGreaterThan(
  result: any[],
  paragraphIndex: number,
  minCount: number
) {
  expect(result[paragraphIndex]?.wordCount).toBeGreaterThan(minCount);
}

function assertWordCountExact(
  result: any[],
  paragraphIndex: number,
  expectedCount: number
) {
  expect(result[paragraphIndex]?.wordCount).toBe(expectedCount);
}

function assertContainsText(
  result: any[],
  paragraphIndex: number,
  expectedText: string
) {
  expect(result[paragraphIndex]?.rawText).toContain(expectedText);
}

function assertHasSentences(result: any[], paragraphIndex: number) {
  expect(result[paragraphIndex]?.sentences?.length).toBeGreaterThan(0);
}

function assertAllParagraphsHaveContent(result: any[]) {
  expect(result.every((p) => p.rawText.trim().length > 0)).toBe(true);
}

describe('EPUB Parser Content Processor - splitIntoParagraphs (Basic)', () => {
  describe('basic paragraph splitting', () => {
    test('should split single paragraph correctly', () => {
      const content = createParagraphContent();
      const result = splitIntoParagraphs(content);

      assertSingleParagraphStructure(
        result,
        9,
        'This is a single paragraph with some text content.'
      );
    });

    test('should split multiple paragraphs correctly', () => {
      const content = createMultipleParagraphContent();
      const result = splitIntoParagraphs(content);

      assertMultipleParagraphStructure(result, 3);
      assertParagraphTextContent(result, 0, 'First paragraph.');
      assertParagraphTextContent(result, 1, 'Second paragraph.');
      assertParagraphTextContent(result, 2, 'Third paragraph.');
    });
  });
});

describe('EPUB Parser Content Processor - splitIntoParagraphs (Empty Lines)', () => {
  describe('empty line handling', () => {
    test('should handle empty lines between paragraphs', () => {
      const content = createEmptyLinesContent();
      const result = splitIntoParagraphs(content);

      expect(result).toHaveLength(2);
      assertParagraphTextContent(result, 0, 'First paragraph.');
      assertParagraphTextContent(result, 1, 'Second paragraph.');
    });

    test('should ignore empty paragraphs', () => {
      const content = createEmptyParagraphsContent();
      const result = splitIntoParagraphs(content);

      expect(result).toHaveLength(2);
      assertAllParagraphsHaveContent(result);
    });

    test('should handle content with only whitespace', () => {
      const content = createWhitespaceOnlyContent();
      const result = splitIntoParagraphs(content);

      expect(result).toHaveLength(0);
    });
  });
});

describe('EPUB Parser Content Processor - splitIntoParagraphs (Sentences)', () => {
  describe('sentence handling within paragraphs', () => {
    test('should handle paragraphs with multiple sentences', () => {
      const content = createMultipleSentencesContent();
      const result = splitIntoParagraphs(content);

      assertSentenceCount(result, 0, 3);
      assertSentenceText(result, 0, 0, 'First sentence.');
      assertSentenceText(result, 0, 1, 'Second sentence!');
      assertSentenceText(result, 0, 2, 'Third sentence?');
    });

    test('should handle paragraphs with no sentence-ending punctuation', () => {
      const content = createNoSentenceEndingsContent();
      const result = splitIntoParagraphs(content);

      assertSentenceCount(result, 0, 1);
      assertSentenceText(result, 0, 0, 'Text without sentence endings');
    });

    test('should handle sentences with mixed punctuation', () => {
      const content = createMixedPunctuationContent();
      const result = splitIntoParagraphs(content);

      expect(result).toHaveLength(1);
      expect(result[0]?.sentences.length).toBeGreaterThan(1);
    });
  });
});

describe('EPUB Parser Content Processor - splitIntoParagraphs (Word Count)', () => {
  describe('word count calculation', () => {
    test('should calculate word count correctly', () => {
      const content = createWordCountContent();
      const result = splitIntoParagraphs(content);

      assertWordCountExact(result, 0, 8); // Text has 8 words total
    });

    test('should handle paragraphs with complex word patterns', () => {
      const content = createComplexWordPatternsContent();
      const result = splitIntoParagraphs(content);

      assertWordCountExact(result, 0, 7); // Word-count-test, with-hyphens, and, "quotes", and, numbers, 123
    });
  });
});

describe('EPUB Parser Content Processor - splitIntoParagraphs (Special Content)', () => {
  describe('special characters and content', () => {
    test('should handle paragraphs with special characters', () => {
      const content = createSpecialCharactersContent();
      const result = splitIntoParagraphs(content);

      assertSingleParagraphStructure(
        result,
        9,
        'Café résumé naïve — these are words with accents!'
      );
    });

    test('should handle paragraphs with numbers and punctuation', () => {
      const content = createNumbersAndPunctuationContent();
      const result = splitIntoParagraphs(content);

      expect(result).toHaveLength(1);
      assertHasSentences(result, 0);
      assertWordCountGreaterThan(result, 0, 0);
    });

    test('should handle paragraphs with emojis', () => {
      const content = createEmojisContent();
      const result = splitIntoParagraphs(content);

      expect(result).toHaveLength(1);
      assertWordCountGreaterThan(result, 0, 0);
      assertContainsText(result, 0, '🎉📚');
    });

    test('should handle paragraphs with URLs', () => {
      const content = createURLsContent();
      const result = splitIntoParagraphs(content);

      expect(result).toHaveLength(1);
      assertContainsText(result, 0, 'https://example.com/path');
      assertWordCountGreaterThan(result, 0, 0);
    });
  });
});

describe('EPUB Parser Content Processor - splitIntoParagraphs (Positioning)', () => {
  describe('position and ID generation', () => {
    test('should assign correct positions to multiple paragraphs', () => {
      const content = createMultipleParagraphs();
      const result = splitIntoParagraphs(content);

      assertMultipleParagraphStructure(result, 3);
      expect(result[0]?.position).toBe(0);
      expect(result[1]?.position).toBe(1);
      expect(result[2]?.position).toBe(2);
    });

    test('should generate unique IDs for paragraphs', () => {
      const content = createMultipleParagraphs();
      const result = splitIntoParagraphs(content);

      expect(result[0]?.id).toBe('paragraph-1');
      expect(result[1]?.id).toBe('paragraph-2');
      expect(result[2]?.id).toBe('paragraph-3');
    });
  });
});

describe('EPUB Parser Content Processor - splitIntoParagraphs (Confidence)', () => {
  describe('confidence scoring', () => {
    test('should assign appropriate confidence scores', () => {
      const content = createWellFormedContent();
      const result = splitIntoParagraphs(content);

      expect(result[0]?.confidence).toBe(0.8);
    });

    test('should handle very short paragraphs', () => {
      const content = createShortParagraphContent();
      const result = splitIntoParagraphs(content);

      expect(result).toHaveLength(1);
      expect(result[0]?.confidence).toBe(0.8);
    });
  });
});
