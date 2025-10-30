import { describe, test, expect } from 'bun:test';
import { splitIntoSentences } from '../../../../src/core/document-processing/parsers/epub-parser-content-processor.js';

describe('EPUB Parser Content Processor - splitIntoSentences - Index', () => {
  describe('index calculation - basic scenarios', () => {
    test('should calculate correct start and end indices', () => {
      const text = 'First sentence. Second sentence.';
      const startIndex = 50;
      const result = splitIntoSentences(text, startIndex);

      expect(result.length).toBe(2);
      expect(result[0]?.startIndex).toBe(50);
      expect(result[0]?.endIndex).toBe(66); // "First sentence." + space after punctuation
      expect(result[1]?.startIndex).toBe(66); // starts right after first sentence
      expect(result[1]?.endIndex).toBe(82); // "Second sentence." length + position
    });

    test('should handle zero start index', () => {
      const text = 'Start from zero sentence.';
      const startIndex = 0;
      const result = splitIntoSentences(text, startIndex);

      expect(result.length).toBe(1);
      expect(result[0]?.startIndex).toBe(0);
      expect(result[0]?.endIndex).toBe(25);
    });
  });

  describe('index calculation - edge cases', () => {
    test('should handle large start index', () => {
      const text = 'Short sentence.';
      const startIndex = 10000;
      const result = splitIntoSentences(text, startIndex);

      expect(result.length).toBe(1);
      expect(result[0]?.startIndex).toBe(10000);
      expect(result[0]?.endIndex).toBe(10015);
    });

    test('should handle negative start index', () => {
      const text = 'Negative start index.';
      const startIndex = -10;
      const result = splitIntoSentences(text, startIndex);

      expect(result.length).toBe(1);
      expect(result[0]?.startIndex).toBe(-10);
      expect(result[0]?.endIndex).toBe(11);
    });
  });

  describe('index calculation - multiple sentences', () => {
    test('should maintain index consistency across multiple sentences', () => {
      const text = 'First. Second. Third.';
      const startIndex = 100;
      const result = splitIntoSentences(text, startIndex);

      expect(result.length).toBe(3);

      // Check that indices are sequential and don't overlap
      for (let i = 0; i < result.length; i++) {
        expect(result[i]?.startIndex).toBeGreaterThanOrEqual(
          i === 0 ? -1 : result[i - 1]?.endIndex || -1
        );
        expect(result[i]?.endIndex).toBeGreaterThan(
          result[i]?.startIndex || -1
        );
      }
    });
  });

  describe('index calculation - special characters and whitespace', () => {
    test('should handle text with multiple spaces between sentences', () => {
      const text = 'First sentence.   Second sentence.';
      const startIndex = 0;
      const result = splitIntoSentences(text, startIndex);

      expect(result.length).toBe(2);
      expect(result[0]?.endIndex).toBe(18); // All spaces are included in first sentence
      expect(result[1]?.startIndex).toBe(18); // Second sentence starts right after
    });

    test('should handle text with tabs and newlines', () => {
      const text = 'First sentence.\n\tSecond sentence.';
      const startIndex = 0;
      const result = splitIntoSentences(text, startIndex);

      expect(result.length).toBe(2);
      expect(result[1]?.startIndex).toBeGreaterThanOrEqual(
        result[0]?.endIndex || 0
      );
    });
  });
});
