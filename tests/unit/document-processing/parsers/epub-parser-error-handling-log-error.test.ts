import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { logError } from '../../../../src/core/document-processing/parsers/epub-parser-error-handling.js';
import { DocumentParseError } from '../../../../src/errors/document-parse-error.js';
import {
  setupMockLogger,
  restoreMockLogger,
} from './epub-parser-error-handling-test-utils';

// Common setup and teardown for tests
let mockLogger: any;

beforeEach(() => {
  mockLogger = setupMockLogger();
});

afterEach(() => {
  restoreMockLogger(mockLogger);
});

describe('EPUB Parser Error Handling - logError - Error Instances', () => {
  test('should log Error instance with message', () => {
    const parserName = 'EPUBParser';
    const error = new Error('File not found');

    logError(parserName, error);

    expect(mockLogger.error).toHaveBeenCalledWith('EPUB parsing failed', {
      parser: 'EPUBParser',
      error: 'File not found',
    });
  });

  test('should log DocumentParseError with message', () => {
    const parserName = 'EPUBParser';
    const error = new DocumentParseError(
      'Invalid EPUB structure',
      'INVALID_STRUCTURE'
    );

    logError(parserName, error);

    expect(mockLogger.error).toHaveBeenCalledWith('EPUB parsing failed', {
      parser: 'EPUBParser',
      error: 'Invalid EPUB structure',
    });
  });

  test('should log Error without message as unknown error', () => {
    const parserName = 'EmptyErrorParser';
    const error = new Error('Empty error message');

    logError(parserName, error);

    expect(mockLogger.error).toHaveBeenCalledWith('EPUB parsing failed', {
      parser: 'EmptyErrorParser',
      error: 'Empty error message',
    });
  });
});

describe('EPUB Parser Error Handling - logError - Primitive Error Types', () => {
  test('should log string error as unknown error', () => {
    const parserName = 'TestParser';
    const error = 'Something went wrong';

    logError(parserName, error);

    expect(mockLogger.error).toHaveBeenCalledWith('EPUB parsing failed', {
      parser: 'TestParser',
      error: 'Unknown error',
    });
  });

  test('should log null error as unknown error', () => {
    const parserName = 'NullParser';
    const error = null;

    logError(parserName, error);

    expect(mockLogger.error).toHaveBeenCalledWith('EPUB parsing failed', {
      parser: 'NullParser',
      error: 'Unknown error',
    });
  });

  test('should log undefined error as unknown error', () => {
    const parserName = 'UndefinedParser';
    const error = undefined;

    logError(parserName, error);

    expect(mockLogger.error).toHaveBeenCalledWith('EPUB parsing failed', {
      parser: 'UndefinedParser',
      error: 'Unknown error',
    });
  });

  test('should log number error as unknown error', () => {
    const parserName = 'NumberParser';
    const error = 404;

    logError(parserName, error);

    expect(mockLogger.error).toHaveBeenCalledWith('EPUB parsing failed', {
      parser: 'NumberParser',
      error: 'Unknown error',
    });
  });
});

describe('EPUB Parser Error Handling - logError - Object Errors', () => {
  test('should log object error as unknown error', () => {
    const parserName = 'ObjectParser';
    const error = { code: 'CUSTOM_ERROR', message: 'Custom error message' };

    logError(parserName, error);

    expect(mockLogger.error).toHaveBeenCalledWith('EPUB parsing failed', {
      parser: 'ObjectParser',
      error: 'Unknown error',
    });
  });
});
