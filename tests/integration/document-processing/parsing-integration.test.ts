/**
 * Integration tests for document parsing functionality.
 * Tests the complete parsing pipeline from input to document structure.
 * Enhanced with test cleanup patterns and priority classification.
 */

import { expect, mock, describe, test } from 'bun:test';
import { MarkdownParser } from '../../../src/core/document-processing/parsers/markdown-parser.js';
import { BunTtsError } from '../../../src/errors/bun-tts-error.js';
import type { Result } from '../../../src/errors/result.js';
import {
  MarkdownContentFactory,
  ExpectationFactory,
  TestIdGenerator,
  BDDTemplateFactory,
} from '../../support/document-processing-factories.js';
import {
  TestCleanupManager,
  EnhancedMockFactory,
  EnhancedTestPatterns,
  TestPriority,
  TestPerformanceMonitor,
} from '../../support/test-utilities.js';

// Sample markdown content for testing
const SAMPLE_MARKDOWN = MarkdownContentFactory.createComplexDocument();

// Helper function to safely extract data from successful Result
function getResultData<T, E extends BunTtsError>(result: Result<T, E>): T {
  if (result.success === false) {
    throw new Error(
      `Expected successful result but got error: ${result.error.message}`
    );
  }
  return result.data;
}

// Helper function to create a parser with enhanced mocks and automatic cleanup
function createParserWithMocks(): {
  parser: MarkdownParser;
  mockLogger: any & { mock: ReturnType<typeof mock> };
  mockConfigManager: any & { mock: ReturnType<typeof mock> };
} {
  const mockLogger = EnhancedMockFactory.createLogger();
  const mockConfigManager = EnhancedMockFactory.createConfigManager();
  const parser = new MarkdownParser(mockLogger, mockConfigManager);

  // Register cleanup tasks
  TestCleanupManager.registerCleanup(() => {
    // Parser cleanup handled by garbage collection
  });

  return { parser, mockLogger, mockConfigManager };
}

// Helper function to validate basic document structure
function validateBasicDocumentStructure(
  structure: any,
  expectations: any
): void {
  // Check metadata
  expect(structure.metadata.title).toBe('Sample Technical Documentation');
  expect(structure.metadata.wordCount).toBeGreaterThan(
    expectations.wordCountGreaterThan
  );

  // Check chapters (should detect ## headers as chapters)
  expect(structure.chapters.length).toBeGreaterThan(
    expectations.totalChaptersAtLeast
  );
  const chapterTitles = structure.chapters.map((ch: any) => ch.title);
  for (const title of expectations.chapterTitlesInclude) {
    expect(chapterTitles).toContain(title);
  }
}

// Helper function to validate content statistics
function validateContentStatistics(structure: any, expectations: any): void {
  expect(structure.totalParagraphs).toBeGreaterThan(
    expectations.totalParagraphsAtLeast
  );
  expect(structure.totalSentences).toBeGreaterThan(
    expectations.totalSentencesAtLeast
  );
  expect(structure.confidence).toBeGreaterThan(
    expectations.confidenceGreaterThan
  );
}

// Helper function to validate processing metrics
function validateProcessingMetrics(
  structure: any,
  sampleMarkdown: string
): void {
  expect(structure.processingMetrics.parseDurationMs).toBeGreaterThan(0);
  expect(structure.processingMetrics.sourceLength).toBe(sampleMarkdown.length);
}

// Helper function to setup BDD template for complex documentation parsing test
function setupComplexDocumentationBdd() {
  return BDDTemplateFactory.createGivenWhenThenComment(
    [
      'A complex technical documentation markdown file is available',
      'The parser is configured with default settings',
      'The document contains multiple chapters and content types',
    ],
    [
      'The parser processes the complete markdown document',
      'All document structure is extracted and analyzed',
    ],
    [
      'The parsing should complete successfully',
      'All chapters should be correctly identified',
      'Content statistics should be accurately calculated',
      'Processing metrics should be recorded',
    ]
  );
}

// Helper function to execute complex documentation parsing validation
async function executeComplexDocumentationValidation(
  parser: MarkdownParser,
  sampleMarkdown: string
) {
  const result = await parser.parse(sampleMarkdown);
  expect(result.success).toBe(true);

  const structure = getResultData(result);
  const expectations = ExpectationFactory.createComplexDocumentExpectations();

  validateBasicDocumentStructure(structure, expectations);
  validateContentStatistics(structure, expectations);
  validateProcessingMetrics(structure, sampleMarkdown);
}

// Helper function to create malformed markdown for testing
function createMalformedMarkdown(): string {
  return `
# Test Document

## Chapter 1

This has unclosed code blocks:
\`\`\`javascript
function test() {
  return true;

## Chapter 2

This has malformed tables:
| Header 1 | Header 2
Cell 1   | Cell 2

## Chapter 3

This has malformed lists:
* Item 1
* Item 2
 Invalid indentation

## Chapter 4

Normal content to ensure parsing continues. This should work fine and be parsed correctly despite the issues in previous chapters.
      `;
}

// Helper function to validate malformed document parsing
async function validateMalformedDocumentParsing(
  parser: MarkdownParser,
  malformedMarkdown: string
) {
  const result = await parser.parse(malformedMarkdown);
  expect(result.success).toBe(true);

  const structure = getResultData(result);
  expect(structure.chapters.length).toBeGreaterThanOrEqual(4);

  // Validate should detect some issues
  const validationResult = await parser.validate(structure);
  expect(validationResult.isValid).toBe(true);
  // May have warnings but should not have critical errors
}

// Helper function to validate extremely short content parsing
async function validateShortContentParsing(
  parser: MarkdownParser,
  shortMarkdown: string
) {
  const result = await parser.parse(shortMarkdown);
  expect(result.success).toBe(true);

  const structure = getResultData(result);
  expect(structure.chapters.length).toBe(0);
  expect(structure.totalParagraphs).toBe(0);

  const validationResult = await parser.validate(structure);
  expect(validationResult.isValid).toBe(false); // No chapters should fail validation
  expect(validationResult.errors.some((e) => e.code === 'NO_CHAPTERS')).toBe(
    true
  );
}

// Helper function to create headers-only markdown
function createHeadersOnlyMarkdown(): string {
  return `# Document Title

## Chapter 1

## Chapter 2

### Subsection

## Chapter 3
      `;
}

// Helper function to validate headers-only content parsing
async function validateHeadersOnlyParsing(
  parser: MarkdownParser,
  headersOnlyMarkdown: string
) {
  const result = await parser.parse(headersOnlyMarkdown);
  expect(result.success).toBe(true);

  const structure = getResultData(result);
  expect(structure.chapters.length).toBe(3); // ## headers only

  const validationResult = await parser.validate(structure);
  expect(
    validationResult.warnings.some((w) => w.code === 'EMPTY_CHAPTER')
  ).toBe(true);
}

// Helper function to create the complex documentation test
function createComplexDocumentationTest() {
  return EnhancedTestPatterns.createTest(
    `${TestIdGenerator.generateIntegration('1.2', 1)} should parse complex technical documentation end-to-end`,
    async () => {
      const endMeasurement = TestPerformanceMonitor.startMeasurement(
        'complex-document-integration'
      );

      const setup = createParserWithMocks();
      const parser = setup.parser;

      setupComplexDocumentationBdd();
      await executeComplexDocumentationValidation(parser, SAMPLE_MARKDOWN);

      const duration = endMeasurement();
      expect(duration).toBeLessThan(2000); // Integration tests can be slower
    },
    {
      priority: TestPriority.CRITICAL,
      category: 'integration',
      tags: ['end-to-end', 'complex-document', 'full-pipeline'],
      acceptanceCriteria: ['1', '2', '3', '4', '5', '6'],
      slow: true,
      requiresSetup: true,
      cleanupRequired: true,
    }
  );
}

// Helper function to create the malformed document test
function createMalformedDocumentTest() {
  return EnhancedTestPatterns.createTest(
    'should handle malformed documents gracefully',
    async () => {
      const endMeasurement = TestPerformanceMonitor.startMeasurement(
        'malformed-document-integration'
      );

      const setup = createParserWithMocks();
      const parser = setup.parser;

      const malformedMarkdown = createMalformedMarkdown();
      await validateMalformedDocumentParsing(parser, malformedMarkdown);

      const duration = endMeasurement();
      expect(duration).toBeLessThan(1500);
    },
    {
      priority: TestPriority.HIGH,
      category: 'integration',
      tags: ['error-recovery', 'malformed-content', 'graceful-degradation'],
      acceptanceCriteria: ['4'],
      requiresSetup: true,
      cleanupRequired: true,
    }
  );
}

// Helper function to create the short content test
function createShortContentTest() {
  return EnhancedTestPatterns.createTest(
    'should handle extremely short content',
    async () => {
      const endMeasurement = TestPerformanceMonitor.startMeasurement(
        'short-content-integration'
      );

      const setup = createParserWithMocks();
      const parser = setup.parser;

      const shortMarkdown = 'A';
      await validateShortContentParsing(parser, shortMarkdown);

      const duration = endMeasurement();
      expect(duration).toBeLessThan(500); // Should be very fast
    },
    {
      priority: TestPriority.HIGH,
      category: 'integration',
      tags: ['edge-cases', 'short-content', 'validation'],
      acceptanceCriteria: ['4'],
      requiresSetup: true,
      cleanupRequired: true,
    }
  );
}

// Helper function to create the headers-only test
function createHeadersOnlyTest() {
  return EnhancedTestPatterns.createTest(
    'should handle content with only headers',
    async () => {
      const endMeasurement = TestPerformanceMonitor.startMeasurement(
        'headers-only-integration'
      );

      const setup = createParserWithMocks();
      const parser = setup.parser;

      const headersOnlyMarkdown = createHeadersOnlyMarkdown();
      await validateHeadersOnlyParsing(parser, headersOnlyMarkdown);

      const duration = endMeasurement();
      expect(duration).toBeLessThan(1000);
    },
    {
      priority: TestPriority.MEDIUM,
      category: 'integration',
      tags: ['edge-cases', 'headers-only', 'structure-detection'],
      acceptanceCriteria: ['1', '2'],
      requiresSetup: true,
      cleanupRequired: true,
    }
  );
}

// Helper function to create all tests
function createAllTests() {
  createComplexDocumentationTest();
  createMalformedDocumentTest();
  createShortContentTest();
  createHeadersOnlyTest();
}

// Basic test to verify the file structure and imports are working
describe('Parsing Integration Test File Structure', () => {
  test('should have all required helper functions available', () => {
    // Verify that our helper functions are properly defined
    expect(typeof createParserWithMocks).toBe('function');
    expect(typeof validateBasicDocumentStructure).toBe('function');
    expect(typeof validateContentStatistics).toBe('function');
    expect(typeof validateProcessingMetrics).toBe('function');
    expect(typeof setupComplexDocumentationBdd).toBe('function');
    expect(typeof executeComplexDocumentationValidation).toBe('function');
    expect(typeof createMalformedMarkdown).toBe('function');
    expect(typeof validateMalformedDocumentParsing).toBe('function');
    expect(typeof validateShortContentParsing).toBe('function');
    expect(typeof createHeadersOnlyMarkdown).toBe('function');
    expect(typeof validateHeadersOnlyParsing).toBe('function');
    expect(typeof createComplexDocumentationTest).toBe('function');
    expect(typeof createMalformedDocumentTest).toBe('function');
    expect(typeof createShortContentTest).toBe('function');
    expect(typeof createHeadersOnlyTest).toBe('function');
    expect(typeof createAllTests).toBe('function');
  });

  test('should have valid sample markdown content', () => {
    expect(SAMPLE_MARKDOWN).toBeDefined();
    expect(typeof SAMPLE_MARKDOWN).toBe('string');
    expect(SAMPLE_MARKDOWN.length).toBeGreaterThan(0);
  });
});

// Main describe block - now much shorter and cleaner
EnhancedTestPatterns.createDescribe(
  'Document Parsing Integration',
  () => {
    createAllTests();
  },
  {
    priority: TestPriority.HIGH,
    category: 'integration',
    tags: ['document-processing', 'parsing-pipeline'],
    acceptanceCriteria: ['1', '2', '3', '4', '5', '6'],
    slow: true,
    requiresSetup: true,
    cleanupRequired: true,
  }
);
