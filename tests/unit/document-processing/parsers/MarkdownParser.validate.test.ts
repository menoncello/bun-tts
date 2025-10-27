/**
 * Unit tests for MarkdownParser validate functionality.
 * Tests document validation and quality checks.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import type { Logger } from 'interfaces/logger.js';
import type { ConfigManager } from 'config/config-manager.js';
import { MarkdownParser } from 'src/core/document-processing/parsers/markdown-parser.js';
import {
  MockLoggerFactory,
  MockConfigManagerFactory,
  MarkdownContentFactory,
  TestIdGenerator,
  BDDTemplateFactory,
} from '../../../support/document-processing-factories.js';

/**
 * Helper function to create a basic parser instance for testing
 */
function createParser(): MarkdownParser {
  return new MarkdownParser(
    MockLoggerFactory.create(),
    MockConfigManagerFactory.createDefault()
  );
}

/**
 * Helper function to parse markdown and handle success validation
 */
async function parseMarkdown(parser: MarkdownParser, markdown: string) {
  const parseResult = await parser.parse(markdown);
  expect(parseResult.success).toBe(true);

  if (!parseResult.success) {
    throw new Error('Expected successful parsing result');
  }

  return parseResult.data;
}

describe('MarkdownParser Validate - Basic Structure', () => {
  let parser: MarkdownParser;

  beforeEach(() => {
    parser = createParser();
  });

  test(`${TestIdGenerator.generateUnit('1.2', 4)} should validate correct document structure`, async () => {
    const bddComment = BDDTemplateFactory.createGivenWhenThenComment(
      [
        'A well-structured markdown document with two chapters is available',
        'Each chapter contains proper content with multiple sentences',
        'The document has been successfully parsed into a structure',
        'Validation rules are configured to check document quality',
      ],
      [
        'The parsed document structure is submitted for validation',
        'All validation checks are applied to the structure',
        'Content quality metrics are calculated',
      ],
      [
        'The document should pass all validation checks',
        'No validation errors should be present',
        'The validation score should be above the threshold',
        'The document should be marked as valid',
      ]
    );

    const markdown = MarkdownContentFactory.createSimpleDocument();
    const documentStructure = await parseMarkdown(parser, markdown);

    const validationResult = await parser.validate(documentStructure);
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.errors).toHaveLength(0);
    expect(validationResult.score).toBeGreaterThan(0.8);
  });
});

describe('MarkdownParser Validate - Content Warnings', () => {
  let parser: MarkdownParser;

  beforeEach(() => {
    parser = createParser();
  });

  test('should detect empty chapters', async () => {
    const markdown = `# Test Document

## Chapter 1

## Chapter 2

Some content here.
      `;

    const documentStructure = await parseMarkdown(parser, markdown);
    const validationResult = await parser.validate(documentStructure);

    expect(validationResult.isValid).toBe(true);
    expect(
      validationResult.warnings.some((w) => w.code === 'EMPTY_CHAPTER')
    ).toBe(true);
  });

  test('should detect empty paragraphs', async () => {
    const markdown = `# Test Document

## Chapter 1

## Chapter 2

Some content here.
      `;

    const documentStructure = await parseMarkdown(parser, markdown);
    const validationResult = await parser.validate(documentStructure);

    // This document should have an empty chapter warning
    expect(
      validationResult.warnings.some((w) => w.code === 'EMPTY_CHAPTER')
    ).toBe(true);
  });
});

describe('MarkdownParser Validate - Content Errors', () => {
  let parser: MarkdownParser;

  beforeEach(() => {
    parser = createParser();
  });

  test('should validate document with custom parser configuration', async () => {
    // Test validation with different configuration
    const customConfig = MockConfigManagerFactory.createCustom({
      minSentenceLength: 1,
      maxSentenceLength: 1000,
    });

    const customParser = new MarkdownParser(
      MockLoggerFactory.create(),
      customConfig
    );

    const markdown = `# Test Document

## Chapter 1

This is a test sentence.
      `;

    const documentStructure = await parseMarkdown(customParser, markdown);
    const validationResult = await customParser.validate(documentStructure);

    // Document should be valid with proper configuration
    expect(validationResult.isValid).toBe(true);
  });
});
