/**
 * Integration tests for document streaming functionality.
 * Tests large document processing and streaming capabilities.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import type { ConfigManager } from '../../../src/config/config-manager.js';
import { MarkdownParser } from '../../../src/core/document-processing/parsers/markdown-parser.js';
import { BunTtsError } from '../../../src/errors/bun-tts-error.js';
import type { Result } from '../../../src/errors/result.js';
import type { Logger } from '../../../src/interfaces/logger.js';
import {
  MockLoggerFactory,
  MockConfigManagerFactory,
  MarkdownContentFactory,
  TestIdGenerator,
  BDDTemplateFactory,
} from '../../support/document-processing-factories.js';

// Helper function to safely extract data from successful Result
function _getResultData<T, E extends BunTtsError>(result: Result<T, E>): T {
  if (result.success === false) {
    throw new Error(
      `Expected successful result but got error: ${result.error.message}`
    );
  }
  return result.data;
}

// Helper function to create a parser with default mocks
function createParserWithMocks(): {
  parser: MarkdownParser;
  mockLogger: Logger;
  mockConfigManager: ConfigManager;
} {
  const mockLogger = MockLoggerFactory.create();
  const mockConfigManager = MockConfigManagerFactory.createDefault();
  const parser = new MarkdownParser(mockLogger, mockConfigManager);

  return { parser, mockLogger, mockConfigManager };
}

// Helper function to validate stream metadata
function validateStreamMetadata(chunks: unknown[]): void {
  const metadataChunk = chunks.find(
    (chunk) => (chunk as any).type === 'metadata'
  );
  expect(metadataChunk).toBeDefined();
  expect((metadataChunk as any).metadata.title).toBe(
    'Sample Technical Documentation'
  );
}

// Helper function to validate stream chapters
function validateStreamChapters(chunks: unknown[]): void {
  const chapterChunks = chunks.filter(
    (chunk) => (chunk as any).type === 'chapter'
  );
  expect(chapterChunks.length).toBeGreaterThan(20); // 8 chapters * 5 repetitions
}

// Helper function to validate stream progress
function validateStreamProgress(chunks: unknown[]): void {
  const progressValues = chunks.map((chunk) => (chunk as any).progress);
  expect(progressValues[progressValues.length - 1]).toBeGreaterThan(
    progressValues[0]
  );
}

// Helper function to validate final stream structure
async function validateFinalStreamStructure(stream: any): Promise<void> {
  const finalStructure = await stream.getStructure();
  expect(finalStructure.chapters.length).toBeGreaterThan(20);
  expect(finalStructure.totalWordCount).toBeGreaterThan(1900);
}

describe('Streaming Integration', () => {
  let parser: MarkdownParser;

  beforeEach(() => {
    const setup = createParserWithMocks();
    parser = setup.parser;
  });

  test(`${TestIdGenerator.generateIntegration('1.2', 4)} should stream large document correctly`, async () => {
    BDDTemplateFactory.createGivenWhenThenComment(
      [
        'A large markdown document is available for streaming processing',
        'The document contains multiple chapters and content types',
        'The parser is configured with streaming enabled',
        'The document size exceeds normal processing thresholds',
      ],
      [
        'A document stream is created for the large content',
        'The stream processes the document in chunks',
        'Progress tracking is enabled throughout the process',
      ],
      [
        'The stream should process all chunks correctly',
        'Metadata should be available in the stream',
        'Chapter chunks should be properly identified',
        'Progress should increase throughout processing',
        'The final structure should be complete and accurate',
      ]
    );

    // Create a larger document by repeating the sample
    const largeMarkdown = MarkdownContentFactory.createLargeDocument(5);

    const stream = parser.createStream(largeMarkdown);
    const chunks: unknown[] = [];

    // Collect all chunks
    for await (const chunk of stream.chunks()) {
      chunks.push(chunk);
    }

    validateStreamMetadata(chunks);
    validateStreamChapters(chunks);
    validateStreamProgress(chunks);
    await validateFinalStreamStructure(stream);
  });
});
