import { describe, test, expect } from 'bun:test';
import { normalizeError } from '../../../../src/core/document-processing/parsers/epub-parser-error-handling.js';
import { DocumentParseError } from '../../../../src/errors/document-parse-error.js';

// Test helper function moved to outer scope
const createFunctionError = () => {
  throw new Error('Function error');
};

describe('EPUB Parser Error Handling - normalizeError - DocumentParseError', () => {
  test('should return DocumentParseError unchanged', () => {
    const originalError = new DocumentParseError(
      'EPUB parse error',
      'PARSE_ERROR',
      {
        detail: 'additional info',
      }
    );

    const result = normalizeError(originalError);

    expect(result).toBe(originalError);
    expect(result.message).toBe('EPUB parse error');
    expect(result.code).toBe('PARSE_ERROR');
    expect(result.details).toEqual({
      detail: 'additional info',
    });
  });

  test('should preserve DocumentParseError with empty details', () => {
    const originalError = new DocumentParseError('Simple error');

    const result = normalizeError(originalError);

    expect(result).toBe(originalError);
    expect(result.message).toBe('Simple error');
    expect(result.code).toBe('PARSE_ERROR');
    expect(result.details).toEqual({});
  });
});

describe('EPUB Parser Error Handling - normalizeError - Error Instances', () => {
  test('should convert regular Error to DocumentParseError', () => {
    const originalError = new Error('Network connection failed');
    originalError.stack =
      'Error: Network connection failed\n    at test.js:1:1';

    const result = normalizeError(originalError);

    expect(result).toBeInstanceOf(DocumentParseError);
    expect(result.message).toBe('Network connection failed');
    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.details).toEqual({
      originalError: 'Network connection failed',
      stack: 'Error: Network connection failed\n    at test.js:1:1',
    });
  });

  test('should convert Error without stack to DocumentParseError', () => {
    const originalError = new Error('Missing file');
    delete (originalError as any).stack;

    const result = normalizeError(originalError);

    expect(result).toBeInstanceOf(DocumentParseError);
    expect(result.message).toBe('Missing file');
    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.details).toEqual({
      originalError: 'Missing file',
      stack: undefined,
    });
  });

  test('should handle custom error types', () => {
    class CustomError extends Error {
      constructor(
        message: string,
        public code: string
      ) {
        super(message);
        this.name = 'CustomError';
      }
    }

    const customError = new CustomError('Custom failure', 'CUSTOM_CODE');

    const result = normalizeError(customError);

    expect(result).toBeInstanceOf(DocumentParseError);
    expect(result.message).toBe('Custom failure');
    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.details.originalError).toBe('Custom failure');
    expect(result.details.stack).toBeDefined();
  });
});

describe('EPUB Parser Error Handling - normalizeError - Primitive Types', () => {
  test('should convert string to DocumentParseError', () => {
    const error = 'Invalid input format';

    const result = normalizeError(error);

    expect(result).toBeInstanceOf(DocumentParseError);
    expect(result.message).toBe('Unknown error occurred during parsing');
    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.details).toEqual({
      error: 'Invalid input format',
    });
  });

  test('should convert number to DocumentParseError', () => {
    const error = 404;

    const result = normalizeError(error);

    expect(result).toBeInstanceOf(DocumentParseError);
    expect(result.message).toBe('Unknown error occurred during parsing');
    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.details).toEqual({
      error: '404',
    });
  });

  test('should convert boolean to DocumentParseError', () => {
    const error = false;

    const result = normalizeError(error);

    expect(result).toBeInstanceOf(DocumentParseError);
    expect(result.message).toBe('Unknown error occurred during parsing');
    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.details).toEqual({
      error: 'false',
    });
  });

  test('should handle null and undefined', () => {
    const nullResult = normalizeError(null);
    const undefinedResult = normalizeError(null);

    expect(nullResult).toBeInstanceOf(DocumentParseError);
    expect(nullResult.message).toBe('Unknown error occurred during parsing');
    expect(nullResult.code).toBe('UNKNOWN_ERROR');

    expect(undefinedResult).toBeInstanceOf(DocumentParseError);
    expect(undefinedResult.message).toBe(
      'Unknown error occurred during parsing'
    );
    expect(undefinedResult.code).toBe('UNKNOWN_ERROR');
  });
});

describe('EPUB Parser Error Handling - normalizeError - Complex Types', () => {
  test('should convert object to DocumentParseError', () => {
    const error = { type: 'ValidationError', field: 'title' };

    const result = normalizeError(error);

    expect(result).toBeInstanceOf(DocumentParseError);
    expect(result.message).toBe('Unknown error occurred during parsing');
    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.details).toEqual({
      error: '[object Object]',
    });
  });

  test('should convert array to DocumentParseError', () => {
    const error = ['error1', 'error2'];

    const result = normalizeError(error);

    expect(result).toBeInstanceOf(DocumentParseError);
    expect(result.message).toBe('Unknown error occurred during parsing');
    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.details).toEqual({
      error: 'error1,error2',
    });
  });

  test('should handle function errors', () => {
    const error = createFunctionError;

    const result = normalizeError(error);

    expect(result).toBeInstanceOf(DocumentParseError);
    expect(result.message).toBe('Unknown error occurred during parsing');
    expect(result.code).toBe('UNKNOWN_ERROR');
  });

  test('should handle symbol errors', () => {
    const error = Symbol('custom_error');

    const result = normalizeError(error);

    expect(result).toBeInstanceOf(DocumentParseError);
    expect(result.message).toBe('Unknown error occurred during parsing');
    expect(result.code).toBe('UNKNOWN_ERROR');
  });
});
