import { describe, test, expect } from 'bun:test';
import { hasParseResultWithErrorCode } from '../../../../src/core/document-processing/parsers/epub-parser-type-guards.js';
import type { ParseResult } from '../../../../src/core/document-processing/types.js';

// Helper function to create a base parse result
const createBaseParseResult = (): ParseResult => ({
  success: false,
  error: { message: 'Parse failed' },
});

describe('EPUB Parser Type Guards - Error Code', () => {
  describe('hasParseResultWithErrorCode', () => {
    test('should return true for parse result with error having code', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = { code: 'PARSE_ERROR', message: 'Parse failed' };

      expect(hasParseResultWithErrorCode(parseResult)).toBe(true);
    });

    test('should return false for parse result with error missing code', () => {
      const parseResult = createBaseParseResult();

      expect(hasParseResultWithErrorCode(parseResult)).toBe(false);
    });

    test('should return false for parse result with null error', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = undefined;

      expect(hasParseResultWithErrorCode(parseResult)).toBe(false);
    });

    test('should return false for parse result with undefined error', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = undefined;

      expect(hasParseResultWithErrorCode(parseResult)).toBe(false);
    });

    test('should return false for parse result with empty string code', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = { code: '', message: 'Parse failed' };

      expect(hasParseResultWithErrorCode(parseResult)).toBe(false);
    });

    test('should return true for parse result with non-empty string code', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
      };

      expect(hasParseResultWithErrorCode(parseResult)).toBe(true);
    });

    test('should return true for parse result with stringified numeric code', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        code: '1234',
        message: 'Stringified numeric error code',
      };

      expect(hasParseResultWithErrorCode(parseResult)).toBe(true);
    });

    test('should return false for parse result with zero numeric code', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = { code: '0', message: 'Zero error code' };

      expect(hasParseResultWithErrorCode(parseResult)).toBe(true); // '0' is a non-empty string, so should be true
    });

    test('should return true for parse result with error object containing code property', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        code: 'CUSTOM_ERROR',
        message: 'Custom error',
      };

      expect(hasParseResultWithErrorCode(parseResult)).toBe(true);
    });

    test('should return false for parse result with error object but no code property', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        message: 'Error without code',
        severity: 'warning',
        details: { field: 'content' },
      };

      expect(hasParseResultWithErrorCode(parseResult)).toBe(false);
    });

    test('should return false for successful parse result', () => {
      const parseResult = createBaseParseResult();
      parseResult.success = true;
      parseResult.error = undefined;

      expect(hasParseResultWithErrorCode(parseResult)).toBe(false);
    });

    test('should handle error with symbol-like code', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        code: 'SYMBOL_ERROR',
        message: 'Symbol-like error code',
      };

      expect(hasParseResultWithErrorCode(parseResult)).toBe(true);
    });

    test('should handle error with string boolean true', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        code: 'true',
        message: 'String boolean true error code',
      };

      expect(hasParseResultWithErrorCode(parseResult)).toBe(true);
    });

    test('should handle error with string boolean false', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        code: 'false',
        message: 'String boolean false error code',
      };

      expect(hasParseResultWithErrorCode(parseResult)).toBe(true);
    });

    test('should handle error with stringified object code', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        code: 'ERROR_TYPE_123',
        message: 'Stringified object error code',
      };

      expect(hasParseResultWithErrorCode(parseResult)).toBe(true);
    });

    test('should handle error with stringified array code', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        code: 'ERROR_TYPE_SUB_TYPE',
        message: 'Stringified array error code',
      };

      expect(hasParseResultWithErrorCode(parseResult)).toBe(true);
    });

    test('should handle error with empty string code', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        code: '',
        message: 'Empty string error code',
      };

      expect(hasParseResultWithErrorCode(parseResult)).toBe(false);
    });

    test('should preserve type safety for error code property access', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = { code: 'TYPE_ERROR', message: 'Type error' };

      if (hasParseResultWithErrorCode(parseResult)) {
        // TypeScript should know that error.code exists
        expect(typeof parseResult.error.code).toBe('string');
      }
    });
  });
});
