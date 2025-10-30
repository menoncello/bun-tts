import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import {
  logSuccess,
  logError,
  normalizeError,
} from '../../../../src/core/document-processing/parsers/epub-parser-error-handling.js';
import type {
  Chapter,
  DocumentStatistics,
} from '../../../../src/core/document-processing/types.js';
import { DocumentParseError } from '../../../../src/errors/document-parse-error.js';
import {
  setupMockLogger,
  restoreMockLogger,
  createTestChapter,
  createTestStatistics,
} from './epub-parser-error-handling-test-utils';

describe('EPUB Parser Error Handling - Integration Tests', () => {
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockLogger);
  });

  describe('error workflow integration', () => {
    test('should log error correctly', () => {
      const parserName = 'IntegrationParser';
      const originalError = new Error('Integration test error');

      logError(parserName, originalError);

      expect(mockLogger.error).toHaveBeenCalledWith('EPUB parsing failed', {
        parser: 'IntegrationParser',
        error: 'Integration test error',
      });
    });

    test('should normalize error correctly', () => {
      const originalError = new Error('Integration test error');
      const normalizedError = normalizeError(originalError);

      expect(normalizedError).toBeInstanceOf(DocumentParseError);
      expect(normalizedError.message).toBe('Integration test error');
      expect(normalizedError.code).toBe('UNKNOWN_ERROR');
    });

    test('should handle complete error workflow end-to-end', () => {
      const parserName = 'IntegrationParser';
      const originalError = new Error('Integration test error');

      // Test error logging and normalization together
      logError(parserName, originalError);
      const normalizedError = normalizeError(originalError);

      expect(mockLogger.error).toHaveBeenCalledWith('EPUB parsing failed', {
        parser: 'IntegrationParser',
        error: 'Integration test error',
      });

      expect(normalizedError).toBeInstanceOf(DocumentParseError);
      expect(normalizedError.message).toBe('Integration test error');
      expect(normalizedError.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('success workflow integration', () => {
    test('should log success correctly', () => {
      const parserName = 'SuccessIntegrationParser';
      const chapters: Chapter[] = [
        createTestChapter('success-chapter', 'Success Chapter', 250),
      ];
      const stats: DocumentStatistics = createTestStatistics(250, 1);
      const parseTimeMs = 300;

      logSuccess(parserName, chapters, stats, parseTimeMs);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'EPUB parsing completed successfully',
        {
          parser: 'SuccessIntegrationParser',
          chapters: 1,
          words: 250,
          parseTime: 300,
        }
      );
    });

    test('should handle complete success workflow end-to-end', () => {
      const parserName = 'SuccessIntegrationParser';
      const chapters: Chapter[] = [
        createTestChapter('success-chapter', 'Success Chapter', 250),
      ];
      const stats: DocumentStatistics = createTestStatistics(250, 1);
      const parseTimeMs = 300;

      logSuccess(parserName, chapters, stats, parseTimeMs);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'EPUB parsing completed successfully',
        {
          parser: 'SuccessIntegrationParser',
          chapters: 1,
          words: 250,
          parseTime: 300,
        }
      );
    });
  });

  describe('mixed scenario workflows', () => {
    test('should handle error followed by success scenario', () => {
      const parserName = 'MixedScenarioParser';

      // First log an error
      logError(parserName, 'Test error message');

      expect(mockLogger.error).toHaveBeenCalledWith('EPUB parsing failed', {
        parser: 'MixedScenarioParser',
        error: 'Unknown error',
      });
    });

    test('should handle success after error recovery', () => {
      const parserName = 'MixedScenarioParser';

      // Then log success (simulating recovery)
      const chapters: Chapter[] = [];
      const stats: DocumentStatistics = createTestStatistics(0, 0);
      logSuccess(parserName, chapters, stats, 0);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'EPUB parsing completed successfully',
        {
          parser: 'MixedScenarioParser',
          chapters: 0,
          words: 0,
          parseTime: 0,
        }
      );
    });

    test('should handle mixed success and error scenarios end-to-end', () => {
      const parserName = 'MixedScenarioParser';

      // First log an error
      logError(parserName, 'Test error message');

      // Then log success (simulating recovery)
      const chapters: Chapter[] = [];
      const stats: DocumentStatistics = createTestStatistics(0, 0);
      logSuccess(parserName, chapters, stats, 0);

      expect(mockLogger.error).toHaveBeenCalledWith('EPUB parsing failed', {
        parser: 'MixedScenarioParser',
        error: 'Unknown error',
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'EPUB parsing completed successfully',
        {
          parser: 'MixedScenarioParser',
          chapters: 0,
          words: 0,
          parseTime: 0,
        }
      );
    });
  });
});
