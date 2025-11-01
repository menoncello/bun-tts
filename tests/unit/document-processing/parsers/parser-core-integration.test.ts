/**
 * Unit tests for parser-core.ts integration functionality.
 * Tests integration between tokenization, document building, and structure creation.
 */

import { describe, test, expect } from 'bun:test';
import { MarkdownParseError } from '../../../../src/core/document-processing/errors/markdown-parse-error';
import {
  tokenizeMarkdown,
  buildDocumentStructure,
} from '../../../../src/core/document-processing/parsers/parser-core';
import type { ParsedToken } from '../../../../src/core/document-processing/parsers/token-processing';
import type {
  DocumentStructure,
  Chapter,
} from '../../../../src/core/document-processing/types';

// Type guard function to check if result is DocumentStructure
function isDocumentStructure(result: any): result is DocumentStructure {
  return (
    result &&
    typeof result === 'object' &&
    !('success' in result) &&
    !('message' in result) &&
    'metadata' in result &&
    'chapters' in result
  );
}

describe('parser-core - Integration Tests', () => {
  describe('tokenizeMarkdown integration', () => {
    test('should tokenize simple markdown', () => {
      const content = '# Header\n\nParagraph text.';

      const result = tokenizeMarkdown(content);

      expect(result).not.toBeInstanceOf(MarkdownParseError);
      if (Array.isArray(result)) {
        expect(result.length).toBeGreaterThan(0);
        const firstToken = result[0];
        if (firstToken) {
          expect(firstToken).toHaveProperty('type');
          expect(firstToken).toHaveProperty('text');
        }
      }
    });

    test('should handle tokenization errors gracefully', () => {
      const invalidContent = null as any;

      const result = tokenizeMarkdown(invalidContent);

      expect(result).toBeInstanceOf(MarkdownParseError);
    });

    test('should tokenize complex markdown with various elements', () => {
      const content = `# Main Title

## Subtitle

This is a paragraph with **bold** and *italic* text.

- List item 1
- List item 2
- List item 3

\`\`\`javascript
const code = 'example';
\`\`\`

> Blockquote content

[Link text](https://example.com)`;

      const result = tokenizeMarkdown(content);

      expect(result).not.toBeInstanceOf(MarkdownParseError);
      if (Array.isArray(result)) {
        expect(result.length).toBeGreaterThan(5);
        const types = result.map((token: ParsedToken) => token.type);
        expect(types).toContain('heading');
        expect(types).toContain('paragraph');
        expect(types).toContain('list');
      }
    });

    test('should handle empty content tokenization', () => {
      const content = '';

      const result = tokenizeMarkdown(content);

      expect(result).not.toBeInstanceOf(MarkdownParseError);
      if (Array.isArray(result)) {
        expect(result.length).toBeGreaterThanOrEqual(0);
      }
    });

    test('should handle whitespace-only content', () => {
      const content = '   \n\n   \n   ';

      const result = tokenizeMarkdown(content);

      expect(result).not.toBeInstanceOf(MarkdownParseError);
      if (Array.isArray(result)) {
        expect(result.length).toBeGreaterThanOrEqual(0);
      }
    });

    test('should handle special characters in tokenization', () => {
      const content = '# 特殊字符\n\nContent with émojis 🚀 and symbols &amp;';

      const result = tokenizeMarkdown(content);

      expect(result).not.toBeInstanceOf(MarkdownParseError);
      if (Array.isArray(result)) {
        expect(result.length).toBeGreaterThan(0);
        const firstToken = result[0];
        if (firstToken) {
          expect(firstToken.text).toContain('特殊字符');
        }
      }
    });

    test('should handle very long content tokenization', () => {
      const longContent = `# Long Content\n\n${'Long paragraph. '.repeat(1000)}`;

      const result = tokenizeMarkdown(longContent);

      expect(result).not.toBeInstanceOf(MarkdownParseError);
      if (Array.isArray(result)) {
        expect(result.length).toBeGreaterThan(0);
      }
    });
  });

  describe('buildDocumentStructure integration', () => {
    test('should build structure from tokens', async () => {
      const content = '# Test Document\n\nTest paragraph.';
      const tokens = tokenizeMarkdown(content);

      if (Array.isArray(tokens)) {
        const chapters = [
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

        const result = await buildDocumentStructure(
          content,
          tokens,
          new Date(),
          () => chapters
        );

        expect(result).not.toBeInstanceOf(MarkdownParseError);
        if (isDocumentStructure(result)) {
          expect(result).toHaveProperty('metadata');
          expect(result).toHaveProperty('chapters');
        }
      }
    });

    test('should handle build errors', async () => {
      const content = '# Test';
      const tokens = tokenizeMarkdown(content);

      if (Array.isArray(tokens)) {
        const failingExtractor = () => {
          throw new Error('Build failed');
        };

        try {
          const result = await buildDocumentStructure(
            content,
            tokens,
            new Date(),
            failingExtractor
          );
          // If it doesn't throw, it might return an error object
          expect(
            result === undefined ||
              result instanceof MarkdownParseError ||
              result instanceof Error
          ).toBe(true);
        } catch (error) {
          // Throwing is acceptable behavior for build errors
          expect(error).toBeInstanceOf(Error);
        }
      }
    });

    test('should handle empty tokens array', async () => {
      const content = '';
      const tokens: ParsedToken[] = [];

      const chapters: Chapter[] = [];
      const result = await buildDocumentStructure(
        content,
        tokens,
        new Date(),
        () => chapters
      );

      expect(result).not.toBeInstanceOf(MarkdownParseError);
      if (isDocumentStructure(result)) {
        expect(result.chapters).toEqual(chapters);
      }
    });

    test('should handle complex document structure', async () => {
      const content = `# Main Title

## Section 1

Content for section 1.

### Subsection 1.1

Subsection content.

## Section 2

More content.`;

      const tokens = tokenizeMarkdown(content);

      if (Array.isArray(tokens)) {
        const chapters = [
          {
            id: 'chapter-1',
            title: 'Main Title',
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
            wordCount: 15,
            estimatedDuration: 6.0,
            paragraphs: [],
          },
        ];

        const result = await buildDocumentStructure(
          content,
          tokens,
          new Date(),
          () => chapters
        );

        expect(result).not.toBeInstanceOf(MarkdownParseError);
        if (isDocumentStructure(result)) {
          expect(result.chapters).toHaveLength(1);
          const firstChapter = result.chapters[0];
          if (firstChapter) {
            expect(firstChapter.title).toBe('Main Title');
          }
        }
      }
    });

    test('should handle async chapter extraction', async () => {
      const content = '# Async Test\n\nContent here.';
      const tokens = tokenizeMarkdown(content);

      if (Array.isArray(tokens)) {
        const chapters = [
          {
            id: 'chapter-1',
            title: 'Async Test',
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

        const asyncExtractor = async () => {
          // Simulate async processing
          await new Promise((resolve) => setTimeout(resolve, 10));
          return chapters;
        };

        const result = await buildDocumentStructure(
          content,
          tokens,
          new Date(),
          asyncExtractor
        );

        expect(result).not.toBeInstanceOf(MarkdownParseError);
        if (isDocumentStructure(result)) {
          expect(result.chapters).toEqual(chapters);
        }
      }
    });
  });

  describe('end-to-end integration', () => {
    test('should integrate tokenization and structure building', async () => {
      const content = `# Integration Test

This is a test paragraph.

## Subsection

Another paragraph with **bold** text.`;

      // Step 1: Tokenize
      const tokens = tokenizeMarkdown(content);
      expect(Array.isArray(tokens)).toBe(true);

      if (Array.isArray(tokens)) {
        // Step 2: Build structure
        const chapters = [
          {
            id: 'chapter-1',
            title: 'Integration Test',
            level: 1,
            position: 0,
            startPosition: 0,
            endPosition: 110,
            startIndex: 0,
            charRange: {
              start: 0,
              end: 110,
            },
            depth: 1,
            wordCount: 11,
            estimatedDuration: 4.4,
            paragraphs: [],
          },
        ];

        const structure = await buildDocumentStructure(
          content,
          tokens,
          new Date(),
          () => chapters
        );

        expect(structure).not.toBeInstanceOf(MarkdownParseError);
        if (isDocumentStructure(structure)) {
          expect(structure.chapters).toHaveLength(1);
          const firstChapter = structure.chapters[0];
          if (firstChapter) {
            expect(firstChapter.title).toBe('Integration Test');
          }
        }
      }
    });

    test('should handle integration errors gracefully', async () => {
      const invalidContent = null as any;

      // Tokenization should fail
      const tokens = tokenizeMarkdown(invalidContent);
      expect(tokens).toBeInstanceOf(MarkdownParseError);

      // Structure building should handle invalid tokens
      if (tokens instanceof MarkdownParseError) {
        try {
          const result = await buildDocumentStructure(
            invalidContent,
            [],
            new Date(),
            () => []
          );
          // Should either return an error or throw
          expect(
            result === undefined ||
              result instanceof MarkdownParseError ||
              result instanceof Error
          ).toBe(true);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }
    });

    test('should maintain consistency across integration steps', async () => {
      const content = `# Consistency Test

Paragraph with consistent content.

## Another Section

More consistent text.`;

      const tokens = tokenizeMarkdown(content);
      expect(Array.isArray(tokens)).toBe(true);

      if (Array.isArray(tokens)) {
        const chapters = [
          {
            id: 'chapter-1',
            title: 'Consistency Test',
            level: 1,
            position: 0,
            startPosition: 0,
            endPosition: 90,
            startIndex: 0,
            charRange: {
              start: 0,
              end: 90,
            },
            depth: 1,
            wordCount: 9,
            estimatedDuration: 3.6,
            paragraphs: [],
          },
        ];

        const structure1 = await buildDocumentStructure(
          content,
          tokens,
          new Date(),
          () => chapters
        );

        const structure2 = await buildDocumentStructure(
          content,
          tokens,
          new Date(),
          () => chapters
        );

        // Results should be consistent
        expect(structure1).toEqual(structure2);
        expect(structure1).not.toBeInstanceOf(MarkdownParseError);
      }
    });
  });
});
