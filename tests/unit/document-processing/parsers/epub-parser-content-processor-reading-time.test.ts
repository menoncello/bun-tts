import { describe, test, expect } from 'bun:test';
import { calculateReadingTime } from '../../../../src/core/document-processing/parsers/epub-parser-content-processor.js';

// Constants for reading time calculation
const WORDS_PER_MINUTE = 200;

// Test data creation functions
function createStandardWordCounts() {
  return [100, 1000, 0];
}

function createRoundingTestCases() {
  return [
    { words: 400, expected: 2, description: 'exact division' },
    { words: 201, expected: 2, description: 'partial minute' },
    { words: 1, expected: 1, description: 'small partial amount' },
  ];
}

function createEdgeCaseWordCounts() {
  return [
    { words: 50000, expected: 250, description: 'very large document' },
    { words: -10, expected: -0, description: 'negative word count' },
    { words: 123.5, expected: 1, description: 'fractional word count' },
    { words: 399.9, expected: 2, description: 'decimal word count' },
  ];
}

function createStandardSpeedTestCases() {
  return [
    { words: 200, expectedMinutes: 1 },
    { words: 400, expectedMinutes: 2 },
    { words: 600, expectedMinutes: 3 },
    { words: 1000, expectedMinutes: 5 },
  ];
}

function createBookLengthTestCases() {
  return [
    { words: 70000, description: 'Short novel' },
    { words: 100000, description: 'Standard novel' },
    { words: 150000, description: 'Long novel' },
  ];
}

function _createBoundaryTestCases() {
  return [
    { words: 1, expected: 1, description: 'single word' },
    { words: Number.MAX_SAFE_INTEGER, description: 'maximum safe integer' },
    { words: Infinity, expected: Infinity, description: 'Infinity' },
    { words: Number.NaN, description: 'NaN' },
  ];
}

// Helper assertion functions
function assertReadingTime(wordCount: number, expectedMinutes: number) {
  const result = calculateReadingTime(wordCount);
  expect(result).toBe(expectedMinutes);
}

function assertReadingTimeCalculation(wordCount: number) {
  const result = calculateReadingTime(wordCount);
  expect(result).toBe(Math.ceil(wordCount / WORDS_PER_MINUTE));
}

function assertPositiveReadingTime(wordCount: number) {
  const result = calculateReadingTime(wordCount);
  expect(result).toBeGreaterThan(0);
}

function assertFiniteResult(wordCount: number) {
  const result = calculateReadingTime(wordCount);
  expect(Number.isFinite(result)).toBe(true);
}

function assertNaNResult(wordCount: number) {
  const result = calculateReadingTime(wordCount);
  expect(Number.isNaN(result)).toBe(true);
}

function assertInfinityResult(wordCount: number) {
  const result = calculateReadingTime(wordCount);
  expect(result).toBe(Infinity);
}

function runPerformanceTest(
  wordCount: number,
  iterations: number,
  maxTime: number
) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    calculateReadingTime(wordCount);
  }
  const end = performance.now();
  expect(end - start).toBeLessThan(maxTime);
}

function assertConsistency(wordCount: number, iterations: number) {
  const results: number[] = [];
  for (let i = 0; i < iterations; i++) {
    results.push(calculateReadingTime(wordCount));
  }
  expect(results.every((r) => r === results[0])).toBe(true);
}

describe('EPUB Parser Content Processor - calculateReadingTime (Basic)', () => {
  describe('basic reading time calculation', () => {
    test('should calculate reading time for standard word counts', () => {
      const wordCounts = createStandardWordCounts();

      for (const wordCount of wordCounts) {
        assertReadingTimeCalculation(wordCount);
      }
    });
  });
});

describe('EPUB Parser Content Processor - calculateReadingTime (Rounding)', () => {
  describe('rounding behavior', () => {
    test('should handle various rounding scenarios', () => {
      const testCases = createRoundingTestCases();

      for (const { words, expected } of testCases) {
        assertReadingTime(words, expected);
      }
    });
  });
});

describe('EPUB Parser Content Processor - calculateReadingTime (Edge Cases)', () => {
  describe('edge cases', () => {
    test('should handle edge case word counts', () => {
      const testCases = createEdgeCaseWordCounts();

      for (const { words, expected } of testCases) {
        if (typeof expected === 'number' && !Number.isNaN(expected)) {
          assertReadingTime(words, expected);
        }
      }
    });

    test('should handle negative word count gracefully', () => {
      const result = calculateReadingTime(-10);
      expect(result).toBe(-0);
    });
  });
});

describe('EPUB Parser Content Processor - calculateReadingTime (Speed)', () => {
  describe('reading speed assumptions', () => {
    test('should use 200 words per minute as standard', () => {
      const testCases = createStandardSpeedTestCases();

      for (const { words, expectedMinutes } of testCases) {
        assertReadingTime(words, expectedMinutes);
      }
    });

    test('should handle realistic book lengths', () => {
      const bookLengths = createBookLengthTestCases();

      for (const { words } of bookLengths) {
        assertPositiveReadingTime(words);
        assertReadingTimeCalculation(words);
      }
    });
  });
});

describe('EPUB Parser Content Processor - calculateReadingTime (Boundaries)', () => {
  describe('boundary conditions', () => {
    test('should handle single word', () => {
      assertReadingTime(1, 1);
    });

    test('should handle maximum safe integer', () => {
      const wordCount = Number.MAX_SAFE_INTEGER;
      assertPositiveReadingTime(wordCount);
      assertFiniteResult(wordCount);
    });

    test('should handle Infinity', () => {
      assertInfinityResult(Infinity);
    });

    test('should handle NaN', () => {
      assertNaNResult(Number.NaN);
    });
  });
});

describe('EPUB Parser Content Processor - calculateReadingTime (Performance)', () => {
  describe('performance considerations', () => {
    test('should handle repeated calculations efficiently', () => {
      runPerformanceTest(1000, 10000, 100);
    });

    test('should be consistent across multiple calls', () => {
      assertConsistency(1234, 100);
    });
  });
});
