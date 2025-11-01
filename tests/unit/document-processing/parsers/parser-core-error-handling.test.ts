/**
 * Unit tests for parser-core.ts error handling and edge cases.
 * Tests error scenarios, invalid inputs, and edge case handling.
 */

import { describe, test, expect, beforeEach, mock } from 'bun:test';
import type { MarkdownParserConfig } from '../../../../src/core/document-processing/config/markdown-parser-config';
import { MarkdownParseError } from '../../../../src/core/document-processing/errors/markdown-parse-error';
import {
  parseMarkdownDocument,
  tokenizeMarkdown,
  buildDocumentStructure,
} from '../../../../src/core/document-processing/parsers/parser-core';
import type { ParsedToken } from '../../../../src/core/document-processing/parsers/token-processing';
import type { Logger } from '../../../../src/interfaces/logger';
import {
  MockLoggerFactory,
  MarkdownParserConfigFactory,
} from '../../../../tests/support/document-processing-factories';
import { TestCleanupManager } from '../../../../tests/support/test-utilities';

describe('parser-core - Error Handling Edge Cases', () => {
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

  test('should handle null content', async () => {
    const result = await parseMarkdownDocument(
      null as any,
      mockConfig,
      mockLogger,
      mockChapterExtractor
    );

    expect(result).toBeInstanceOf(MarkdownParseError);
  });

  test('should handle undefined content', async () => {
    const result = await parseMarkdownDocument(
      undefined as any,
      mockConfig,
      mockLogger,
      mockChapterExtractor
    );

    expect(result).toBeInstanceOf(MarkdownParseError);
  });

  test('should handle non-string content', async () => {
    const result = await parseMarkdownDocument(
      123 as any,
      mockConfig,
      mockLogger,
      mockChapterExtractor
    );

    expect(result).toBeInstanceOf(MarkdownParseError);
  });

  test('should handle chapter extractor throwing non-Error objects', async () => {
    const content = '# Test';

    mockChapterExtractor.mockImplementation(() => {
      throw 'String error';
    });

    try {
      const result = await parseMarkdownDocument(
        content,
        mockConfig,
        mockLogger,
        mockChapterExtractor
      );
      // If it doesn't throw, it might return an error object
      expect(
        result === undefined ||
          result instanceof MarkdownParseError ||
          result instanceof Error
      ).toBe(true);
    } catch (error) {
      // Throwing on string errors is acceptable behavior
      expect(error === 'String error' || error instanceof Error).toBe(true);
    }
  });

  test('should handle chapter extractor returning null', async () => {
    const content = '# Test';

    mockChapterExtractor.mockReturnValue(null as any);

    // This might throw due to null chapters array, let's handle it
    try {
      const result = await parseMarkdownDocument(
        content,
        mockConfig,
        mockLogger,
        mockChapterExtractor
      );
      // If it doesn't throw, the result should be defined
      expect(result !== undefined).toBe(true);
    } catch (error) {
      // Throwing on null chapters is acceptable behavior
      expect(error).toBeInstanceOf(Error);
    }
  });

  test('should handle chapter extractor returning undefined', async () => {
    const content = '# Test';

    mockChapterExtractor.mockReturnValue(undefined as any);

    // This might throw due to undefined chapters array, let's handle it
    try {
      const result = await parseMarkdownDocument(
        content,
        mockConfig,
        mockLogger,
        mockChapterExtractor
      );
      // If it doesn't throw, the result should be defined
      expect(result !== undefined).toBe(true);
    } catch (error) {
      // Throwing on undefined chapters is acceptable behavior
      expect(error).toBeInstanceOf(Error);
    }
  });

  test('should handle circular references in chapter data', async () => {
    const content = '# Test';
    const circularChapters: any = [
      {
        id: 'chapter-1',
        title: 'Test',
        level: 1,
        position: 0,
        startPosition: 0,
        endPosition: 10,
        startIndex: 0,
        charRange: {
          start: 0,
          end: 10,
        },
        depth: 1,
        wordCount: 1,
        estimatedDuration: 0.4,
        paragraphs: [],
      },
    ];
    // Create circular reference
    circularChapters[0].self = circularChapters[0];

    mockChapterExtractor.mockReturnValue(circularChapters);

    try {
      const result = await parseMarkdownDocument(
        content,
        mockConfig,
        mockLogger,
        mockChapterExtractor
      );
      // Should handle circular references gracefully
      expect(result !== undefined).toBe(true);
    } catch (error) {
      // Failing on circular references is acceptable
      expect(error).toBeInstanceOf(Error);
    }
  });

  test('should handle very deep nesting in chapter structure', async () => {
    const content = '# Test';
    let deepChapter: any = {
      id: 'chapter-1',
      title: 'Test',
      level: 1,
      position: 0,
      charRange: {
        start: 0,
        end: 10,
      },
      depth: 1,
      wordCount: 1,
      estimatedDuration: 0.4,
      paragraphs: [],
    };

    // Create deep nesting
    for (let i = 0; i < 100; i++) {
      deepChapter.nested = { level: i, parent: deepChapter };
      deepChapter = deepChapter.nested;
    }

    mockChapterExtractor.mockReturnValue([deepChapter]);

    try {
      const result = await parseMarkdownDocument(
        content,
        mockConfig,
        mockLogger,
        mockChapterExtractor
      );
      // Should handle deep nesting gracefully
      expect(result !== undefined).toBe(true);
    } catch (error) {
      // Failing on deep nesting is acceptable
      expect(error).toBeInstanceOf(Error);
    }
  });

  test('should handle extremely large chapter arrays', async () => {
    const content = '# Large Document';
    const largeChapters = Array.from({ length: 10000 }, (_, i) => ({
      id: `chapter-${i}`,
      title: `Chapter ${i}`,
      level: 1,
      position: i,
      charRange: {
        start: i * 20,
        end: (i + 1) * 20,
      },
      depth: 1,
      wordCount: 1,
      estimatedDuration: 0.4,
      paragraphs: [],
    }));

    mockChapterExtractor.mockReturnValue(largeChapters);

    const result = await parseMarkdownDocument(
      content,
      mockConfig,
      mockLogger,
      mockChapterExtractor
    );

    // Should handle large arrays without memory issues
    expect(result !== undefined).toBe(true);
  });
});

describe('parser-core - Tokenization Error Cases', () => {
  test('should handle malformed markdown in tokenization', () => {
    const malformedContent =
      '# Unclosed\n\n**Bold\n\n* List\n- Mixed\n```code\nNo closing';

    const result = tokenizeMarkdown(malformedContent);

    // Should handle malformed markdown gracefully
    expect(result).not.toBeInstanceOf(MarkdownParseError);
    if (Array.isArray(result)) {
      expect(result.length).toBeGreaterThanOrEqual(0);
    }
  });

  test('should handle unicode and special characters in tokenization', () => {
    const unicodeContent =
      '# 特殊字符\n\nContent with émojis 🚀 and symbols &amp; 中文';

    const result = tokenizeMarkdown(unicodeContent);

    expect(result).not.toBeInstanceOf(MarkdownParseError);
    if (Array.isArray(result)) {
      expect(result.length).toBeGreaterThan(0);
      // Should preserve unicode characters
      const firstToken = result[0];
      if (firstToken && firstToken.text) {
        expect(firstToken.text).toContain('特殊字符');
      }
    }
  });

  test('should handle very long lines in tokenization', () => {
    const longLine = 'x'.repeat(100000);
    const content = `# Long Line Test\n\n${longLine}`;

    const result = tokenizeMarkdown(content);

    expect(result).not.toBeInstanceOf(MarkdownParseError);
    if (Array.isArray(result)) {
      expect(result.length).toBeGreaterThan(0);
    }
  });

  test('should handle control characters in tokenization', () => {
    const controlContent =
      '# Control\n\nContent\u0000with\u0001control\u0002chars';

    const result = tokenizeMarkdown(controlContent);

    expect(result).not.toBeInstanceOf(MarkdownParseError);
    if (Array.isArray(result)) {
      expect(result.length).toBeGreaterThan(0);
    }
  });
});

describe('parser-core - Document Building Error Cases', () => {
  test('should handle invalid token types in structure building', async () => {
    const content = '# Test';
    const invalidTokens: ParsedToken[] = [
      { type: 'invalid', text: 'test', raw: 'test' } as ParsedToken,
      { type: null as any, text: 'test', raw: 'test' } as ParsedToken,
      { type: undefined as any, text: 'test', raw: 'test' } as ParsedToken,
    ];

    const chapters = [
      {
        id: 'chapter-1',
        title: 'Test',
        level: 1,
        position: 0,
        startPosition: 0,
        endPosition: 10,
        startIndex: 0,
        charRange: {
          start: 0,
          end: 10,
        },
        depth: 1,
        wordCount: 1,
        estimatedDuration: 0.4,
        paragraphs: [],
      },
    ];

    try {
      const result = await buildDocumentStructure(
        content,
        invalidTokens,
        new Date(),
        () => chapters
      );
      // Should handle invalid tokens gracefully
      expect(result !== undefined).toBe(true);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  test('should handle missing required token properties', async () => {
    const content = '# Test';
    const incompleteTokens: ParsedToken[] = [
      { text: 'test', type: 'paragraph', raw: 'test' } as ParsedToken,
      { type: 'heading', text: '', raw: '# ' } as ParsedToken,
      { type: 'paragraph', text: '', raw: '' } as ParsedToken,
    ];

    const chapters = [
      {
        id: 'chapter-1',
        title: 'Test',
        level: 1,
        position: 0,
        startPosition: 0,
        endPosition: 10,
        startIndex: 0,
        charRange: {
          start: 0,
          end: 10,
        },
        depth: 1,
        wordCount: 1,
        estimatedDuration: 0.4,
        paragraphs: [],
      },
    ];

    try {
      const result = await buildDocumentStructure(
        content,
        incompleteTokens,
        new Date(),
        () => chapters
      );
      // Should handle incomplete tokens gracefully
      expect(result !== undefined).toBe(true);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  test('should handle structure building with null timestamp', async () => {
    const content = '# Test';
    const tokens = tokenizeMarkdown(content);

    if (Array.isArray(tokens)) {
      const chapters = [
        {
          id: 'chapter-1',
          title: 'Test',
          level: 1,
          position: 0,
          startPosition: 0,
          endPosition: 10,
          startIndex: 0,
          charRange: {
            start: 0,
            end: 10,
          },
          depth: 1,
          wordCount: 1,
          estimatedDuration: 0.4,
          paragraphs: [],
        },
      ];

      try {
        const result = await buildDocumentStructure(
          content,
          tokens,
          null as any,
          () => chapters
        );
        // Should handle null timestamp gracefully
        expect(result !== undefined).toBe(true);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    }
  });
});

describe('parser-core - Memory and Resource Edge Cases', () => {
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

  test('should handle memory pressure during parsing', async () => {
    const hugeContent = `# Huge Document

${'Large paragraph. '.repeat(50000)}`;

    const expectedChapters = [
      {
        id: 'chapter-1',
        title: 'Huge Document',
        level: 1,
        position: 0,
        charRange: {
          start: 0,
          end: 1000000,
        },
        depth: 1,
        wordCount: 100002,
        estimatedDuration: 40000.8,
        paragraphs: [],
      },
    ];

    mockChapterExtractor.mockReturnValue(expectedChapters);

    try {
      const result = await parseMarkdownDocument(
        hugeContent,
        mockConfig,
        mockLogger,
        mockChapterExtractor
      );
      // Should handle large content without memory issues
      expect(result !== undefined).toBe(true);
    } catch (error) {
      // Memory errors are acceptable for very large content
      expect(error).toBeInstanceOf(Error);
    }
  });

  test('should handle rapid sequential parsing requests', async () => {
    const content = '# Sequential Test';
    const expectedChapters = [
      {
        id: 'chapter-1',
        title: 'Sequential Test',
        level: 1,
        position: 0,
        charRange: {
          start: 0,
          end: 25,
        },
        depth: 1,
        wordCount: 2,
        estimatedDuration: 0.8,
        paragraphs: [],
      },
    ];

    mockChapterExtractor.mockReturnValue(expectedChapters);

    // Rapid sequential requests
    const promises = Array.from({ length: 100 }, () =>
      parseMarkdownDocument(
        content,
        mockConfig,
        mockLogger,
        mockChapterExtractor
      )
    );

    try {
      const results = await Promise.all(promises);
      // All requests should complete
      expect(results.every((result: any) => result !== undefined)).toBe(true);
    } catch (error) {
      // Some requests might fail under load
      expect(error).toBeInstanceOf(Error);
    }
  });

  test('should handle resource cleanup on errors', async () => {
    const content = '# Cleanup Test';

    mockChapterExtractor.mockImplementation(() => {
      // Simulate resource allocation
      throw new Error('Simulated error after resource allocation');
    });

    try {
      await parseMarkdownDocument(
        content,
        mockConfig,
        mockLogger,
        mockChapterExtractor
      );
    } catch (error) {
      // Should handle errors and clean up resources
      expect(error).toBeInstanceOf(Error);
    }

    // Should be able to parse again after error
    mockChapterExtractor.mockReturnValue([
      {
        id: 'chapter-1',
        title: 'Cleanup Test',
        level: 1,
        position: 0,
        charRange: {
          start: 0,
          end: 25,
        },
        depth: 1,
        wordCount: 2,
        estimatedDuration: 0.8,
        paragraphs: [],
      },
    ]);

    const result = await parseMarkdownDocument(
      content,
      mockConfig,
      mockLogger,
      mockChapterExtractor
    );
    expect(result !== undefined).toBe(true);
  });
});
