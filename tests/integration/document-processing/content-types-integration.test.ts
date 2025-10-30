/**
 * Integration tests for mixed content types handling.
 * Tests how the parser processes different markdown elements.
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
  ExpectationFactory,
  TestIdGenerator,
  BDDTemplateFactory,
} from '../../support/document-processing-factories.js';

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

// Helper function to validate paragraph types and content
function validateMixedContentTypes(structure: any): void {
  const allParagraphs = structure.chapters.flatMap((ch: any) => ch.paragraphs);
  const expectations = ExpectationFactory.createComplexDocumentExpectations();

  // Should have different paragraph types
  const paragraphTypes = Array.from(
    new Set(allParagraphs.map((p: any) => p.type))
  );
  for (const type of expectations.paragraphTypesInclude) {
    expect(paragraphTypes).toContain(type);
  }
}

// Helper function to validate code blocks are excluded from audio
function validateCodeBlocksExcluded(structure: any): void {
  const allParagraphs = structure.chapters.flatMap((ch: any) => ch.paragraphs);

  const codeParagraphs = allParagraphs.filter((p: any) => p.type === 'code');
  expect(codeParagraphs.length).toBeGreaterThan(0);
  expect(codeParagraphs.every((p: any) => !p.includeInAudio)).toBe(true);
}

// Helper function to validate blockquotes are included in audio
function validateBlockquotesIncluded(structure: any): void {
  const allParagraphs = structure.chapters.flatMap((ch: any) => ch.paragraphs);

  const blockquoteParagraphs = allParagraphs.filter(
    (p: any) => p.type === 'blockquote'
  );
  expect(blockquoteParagraphs.length).toBeGreaterThan(0);
  expect(blockquoteParagraphs.every((p: any) => p.includeInAudio)).toBe(true);
}

// Helper function to setup BDD template for mixed content types test
function setupMixedContentTypesBdd() {
  return BDDTemplateFactory.createGivenWhenThenComment(
    [
      'A markdown document with various content types is available',
      'The document includes text, code blocks, blockquotes, lists, and tables',
      'The parser is configured to include/exclude different content types',
    ],
    [
      'The parser processes the document and identifies each content type',
      'Appropriate inclusion/exclusion rules are applied to each paragraph',
    ],
    [
      'All expected content types should be identified',
      'Code blocks should be excluded from audio processing',
      'Blockquotes should be included in audio processing',
      'Each paragraph should have the correct type classification',
    ]
  );
}

// Helper function to execute mixed content types validation
async function executeMixedContentTypesValidation(
  parser: MarkdownParser,
  sampleMarkdown: string
) {
  const result = await parser.parse(sampleMarkdown);
  expect(result.success).toBe(true);

  const structure = getResultData(result);

  validateMixedContentTypes(structure);
  validateCodeBlocksExcluded(structure);
  validateBlockquotesIncluded(structure);
}

// Helper function to setup custom configuration for content inclusion test
function setupCustomContentInclusionConfig(mockConfigManager: ConfigManager) {
  const originalGet = mockConfigManager.get;
  mockConfigManager.get = ((key: string, defaultValue?: unknown) => {
    if (key === 'markdownParser') {
      return {
        ...(originalGet as any)('markdownParser', defaultValue),
        includeCodeBlocks: true,
        chapterHeaderLevels: [1, 2], // Include # and ## headers
      };
    }
    return originalGet as any;
  }) as any;
}

// Helper function to validate custom configuration results
function validateCustomConfigurationResults(structure: any) {
  // Should include # headers as chapters now
  const chapterTitles = structure.chapters.map(
    (ch: { title: string }) => ch.title
  );
  expect(chapterTitles).toContain('Sample Technical Documentation'); // # header

  // Code blocks should be included in audio
  const codeParagraphs = structure.chapters
    .flatMap((ch: { paragraphs: unknown[] }) => ch.paragraphs)
    .filter((p: any) => p.type === 'code');
  expect(codeParagraphs.every((p: any) => p.includeInAudio)).toBe(true);
}

describe('Content Types Integration', () => {
  let parser: MarkdownParser;
  let mockLogger: Logger;
  let mockConfigManager: ConfigManager;

  beforeEach(() => {
    const setup = createParserWithMocks();
    parser = setup.parser;
    mockLogger = setup.mockLogger;
    mockConfigManager = setup.mockConfigManager;
  });

  test(`${TestIdGenerator.generateIntegration('1.2', 2)} should handle mixed content types correctly`, async () => {
    setupMixedContentTypesBdd();
    await executeMixedContentTypesValidation(parser, SAMPLE_MARKDOWN);
  });

  test('should respect custom configuration for content inclusion', async () => {
    setupCustomContentInclusionConfig(mockConfigManager);
    const customParser = new MarkdownParser(mockLogger, mockConfigManager);
    const result = await customParser.parse(SAMPLE_MARKDOWN);
    expect(result.success).toBe(true);

    const structure = getResultData(result);
    validateCustomConfigurationResults(structure);
  });
});
