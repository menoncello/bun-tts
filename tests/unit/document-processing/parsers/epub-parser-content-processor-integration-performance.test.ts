import { describe, test, expect } from 'bun:test';
import {
  processChapterContent,
  splitIntoParagraphs,
} from '../../../../src/core/document-processing/parsers/epub-parser-content-processor.js';
import type { EPUBParseOptions } from '../../../../src/core/document-processing/parsers/epub-parser-types.js';

// Helper function to create large test content
function createLargeTestContent(paragraphCount = 50): string {
  const paragraphs = [];
  for (let i = 1; i <= paragraphCount; i++) {
    paragraphs.push(
      `This is paragraph ${i} with multiple sentences. It contains important information. Is it useful? Yes!`
    );
  }
  // Use double newlines to ensure proper paragraph separation
  return paragraphs.join('\n\n');
}

// Helper function to run performance test and check results
function runPerformanceTest(
  content: string,
  options: EPUBParseOptions,
  expectedMinWords = 500
) {
  const startTime = performance.now();
  const processed = processChapterContent(content, options);
  const paragraphObjects = splitIntoParagraphs(processed);
  const endTime = performance.now();

  // Should process large content quickly (under 100ms)
  expect(endTime - startTime).toBeLessThan(100);
  // Should handle the content and create at least some paragraphs
  expect(paragraphObjects.length).toBeGreaterThan(0);

  const totalWords = paragraphObjects.reduce((sum, p) => sum + p.wordCount, 0);
  // Should have significant word count
  expect(totalWords).toBeGreaterThan(expectedMinWords);
}

// Helper function to run consistency test
function runConsistencyTest(
  content: string,
  options: EPUBParseOptions,
  iterations = 10
) {
  const results: Array<{
    processed: string;
    wordCount?: number;
    sentenceCount?: number;
  }> = [];

  for (let i = 0; i < iterations; i++) {
    const processed = processChapterContent(content, options);
    const paragraphs = splitIntoParagraphs(processed);
    results.push({
      processed,
      wordCount: paragraphs[0]?.wordCount,
      sentenceCount: paragraphs[0]?.sentences?.length,
    });
  }

  // All results should be identical
  expect(results.every((r) => r.processed === results[0]?.processed)).toBe(
    true
  );
  expect(results.every((r) => r.wordCount === results[0]?.wordCount)).toBe(
    true
  );
  expect(
    results.every((r) => r.sentenceCount === results[0]?.sentenceCount)
  ).toBe(true);
}

describe('EPUB Parser Content Processor - Integration Performance', () => {
  describe('large content processing', () => {
    test('should handle large chapter content efficiently', () => {
      const content = createLargeTestContent(50);
      const options: EPUBParseOptions = { preserveHTML: false };

      runPerformanceTest(content, options);
    });
  });

  describe('consistency checks', () => {
    test('should maintain consistency across multiple processing runs', () => {
      const content =
        '<p>Test content for consistency checking. This should be processed identically each time!</p>';
      const options: EPUBParseOptions = { preserveHTML: false };

      runConsistencyTest(content, options);
    });
  });
});
