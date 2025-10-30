import { describe, test, expect } from 'bun:test';
import {
  stripHTMLAndClean,
  countWords,
} from '../../../../src/core/document-processing/parsers/epub-parser-utils.js';

describe('EPUB Parser Utils - Text Processing', () => {
  describe('stripHTMLAndClean', () => {
    describe('basic HTML stripping', () => {
      test('should strip script tags completely', () => {
        const input =
          '<p>Some text</p><script>alert("test")</script><p>More text</p>';
        const result = stripHTMLAndClean(input);
        expect(result).toBe('Some text More text');
        expect(result).not.toContain('alert');
      });

      test('should strip style tags completely', () => {
        const input =
          '<p>Text</p><style>body { color: red; }</style><p>More text</p>';
        const result = stripHTMLAndClean(input);
        expect(result).toBe('Text More text');
        expect(result).not.toContain('color');
      });

      test('should replace HTML tags with spaces', () => {
        const input = '<p>Hello</p><strong>world</strong><em>!</em>';
        const result = stripHTMLAndClean(input);
        expect(result).toBe('Hello world !');
      });

      test('should handle nested HTML tags', () => {
        const input = '<div><p><strong>Nested <em>text</em></strong></p></div>';
        const result = stripHTMLAndClean(input);
        expect(result).toBe('Nested text');
      });

      test('should handle self-closing tags', () => {
        const input = '<p>Text<br/>with<br/>line breaks</p>';
        const result = stripHTMLAndClean(input);
        expect(result).toBe('Text with line breaks');
      });
    });

    describe('whitespace handling', () => {
      test('should handle multiple whitespace characters', () => {
        const input = '<p>Text    with     multiple   spaces</p>';
        const result = stripHTMLAndClean(input);
        expect(result).toBe('Text with multiple spaces');
      });

      test('should normalize line breaks', () => {
        const input = '<p>Line 1\n\n\nLine 2</p>\n\n<p>Line 3</p>';
        const result = stripHTMLAndClean(input);
        expect(result).toBe('Line 1 Line 2 Line 3');
      });
    });

    describe('edge cases', () => {
      test('should handle empty input', () => {
        const result = stripHTMLAndClean('');
        expect(result).toBe('');
      });

      test('should handle null input', () => {
        const result = stripHTMLAndClean(null as any);
        expect(result).toBe('');
      });

      test('should handle undefined input', () => {
        const result = stripHTMLAndClean(undefined as any);
        expect(result).toBe('');
      });

      test('should handle text without HTML', () => {
        const input = 'Plain text without any HTML tags';
        const result = stripHTMLAndClean(input);
        expect(result).toBe('Plain text without any HTML tags');
      });
    });

    describe('HTML entities and special characters', () => {
      test('should handle HTML entities', () => {
        const input = '<p>Text with &amp; &lt; &gt; &quot; entities</p>';
        const result = stripHTMLAndClean(input);
        expect(result).toBe('Text with & < > " entities');
      });

      test('should handle numeric HTML entities', () => {
        const input = '<p>Numeric entities: &#38; &#60; &#62;</p>';
        const result = stripHTMLAndClean(input);
        expect(result).toBe('Numeric entities: & < >');
      });

      test('should handle hexadecimal HTML entities', () => {
        const input = '<p>Hex entities: &#x26; &#x3C; &#x3E;</p>';
        const result = stripHTMLAndClean(input);
        expect(result).toBe('Hex entities: & < >');
      });

      test('should preserve special characters', () => {
        const input = '<p>Text with émojis 😊 and accénted characters</p>';
        const result = stripHTMLAndClean(input);
        expect(result).toBe('Text with émojis 😊 and accénted characters');
      });
    });

    describe('complex scenarios', () => {
      test('should handle HTML comments', () => {
        const input = '<p>Text</p><!-- This is a comment --><p>More text</p>';
        const result = stripHTMLAndClean(input);
        expect(result).toBe('Text More text');
        expect(result).not.toContain('This is a comment');
      });

      test('should handle malformed HTML', () => {
        const input =
          '<p>Unclosed paragraph<div>Nested div</p>Missing closing div';
        const result = stripHTMLAndClean(input);
        expect(result).toBe(
          'Unclosed paragraph Nested div Missing closing div'
        );
      });
    });
  });

  describe('countWords', () => {
    describe('basic functionality', () => {
      test('should count words in simple text', () => {
        const text = 'Hello world this is a test';
        expect(countWords(text)).toBe(6);
      });

      test('should handle multiple spaces', () => {
        const text = 'Hello    world   this  is   a   test';
        expect(countWords(text)).toBe(6);
      });

      test('should handle tabs and newlines', () => {
        const text = 'Hello\nworld\tthis\nis\ta test';
        expect(countWords(text)).toBe(6);
      });

      test('should handle leading and trailing whitespace', () => {
        const text = '   Hello world this is a test   ';
        expect(countWords(text)).toBe(6);
      });
    });

    describe('edge cases', () => {
      test('should handle empty string', () => {
        expect(countWords('')).toBe(0);
      });

      test('should handle null input', () => {
        expect(countWords(null as any)).toBe(0);
      });

      test('should handle undefined input', () => {
        expect(countWords(undefined as any)).toBe(0);
      });

      test('should handle whitespace-only string', () => {
        expect(countWords('   \t\n   ')).toBe(0);
      });
    });

    describe('complex word patterns', () => {
      test('should handle contractions', () => {
        const text = "Don't can't won't shouldn't";
        expect(countWords(text)).toBe(4);
      });

      test('should handle hyphenated words', () => {
        const text = 'well-known state-of-the-art long-term';
        expect(countWords(text)).toBe(4);
      });

      test('should handle numbers', () => {
        const text = 'The year 2023 was good for 123 people';
        expect(countWords(text)).toBe(7);
      });

      test('should handle decimal numbers', () => {
        const text = 'The price is 19.99 and 3.14159';
        expect(countWords(text)).toBe(6);
      });
    });

    describe('special content types', () => {
      test('should handle email addresses', () => {
        const text = 'Contact user@example.com for details';
        expect(countWords(text)).toBe(4);
      });

      test('should handle URLs', () => {
        const text = 'Visit https://example.com/path?query=value for more';
        expect(countWords(text)).toBe(6);
      });

      test('should handle punctuation attached to words', () => {
        const text = 'Hello, world! This is a test.';
        expect(countWords(text)).toBe(6);
      });

      test('should handle emojis and special characters', () => {
        const text = 'Hello 😊 world 🌍 test 📚';
        expect(countWords(text)).toBe(4);
      });

      test('should handle mixed content', () => {
        const text = 'Chapter 1: "The Beginning" - Once upon a time...';
        expect(countWords(text)).toBe(7);
      });
    });

    describe('performance and large text', () => {
      test('should handle very long text', () => {
        const words = Array(1000).fill('word');
        const text = words.join(' ');
        expect(countWords(text)).toBe(1000);
      });

      test('should handle text with line breaks', () => {
        const text = 'Line 1\nLine 2\nLine 3';
        expect(countWords(text)).toBe(6);
      });

      test('should handle text with mixed whitespace', () => {
        const text = 'Word1 \t Word2 \n Word3   Word4';
        expect(countWords(text)).toBe(4);
      });
    });
  });
});
