import { describe, test, expect } from 'bun:test';
import { splitIntoSentences } from '../../../../src/core/document-processing/parsers/epub-parser-content-processor.js';

describe('EPUB Parser Content Processor - Advanced Sentence Splitting - Punctuation Handling', () => {
  test('should handle different punctuation marks', () => {
    const text = 'Question? Exclamation! Period.';
    const startIndex = 0;
    const result = splitIntoSentences(text, startIndex);

    expect(result.length).toBe(3);
    expect(result[0]?.text).toBe('Question?');
    expect(result[1]?.text).toBe('Exclamation!');
    expect(result[2]?.text).toBe('Period.');
  });

  test('should handle multiple punctuation marks', () => {
    const text = 'What?! Amazing... Really?!';
    const startIndex = 0;
    const result = splitIntoSentences(text, startIndex);

    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  test('should handle decimal numbers correctly', () => {
    const text = 'The price is 12.99 dollars. It is reasonable.';
    const startIndex = 0;
    const result = splitIntoSentences(text, startIndex);

    expect(result.length).toBe(2);
    expect(result[0]?.text).toContain('12.99');
    expect(result[1]?.text).toBe('It is reasonable.');
  });

  test('should handle abbreviations', () => {
    const text = 'Dr. Smith went to the U.S.A. He was happy.';
    const startIndex = 0;
    const result = splitIntoSentences(text, startIndex);

    expect(result.length).toBeGreaterThanOrEqual(2);
  });
});

describe('EPUB Parser Content Processor - Advanced Sentence Splitting - Special Characters', () => {
  test('should handle Unicode characters', () => {
    const text = 'Text with émojis 🎉 and 中文 characters.';
    const startIndex = 0;
    const result = splitIntoSentences(text, startIndex);

    expect(result.length).toBe(1);
    expect(result[0]?.text).toContain('🎉');
    expect(result[0]?.text).toContain('中文');
  });

  test('should handle quotes and parentheses', () => {
    const text = '"Quoted sentence." (Parenthesized sentence.)';
    const startIndex = 0;
    const result = splitIntoSentences(text, startIndex);

    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  test('should handle mixed punctuation', () => {
    const text = 'Wait... what?! Yes, exactly!';
    const startIndex = 0;
    const result = splitIntoSentences(text, startIndex);

    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  test('should handle very long sentences', () => {
    const longSentence =
      'This is a very long sentence that contains multiple clauses and continues on for quite some time without ending until finally it does end.';
    const startIndex = 0;
    const result = splitIntoSentences(longSentence, startIndex);

    expect(result.length).toBe(1);
    expect(result[0]?.text).toBe(longSentence);
  });
});

describe('EPUB Parser Content Processor - Advanced Sentence Splitting - Edge Cases', () => {
  test('should handle sentence ending with multiple punctuation', () => {
    const text = 'Are you sure?!';
    const startIndex = 0;
    const result = splitIntoSentences(text, startIndex);

    expect(result.length).toBe(1);
    expect(result[0]?.text).toBe('Are you sure?!');
  });

  test('should handle ellipsis', () => {
    const text = 'The story continues... What happens next?';
    const startIndex = 0;
    const result = splitIntoSentences(text, startIndex);

    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  test('should handle consecutive punctuation', () => {
    const text = 'Wow!!! Amazing!!!';
    const startIndex = 0;
    const result = splitIntoSentences(text, startIndex);

    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  test('should handle no punctuation but forced sentence split', () => {
    const text = 'No punctuation here but should be processed';
    const startIndex = 0;
    const result = splitIntoSentences(text, startIndex);

    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  test('should handle only punctuation', () => {
    const text = '...?!';
    const startIndex = 0;
    const result = splitIntoSentences(text, startIndex);

    // Should handle this gracefully without crashing
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('EPUB Parser Content Processor - Advanced Sentence Splitting - Sentence Object Properties', () => {
  test('should create sentence objects with required properties', () => {
    const text = 'Test sentence.';
    const startIndex = 10;
    const result = splitIntoSentences(text, startIndex);

    expect(result.length).toBe(1);
    expect(result[0]).toHaveProperty('text');
    expect(result[0]).toHaveProperty('startIndex');
    expect(result[0]).toHaveProperty('endIndex');
    expect(typeof result[0]?.text).toBe('string');
    expect(typeof result[0]?.startIndex).toBe('number');
    expect(typeof result[0]?.endIndex).toBe('number');
  });

  test('should handle sentence with special formatting', () => {
    const text = 'Sentence with **bold** text.';
    const startIndex = 0;
    const result = splitIntoSentences(text, startIndex);

    expect(result.length).toBe(1);
    expect(result[0]?.text).toBe('Sentence with **bold** text.');
    expect(result[0]?.startIndex).toBe(0);
    expect(result[0]?.endIndex).toBe(text.length);
  });
});
