/**
 * Integration tests for performance and DI container functionality.
 * Tests performance characteristics and dependency injection.
 */

import { describe, test, expect, beforeEach, mock } from 'bun:test';
import type { Logger } from '../../../src/interfaces/logger.js';
import type { ConfigManager } from '../../../src/config/config-manager.js';
import type { Result } from '../../../src/errors/result.js';
import { BunTtsError } from '../../../src/errors/bun-tts-error.js';
import { container } from '../../../src/di/container.js';
import { MarkdownParser } from '../../../src/core/document-processing/parsers/markdown-parser.js';
import {
  MockLoggerFactory,
  MockConfigManagerFactory,
  MarkdownContentFactory,
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

// Helper function to test DI container resolution
function testDiContainerResolution() {
  expect(() => container.resolve('markdownParser')).not.toThrow();
  const resolvedParser = container.resolve('markdownParser');
  expect(resolvedParser).toBeInstanceOf(MarkdownParser);
}

// Helper function to test injected dependencies usage
async function testInjectedDependenciesUsage(
  parser: MarkdownParser,
  mockLogger: Logger,
  mockConfigManager: ConfigManager,
  sampleMarkdown: string
) {
  const result = await parser.parse(sampleMarkdown);
  expect(result.success).toBe(true);
  expect(mockLogger.info).toHaveBeenCalledWith(
    'Starting Markdown parsing',
    expect.any(Object)
  );
  expect(mockLogger.info).toHaveBeenCalledWith(
    'Markdown parsing completed successfully',
    expect.any(Object)
  );
  expect(mockConfigManager.get).toHaveBeenCalledWith(
    'markdownParser',
    expect.any(Object)
  );
}

// Helper function to test processing performance
async function testProcessingPerformance(
  parser: MarkdownParser,
  sampleMarkdown: string
) {
  const startTime = Date.now();
  const result = await parser.parse(sampleMarkdown);
  const endTime = Date.now();

  expect(result.success).toBe(true);
  expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds

  const structure = getResultData(result);
  // Processing metrics should be reasonable
  expect(structure.processingMetrics.parseDurationMs).toBeLessThan(5000);
  expect(structure.processingMetrics.parseDurationMs).toBeGreaterThan(0);
}

// Helper function to test duration estimation
async function testDurationEstimation(
  parser: MarkdownParser,
  sampleMarkdown: string
) {
  const result = await parser.parse(sampleMarkdown);
  expect(result.success).toBe(true);

  const structure = getResultData(result);
  expect(structure.estimatedTotalDuration).toBeGreaterThan(10); // At least 10 seconds
  expect(structure.estimatedTotalDuration).toBeLessThan(600); // Less than 10 minutes

  // Chapter durations should sum to total
  const chapterSum = structure.chapters.reduce(
    (sum: number, ch: { estimatedDuration: number }) =>
      sum + ch.estimatedDuration,
    0
  );
  expect(Math.abs(chapterSum - structure.estimatedTotalDuration)).toBeLessThan(
    0.1
  );
}

describe('Performance and DI Integration', () => {
  let parser: MarkdownParser;
  let mockLogger: Logger;
  let mockConfigManager: ConfigManager;

  beforeEach(() => {
    const setup = createParserWithMocks();
    parser = setup.parser;
    mockLogger = setup.mockLogger;
    mockConfigManager = setup.mockConfigManager;
  });

  describe('dependency injection integration', () => {
    test('should work with DI container', () => {
      testDiContainerResolution();
    });

    test('should use injected dependencies correctly', async () => {
      await testInjectedDependenciesUsage(
        parser,
        mockLogger,
        mockConfigManager,
        SAMPLE_MARKDOWN
      );
    });
  });

  describe('performance integration', () => {
    test('should process documents within reasonable time', async () => {
      await testProcessingPerformance(parser, SAMPLE_MARKDOWN);
    });

    test('should estimate durations correctly', async () => {
      await testDurationEstimation(parser, SAMPLE_MARKDOWN);
    });
  });
});
