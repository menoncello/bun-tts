/**
 * Integration tests for document validation functionality.
 * Tests validation of parsed document structures.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import type { Logger } from '../../../src/interfaces/logger.js';
import type { ConfigManager } from '../../../src/config/config-manager.js';
import type { Result } from '../../../src/errors/result.js';
import { BunTtsError } from '../../../src/errors/bun-tts-error.js';
import { MarkdownParser } from '../../../src/core/document-processing/parsers/markdown-parser.js';
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

// Helper function to setup BDD template for validation test
function setupValidationBdd() {
  return BDDTemplateFactory.createGivenWhenThenComment(
    [
      'A well-structured technical documentation markdown file is available',
      'The document has been successfully parsed into a DocumentStructure',
      'The parser validation functionality is available',
    ],
    [
      'The parsed document structure is submitted for validation',
      'All validation rules are applied to the structure',
    ],
    [
      'The document should pass validation successfully',
      'No critical errors should be found',
      'The validation score should be above the threshold',
      'Minimal warnings should be present for well-structured content',
    ]
  );
}

// Helper function to execute document validation
async function executeDocumentValidation(
  parser: MarkdownParser,
  sampleMarkdown: string
) {
  const parseResult = await parser.parse(sampleMarkdown);
  expect(parseResult.success).toBe(true);

  const validationResult = await parser.validate(getResultData(parseResult));
  const expectations = ExpectationFactory.createValidationExpectations();

  expect(validationResult.isValid).toBe(expectations.isValid);
  expect(validationResult.errors).toHaveLength(0);
  expect(validationResult.score).toBeGreaterThan(expectations.scoreGreaterThan);

  // Should have minimal warnings for well-structured content
  expect(validationResult.warnings.length).toBeLessThan(
    expectations.warningsLessThan
  );
}

// Helper function to setup high confidence threshold configuration
function setupHighConfidenceThreshold(mockConfigManager: ConfigManager) {
  const originalGet = mockConfigManager.get;
  mockConfigManager.get = ((key: string, defaultValue?: unknown) => {
    if (key === 'markdownParser') {
      return {
        ...(originalGet as any)('markdownParser', defaultValue),
        confidenceThreshold: 0.99,
      };
    }
    return originalGet as any;
  }) as any;
}

// Helper function to test high confidence threshold parsing
async function testHighConfidenceThreshold(
  mockLogger: Logger,
  mockConfigManager: ConfigManager,
  sampleMarkdown: string
) {
  const strictParser = new MarkdownParser(mockLogger, mockConfigManager);
  const result = await strictParser.parse(sampleMarkdown);

  // The sample document is well-structured, so should still pass
  expect(result.success).toBe(true);

  const structure = getResultData(result);
  expect(structure.confidence).toBeGreaterThan(0.99);
}

describe('Validation Integration', () => {
  let parser: MarkdownParser;
  let mockLogger: Logger;
  let mockConfigManager: ConfigManager;

  beforeEach(() => {
    const setup = createParserWithMocks();
    parser = setup.parser;
    mockLogger = setup.mockLogger;
    mockConfigManager = setup.mockConfigManager;
  });

  test(`${TestIdGenerator.generateIntegration('1.2', 3)} should validate parsed document successfully`, async () => {
    const bddComment = setupValidationBdd();
    await executeDocumentValidation(parser, SAMPLE_MARKDOWN);
  });

  test('should handle different confidence thresholds', async () => {
    setupHighConfidenceThreshold(mockConfigManager);
    await testHighConfidenceThreshold(
      mockLogger,
      mockConfigManager,
      SAMPLE_MARKDOWN
    );
  });
});
