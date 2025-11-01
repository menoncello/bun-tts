/**
 * Unit tests for parser-core.ts performance and timing.
 * Tests performance characteristics, timing, and efficiency.
 */

import { describe, test, expect, beforeEach, mock } from 'bun:test';
import type { MarkdownParserConfig } from '../../../../src/core/document-processing/config/markdown-parser-config';
import { MarkdownParseError } from '../../../../src/core/document-processing/errors/markdown-parse-error';
import {
  parseMarkdownDocument,
  tokenizeMarkdown,
  buildDocumentStructure,
} from '../../../../src/core/document-processing/parsers/parser-core';
import type { Logger } from '../../../../src/interfaces/logger';
import {
  MockLoggerFactory,
  MarkdownParserConfigFactory,
} from '../../../../tests/support/document-processing-factories';
import { TestCleanupManager } from '../../../../tests/support/test-utilities';

describe('parser-core - Performance and Timing', () => {
  let mockLogger: Logger & { mock: ReturnType<typeof mock> };
  let mockConfig: MarkdownParserConfig;
  let mockChapterExtractor: ReturnType<typeof mock>;

  beforeEach(() => {
    mockLogger = MockLoggerFactory.createWithExpectations();
    mockConfig = MarkdownParserConfigFactory.createDefault();
    mockChapterExtractor = mock(() => []);

    TestCleanupManager.registerCleanup(() => {
      mockLogger = null as any;
      mockConfig = null as any;
      mockChapterExtractor = null as any;
    });
  });

  describe('performance and timing', () => {
    test('should track processing time', async () => {
      const content = '# Test Document\n\nContent here.';
      const expectedChapters = [
        {
          id: 'chapter-1',
          title: 'Test Document',
          level: 1,
          position: 0,
          startPosition: 0,
          endPosition: 30,
          startIndex: 0,
          charRange: {
            start: 0,
            end: 30,
          },
          depth: 1,
          wordCount: 3,
          estimatedDuration: 1.2,
          paragraphs: [],
        },
      ];

      mockChapterExtractor.mockReturnValue(expectedChapters);

      const startTime = Date.now();
      await parseMarkdownDocument(
        content,
        mockConfig,
        mockLogger,
        mockChapterExtractor
      );
      const endTime = Date.now();

      // Should complete reasonably quickly
      expect(endTime - startTime).toBeLessThan(1000);
    });

    test('should handle concurrent parsing requests', async () => {
      const content =
        '# Test Document\n\nThis is a test document with multiple sentences to ensure better confidence scoring. It should have sufficient content to pass confidence thresholds.';
      const expectedChapters = [
        {
          id: 'chapter-1',
          title: 'Test Document',
          level: 1,
          position: 0,
          startPosition: 0,
          endPosition: 150,
          startIndex: 0,
          charRange: {
            start: 0,
            end: 150,
          },
          depth: 1,
          wordCount: 20,
          estimatedDuration: 8.0,
          paragraphs: [
            {
              id: 'paragraph-1',
              type: 'text',
              sentences: [
                {
                  id: 'sentence-1',
                  text: 'This is a test document with multiple sentences to ensure better confidence scoring.',
                  position: 0,
                  wordCount: 12,
                  estimatedDuration: 4.8,
                  hasFormatting: false,
                },
              ],
              position: 0,
              wordCount: 12,
              rawText:
                'This is a test document with multiple sentences to ensure better confidence scoring.',
              includeInAudio: true,
              confidence: 0.9,
              text: 'This is a test document with multiple sentences to ensure better confidence scoring.',
            },
            {
              id: 'paragraph-2',
              type: 'text',
              sentences: [
                {
                  id: 'sentence-2',
                  text: 'It should have sufficient content to pass confidence thresholds.',
                  position: 0,
                  wordCount: 8,
                  estimatedDuration: 3.2,
                  hasFormatting: false,
                },
              ],
              position: 1,
              wordCount: 8,
              rawText:
                'It should have sufficient content to pass confidence thresholds.',
              includeInAudio: true,
              confidence: 0.9,
              text: 'It should have sufficient content to pass confidence thresholds.',
            },
          ],
        },
      ];

      mockChapterExtractor.mockReturnValue(expectedChapters);

      const promises = Array.from({ length: 10 }, () =>
        parseMarkdownDocument(
          content,
          mockConfig,
          mockLogger,
          mockChapterExtractor
        )
      );

      const results = await Promise.all(promises);

      // All requests should complete successfully
      expect(results).toHaveLength(10);
      for (const result of results) {
        expect(result).not.toBeInstanceOf(MarkdownParseError);
      }
    });

    test('should handle large documents efficiently', async () => {
      const largeContent = `# Large Document\n\n${'Large paragraph. '.repeat(1000)}`;
      const expectedChapters = [
        {
          id: 'chapter-1',
          title: 'Large Document',
          level: 1,
          position: 0,
          startPosition: 0,
          endPosition: 20000,
          startIndex: 0,
          charRange: {
            start: 0,
            end: 20000,
          },
          depth: 1,
          wordCount: 2002,
          estimatedDuration: 800.8,
          paragraphs: [],
        },
      ];

      mockChapterExtractor.mockReturnValue(expectedChapters);

      const startTime = Date.now();
      const result = await parseMarkdownDocument(
        largeContent,
        mockConfig,
        mockLogger,
        mockChapterExtractor
      );
      const endTime = Date.now();

      expect(result).not.toBeInstanceOf(MarkdownParseError);
      // Large documents should still complete in reasonable time
      expect(endTime - startTime).toBeLessThan(2000);
    });

    test('should maintain consistent performance across multiple runs', async () => {
      const content = '# Performance Test\n\nContent for testing.';
      const expectedChapters = [
        {
          id: 'chapter-1',
          title: 'Performance Test',
          level: 1,
          position: 0,
          startPosition: 0,
          endPosition: 40,
          startIndex: 0,
          charRange: {
            start: 0,
            end: 40,
          },
          depth: 1,
          wordCount: 4,
          estimatedDuration: 1.6,
          paragraphs: [],
        },
      ];

      mockChapterExtractor.mockReturnValue(expectedChapters);

      const times: number[] = [];

      // Run multiple times and measure performance
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        await parseMarkdownDocument(
          content,
          mockConfig,
          mockLogger,
          mockChapterExtractor
        );
        const endTime = Date.now();
        times.push(endTime - startTime);
      }

      // Performance should be relatively consistent
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      // Should not have extreme performance variations
      // Use a more reasonable threshold that handles zero average times
      const reasonableThreshold = Math.max(avgTime * 2, 10);
      expect(maxTime - minTime).toBeLessThan(reasonableThreshold);
      expect(avgTime).toBeLessThan(100);
    });

    test('should handle memory-efficient parsing', async () => {
      const content = '# Memory Test\n\nContent for memory testing.';
      const expectedChapters = [
        {
          id: 'chapter-1',
          title: 'Memory Test',
          level: 1,
          position: 0,
          startPosition: 0,
          endPosition: 50,
          startIndex: 0,
          charRange: {
            start: 0,
            end: 50,
          },
          depth: 1,
          wordCount: 5,
          estimatedDuration: 2.0,
          paragraphs: [],
        },
      ];

      mockChapterExtractor.mockReturnValue(expectedChapters);

      const memoryBefore = process.memoryUsage().heapUsed;

      // Parse multiple documents to test memory usage
      const promises = Array.from({ length: 50 }, () =>
        parseMarkdownDocument(
          content,
          mockConfig,
          mockLogger,
          mockChapterExtractor
        )
      );

      await Promise.all(promises);

      const memoryAfter = process.memoryUsage().heapUsed;
      const memoryIncrease = memoryAfter - memoryBefore;

      // Memory usage should be reasonable
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
    });
  });

  describe('tokenization performance', () => {
    test('should tokenize content efficiently', () => {
      const content = `# Performance Test\n\n${'Paragraph with content. '.repeat(100)}`;

      const startTime = Date.now();
      const result = tokenizeMarkdown(content);
      const endTime = Date.now();

      expect(result).not.toBeInstanceOf(MarkdownParseError);
      expect(endTime - startTime).toBeLessThan(500); // Should complete quickly
    });

    test('should handle large content tokenization', () => {
      const largeContent = `# Large Tokenization Test\n\n${'Large paragraph. '.repeat(10000)}`;

      const startTime = Date.now();
      const result = tokenizeMarkdown(largeContent);
      const endTime = Date.now();

      expect(result).not.toBeInstanceOf(MarkdownParseError);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in reasonable time
    });

    test('should maintain tokenization performance consistency', () => {
      const content = '# Consistency Test\n\nContent for consistency testing.';
      const times: number[] = [];

      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        tokenizeMarkdown(content);
        const endTime = Date.now();
        times.push(endTime - startTime);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      expect(avgTime).toBeLessThan(50); // Should be very fast for small content
    });
  });

  describe('structure building performance', () => {
    test('should build document structure efficiently', async () => {
      const content = '# Structure Test\n\nContent for structure testing.';
      const tokens = tokenizeMarkdown(content);

      if (Array.isArray(tokens)) {
        const chapters = [
          {
            id: 'chapter-1',
            title: 'Structure Test',
            level: 1,
            position: 0,
            startPosition: 0,
            endPosition: 50,
            startIndex: 0,
            charRange: {
              start: 0,
              end: 50,
            },
            depth: 1,
            wordCount: 5,
            estimatedDuration: 2.0,
            paragraphs: [],
          },
        ];

        const startTime = Date.now();
        const result = await buildDocumentStructure(
          content,
          tokens,
          new Date(),
          () => chapters
        );
        const endTime = Date.now();

        expect(result).not.toBeInstanceOf(MarkdownParseError);
        expect(endTime - startTime).toBeLessThan(500);
      }
    });

    test('should handle complex structure building efficiently', async () => {
      const content = `# Complex Structure Test

## Section 1

Content for section 1.

### Subsection 1.1

Subsection content.

### Subsection 1.2

More subsection content.

## Section 2

Content for section 2.

### Subsection 2.1

Final subsection content.`;

      const tokens = tokenizeMarkdown(content);

      if (Array.isArray(tokens)) {
        const chapters = [
          {
            id: 'chapter-1',
            title: 'Complex Structure Test',
            level: 1,
            position: 0,
            startPosition: 0,
            endPosition: 250,
            startIndex: 0,
            charRange: {
              start: 0,
              end: 250,
            },
            depth: 1,
            wordCount: 25,
            estimatedDuration: 10.0,
            paragraphs: [],
          },
        ];

        const startTime = Date.now();
        const result = await buildDocumentStructure(
          content,
          tokens,
          new Date(),
          () => chapters
        );
        const endTime = Date.now();

        expect(result).not.toBeInstanceOf(MarkdownParseError);
        expect(endTime - startTime).toBeLessThan(1000);
      }
    });

    test('should handle concurrent structure building', async () => {
      const content = '# Concurrent Structure Test\n\nContent here.';
      const tokens = tokenizeMarkdown(content);

      if (Array.isArray(tokens)) {
        const chapters = [
          {
            id: 'chapter-1',
            title: 'Concurrent Structure Test',
            level: 1,
            position: 0,
            startPosition: 0,
            endPosition: 40,
            startIndex: 0,
            charRange: {
              start: 0,
              end: 40,
            },
            depth: 1,
            wordCount: 4,
            estimatedDuration: 1.6,
            paragraphs: [],
          },
        ];

        const promises = Array.from({ length: 10 }, () =>
          buildDocumentStructure(content, tokens, new Date(), () => chapters)
        );

        const startTime = Date.now();
        const results = await Promise.all(promises);
        const endTime = Date.now();

        expect(results).toHaveLength(10);
        for (const result of results) {
          expect(result).not.toBeInstanceOf(MarkdownParseError);
        }

        // Concurrent operations should complete in reasonable time
        expect(endTime - startTime).toBeLessThan(1000);
      }
    });
  });

  // Helper functions to reduce nesting
  async function measureProcessingTimesForSizes(
    sizes: number[],
    mockChapterExtractor: ReturnType<typeof mock>
  ): Promise<number[]> {
    const times: number[] = [];

    for (const size of sizes) {
      const content = `# Scale Test ${size}\n${'Paragraph. '.repeat(size)}`;
      const expectedChapters = [
        {
          id: 'chapter-1',
          title: `Scale Test ${size}`,
          level: 1,
          position: 0,
          startPosition: 0,
          endPosition: (size + 3) * 10,
          startIndex: 0,
          charRange: {
            start: 0,
            end: (size + 3) * 10,
          },
          depth: 1,
          wordCount: size + 3,
          estimatedDuration: (size + 3) * 0.4,
          paragraphs: [],
        },
      ];

      mockChapterExtractor.mockReturnValue(expectedChapters);

      const startTime = Date.now();
      await parseMarkdownDocument(
        content,
        mockConfig,
        mockLogger,
        mockChapterExtractor
      );
      const endTime = Date.now();

      times.push(endTime - startTime);
    }

    return times;
  }

  async function measureConcurrentLoadTimes(
    loads: number[],
    mockChapterExtractor: ReturnType<typeof mock>
  ): Promise<number[]> {
    const times: number[] = [];

    for (const load of loads) {
      const content = '# Load Test\n\nContent for load testing.';
      const expectedChapters = [
        {
          id: 'chapter-1',
          title: 'Load Test',
          level: 1,
          position: 0,
          startPosition: 0,
          endPosition: 50,
          startIndex: 0,
          charRange: {
            start: 0,
            end: 50,
          },
          depth: 1,
          wordCount: 5,
          estimatedDuration: 2.0,
          paragraphs: [],
        },
      ];

      mockChapterExtractor.mockReturnValue(expectedChapters);

      const promises = Array.from({ length: load }, () =>
        parseMarkdownDocument(
          content,
          mockConfig,
          mockLogger,
          mockChapterExtractor
        )
      );

      const startTime = Date.now();
      await Promise.all(promises);
      const endTime = Date.now();

      times.push(endTime - startTime);
    }

    return times;
  }

  describe('scalability tests', () => {
    test('should scale with document size', async () => {
      const sizes = [100, 1000, 10000];
      const times = await measureProcessingTimesForSizes(
        sizes,
        mockChapterExtractor
      );

      validateScalingPerformance(times);
    });

    test('should handle concurrent requests with increasing load', async () => {
      const loads = [1, 10, 50];
      const times = await measureConcurrentLoadTimes(
        loads,
        mockChapterExtractor
      );

      validateLoadPerformance(times);
    });
  });
});

// Helper functions moved to outer scope for better scoping
function validateScalingPerformance(times: number[]): void {
  expect(times[0]).toBeLessThan(100);
  expect(times[1]).toBeLessThan(500);
  expect(times[2]).toBeLessThan(2000);

  // Use a more reasonable scaling factor - document processing should not scale linearly
  // Allow for some overhead but ensure it's not exponential
  const time1 = times[1] ?? 1;
  const time2 = times[2] ?? 1;
  const scalingFactor = time1 > 0 ? time2 / time1 : 0;
  expect(scalingFactor).toBeLessThan(20); // Allow up to 20x scaling for 10x content increase
}

function validateLoadPerformance(times: number[]): void {
  expect(times[0]).toBeLessThan(50);
  expect(times[1]).toBeLessThan(500);
  expect(times[2]).toBeLessThan(2000);
}
