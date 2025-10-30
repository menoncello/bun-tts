import { describe, test, expect } from 'bun:test';
import {
  createSentenceObject,
  createRegExpExecArray,
} from '../../../../src/core/document-processing/parsers/epub-parser-text-utils.js';

describe('EPUB Parser Utils - Sentence Extraction - Object Creation', () => {
  describe('createSentenceObject - Basic Functionality', () => {
    test('should create sentence object from simple match', () => {
      const match = createRegExpExecArray(
        'Hello world.',
        0,
        'Hello world. How are you?'
      );
      const sentenceText = 'Hello world.';
      const startIndex = 0;
      const lastIndex = 0;
      const result = createSentenceObject(
        sentenceText,
        startIndex,
        lastIndex,
        match
      );

      expect(result.text).toBe('Hello world.');
      expect(result.position).toBe(0);
      expect(result.wordCount).toBe(2);
      expect(result.estimatedDuration).toBe(1);
    });

    test('should calculate word count correctly', () => {
      const match = createRegExpExecArray(
        'This sentence has five words.',
        0,
        'This sentence has five words.'
      );
      const sentenceText = 'This sentence has five words.';
      const startIndex = 10;
      const lastIndex = 5;
      const result = createSentenceObject(
        sentenceText,
        startIndex,
        lastIndex,
        match
      );

      expect(result.text).toBe('This sentence has five words.');
      expect(result.position).toBe(0); // Math.floor(15 / 100) = 0
      expect(result.wordCount).toBe(5);
      expect(result.estimatedDuration).toBe(2); // Math.ceil(5 / 4) = 2
    });

    test('should handle position correctly', () => {
      const match = createRegExpExecArray(
        'Second sentence.',
        15,
        'First sentence. Second sentence.'
      );
      const sentenceText = 'Second sentence.';
      const startIndex = 100;
      const lastIndex = 20;
      const result = createSentenceObject(
        sentenceText,
        startIndex,
        lastIndex,
        match
      );

      expect(result.text).toBe('Second sentence.');
      expect(result.position).toBe(1); // Math.floor(120 / 100) = 1
    });
  });

  describe('createSentenceObject - Edge Cases', () => {
    test('should handle empty sentence', () => {
      const match = createRegExpExecArray('', 0, '');
      const sentenceText = '';
      const startIndex = 5;
      const lastIndex = 3;
      const result = createSentenceObject(
        sentenceText,
        startIndex,
        lastIndex,
        match
      );

      expect(result.text).toBe('');
    });

    test('should handle sentence with only whitespace', () => {
      const match = createRegExpExecArray('   ', 0, '   ');
      const sentenceText = '   ';
      const startIndex = 0;
      const lastIndex = 0;
      const result = createSentenceObject(
        sentenceText,
        startIndex,
        lastIndex,
        match
      );

      expect(result.text).toBe('   ');
    });

    test('should handle sentence with mixed whitespace', () => {
      const match = createRegExpExecArray(' \t\n \r\n ', 0, ' \t\n \r\n ');
      const sentenceText = ' \t\n \r\n ';
      const startIndex = 10;
      const lastIndex = 5;
      const result = createSentenceObject(
        sentenceText,
        startIndex,
        lastIndex,
        match
      );

      expect(result.text).toBe(' \t\n \r\n ');
    });

    test('should handle null input', () => {
      const match = createRegExpExecArray('Test.', 0, null as any);
      const sentenceText = 'Test.';
      const startIndex = 0;
      const lastIndex = 0;
      const result = createSentenceObject(
        sentenceText,
        startIndex,
        lastIndex,
        match
      );

      expect(result.text).toBe('Test.');
    });

    test('should handle undefined input', () => {
      const match = createRegExpExecArray('Test.', 0, undefined as any);
      const sentenceText = 'Test.';
      const startIndex = 0;
      const lastIndex = 0;
      const result = createSentenceObject(
        sentenceText,
        startIndex,
        lastIndex,
        match
      );

      expect(result.text).toBe('Test.');
    });
  });

  describe('createSentenceObject - Index Handling', () => {
    test('should handle match at start of text', () => {
      const match = createRegExpExecArray(
        'First sentence.',
        0,
        'First sentence. Second sentence.'
      );
      const sentenceText = 'First sentence.';
      const startIndex = 100;
      const lastIndex = 0;
      const result = createSentenceObject(
        sentenceText,
        startIndex,
        lastIndex,
        match
      );

      expect(result.text).toBe('First sentence.');
    });

    test('should handle match in middle of text', () => {
      const match = createRegExpExecArray(
        'Middle sentence.',
        16,
        'First sentence. Middle sentence. Last sentence.'
      );
      const sentenceText = 'Middle sentence.';
      const startIndex = 50;
      const lastIndex = 10;
      const result = createSentenceObject(
        sentenceText,
        startIndex,
        lastIndex,
        match
      );

      expect(result.text).toBe('Middle sentence.');
    });

    test('should handle match at end of text', () => {
      const match = createRegExpExecArray(
        'Last sentence.',
        35,
        'First sentence. Middle sentence. Last sentence.'
      );
      const sentenceText = 'Last sentence.';
      const startIndex = 200;
      const lastIndex = 15;
      const result = createSentenceObject(
        sentenceText,
        startIndex,
        lastIndex,
        match
      );

      expect(result.text).toBe('Last sentence.');
    });
  });

  describe('createSentenceObject - Complex Scenarios', () => {
    test('should handle sentence with special characters', () => {
      const match = createRegExpExecArray(
        'Sentence with "quotes" and (parentheses).',
        0,
        'Sentence with "quotes" and (parentheses).'
      );
      const sentenceText = 'Sentence with "quotes" and (parentheses).';
      const startIndex = 0;
      const lastIndex = 0;
      const result = createSentenceObject(
        sentenceText,
        startIndex,
        lastIndex,
        match
      );

      expect(result.text).toBe('Sentence with "quotes" and (parentheses).');
    });

    test('should handle sentence with numbers', () => {
      const match = createRegExpExecArray(
        'The price is $12.99 today.',
        0,
        'The price is $12.99 today.'
      );
      const sentenceText = 'The price is $12.99 today.';
      const startIndex = 10;
      const lastIndex = 5;
      const result = createSentenceObject(
        sentenceText,
        startIndex,
        lastIndex,
        match
      );

      expect(result.text).toBe('The price is $12.99 today.');
    });

    test('should handle sentence with unicode characters', () => {
      const match = createRegExpExecArray(
        'Text with émojis 🎉 and 中文.',
        0,
        'Text with émojis 🎉 and 中文.'
      );
      const sentenceText = 'Text with émojis 🎉 and 中文.';
      const startIndex = 0;
      const lastIndex = 0;
      const result = createSentenceObject(
        sentenceText,
        startIndex,
        lastIndex,
        match
      );

      expect(result.text).toBe('Text with émojis 🎉 and 中文.');
    });

    test('should handle very long sentence', () => {
      const longSentence =
        'This is a very long sentence that contains many words and should test the word counting and duration calculation functionality of the createSentenceObject function with various edge cases and scenarios.';
      const match = createRegExpExecArray(longSentence, 0, longSentence);
      const sentenceText = longSentence;
      const startIndex = 0;
      const lastIndex = 0;
      const result = createSentenceObject(
        sentenceText,
        startIndex,
        lastIndex,
        match
      );

      expect(result.text).toBe(longSentence);
    });
  });
});
