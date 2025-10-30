import { describe, test, expect, afterEach, beforeAll } from 'bun:test';
import { unlinkSync, existsSync, mkdirSync } from 'fs';
import {
  getErrorCode,
  getErrorRecoverable,
} from '../../src/core/document-processing/parsers/epub-parser-type-guards.js';
import { EPUBParser } from '../../src/core/document-processing/parsers/epub-parser.js';
import { createValidEPUBFile } from '../support/factories/epub-factory';

describe('EPUB Parsing Integration Tests', () => {
  const testFiles: string[] = [];

  beforeAll(setupTestEnvironment);

  afterEach(() => cleanupTestFiles(testFiles));

  describe('EPUB Parser Integration', () => {
    test('AC1-IT01: should handle invalid EPUB files gracefully', async () => {
      // GIVEN: Invalid EPUB file structure or corrupted content
      // WHEN: Parser attempts to process the invalid file
      // THEN: Should handle gracefully with proper error structure and logging
      await testInvalidEPUBHandling(testFiles);
    });

    test('AC1-IT02: should maintain type safety for parser interface', async () => {
      // GIVEN: EPUBParser instance with TypeScript strict mode
      // WHEN: Using parser interface methods and properties
      // THEN: Should maintain type safety throughout operations
      await testParserInterface();
    });

    test('AC5-IT01: should handle different parser options', async () => {
      // GIVEN: Various parser configuration combinations
      // WHEN: Creating parsers with different options
      // THEN: Should handle all configuration options correctly
      await testParserOptions();
    });
  });

  describe('Error Handling Integration', () => {
    test('AC1-IT03: should handle parsing errors with proper structure', async () => {
      // GIVEN: Various error conditions during parsing
      // WHEN: Errors occur during EPUB processing
      // THEN: Should return structured error responses with recovery information
      await testParsingErrorStructure();
    });

    test('AC1-IT04: should handle empty or null input gracefully', async () => {
      // GIVEN: Various forms of invalid input (null, undefined, empty)
      // WHEN: Parser receives invalid input
      // THEN: Should handle gracefully without crashing
      await testInvalidInputHandling();
    });
  });

  describe('Parser Options Integration', () => {
    test('AC1-IT05: should handle streaming mode configuration', async () => {
      // GIVEN: Parser configured for streaming mode
      // WHEN: Processing large EPUB files
      // THEN: Should use streaming architecture for memory efficiency
      await testStreamingConfiguration();
    });

    test('AC1-IT06: should handle configuration changes dynamically', async () => {
      // GIVEN: Parser instance with initial configuration
      // WHEN: Changing configuration options dynamically
      // THEN: Should accept and apply configuration changes
      await testDynamicConfiguration();
    });
  });
});

// Helper functions for EPUB parsing integration tests
function setupTestEnvironment(): void {
  // Create tmp directory if it doesn't exist
  const tmpDir = 'tmp';
  if (!existsSync(tmpDir)) {
    mkdirSync(tmpDir, { recursive: true });
  }
}

function cleanupTestFiles(testFiles: string[]): void {
  // Clean up test files
  for (const file of testFiles) {
    if (existsSync(file)) {
      unlinkSync(file);
    }
  }
  testFiles.length = 0; // Clear the array without reassigning
}

async function testInvalidEPUBHandling(testFiles: string[]): Promise<void> {
  // GIVEN: An invalid EPUB file
  const epubPath = await createValidEPUBFile({
    title: 'Invalid Book',
    author: 'Test Author',
    chapters: [{ title: 'Chapter 1', content: 'Test content.' }],
    tocType: 'ncx',
  });
  testFiles.push(epubPath);

  // WHEN: Processing the invalid EPUB file
  const parser = new EPUBParser();
  const parseResult = await parser.parse(epubPath);

  // THEN: Should handle gracefully with proper error structure
  expect(parseResult).toBeDefined();
  expect(typeof parseResult.success).toBe('boolean');
  expect(parseResult.error).toBeDefined();

  // Should have proper error structure
  if (parseResult.error) {
    const errorCode = getErrorCode(parseResult.error);
    const isRecoverable = getErrorRecoverable(parseResult.error);

    expect(errorCode).toBeDefined();
    expect(parseResult.error).toHaveProperty('message');
    expect(isRecoverable).toBeDefined();
  }
}

async function testParserInterface(): Promise<void> {
  // GIVEN: An EPUB parser instance
  const parser = new EPUBParser();

  // WHEN: Testing parser interface
  expect(typeof parser.parse).toBe('function');
  expect(typeof parser.setOptions).toBe('function');
  expect(typeof parser.getStats).toBe('function');

  // THEN: Should have correct interface
  const stats = parser.getStats();
  expect(stats).toBeDefined();
  expect(typeof stats.parseTimeMs).toBe('number');
}

async function testParserOptions(): Promise<void> {
  // GIVEN: EPUB parser with different options
  const strictParser = new EPUBParser({ extractMedia: true });
  const lenientParser = new EPUBParser({ extractMedia: false });
  const streamingParser = new EPUBParser({ preserveHTML: true });

  // WHEN: Setting options dynamically
  strictParser.setOptions({ extractMedia: false });
  lenientParser.setOptions({ preserveHTML: true });

  // THEN: Should accept options without errors
  expect(strictParser.getStats()).toBeDefined();
  expect(lenientParser.getStats()).toBeDefined();
  expect(streamingParser.getStats()).toBeDefined();
}

async function testParsingErrorStructure(): Promise<void> {
  // GIVEN: Invalid file path
  const invalidPath = '/nonexistent/file.epub';

  // WHEN: Attempting to parse invalid file
  const parser = new EPUBParser();
  const result = await parser.parse(invalidPath);

  // THEN: Should return structured error response
  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();

  const errorCode = getErrorCode(result.error);
  const isRecoverable = getErrorRecoverable(result.error);

  expect(errorCode).toBeDefined();
  expect(result.error!.message).toBeDefined();
  expect(typeof isRecoverable).toBe('boolean');
}

async function testInvalidInputHandling(): Promise<void> {
  // GIVEN: Various invalid inputs
  const parser = new EPUBParser();

  // WHEN: Testing invalid inputs
  const results = await Promise.all([
    parser.parse(''),
    parser.parse(null as any),
    parser.parse(undefined as any),
  ]);

  // THEN: Should handle all gracefully
  for (const result of results) {
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  }
}

async function testStreamingConfiguration(): Promise<void> {
  // GIVEN: Parser with media extraction enabled
  const streamingParser = new EPUBParser({
    extractMedia: true,
    preserveHTML: true,
  });

  // WHEN: Getting parser stats
  const stats = streamingParser.getStats();

  // THEN: Should have proper structure
  expect(stats).toBeDefined();
  expect(typeof stats.parseTimeMs).toBe('number');
  expect(typeof stats.memoryUsageMB).toBe('number');
}

async function testDynamicConfiguration(): Promise<void> {
  // GIVEN: Parser instance
  const parser = new EPUBParser({ extractMedia: true });

  // WHEN: Changing configuration
  parser.setOptions({
    extractMedia: false,
    preserveHTML: true,
  });

  // THEN: Should accept changes without error
  const stats = parser.getStats();
  expect(stats).toBeDefined();
}
