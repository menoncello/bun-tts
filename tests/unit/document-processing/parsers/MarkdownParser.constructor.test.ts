/**
 * Unit tests for MarkdownParser constructor functionality.
 * Tests parser initialization and configuration handling.
 */

import { describe, test, expect, beforeEach, mock } from 'bun:test';
import type { Logger } from 'interfaces/logger.js';
import type { ConfigManager } from 'config/config-manager.js';
import { MarkdownParser } from 'src/core/document-processing/parsers/markdown-parser.js';
import {
  MockLoggerFactory,
  MockConfigManagerFactory,
} from '../../../support/document-processing-factories.js';

// Mock logger and config manager using factories
const mockLogger = MockLoggerFactory.createWithExpectations();
const mockConfigManager = MockConfigManagerFactory.createDefault();

// Test helper functions for constructor tests
function setupConstructorTests() {
  return new MarkdownParser(
    MockLoggerFactory.create(),
    MockConfigManagerFactory.createDefault()
  );
}

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
    set: mock(() => {}),
    has: mock(() => false),
    clear: mock(() => {}),
    getConfig: mock(() => ({})),
    getConfigPath: mock(() => undefined),
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

    const parserWithEmptyConfig = new MarkdownParser(
      mockLogger,
      mockConfigManagerEmpty
    );
    expect(parserWithEmptyConfig).toBeDefined();
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Failed to load Markdown parser config, using defaults',
      expect.any(Object)
    );
  });
});
