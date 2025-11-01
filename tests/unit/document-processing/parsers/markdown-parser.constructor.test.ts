/**
 * Unit tests for MarkdownParser constructor functionality.
 * Tests parser initialization and configuration handling.
 */

import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { ConfigManager } from '../../../../src/config/config-manager.js';
import { MarkdownParser } from '../../../../src/core/document-processing/parsers/markdown-parser.js';
import { Logger } from '../../../../src/interfaces/logger.js';
import {
  MockLoggerFactory,
  MockConfigManagerFactory,
} from '../../../support/document-processing-factories.js';

function createEmptyConfigManager(): ConfigManager {
  return {
    config: undefined,
    configPath: undefined,
    moduleName: 'bun-tts',
    validator: {},
    merger: {},
    paths: {},
    access: {},
    get: mock((key: string, defaultValue?: any) => {
      if (key === 'markdownParser') {
        return {};
      }
      return defaultValue || {};
    }),
    set: mock(() => {
      // Empty mock function for testing
    }),
    has: mock(() => false),
    clear: mock(() => {
      // Empty mock function for testing
    }),
    getConfig: mock(() => ({})),
    getConfigPath: mock(() => {
      // Empty mock function for testing
    }),
    load: mock(async () => ({ success: true, data: {} })),
    loadConfig: mock(async () => ({ success: true, data: {} })),
    validate: mock(() => ({ success: true, data: true })),
    save: mock(async () => ({ success: true, data: undefined })),
    createSampleConfig: mock(async () => '{}'),
    getGlobalConfigDir: mock(() => '/mock'),
    getGlobalConfigPath: mock(() => '/mock/config.json'),
  } as unknown as ConfigManager;
}

describe('MarkdownParser Constructor', () => {
  let parser: MarkdownParser;
  let testMockLogger: Logger;

  beforeEach(() => {
    testMockLogger = MockLoggerFactory.create();
    parser = new MarkdownParser(
      testMockLogger,
      MockConfigManagerFactory.createDefault()
    );
  });

  test('should initialize with default configuration', () => {
    expect(parser).toBeDefined();
    expect(testMockLogger.debug).toHaveBeenCalledWith(
      'MarkdownParser initialized',
      {
        chapterDetectionPattern: '^#{1,6}\\s+(.+)$',
        confidenceThreshold: 0.8,
        enableStreaming: true,
      }
    );
  });

  test('should handle missing config gracefully', () => {
    const mockConfigManagerEmpty = createEmptyConfigManager();
    const mockLogger = MockLoggerFactory.create();

    const parserWithEmptyConfig = new MarkdownParser(
      mockLogger,
      mockConfigManagerEmpty
    );
    expect(parserWithEmptyConfig).toBeDefined();
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to load Markdown parser config, using defaults',
      expect.any(Object)
    );
  });
});
