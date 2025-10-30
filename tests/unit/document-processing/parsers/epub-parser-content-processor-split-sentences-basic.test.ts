import { describe, test, expect } from 'bun:test';
import { splitIntoSentences } from '../../../../src/core/document-processing/parsers/epub-parser-content-processor.js';

describe('EPUB Parser Content Processor - splitIntoSentences - Basic', () => {
  describe('basic sentence splitting', () => {
    test('should split text into sentences with positions', () => {
      const text = 'First sentence. Second sentence! Third sentence?';
      const startIndex = 100;
      const result = splitIntoSentences(text, startIndex);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.text).toContain('First sentence');
      expect(result[0]?.startIndex).toBe(100);
      expect(result[0]?.endIndex).toBeGreaterThan(100);
    });

    test('should handle single sentence', () => {
      const text = 'Only one sentence here.';
      const startIndex = 0;
      const result = splitIntoSentences(text, startIndex);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.text).toBe('Only one sentence here.');
      expect(result[0]?.startIndex).toBe(0);
    });

    test('should handle text without sentence-ending punctuation', () => {
      const text = 'Text without proper sentence endings';
      const startIndex = 0;
      const result = splitIntoSentences(text, startIndex);

      expect(result.length).toBe(1);
      expect(result[0]?.text).toBe('Text without proper sentence endings');
    });

    test('should handle empty text', () => {
      const text = '';
      const startIndex = 0;
      const result = splitIntoSentences(text, startIndex);

      expect(result.length).toBe(0);
    });

    test('should handle whitespace-only text', () => {
      const text = '   \n\t   ';
      const startIndex = 5;
      const result = splitIntoSentences(text, startIndex);

      expect(result.length).toBe(0);
    });

    test('should preserve original text in sentences', () => {
      const text = '  Leading and trailing spaces.  ';
      const startIndex = 10;
      const result = splitIntoSentences(text, startIndex);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.text).toBe('Leading and trailing spaces.');
    });
  });
});
