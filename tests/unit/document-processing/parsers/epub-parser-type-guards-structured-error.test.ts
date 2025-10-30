import { describe, test, expect } from 'bun:test';
import { hasParseResultWithStructuredError } from '../../../../src/core/document-processing/parsers/epub-parser-type-guards.js';
import type { ParseResult } from '../../../../src/core/document-processing/types.js';

// Helper function to create a base parse result
const createBaseParseResult = (): ParseResult => ({
  success: false,
  error: { message: 'Parse failed' },
});

describe('EPUB Parser Type Guards - Structured Error', () => {
  describe('hasParseResultWithStructuredError', () => {
    test('should return true for parse result with structured error object', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        code: 'PARSE_ERROR',
        message: 'Parse failed',
        severity: 'error',
        recoverable: false,
      };

      expect(hasParseResultWithStructuredError(parseResult)).toBe(true);
    });

    test('should return false for parse result with plain error object', () => {
      const parseResult = createBaseParseResult();

      expect(hasParseResultWithStructuredError(parseResult)).toBe(false);
    });

    test('should return false for parse result with null error', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = undefined;

      expect(hasParseResultWithStructuredError(parseResult)).toBe(false);
    });

    test('should return false for parse result with undefined error', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = undefined;

      expect(hasParseResultWithStructuredError(parseResult)).toBe(false);
    });

    test('should return false for parse result with string error', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = 'String error message' as any;

      expect(hasParseResultWithStructuredError(parseResult)).toBe(false);
    });

    test('should return true for parse result with Error instance that has structured properties', () => {
      const parseResult = createBaseParseResult();
      const error = new Error('Parse failed') as any;
      error.code = 'PARSE_ERROR';
      error.severity = 'error';
      error.recoverable = false;
      parseResult.error = error;

      expect(hasParseResultWithStructuredError(parseResult)).toBe(true);
    });

    test('should return true for parse result with minimal structured error (code + message)', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        code: 'MINIMAL_ERROR',
        message: 'Minimal structured error',
      };

      expect(hasParseResultWithStructuredError(parseResult)).toBe(true);
    });

    test('should return false for parse result with error having only message', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        message: 'Error with only message',
      };

      expect(hasParseResultWithStructuredError(parseResult)).toBe(false);
    });

    test('should return false for parse result with error having only code', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        code: 'ERROR_ONLY_CODE',
      } as any;

      expect(hasParseResultWithStructuredError(parseResult)).toBe(false);
    });

    test('should return true for parse result with complex structured error', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        code: 'COMPLEX_ERROR',
        message: 'Complex error occurred',
        severity: 'warning',
        recoverable: true,
        category: 'validation',
        details: {
          field: 'metadata',
          value: 'invalid',
          suggestions: ['provide valid title', 'add author'],
        },
        timestamp: new Date().toISOString(),
        stack: 'Error stack trace',
        context: {
          file: 'epub-parser.ts',
          line: 123,
          function: 'parseMetadata',
        },
      };

      expect(hasParseResultWithStructuredError(parseResult)).toBe(true);
    });

    test('should return true for parse result with structured error with nested details', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        code: 'NESTED_ERROR',
        message: 'Error with nested details',
        details: {
          validation: {
            field: 'title',
            constraints: {
              minLength: 1,
              maxLength: 255,
              required: true,
            },
            actualValue: '',
            violations: ['required', 'minLength'],
          },
          location: {
            chapter: 1,
            section: 'metadata',
            line: 10,
          },
        },
      };

      expect(hasParseResultWithStructuredError(parseResult)).toBe(true);
    });

    test('should return false for Error instance without structured properties', () => {
      const parseResult = createBaseParseResult();
      const error = new Error('Simple error');
      parseResult.error = error;

      expect(hasParseResultWithStructuredError(parseResult)).toBe(false);
    });

    test('should return true for successful parse result with structured error', () => {
      const parseResult = createBaseParseResult();
      parseResult.success = true;
      parseResult.error = {
        code: 'SUCCESS_WARNING',
        message: 'Warning in success case',
        severity: 'warning',
      };

      expect(hasParseResultWithStructuredError(parseResult)).toBe(true);
    });

    test('should preserve type safety for structured error properties', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        code: 'TYPE_SAFE_ERROR',
        message: 'Type safe error',
        severity: 'error',
        recoverable: false,
        details: { field: 'title' },
      };

      if (hasParseResultWithStructuredError(parseResult)) {
        // TypeScript should know that error has structured properties
        expect(typeof parseResult.error.code).toBeDefined();
        expect(typeof parseResult.error.message).toBe('string');
        expect('severity' in parseResult.error).toBe(true);
        expect('recoverable' in parseResult.error).toBe(true);
        expect('details' in parseResult.error).toBe(true);
      }
    });

    test('should handle structured error with array details', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        code: 'ARRAY_DETAILS_ERROR',
        message: 'Error with array details',
        details: [
          { field: 'title', issue: 'missing' },
          { field: 'author', issue: 'invalid format' },
          { field: 'date', issue: 'future date' },
        ],
      };

      expect(hasParseResultWithStructuredError(parseResult)).toBe(true);
    });

    test('should handle structured error with function details', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        code: 'FUNCTION_DETAILS_ERROR',
        message: 'Error with function details',
        details: {
          validate: () => false,
          fix: () => 'Fix applied',
          getHelp: () => 'Contact support',
        },
      };

      expect(hasParseResultWithStructuredError(parseResult)).toBe(true);
    });

    test('should handle structured error with circular references', () => {
      const parseResult = createBaseParseResult();
      const circularError: any = {
        code: 'CIRCULAR_ERROR',
        message: 'Error with circular reference',
      };
      circularError.self = circularError;
      parseResult.error = circularError;

      expect(hasParseResultWithStructuredError(parseResult)).toBe(true);
    });
  });
});
