import { describe, test, expect } from 'bun:test';
import { extractParagraphMatches } from '../../../../src/core/document-processing/parsers/epub-parser-utils.js';

describe('EPUB Parser Utils - Sentence Extraction - Paragraph Matches', () => {
  describe('extractParagraphMatches', () => {
    describe('basic functionality', () => {
      test('should extract non-empty lines as paragraphs', () => {
        const content =
          '<p>First paragraph</p>\n\n<p>Second paragraph</p>\n<p>Third paragraph</p>';
        const result = extractParagraphMatches(content);
        expect(result).toHaveLength(3);
        expect(result[0]).toBe('First paragraph');
        expect(result[1]).toBe('Second paragraph');
        expect(result[2]).toBe('Third paragraph');
      });

      test('should ignore empty lines', () => {
        const content =
          '<p>Paragraph 1</p>\n\n\n<p>Paragraph 2</p>\n   \n<p>Paragraph 3</p>';
        const result = extractParagraphMatches(content);
        expect(result).toHaveLength(3);
        expect(result[0]).toBe('Paragraph 1');
        expect(result[1]).toBe('Paragraph 2');
        expect(result[2]).toBe('Paragraph 3');
      });

      test('should handle whitespace-only lines', () => {
        const content = '<p>Paragraph 1</p>\n   \t  \n<p>Paragraph 2</p>';
        const result = extractParagraphMatches(content);
        expect(result).toHaveLength(2);
      });

      test('should return empty array for empty input', () => {
        const result = extractParagraphMatches('');
        expect(result).toHaveLength(0);
      });

      test('should handle single paragraph', () => {
        const content = '<p>Single paragraph</p>';
        const result = extractParagraphMatches(content);
        expect(result).toHaveLength(1);
        expect(result[0]).toBe('Single paragraph');
      });
    });

    describe('edge cases', () => {
      test('should handle mixed line endings', () => {
        // Note: extractParagraphMatches looks for HTML <p> tags, line endings don't matter as much
        const content =
          '<p>Paragraph 1</p>\r\n<p>Paragraph 2</p>\r<p>Paragraph 3</p>\n<p>Paragraph 4</p>';
        const result = extractParagraphMatches(content);
        expect(result).toHaveLength(4);
        expect(result[0]).toBe('Paragraph 1');
        expect(result[1]).toBe('Paragraph 2');
        expect(result[2]).toBe('Paragraph 3');
        expect(result[3]).toBe('Paragraph 4');
      });

      test('should preserve leading and trailing whitespace in paragraphs', () => {
        const content =
          '<p>  Paragraph with spaces  </p>\n<p>\tParagraph with tabs\t</p>';
        const result = extractParagraphMatches(content);
        expect(result).toHaveLength(2);
        expect(result[0]).toBe('Paragraph with spaces'); // stripHTMLAndClean removes extra whitespace
        expect(result[1]).toBe('Paragraph with tabs');
      });

      test('should handle unicode characters', () => {
        const content =
          '<p>Paragraph with émojis 🎉</p>\n<p>Paragraph with 中文</p>';
        const result = extractParagraphMatches(content);
        expect(result).toHaveLength(2);
        expect(result[0]).toBe('Paragraph with émojis 🎉');
        expect(result[1]).toBe('Paragraph with 中文');
      });

      test('should handle very long paragraphs', () => {
        const longText = 'A'.repeat(1000);
        const content = `<p>${longText}</p>\n<p>${longText}</p>`;
        const result = extractParagraphMatches(content);
        expect(result).toHaveLength(2);
        expect(result[0]).toBe(longText);
        expect(result[1]).toBe(longText);
      });
    });

    describe('advanced scenarios', () => {
      test('should handle paragraphs with special characters', () => {
        const content =
          '<p>Paragraph with "quotes"</p>\n<p>Paragraph with (parentheses)</p>\n<p>Paragraph with [brackets]</p>';
        const result = extractParagraphMatches(content);
        expect(result).toHaveLength(3);
      });

      test('should handle paragraphs with punctuation', () => {
        const content =
          '<p>Paragraph with period.</p>\n<p>Paragraph with question mark?</p>\n<p>Paragraph with exclamation!</p>';
        const result = extractParagraphMatches(content);
        expect(result).toHaveLength(3);
      });

      test('should handle paragraphs with numbers', () => {
        const content =
          '<p>Paragraph with 123 numbers</p>\n<p>Paragraph with 456.789 decimals</p>';
        const result = extractParagraphMatches(content);
        expect(result).toHaveLength(2);
      });
    });
  });
});
