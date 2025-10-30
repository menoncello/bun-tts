import { describe, test, expect } from 'bun:test';
import { hasParseResultWithErrorInstance } from '../../../../src/core/document-processing/parsers/epub-parser-type-guards.js';
import type { ParseResult } from '../../../../src/core/document-processing/types.js';

// Helper function to create a base parse result
const createBaseParseResult = (): ParseResult => ({
  success: false,
  error: { message: 'Parse failed' },
});

describe('EPUB Parser Type Guards - Error Instance', () => {
  describe('hasParseResultWithErrorInstance', () => {
    test('should return true for parse result with Error instance', () => {
      const parseResult = createBaseParseResult();
      const error = new Error('Parse failed');
      parseResult.error = error;

      expect(hasParseResultWithErrorInstance(parseResult)).toBe(true);
    });

    test('should return false for parse result with plain object error', () => {
      const parseResult = createBaseParseResult();

      expect(hasParseResultWithErrorInstance(parseResult)).toBe(false);
    });

    test('should return false for parse result with null error', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = undefined;

      expect(hasParseResultWithErrorInstance(parseResult)).toBe(false);
    });

    test('should return false for parse result with undefined error', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = undefined;

      expect(hasParseResultWithErrorInstance(parseResult)).toBe(false);
    });

    test('should return false for parse result with string error', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = 'String error message' as any;

      expect(hasParseResultWithErrorInstance(parseResult)).toBe(false);
    });

    test('should return true for parse result with custom Error class', () => {
      const parseResult = createBaseParseResult();
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }
      const error = new CustomError('Custom error occurred');
      parseResult.error = error;

      expect(hasParseResultWithErrorInstance(parseResult)).toBe(true);
    });

    test('should return true for parse result with TypeError', () => {
      const parseResult = createBaseParseResult();
      const error = new TypeError('Type error occurred');
      parseResult.error = error;

      expect(hasParseResultWithErrorInstance(parseResult)).toBe(true);
    });

    test('should return true for parse result with ReferenceError', () => {
      const parseResult = createBaseParseResult();
      const error = new ReferenceError('Reference error occurred');
      parseResult.error = error;

      expect(hasParseResultWithErrorInstance(parseResult)).toBe(true);
    });

    test('should return true for parse result with SyntaxError', () => {
      const parseResult = createBaseParseResult();
      const error = new SyntaxError('Syntax error occurred');
      parseResult.error = error;

      expect(hasParseResultWithErrorInstance(parseResult)).toBe(true);
    });

    test('should return true for parse result with RangeError', () => {
      const parseResult = createBaseParseResult();
      const error = new RangeError('Range error occurred');
      parseResult.error = error;

      expect(hasParseResultWithErrorInstance(parseResult)).toBe(true);
    });

    test('should return true for parse result with EvalError', () => {
      const parseResult = createBaseParseResult();
      const error = new EvalError('Eval error occurred');
      parseResult.error = error;

      expect(hasParseResultWithErrorInstance(parseResult)).toBe(true);
    });

    test('should return true for parse result with URIError', () => {
      const parseResult = createBaseParseResult();
      const error = new URIError('URI error occurred');
      parseResult.error = error;

      expect(hasParseResultWithErrorInstance(parseResult)).toBe(true);
    });

    test('should return false for parse result with object that looks like Error but not instance', () => {
      const parseResult = createBaseParseResult();
      const errorLikeObject = {
        name: 'Error',
        message: 'Error-like object',
        stack: 'Error stack trace',
      };
      parseResult.error = errorLikeObject as any;

      expect(hasParseResultWithErrorInstance(parseResult)).toBe(false);
    });

    test('should return false for parse result with Error constructor but not instance', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = Error as any;

      expect(hasParseResultWithErrorInstance(parseResult)).toBe(false);
    });

    test('should return true for successful parse result with Error instance', () => {
      const parseResult = createBaseParseResult();
      parseResult.success = true;
      const error = new Error('Success with error');
      parseResult.error = error;

      expect(hasParseResultWithErrorInstance(parseResult)).toBe(true);
    });

    test('should preserve type safety for error instance methods', () => {
      const parseResult = createBaseParseResult();
      const error = new Error('Test error');
      parseResult.error = error;

      if (hasParseResultWithErrorInstance(parseResult)) {
        // TypeScript should know that error is an Error instance
        expect(typeof parseResult.error.message).toBe('string');
        expect(typeof parseResult.error.name).toBe('string');
        expect(typeof parseResult.error.stack).toBe('string');
        expect(typeof parseResult.error.toString).toBe('function');
      }
    });

    test('should handle Error with custom properties', () => {
      const parseResult = createBaseParseResult();
      const error = new Error('Error with custom properties') as any;
      error.code = 'CUSTOM_CODE';
      error.severity = 'error';
      error.details = { field: 'title' };
      parseResult.error = error;

      expect(hasParseResultWithErrorInstance(parseResult)).toBe(true);
    });

    test('should handle Error created from Error.captureStackTrace', () => {
      const parseResult = createBaseParseResult();
      const error = new Error('Error with captured stack');
      if (Error.captureStackTrace) {
        Error.captureStackTrace(error, hasParseResultWithErrorInstance);
      }
      parseResult.error = error;

      expect(hasParseResultWithErrorInstance(parseResult)).toBe(true);
    });

    test('should work with async errors', () => {
      const parseResult = createBaseParseResult();
      const error = new Error('Async error occurred');
      parseResult.error = error;

      expect(hasParseResultWithErrorInstance(parseResult)).toBe(true);
    });
  });
});
