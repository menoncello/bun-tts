/**
 * Mock implementations and test helpers for structure-analyzer tests.
 * This file provides properly typed mock objects that implement required interfaces.
 */

import type { ConfigManager } from '../../../../src/config/config-manager';
import { ConfigurationError } from '../../../../src/errors/configuration-error';
import { Result, Ok, Err } from '../../../../src/errors/result';
import type { Logger } from '../../../../src/interfaces/logger';
import type { BunTtsConfig } from '../../../../src/types/config';

/**
 * Mock Logger implementation that satisfies the Logger interface.
 * Uses Bun's mock functions for testing purposes.
 */
export function createMockLogger(): Logger {
  const mockLogger: Logger = {
    debug: (_message: string, ..._args: any[]) => {
      // Mock debug implementation
    },
    info: (_message: string, ..._args: any[]) => {
      // Mock info implementation
    },
    warn: (_message: string, ..._args: any[]) => {
      // Mock warn implementation
    },
    error: (_message: string, ..._args: any[]) => {
      // Mock error implementation
    },
    fatal: (_message: string, ..._args: any[]) => {
      // Mock fatal implementation
    },
    child: (_context: any) => mockLogger,
    level: 'info',
    write: (_chunk: unknown) => {
      // Mock write implementation
    },
  };

  return mockLogger;
}

/**
 * Mock ConfigManager implementation that satisfies the ConfigManager interface.
 * Provides basic mock functionality for configuration management.
 */
export function createMockConfigManager(
  config: Partial<BunTtsConfig> = {}
): ConfigManager {
  const mockConfig: BunTtsConfig = {
    // Add default config values as needed
    logging: {
      level: 'info',
      pretty: true,
      file: false,
    },
    tts: {
      defaultEngine: 'kokoro',
      outputFormat: 'mp3',
      sampleRate: 22050,
      quality: 0.8,
      rate: 1.0,
      volume: 1.0,
    },
    processing: {
      maxFileSize: 100,
      parallel: false,
      maxWorkers: 2,
    },
    cli: {
      showProgress: true,
      colors: true,
      debug: false,
    },
    output: {
      format: 'mp3',
      quality: 'high',
    },
    cache: {
      enabled: true,
      maxSize: 500,
      ttl: 3600,
    },
    ...config,
  };

  return {
    config: mockConfig,
    configPath: undefined,
    moduleName: 'bun-tts',
    validator: {} as any,
    merger: {} as any,
    paths: {} as any,
    access: {} as any,

    async load(
      _configPath?: string
    ): Promise<Result<BunTtsConfig, ConfigurationError>> {
      return Ok(mockConfig);
    },

    async loadConfig(_options?: {
      configPath?: string;
    }): Promise<Result<BunTtsConfig, ConfigurationError>> {
      return Ok(mockConfig);
    },

    getConfig(): BunTtsConfig {
      return mockConfig;
    },

    getConfigPath(): string | undefined {
      return undefined;
    },

    validate(_config: Partial<BunTtsConfig>): Result<true, ConfigurationError> {
      return Ok(true);
    },

    getGlobalConfigDir(): string {
      return '/mock/config/dir';
    },

    getGlobalConfigPath(): string {
      return '/mock/config/dir/config.json';
    },

    async createSampleConfig(): Promise<string> {
      return '/mock/config/dir/sample-config.json';
    },

    get<T = unknown>(_key: string, _defaultValue?: T): T {
      return _defaultValue as T;
    },

    set(_key: string, _value: unknown): void {
      // Mock implementation - does nothing
    },

    has(_key: string): boolean {
      return false;
    },

    clear(): void {
      // Mock implementation - does nothing
    },

    async save(
      _config: BunTtsConfig,
      _filePath: string
    ): Promise<Result<void, ConfigurationError>> {
      return Ok(void 0);
    },

    // Add missing private methods as public for mock
    async loadConfigurationFile(_configPath?: string): Promise<any> {
      return { config: mockConfig, filepath: '/mock/path' };
    },

    async handleLoadSuccess(
      result: any
    ): Promise<Result<BunTtsConfig, ConfigurationError>> {
      return Ok(result.config || mockConfig);
    },

    async handleLoadError(
      error: any,
      _configPath?: string
    ): Promise<Result<BunTtsConfig, ConfigurationError>> {
      return Err(
        new ConfigurationError(
          `Mock error: ${error?.message || 'Unknown error'}`,
          { errorCode: 'MOCK_ERROR' }
        )
      );
    },

    isFileNotFoundError(error: unknown): boolean {
      return error instanceof Error && error.message.includes('ENOENT');
    },

    async getDefaultConfig(): Promise<BunTtsConfig> {
      return mockConfig;
    },

    async mergeWithDefaults(config: any): Promise<BunTtsConfig> {
      return { ...mockConfig, ...config };
    },
  } as unknown as ConfigManager;
}

/**
 * Mock parser implementation for document parsers.
 * Provides a consistent mock interface for different parser types.
 */
export function createMockParser() {
  return {
    parse: (() =>
      Promise.resolve({
        success: true,
        data: {
          structure: {
            metadata: {
              title: '',
              wordCount: 0,
              totalWordCount: 0,
              totalChapters: 0,
              totalParagraphs: 0,
              totalSentences: 0,
              estimatedTotalDuration: 0,
              confidence: 0,
              processingMetrics: {
                startTime: Date.now(),
                endTime: Date.now(),
                processingTime: 0,
                nodesProcessed: 0,
              },
              customMetadata: {},
            },
            chapters: [],
            sections: [],
            tableOfContents: [],
            totalParagraphs: 0,
            totalSentences: 0,
            totalWordCount: 0,
            totalChapters: 0,
            estimatedTotalDuration: 0,
            confidence: 0,
            processingMetrics: {
              startTime: Date.now(),
              endTime: Date.now(),
              processingTime: 0,
              nodesProcessed: 0,
            },
          },
        },
      })) as any,
    extractStructure: (() => Promise.resolve({})) as any,
  };
}

/**
 * Type definition for mock chapter confidence factors.
 */
export interface MockChapterConfidenceFactors {
  structuralIntegrity: number;
  headingHierarchy: number;
  contentCompleteness: number;
  logicalFlow: number;
}

/**
 * Type definition for enhanced chapter data with confidence factors.
 */
export interface MockChapterWithConfidence {
  id: string;
  title: string;
  level: number;
  startOffset?: number;
  endOffset?: number;
  wordCount?: number;
  confidence?: number;
  confidenceFactors?: MockChapterConfidenceFactors;
}

/**
 * Create a mock chapter with confidence factors for testing.
 */
export function createMockChapter(
  overrides: Partial<MockChapterWithConfidence> = {}
): MockChapterWithConfidence {
  return {
    id: 'chapter-1',
    title: 'Test Chapter',
    level: 1,
    startOffset: 0,
    endOffset: 100,
    wordCount: 50,
    confidence: 0.85,
    confidenceFactors: {
      structuralIntegrity: 0.9,
      headingHierarchy: 0.8,
      contentCompleteness: 0.85,
      logicalFlow: 0.85,
    },
    ...overrides,
  };
}

/**
 * Type annotation helper for array filter callbacks to avoid implicit 'any' errors.
 */
export function filterHighConfidence(
  chapters: MockChapterWithConfidence[]
): MockChapterWithConfidence[] {
  return chapters.filter(
    (chapter: MockChapterWithConfidence) => (chapter.confidence ?? 0) > 0.8
  );
}

/**
 * Type annotation helper for medium confidence chapters.
 */
export function filterMediumConfidence(
  chapters: MockChapterWithConfidence[]
): MockChapterWithConfidence[] {
  return chapters.filter(
    (chapter: MockChapterWithConfidence) =>
      (chapter.confidence ?? 0) > 0.5 && (chapter.confidence ?? 0) <= 0.8
  );
}

/**
 * Type annotation helper for low confidence chapters.
 */
export function filterLowConfidence(
  chapters: MockChapterWithConfidence[]
): MockChapterWithConfidence[] {
  return chapters.filter(
    (chapter: MockChapterWithConfidence) => (chapter.confidence ?? 0) <= 0.5
  );
}

/**
 * Helper functions to create proper test objects that implement required interfaces
 */

/**
 * Create a proper Sentence object for testing
 */
export function createTestSentence(
  text: string,
  position = 0,
  id?: string
): any {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  return {
    id: id || `sentence-${position}`,
    text,
    position,
    wordCount: words.length,
    estimatedDuration: words.length * 0.5, // 0.5 seconds per word
    hasFormatting: false,
  };
}

/**
 * Create a proper Paragraph object for testing
 */
export function createTestParagraph(
  text: string,
  position = 0,
  sentences?: any[],
  id?: string
): any {
  const sentenceObjects = sentences || [createTestSentence(text, 0)];
  const totalWordCount = sentenceObjects.reduce(
    (sum, s) => sum + s.wordCount,
    0
  );
  return {
    id: id || `paragraph-${position}`,
    type: 'text' as const,
    sentences: sentenceObjects,
    position,
    wordCount: totalWordCount,
    rawText: text,
    includeInAudio: true,
    confidence: 0.9,
    text,
  };
}

/**
 * Create a test paragraph with word counts for testing.
 */
export function createTestParagraphWithWordCounts(
  wordCounts: number[],
  startOffset: number
) {
  return {
    type: 'paragraph' as const,
    content: 'Test paragraph content',
    startOffset,
    endOffset: startOffset + 100,
    lineNumber: 1,
    sentences: wordCounts.map((count, index) => ({
      text: `Test sentence ${index + 1}`,
      startOffset: startOffset + index * 20,
      endOffset: startOffset + (index + 1) * 20,
      wordCount: count,
    })),
  };
}
