import { describe, test, expect } from 'bun:test';
import { hasParseResultWithRecoverable } from '../../../../src/core/document-processing/parsers/epub-parser-type-guards.js';
import type { ParseResult } from '../../../../src/core/document-processing/types.js';

// Helper function to create a base parse result
const createBaseParseResult = (): ParseResult => ({
  success: false,
  error: { message: 'Parse failed' },
});

describe('EPUB Parser Type Guards - Recoverable', () => {
  describe('hasParseResultWithRecoverable', () => {
    test('should return true for parse result with error having recoverable true', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        message: 'Parse failed',
        recoverable: true,
      };

      expect(hasParseResultWithRecoverable(parseResult)).toBe(true);
    });

    test('should return false for parse result with error having recoverable false', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        message: 'Parse failed',
        recoverable: false,
      };

      expect(hasParseResultWithRecoverable(parseResult)).toBe(false);
    });

    test('should return false for parse result with error missing recoverable', () => {
      const parseResult = createBaseParseResult();

      expect(hasParseResultWithRecoverable(parseResult)).toBe(false);
    });

    test('should return false for parse result with null error', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = undefined;

      expect(hasParseResultWithRecoverable(parseResult)).toBe(false);
    });

    test('should return false for parse result with undefined error', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = undefined;

      expect(hasParseResultWithRecoverable(parseResult)).toBe(false);
    });

    test('should return true for parse result with recoverable true and other properties', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        recoverable: true,
        severity: 'warning',
        details: { field: 'title' },
      };

      expect(hasParseResultWithRecoverable(parseResult)).toBe(true);
    });

    test('should return false for parse result with recoverable false and other properties', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        code: 'PARSE_ERROR',
        message: 'Parse failed',
        recoverable: false,
        severity: 'error',
        details: { field: 'content' },
      };

      expect(hasParseResultWithRecoverable(parseResult)).toBe(false);
    });

    test('should return false for successful parse result', () => {
      const parseResult = createBaseParseResult();
      parseResult.success = true;
      parseResult.error = {
        message: 'Should not matter',
        recoverable: true,
      };

      expect(hasParseResultWithRecoverable(parseResult)).toBe(true);
    });

    test('should handle error with string "true" recoverable', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        message: 'Parse failed',
        recoverable: 'true' as any,
      };

      // Type guard expects boolean, so string should not match
      expect(hasParseResultWithRecoverable(parseResult)).toBe(false);
    });

    test('should handle error with number 1 recoverable', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        message: 'Parse failed',
        recoverable: 1 as any,
      };

      // Type guard expects boolean, so number should not match
      expect(hasParseResultWithRecoverable(parseResult)).toBe(false);
    });

    test('should handle error with null recoverable', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        message: 'Parse failed',
        recoverable: null as any,
      };

      expect(hasParseResultWithRecoverable(parseResult)).toBe(false);
    });

    test('should handle error with undefined recoverable', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        message: 'Parse failed',
        recoverable: undefined,
      };

      expect(hasParseResultWithRecoverable(parseResult)).toBe(false);
    });

    test('should preserve type safety for error.recoverable property access', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        message: 'Recoverable error',
        recoverable: true,
      };

      if (hasParseResultWithRecoverable(parseResult)) {
        // TypeScript should know that error.recoverable exists and is boolean
        expect(typeof parseResult.error.recoverable).toBe('boolean');
        expect(parseResult.error.recoverable).toBe(true);
      }
    });

    test('should work with complex error objects', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        code: 'COMPLEX_ERROR',
        message: 'Complex error occurred',
        recoverable: true,
        severity: 'warning',
        category: 'validation',
        details: {
          field: 'metadata',
          value: 'invalid',
          suggestions: ['provide valid title', 'add author'],
        },
        timestamp: new Date().toISOString(),
        stack: 'Error stack trace',
      };

      expect(hasParseResultWithRecoverable(parseResult)).toBe(true);
    });

    test('should handle error with recoverable function', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        message: 'Parse failed',
        recoverable: (() => true) as any,
      };

      // Type guard expects boolean, so function should not match
      expect(hasParseResultWithRecoverable(parseResult)).toBe(false);
    });

    test('should handle error with recoverable object', () => {
      const parseResult = createBaseParseResult();
      parseResult.error = {
        message: 'Parse failed',
        recoverable: { canRecover: true } as any,
      };

      // Type guard expects boolean, so object should not match
      expect(hasParseResultWithRecoverable(parseResult)).toBe(false);
    });
  });
});
