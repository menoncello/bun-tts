/**
 * EPUB Parser Utils - Sentence Extraction - addRemainingTextAsSentence Tests
 *
 * Tests for the addRemainingTextAsSentence utility function
 */

import { describe, test, expect } from 'bun:test';
import { addRemainingTextAsSentence } from '../../../../src/core/document-processing/parsers/epub-parser-text-utils.js';
import type { Sentence } from '../../../../src/core/document-processing/types.js';

describe('EPUB Parser Utils - Sentence Extraction - addRemainingTextAsSentence', () => {
  describe('basic functionality', () => {
    test('should add remaining text as sentence', () => {
      const sentences: Sentence[] = [];
      const fullText = 'First sentence. Second sentence.';
      const lastMatchEnd = 14;

      addRemainingTextAsSentence(sentences, fullText, lastMatchEnd);

      expect(sentences).toHaveLength(1);
      expect(sentences[0]?.id).toBe('sentence-remaining-1');
      expect(sentences[0]?.text).toBe('Second sentence.');
      expect(sentences[0]?.position).toBe(0); // Math.floor(14 / 100) = 0
      expect(sentences[0]?.wordCount).toBe(2);
      expect(sentences[0]?.estimatedDuration).toBe(1); // Math.ceil(2 / 4) = 1
    });

    test('should not add sentence when no remaining text', () => {
      const sentences: Sentence[] = [];
      const fullText = 'First sentence.';
      const lastMatchEnd = 15;

      addRemainingTextAsSentence(sentences, fullText, lastMatchEnd);

      expect(sentences).toHaveLength(0);
    });

    test('should add sentence with only whitespace', () => {
      const sentences: Sentence[] = [];
      const fullText = 'First sentence.   ';
      const lastMatchEnd = 15;

      addRemainingTextAsSentence(sentences, fullText, lastMatchEnd);

      expect(sentences).toHaveLength(1);
      expect(sentences[0]?.text).toBe('   ');
      expect(sentences[0]?.wordCount).toBe(0);
      expect(sentences[0]?.estimatedDuration).toBe(0);
    });
  });

  describe('edge cases', () => {
    test('should handle empty full text', () => {
      const sentences: Sentence[] = [];
      const fullText = '';
      const lastMatchEnd = 0;

      addRemainingTextAsSentence(sentences, fullText, lastMatchEnd);

      expect(sentences).toHaveLength(0);
    });

    test('should handle null text', () => {
      const sentences: Sentence[] = [];
      const fullText = null as any;
      const lastMatchEnd = 0;

      expect(() => {
        addRemainingTextAsSentence(sentences, fullText, lastMatchEnd);
      }).toThrow();
    });

    test('should handle undefined text', () => {
      const sentences: Sentence[] = [];
      const fullText = undefined as any;
      const lastMatchEnd = 0;

      expect(() => {
        addRemainingTextAsSentence(sentences, fullText, lastMatchEnd);
      }).toThrow();
    });

    test('should handle last match end beyond text length', () => {
      const sentences: Sentence[] = [];
      const fullText = 'Short.';
      const lastMatchEnd = 100;

      addRemainingTextAsSentence(sentences, fullText, lastMatchEnd);

      expect(sentences).toHaveLength(0);
    });

    test('should handle negative last match end', () => {
      const sentences: Sentence[] = [];
      const fullText = 'Some text here.';
      const lastMatchEnd = -5;

      addRemainingTextAsSentence(sentences, fullText, lastMatchEnd);

      expect(sentences).toHaveLength(1);
      expect(sentences[0]?.text).toBe('Some text here.');
    });
  });

  describe('index calculation', () => {
    test('should calculate correct position for remaining text', () => {
      const sentences: Sentence[] = [];
      const fullText = 'First sentence. Remaining part here.';
      const lastMatchEnd = 15;

      addRemainingTextAsSentence(sentences, fullText, lastMatchEnd);

      expect(sentences[0]?.position).toBe(15);
    });

    test('should handle multiple calls with different positions', () => {
      const sentences1: any[] = [];
      const sentences2: any[] = [];
      const fullText = 'First. Second. Third.';

      addRemainingTextAsSentence(sentences1, fullText, 7);
      addRemainingTextAsSentence(sentences2, fullText, 15);

      expect(sentences1[0]?.text).toBe(' Second. Third.');
      expect(sentences1[0]?.position).toBe(7);

      expect(sentences2[0]?.text).toBe(' Third.');
      expect(sentences2[0]?.position).toBe(15);
    });

    test('should generate unique IDs for multiple remaining sentences', () => {
      const sentences: Sentence[] = [];
      const fullText = 'First sentence.';

      addRemainingTextAsSentence(sentences, fullText, 0);
      addRemainingTextAsSentence(sentences, fullText, 0);

      expect(sentences).toHaveLength(2);
      expect(sentences[0]?.id).toBe('sentence-remaining-1');
      expect(sentences[1]?.id).toBe('sentence-remaining-2');
    });
  });

  describe('complex scenarios', () => {
    test('should handle remaining text with special characters', () => {
      const sentences: Sentence[] = [];
      const fullText = 'First sentence. Résumé café naïve.';
      const lastMatchEnd = 15;

      addRemainingTextAsSentence(sentences, fullText, lastMatchEnd);

      expect(sentences).toHaveLength(1);
      expect(sentences[0]?.text).toBe(' Résumé café naïve.');
      expect(sentences[0]?.wordCount).toBe(3);
    });

    test('should handle remaining text with numbers', () => {
      const sentences: Sentence[] = [];
      const fullText = 'First sentence. The price is $12.99.';
      const lastMatchEnd = 15;

      addRemainingTextAsSentence(sentences, fullText, lastMatchEnd);

      expect(sentences).toHaveLength(1);
      expect(sentences[0]?.text).toBe(' The price is $12.99.');
      expect(sentences[0]?.wordCount).toBe(5);
    });

    test('should handle remaining text with mixed content', () => {
      const sentences: Sentence[] = [];
      const fullText = 'First. **Bold** text and http://example.com link.';
      const lastMatchEnd = 7;

      addRemainingTextAsSentence(sentences, fullText, lastMatchEnd);

      expect(sentences).toHaveLength(1);
      expect(sentences[0]?.text).toBe(
        ' **Bold** text and http://example.com link.'
      );
      expect(sentences[0]?.wordCount).toBe(6);
      expect(sentences[0]?.hasFormatting).toBe(true);
    });
  });
});
