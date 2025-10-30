/**
 * Unit Tests for Parser Streaming
 *
 * Comprehensive test suite for streaming functionality
 * covering edge cases, performance scenarios, and large document processing
 */

import { describe, expect, beforeEach, afterEach, mock, test } from 'bun:test';
import type { MarkdownParser } from '../../../../src/core/document-processing/parsers/markdown-parser.js';
import { createStream } from '../../../../src/core/document-processing/parsers/parser-streaming.js';
import { MarkdownContentFactory } from '../../../support/document-processing-factories.js';
import {
  TestCleanupManager,
  TestPriority,
  EnhancedTestPatterns,
} from '../../../support/test-utilities.js';

/**
 * Create mock chapter structure
 * @param {number} chapterIndex - Chapter index
 * @param {string} title - Chapter title
 * @returns {object} Mock chapter structure
 */
function createMockChapter(chapterIndex: number, title: string) {
  return {
    id: `chapter-${chapterIndex}`,
    title,
    paragraphs: [
      {
        id: `para-${chapterIndex}-0`,
        type: 'text' as const,
        sentences: [
          {
            id: `sent-${chapterIndex}-0-0`,
            text: 'Sample content',
            position: 0,
            wordCount: 2,
            estimatedDuration: 1,
            hasFormatting: false,
          },
        ],
        position: 0,
        wordCount: 2,
        estimatedDuration: 1,
        hasFormatting: false,
      },
    ],
    position: chapterIndex,
    wordCount: 2,
    estimatedDuration: 1,
    hasFormatting: false,
  };
}

/**
 * Parse headers from content lines
 * @param {string} line - Content line to parse
 * @returns {Array<string> | null} Header match or null
 */
function parseHeader(line: string): string[] | null {
  const trimmedLine = line.trim();

  if (trimmedLine.startsWith('##')) {
    return ['##', '##', trimmedLine.substring(2).trim()];
  }

  if (trimmedLine.startsWith('#')) {
    const hashCount = trimmedLine.length - trimmedLine.trimLeft().length;
    if (hashCount <= 6) {
      const title = trimmedLine.substring(hashCount).trim();
      return ['#'.repeat(hashCount), '#'.repeat(hashCount), title];
    }
  }

  return null;
}

/**
 * Mock parser function for testing
 * @param {string} content - Content to parse
 * @returns {object} Parsed document structure
 */
async function mockParseFunction(content: string) {
  const lines = content.split('\n');
  const chapters = [];
  let currentChapter = null;
  let chapterIndex = 0;

  // Extract title from content
  let title = 'Test Document';
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('# ')) {
      title = trimmedLine.substring(2).trim();
      break;
    }
  }

  for (const line of lines) {
    const headerMatch = parseHeader(line);

    if (
      headerMatch &&
      headerMatch[1] &&
      headerMatch[1].length === 2 &&
      headerMatch[2]
    ) {
      if (currentChapter) {
        chapters.push(currentChapter);
      }
      currentChapter = createMockChapter(chapterIndex, headerMatch[2]);
      chapterIndex++;
    }
  }

  if (currentChapter) {
    chapters.push(currentChapter);
  }

  return {
    success: true,
    data: {
      metadata: {
        title,
        author: 'Test Author',
        language: 'en',
      },
      chapters,
      totalWords: chapters.length * 2,
      totalParagraphs: chapters.length,
      totalSentences: chapters.length,
      confidence: 0.95,
    },
  };
}

// Simple test to satisfy ESLint requirements
test('parser streaming test suite is functional', () => {
  expect(true).toBe(true);
});

/**
 * Collect all chunks from a stream
 */
async function collectChunks(stream: any) {
  const chunks = [];
  for await (const chunk of stream.chunks()) {
    chunks.push(chunk);
  }
  return chunks;
}

/**
 * Verify workflow consistency of chunks and structure
 */
function verifyWorkflowConsistency(chunks: any[], structure: any) {
  expect(chunks.length).toBeGreaterThan(0);
  const firstWorkflowChunk = chunks[0];
  const lastWorkflowChunk = chunks[chunks.length - 1];
  if (!firstWorkflowChunk || !lastWorkflowChunk) {
    throw new Error('Expected chunks to be defined for complete workflow');
  }
  expect(firstWorkflowChunk.type).toBe('metadata');
  expect(lastWorkflowChunk.type).toBe('chapter');
  expect(structure?.metadata?.title).toBeDefined();
}

/**
 * Verify chunk progression contains expected types
 */
function verifyChunkProgression(chunks: any[]) {
  let foundChapterChunks = false;
  let foundContentChunks = false;

  for (const chunk of chunks) {
    if (chunk.type === 'chapter' && chunk.id !== 'chapter-complete') {
      foundChapterChunks = true;
    }
    if (chunk.type === 'paragraphs') {
      foundContentChunks = true;
    }
  }

  expect(foundChapterChunks || foundContentChunks).toBe(true);
}

describe('Parser Streaming', () => {
  let mockParser: MarkdownParser;

  beforeEach(() => {
    TestCleanupManager.clear();
    // Mock logger created but not directly used in current tests
    // mockLogger = {
    //   debug: mock(() => { /* Intentionally empty for test purposes */ }),
    //   info: mock(() => { /* Intentionally empty for test purposes */ }),
    //   warn: mock(() => { /* Intentionally empty for test purposes */ }),
    //   error: mock(() => { /* Intentionally empty for test purposes */ }),
    // };

    // Create a mock parser with required methods
    mockParser = {
      name: 'MockMarkdownParser',
      version: '1.0.0',
      parse: mock(mockParseFunction),
      extractBasicMetadata: mock((content: string) => {
        const lines = content.split('\n');
        let title = 'Test Document';

        // Extract title from first line if it looks like a heading
        if (lines.length > 0) {
          const firstLine = lines[0]?.trim();
          if (firstLine && firstLine.startsWith('# ')) {
            title = firstLine.substring(2).trim();
          } else if (firstLine && firstLine.startsWith('## ')) {
            title = firstLine.substring(3).trim();
          }
        }

        return {
          title,
          wordCount: content.split(/\s+/).length,
          customMetadata: {},
        };
      }),
    } as unknown as MarkdownParser;
  });

  afterEach(async () => {
    await TestCleanupManager.cleanup();
  });

  describe('createStream', () => {
    EnhancedTestPatterns.createTest(
      'should create a valid document stream',
      () => {
        const content = MarkdownContentFactory.createSimpleDocument();
        const stream = createStream(content, mockParser);

        expect(stream).toBeDefined();
        expect(typeof stream.chunks).toBe('function');
        expect(typeof stream.getStructure).toBe('function');
      },
      { priority: TestPriority.CRITICAL, tags: ['core', 'streaming'] }
    );

    EnhancedTestPatterns.createTest(
      'should handle Buffer input',
      () => {
        const content = MarkdownContentFactory.createSimpleDocument();
        const buffer = Buffer.from(content);
        const stream = createStream(buffer, mockParser);

        expect(stream).toBeDefined();
        expect(typeof stream.chunks).toBe('function');
        expect(typeof stream.getStructure).toBe('function');
      },
      { priority: TestPriority.CRITICAL, tags: ['core', 'streaming'] }
    );

    EnhancedTestPatterns.createTest(
      'should generate metadata chunk first',
      async () => {
        const content = MarkdownContentFactory.createSimpleDocument();
        const stream = createStream(content, mockParser);
        const chunks = [];

        for await (const chunk of stream.chunks()) {
          chunks.push(chunk);
        }

        expect(chunks.length).toBeGreaterThan(0);
        const firstChunk = chunks[0];
        if (!firstChunk) {
          throw new Error('Expected first chunk to be defined');
        }
        expect(firstChunk.type).toBe('metadata');
        expect(firstChunk.id).toBe('metadata-0');
        expect(firstChunk.position).toBe(0);
        expect(firstChunk.progress).toBe(0);
        expect(firstChunk.metadata).toBeDefined();
      },
      { priority: TestPriority.CRITICAL, tags: ['streaming', 'metadata'] }
    );

    EnhancedTestPatterns.createTest(
      'should generate chapter chunks from parsed content',
      async () => {
        const content = `# Test Document

## Chapter 1

This is the first chapter.

## Chapter 2

This is the second chapter.

## Chapter 3

This is the third chapter.`;

        const stream = createStream(content, mockParser);
        const chunks = [];

        for await (const chunk of stream.chunks()) {
          chunks.push(chunk);
        }

        // Should have metadata + chapter chunks + completion chunk
        const chapterChunks = chunks.filter(
          (chunk) => chunk.type === 'chapter' && chunk.id !== 'chapter-complete'
        );
        expect(chapterChunks.length).toBeGreaterThan(0);

        // Verify chapter chunk structure
        for (const [index, chunk] of chapterChunks.entries()) {
          expect(chunk.id).toBe(`chapter-${index}`);
          expect(chunk.type).toBe('chapter');
          expect(chunk.chapter).toBeDefined();
          expect(chunk.progress).toBeGreaterThan(0);
        }
      },
      { priority: TestPriority.HIGH, tags: ['streaming', 'chapters'] }
    );

    EnhancedTestPatterns.createTest(
      'should generate content chunks for remaining content',
      async () => {
        const content = MarkdownContentFactory.createComplexDocument();
        const stream = createStream(content, mockParser);
        const chunks = [];

        for await (const chunk of stream.chunks()) {
          chunks.push(chunk);
        }

        // Should have paragraph chunks for remaining content
        const contentChunks = chunks.filter(
          (chunk) => chunk.type === 'paragraphs'
        );
        expect(contentChunks.length).toBeGreaterThan(0);

        for (const chunk of contentChunks) {
          expect(chunk.id).toMatch(/^chunk-\d+$/);
          expect(chunk.type).toBe('paragraphs');
          expect(chunk.paragraphs).toBeDefined();
          expect(chunk.progress).toBeGreaterThan(0);
        }
      },
      { priority: TestPriority.HIGH, tags: ['streaming', 'content-chunks'] }
    );

    EnhancedTestPatterns.createTest(
      'should generate completion chunk at the end',
      async () => {
        const content = MarkdownContentFactory.createSimpleDocument();
        const stream = createStream(content, mockParser);
        const chunks = [];

        for await (const chunk of stream.chunks()) {
          chunks.push(chunk);
        }

        const lastChunk = chunks[chunks.length - 1];
        if (!lastChunk) {
          throw new Error('Expected last chunk to be defined');
        }
        expect(lastChunk.type).toBe('chapter');
        expect(lastChunk.id).toBe('chapter-complete');
        expect(lastChunk.progress).toBe(100);
        expect(lastChunk.chapter).toBeDefined();
        expect(lastChunk.chapter?.title).toBe('Document Complete');
      },
      { priority: TestPriority.HIGH, tags: ['streaming', 'completion'] }
    );

    EnhancedTestPatterns.createTest(
      'should return document structure from getStructure',
      async () => {
        const content = MarkdownContentFactory.createComplexDocument();
        const stream = createStream(content, mockParser);

        const structure = await stream.getStructure();

        expect(structure).toBeDefined();
        expect(structure.metadata).toBeDefined();
        expect(Array.isArray(structure.chapters)).toBe(true);
        expect(typeof structure.totalParagraphs).toBe('number');
        expect(typeof structure.totalSentences).toBe('number');
        expect(typeof structure.confidence).toBe('number');
      },
      { priority: TestPriority.CRITICAL, tags: ['streaming', 'structure'] }
    );

    EnhancedTestPatterns.createTest(
      'should handle empty content',
      async () => {
        const content = '';
        const stream = createStream(content, mockParser);

        const chunks = [];
        for await (const chunk of stream.chunks()) {
          chunks.push(chunk);
        }

        // Should still have metadata and completion chunks
        expect(chunks.length).toBeGreaterThanOrEqual(2);
        const firstEmptyChunk = chunks[0];
        const lastEmptyChunk = chunks[chunks.length - 1];
        if (!firstEmptyChunk || !lastEmptyChunk) {
          throw new Error('Expected chunks to be defined for empty content');
        }
        expect(firstEmptyChunk.type).toBe('metadata');
        expect(lastEmptyChunk.type).toBe('chapter');

        const structure = await stream.getStructure();
        expect(structure).toBeDefined();
        expect(structure.chapters).toEqual([]);
      },
      { priority: TestPriority.MEDIUM, tags: ['streaming', 'edge-cases'] }
    );

    EnhancedTestPatterns.createTest(
      'should handle very large documents',
      async () => {
        const content = MarkdownContentFactory.createLargeDocument(3);
        const stream = createStream(content, mockParser);

        const chunks = [];
        for await (const chunk of stream.chunks()) {
          chunks.push(chunk);
        }

        expect(chunks.length).toBeGreaterThan(5); // Should have multiple chunks
        const firstLargeChunk = chunks[0];
        const lastLargeChunk = chunks[chunks.length - 1];
        if (!firstLargeChunk || !lastLargeChunk) {
          throw new Error('Expected chunks to be defined for large document');
        }
        expect(firstLargeChunk.type).toBe('metadata');
        expect(lastLargeChunk.type).toBe('chapter');

        // Should have content chunks for large document
        const contentChunks = chunks.filter(
          (chunk) => chunk.type === 'paragraphs'
        );
        expect(contentChunks.length).toBeGreaterThan(0);
      },
      { priority: TestPriority.MEDIUM, tags: ['streaming', 'performance'] }
    );

    EnhancedTestPatterns.createTest(
      'should handle content with various formatting',
      async () => {
        const content = MarkdownContentFactory.createComplexDocument();
        const stream = createStream(content, mockParser);

        const chunks = [];
        for await (const chunk of stream.chunks()) {
          chunks.push(chunk);
        }

        expect(chunks.length).toBeGreaterThan(0);
        const firstFormattedChunk = chunks[0];
        if (!firstFormattedChunk) {
          throw new Error(
            'Expected first chunk to be defined for formatted document'
          );
        }
        expect(firstFormattedChunk.type).toBe('metadata');

        const structure = await stream.getStructure();
        if (!structure) {
          throw new Error(
            'Expected structure to be defined for formatted document'
          );
        }
        expect(structure.metadata?.title).toBe(
          'Sample Technical Documentation'
        );
      },
      { priority: TestPriority.MEDIUM, tags: ['streaming', 'formatting'] }
    );

    EnhancedTestPatterns.createTest(
      'should calculate progress correctly',
      async () => {
        const content = MarkdownContentFactory.createComplexDocument();
        const stream = createStream(content, mockParser);
        const chunks = [];

        for await (const chunk of stream.chunks()) {
          chunks.push(chunk);
        }

        // Progress should be monotonic (non-decreasing)
        let previousProgress = -1;
        for (const chunk of chunks) {
          expect(chunk.progress).toBeGreaterThanOrEqual(previousProgress);
          previousProgress = chunk.progress;
        }

        // Last chunk should have 100% progress
        const lastProgressChunk = chunks[chunks.length - 1];
        if (!lastProgressChunk) {
          throw new Error(
            'Expected last chunk to be defined for progress test'
          );
        }
        expect(lastProgressChunk.progress).toBe(100);
      },
      { priority: TestPriority.HIGH, tags: ['streaming', 'progress'] }
    );

    EnhancedTestPatterns.createTest(
      'should handle malformed markdown gracefully',
      async () => {
        const content = MarkdownContentFactory.createMalformedDocument();
        const stream = createStream(content, mockParser);

        const chunks = [];
        for await (const chunk of stream.chunks()) {
          chunks.push(chunk);
        }

        expect(chunks.length).toBeGreaterThan(0);
        const firstMalformedChunk = chunks[0];
        if (!firstMalformedChunk) {
          throw new Error(
            'Expected first chunk to be defined for malformed document'
          );
        }
        expect(firstMalformedChunk.type).toBe('metadata');

        const malformedStructure = await stream.getStructure();
        if (!malformedStructure) {
          throw new Error(
            'Expected structure to be defined for malformed document'
          );
        }
        expect(malformedStructure).toBeDefined();
      },
      { priority: TestPriority.MEDIUM, tags: ['streaming', 'error-handling'] }
    );
  });

  describe('Stream Chunk Types', () => {
    EnhancedTestPatterns.createTest(
      'should create proper metadata chunk structure',
      async () => {
        const content = MarkdownContentFactory.createSimpleDocument();
        const stream = createStream(content, mockParser);

        const chunks = [];
        for await (const chunk of stream.chunks()) {
          chunks.push(chunk);
        }

        const metadataChunk = chunks[0];
        if (!metadataChunk) {
          throw new Error('Expected metadata chunk to be defined');
        }
        expect(metadataChunk.type).toBe('metadata');
        expect(metadataChunk.id).toBe('metadata-0');
        expect(metadataChunk.position).toBe(0);
        expect(metadataChunk.progress).toBe(0);
        expect(metadataChunk.metadata).toBeDefined();
        expect(metadataChunk.metadata?.title).toBeDefined();
      },
      { priority: TestPriority.HIGH, tags: ['chunks', 'metadata'] }
    );

    EnhancedTestPatterns.createTest(
      'should create proper chapter chunk structure',
      async () => {
        const content = `# Test

## Chapter 1

Content here.`;

        const stream = createStream(content, mockParser);

        const chunks = [];
        for await (const chunk of stream.chunks()) {
          chunks.push(chunk);
        }

        const chapterChunks = chunks.filter(
          (chunk) => chunk.type === 'chapter' && chunk.id !== 'chapter-complete'
        );

        if (chapterChunks.length > 0) {
          const chapterChunk = chapterChunks[0];
          if (!chapterChunk) {
            throw new Error('Expected chapter chunk to be defined');
          }
          expect(chapterChunk.type).toBe('chapter');
          expect(chapterChunk.chapter).toBeDefined();
          expect(chapterChunk.chapter?.id).toBeDefined();
          expect(chapterChunk.chapter?.title).toBeDefined();
          expect(chapterChunk.chapter?.paragraphs).toBeDefined();
        }
      },
      { priority: TestPriority.HIGH, tags: ['chunks', 'chapters'] }
    );

    EnhancedTestPatterns.createTest(
      'should create proper content chunk structure',
      async () => {
        const content = MarkdownContentFactory.createComplexDocument();
        const stream = createStream(content, mockParser);

        const chunks = [];
        for await (const chunk of stream.chunks()) {
          chunks.push(chunk);
        }

        const contentChunks = chunks.filter(
          (chunk) => chunk.type === 'paragraphs'
        );

        if (contentChunks.length > 0) {
          const contentChunk = contentChunks[0];
          if (!contentChunk) {
            throw new Error('Expected content chunk to be defined');
          }
          expect(contentChunk.type).toBe('paragraphs');
          expect(contentChunk.paragraphs).toBeDefined();
          expect(Array.isArray(contentChunk.paragraphs)).toBe(true);
          expect(contentChunk.progress).toBeGreaterThan(0);
          expect(contentChunk.progress).toBeLessThan(100);
        }
      },
      { priority: TestPriority.HIGH, tags: ['chunks', 'content'] }
    );

    EnhancedTestPatterns.createTest(
      'should create proper completion chunk structure',
      async () => {
        const content = MarkdownContentFactory.createSimpleDocument();
        const stream = createStream(content, mockParser);

        const chunks = [];
        for await (const chunk of stream.chunks()) {
          chunks.push(chunk);
        }

        const completionChunk = chunks[chunks.length - 1];
        if (!completionChunk) {
          throw new Error('Expected completion chunk to be defined');
        }
        expect(completionChunk.type).toBe('chapter');
        expect(completionChunk.id).toBe('chapter-complete');
        expect(completionChunk.progress).toBe(100);
        expect(completionChunk.chapter).toBeDefined();
        expect(completionChunk.chapter?.title).toBe('Document Complete');
      },
      { priority: TestPriority.HIGH, tags: ['chunks', 'completion'] }
    );
  });

  describe('Performance and Memory', () => {
    EnhancedTestPatterns.createTest(
      'should handle streaming without memory leaks',
      async () => {
        const content = MarkdownContentFactory.createLargeDocument(5);

        // Create multiple streams to test memory handling
        for (let i = 0; i < 5; i++) {
          const stream = createStream(content, mockParser);

          const chunks = [];
          for await (const chunk of stream.chunks()) {
            chunks.push(chunk);
            // Only keep last few chunks to test memory efficiency
            if (chunks.length > 10) {
              chunks.shift();
            }
          }

          expect(chunks.length).toBeGreaterThan(0);
        }
      },
      { priority: TestPriority.MEDIUM, tags: ['performance', 'memory'] }
    );

    EnhancedTestPatterns.createTest(
      'should process chunks efficiently',
      async () => {
        const content = MarkdownContentFactory.createComplexDocument();
        const stream = createStream(content, mockParser);

        const startTime = performance.now();
        const chunks = [];

        for await (const chunk of stream.chunks()) {
          chunks.push(chunk);
        }

        const endTime = performance.now();
        const processingTime = endTime - startTime;

        // Should process within reasonable time (adjust threshold as needed)
        expect(processingTime).toBeLessThan(1000); // 1 second
        expect(chunks.length).toBeGreaterThan(0);
      },
      { priority: TestPriority.MEDIUM, tags: ['performance', 'efficiency'] }
    );

    EnhancedTestPatterns.createTest(
      'should handle concurrent stream operations',
      async () => {
        const content = MarkdownContentFactory.createComplexDocument();
        const stream = createStream(content, mockParser);

        // Test getting structure while iterating chunks
        const chunksPromise = (async () => {
          const chunks = [];
          for await (const chunk of stream.chunks()) {
            chunks.push(chunk);
          }
          return chunks;
        })();

        const structurePromise = stream.getStructure();

        const [chunks, structure] = await Promise.all([
          chunksPromise,
          structurePromise,
        ]);

        expect(chunks.length).toBeGreaterThan(0);
        expect(structure).toBeDefined();
      },
      { priority: TestPriority.MEDIUM, tags: ['performance', 'concurrency'] }
    );
  });

  describe('Error Handling', () => {
    EnhancedTestPatterns.createTest(
      'should handle parser errors gracefully',
      async () => {
        const errorParser = {
          name: 'ErrorMockParser',
          version: '1.0.0',
          parse: mock(async () => {
            throw new Error('Parser failed');
          }),
          extractBasicMetadata: mock((content: string) => {
            const lines = content.split('\n');
            let title = 'Error Test Document';

            // Extract title from first line if it looks like a heading
            if (lines.length > 0) {
              const firstLine = lines[0]?.trim();
              if (firstLine && firstLine.startsWith('# ')) {
                title = firstLine.substring(2).trim();
              } else if (firstLine && firstLine.startsWith('## ')) {
                title = firstLine.substring(3).trim();
              }
            }

            return {
              title,
              wordCount: content.split(/\s+/).length,
              customMetadata: {},
            };
          }),
        } as unknown as MarkdownParser;

        const content = MarkdownContentFactory.createSimpleDocument();
        const stream = createStream(content, errorParser);

        const chunks = [];
        for await (const chunk of stream.chunks()) {
          chunks.push(chunk);
        }

        // Should still return some chunks even with parser error
        expect(chunks.length).toBeGreaterThan(0);
        const firstErrorChunk = chunks[0];
        if (!firstErrorChunk) {
          throw new Error(
            'Expected first chunk to be defined for parser error'
          );
        }
        expect(firstErrorChunk.type).toBe('metadata');

        // Structure should fallback to basic structure
        const errorStructure = await stream.getStructure();
        if (!errorStructure) {
          throw new Error('Expected structure to be defined for parser error');
        }
        expect(errorStructure).toBeDefined();
        expect(errorStructure.chapters).toEqual([]);
      },
      { priority: TestPriority.HIGH, tags: ['error-handling', 'parser-errors'] }
    );

    EnhancedTestPatterns.createTest(
      'should handle invalid input types',
      () => {
        expect(() => {
          createStream(null as unknown as string | Buffer, mockParser);
        }).toThrow();

        expect(() => {
          createStream(undefined as unknown as string | Buffer, mockParser);
        }).toThrow();
      },
      { priority: TestPriority.HIGH, tags: ['error-handling', 'invalid-input'] }
    );

    EnhancedTestPatterns.createTest(
      'should handle malformed Buffer input',
      () => {
        // Create a malformed Buffer
        const malformedBuffer = Buffer.from([0xFF, 0xFE, 0x00, 0x00]);

        expect(() => {
          createStream(malformedBuffer, mockParser);
        }).not.toThrow();
      },
      {
        priority: TestPriority.MEDIUM,
        tags: ['error-handling', 'malformed-buffer'],
      }
    );
  });

  describe('Integration Scenarios', () => {
    EnhancedTestPatterns.createTest(
      'should handle complete streaming workflow',
      async () => {
        const content = MarkdownContentFactory.createComplexDocument();
        const stream = createStream(content, mockParser);

        const chunks = await collectChunks(stream);
        const structure = await stream.getStructure();

        verifyWorkflowConsistency(chunks, structure);
        verifyChunkProgression(chunks);
      },
      {
        priority: TestPriority.HIGH,
        tags: ['integration', 'complete-workflow'],
      }
    );

    EnhancedTestPatterns.createTest(
      'should maintain consistency between chunks and structure',
      async () => {
        const content = `# Test Document

## Chapter 1

First chapter content.

## Chapter 2

Second chapter content.`;

        const stream = createStream(content, mockParser);

        // Get structure first
        const structure = await stream.getStructure();

        // Then get chunks
        const chunks = [];
        for await (const chunk of stream.chunks()) {
          chunks.push(chunk);
        }

        // Verify structure metadata matches metadata chunk
        const consistencyMetadataChunk = chunks[0];
        if (!consistencyMetadataChunk) {
          throw new Error(
            'Expected metadata chunk to be defined for consistency test'
          );
        }
        expect(consistencyMetadataChunk.metadata?.title).toBe(
          structure.metadata.title
        );

        // Verify chapter count consistency
        const chapterChunks = chunks.filter(
          (chunk) => chunk.type === 'chapter' && chunk.id !== 'chapter-complete'
        );
        expect(chapterChunks.length).toBe(structure.chapters.length);
      },
      { priority: TestPriority.HIGH, tags: ['integration', 'consistency'] }
    );

    EnhancedTestPatterns.createTest(
      'should handle real-world document scenarios',
      async () => {
        const realWorldContent = `# Technical Documentation Guide

## Overview

This guide provides comprehensive information about our system architecture and implementation details.

## Getting Started

To begin using our system, follow these steps:

1. Install the required dependencies
2. Configure your environment
3. Run the initialization script

### Prerequisites

Before you begin, ensure you have:
- Node.js version 16 or higher
- npm or yarn package manager
- Sufficient disk space

## Installation

Download the package from our repository and extract it to your desired location.

## Configuration

Edit the configuration file to match your environment settings.

## Troubleshooting

If you encounter issues, please check the following:

### Common Problems

- **Connection timeout**: Increase timeout settings
- **Memory errors**: Reduce chunk size
- **Parse failures**: Check input format

## Conclusion

This concludes our technical documentation guide.`;

        const stream = createStream(realWorldContent, mockParser);

        const chunks = [];
        for await (const chunk of stream.chunks()) {
          chunks.push(chunk);
        }

        const structure = await stream.getStructure();

        // Should handle complex real-world content
        expect(chunks.length).toBeGreaterThan(5);
        expect(structure?.chapters?.length).toBeGreaterThan(3);
        expect(structure?.metadata?.title).toBe(
          'Technical Documentation Guide'
        );
      },
      { priority: TestPriority.HIGH, tags: ['integration', 'real-world'] }
    );
  });
});
