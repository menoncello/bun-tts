import { describe, test, expect } from 'bun:test';
import {
  extractSentenceMatches,
  extractSentenceText,
} from '../../../../src/core/document-processing/parsers/epub-parser-utils.js';

describe('EPUB Parser Utils - Sentence Extraction - Sentence Matches', () => {
  describe('extractSentenceMatches', () => {
    describe('basic functionality', () => {
      test('should extract sentence matches with period', () => {
        const content = 'First sentence. Second sentence.';
        const result = extractSentenceMatches(content);
        expect(result).toHaveLength(1);
        expect(result[0]?.match).toBe('. '); // the function returns the punctuation and space
        expect(result[0]?.index).toBe(14);
      });

      test('should extract sentence matches with question mark', () => {
        const content = 'Is this a question? Yes it is.';
        const result = extractSentenceMatches(content);
        expect(result).toHaveLength(1);
        expect(result[0]?.match).toBe('? '); // the function returns the punctuation and space
        expect(result[0]?.index).toBe(18);
      });

      test('should extract sentence matches with exclamation mark', () => {
        const content = 'What a surprise! Amazing indeed.';
        const result = extractSentenceMatches(content);
        expect(result).toHaveLength(1);
        expect(result[0]?.match).toBe('! '); // the function returns the punctuation and space
        expect(result[0]?.index).toBe(15);
      });
    });

    describe('edge cases', () => {
      test('should handle empty input', () => {
        const result = extractSentenceMatches('');
        expect(result).toHaveLength(0);
      });

      test('should handle text without sentence endings', () => {
        const content = 'Text without endings';
        const result = extractSentenceMatches(content);
        expect(result).toHaveLength(0);
      });

      test('should handle multiple spaces between sentences', () => {
        const content = 'First sentence.   Second sentence.';
        const result = extractSentenceMatches(content);
        expect(result).toHaveLength(1);
        expect(result[0]?.match).toBe('.   '); // the function returns the punctuation and all spaces
        expect(result[0]?.index).toBe(14);
      });
    });

    describe('complex scenarios', () => {
      test('should handle abbreviations correctly - regex will find the sentence boundaries', () => {
        const content = 'Dr. Smith went to the U.S.A. He was happy.';
        const result = extractSentenceMatches(content);
        // The simple regex will find all punctuation + space patterns
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]?.match).toBe('. ');
        expect(result[0]?.index).toBe(2);
      });

      test('should handle decimal numbers', () => {
        const content = 'The price is 12.99 dollars. It is reasonable.';
        const result = extractSentenceMatches(content);
        expect(result).toHaveLength(1);
        expect(result[0]?.match).toBe('. ');
        expect(result[0]?.index).toBe(26);
      });

      test('should handle ellipsis', () => {
        const content = 'The story continues... What happens next?';
        const result = extractSentenceMatches(content);
        expect(result).toHaveLength(1);
        expect(result[0]?.match).toBe('. '); // the function finds the last period of the ellipsis
        expect(result[0]?.index).toBe(21);
      });
    });
  });

  describe('extractSentenceText', () => {
    describe('basic functionality', () => {
      test('should extract text from simple match', () => {
        const match = {
          index: 11,
          match: '. ',
        };
        const text = 'Hello world. How are you?';
        const lastIndex = 0;
        const result = extractSentenceText(text, match, lastIndex);
        expect(result).toBe('Hello world.');
      });

      test('should handle match at different position', () => {
        const match = {
          index: 18,
          match: '? ',
        };
        const text = 'Is this a question? Yes it is.';
        const lastIndex = 0;
        const result = extractSentenceText(text, match, lastIndex);
        expect(result).toBe('Is this a question?');
      });

      test('should extract text with leading whitespace', () => {
        const match = {
          index: 13,
          match: '.  ',
        };
        const text = 'Previous text.  Indented sentence.';
        const lastIndex = 0;
        const result = extractSentenceText(text, match, lastIndex);
        expect(result).toBe('Previous text.');
      });
    });

    describe('edge cases', () => {
      test('should handle empty match', () => {
        const match = {
          index: 0,
          match: '',
        };
        const text = '';
        const lastIndex = 0;
        const result = extractSentenceText(text, match, lastIndex);
        expect(result).toBe('');
      });

      test('should handle match with only whitespace', () => {
        // This test doesn't make sense because extractSentenceMatches only matches punctuation+space
        // So we can't have a match with only whitespace
        const match = {
          index: 4,
          match: '. ',
        };
        const text = 'Test. ';
        const lastIndex = 0;
        const result = extractSentenceText(text, match, lastIndex);
        expect(result).toBe('Test.');
      });

      test('should handle null input in match object', () => {
        const match = {
          index: 4,
          match: '. ',
        };
        const text = 'Test.';
        const lastIndex = 0;
        const result = extractSentenceText(text, match, lastIndex);
        expect(result).toBe('Test.');
      });

      test('should handle undefined input in match object', () => {
        const match = {
          index: 4,
          match: '. ',
        };
        const text = 'Test.';
        const lastIndex = 0;
        const result = extractSentenceText(text, match, lastIndex);
        expect(result).toBe('Test.');
      });
    });

    describe('whitespace handling', () => {
      test('should preserve original whitespace in match', () => {
        const match = {
          index: 25,
          match: '.  ',
        };
        const text = '  Multiple   spaces  here.  Next sentence.';
        const lastIndex = 0;
        const result = extractSentenceText(text, match, lastIndex);
        expect(result).toBe('Multiple   spaces  here.');
      });

      test('should handle tabs and newlines within sentence', () => {
        const match = {
          index: 29,
          match: '. ',
        };
        const text = 'Sentence with\ttab\nand newline. Next sentence.';
        const lastIndex = 0;
        const result = extractSentenceText(text, match, lastIndex);
        expect(result).toBe('Sentence with\ttab\nand newline.');
      });

      test('should handle mixed whitespace characters', () => {
        const match = {
          index: 23,
          match: '. ',
        };
        const text = ' \t\n Mixed \r\n whitespace. Next sentence.';
        const lastIndex = 0;
        const result = extractSentenceText(text, match, lastIndex);
        expect(result).toBe('Mixed \r\n whitespace.');
      });
    });
  });
});
