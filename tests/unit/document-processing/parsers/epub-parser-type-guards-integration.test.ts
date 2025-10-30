import { describe, test, expect } from 'bun:test';
import {
  hasErrorCode,
  hasRecoverableProperty,
  isErrorInstance,
  isStructuredError,
  hasParseResultWithErrorCode,
  hasParseResultWithRecoverable,
  hasParseResultWithErrorInstance,
  hasParseResultWithStructuredError,
  getErrorCode,
  getErrorRecoverable,
  getErrorMessage,
} from '../../../../src/core/document-processing/parsers/epub-parser-type-guards.js';
import type { ParseResult } from '../../../../src/core/document-processing/types.js';

describe('EPUB Parser Type Guards - Integration Scenarios', () => {
  test('should handle complex structured error with all properties', () => {
    const complexError = {
      code: 'COMPLEX_ERROR',
      message: 'Complex error with all properties',
      recoverable: true,
      details: { field: 'value', nested: { deep: true } },
      timestamp: new Date('2023-01-01T10:00:00Z'),
      stack: 'Error stack trace',
    };

    expect(hasErrorCode(complexError)).toBe(true);
    expect(hasRecoverableProperty(complexError)).toBe(true);
    expect(isStructuredError(complexError)).toBe(true);
    expect(getErrorCode(complexError)).toBe('COMPLEX_ERROR');
    expect(getErrorRecoverable(complexError)).toBe(true);
    expect(getErrorMessage(complexError)).toBe(
      'Complex error with all properties'
    );
  });

  test('should handle Error instance with additional properties', () => {
    const enhancedError = new Error('Enhanced error message');
    (enhancedError as any).code = 'ENHANCED_ERROR';
    (enhancedError as any).recoverable = false;
    (enhancedError as any).details = { source: 'parser' };

    expect(hasErrorCode(enhancedError)).toBe(true);
    expect(hasRecoverableProperty(enhancedError)).toBe(true);
    expect(isErrorInstance(enhancedError)).toBe(true);
    expect(isStructuredError(enhancedError)).toBe(true);
    expect(getErrorCode(enhancedError)).toBe('ENHANCED_ERROR');
    expect(getErrorRecoverable(enhancedError)).toBe(false);
    expect(getErrorMessage(enhancedError)).toBe('Enhanced error message');
  });

  test('should handle parse result with structured error', () => {
    const parseResult: ParseResult = {
      success: false,
      error: {
        code: 'PARSE_STRUCTURED_ERROR',
        message: 'Parse failed with structured error',
        recoverable: true,
        details: { line: 10, column: 5 },
      },
    };

    expect(hasParseResultWithErrorCode(parseResult)).toBe(true);
    expect(hasParseResultWithRecoverable(parseResult)).toBe(true);
    expect(hasParseResultWithStructuredError(parseResult)).toBe(true);
    expect(hasParseResultWithErrorInstance(parseResult)).toBe(false);
  });

  test('should handle parse result with Error instance', () => {
    const parseResult: ParseResult = {
      success: false,
      error: new Error('Parse failed with Error instance'),
    };

    expect(hasParseResultWithErrorCode(parseResult)).toBe(false);
    expect(hasParseResultWithRecoverable(parseResult)).toBe(false);
    expect(hasParseResultWithStructuredError(parseResult)).toBe(false);
    expect(hasParseResultWithErrorInstance(parseResult)).toBe(true);
  });

  test('should handle successful parse result', () => {
    const parseResult: ParseResult = {
      success: true,
    };

    expect(hasParseResultWithErrorCode(parseResult)).toBe(false);
    expect(hasParseResultWithRecoverable(parseResult)).toBe(false);
    expect(hasParseResultWithStructuredError(parseResult)).toBe(false);
    expect(hasParseResultWithErrorInstance(parseResult)).toBe(false);
  });

  test('should handle minimal error objects', () => {
    const minimalError = { code: 'MINIMAL' };
    expect(hasErrorCode(minimalError)).toBe(true);
    expect(hasRecoverableProperty(minimalError)).toBe(false);
    expect(isStructuredError(minimalError)).toBe(false);
    expect(getErrorCode(minimalError)).toBe('MINIMAL');
    expect(getErrorRecoverable(minimalError)).toBeNull();
    expect(getErrorMessage(minimalError)).toBe('[object Object]');
  });

  test('should handle objects with null prototype', () => {
    const nullProtoError = Object.create(null);
    nullProtoError.code = 'NULL_PROTO';
    nullProtoError.message = 'Null prototype error';
    nullProtoError.recoverable = true;

    expect(hasErrorCode(nullProtoError)).toBe(true);
    expect(hasRecoverableProperty(nullProtoError)).toBe(true);
    expect(isStructuredError(nullProtoError)).toBe(true);
    expect(getErrorCode(nullProtoError)).toBe('NULL_PROTO');
    expect(getErrorRecoverable(nullProtoError)).toBe(true);
    expect(getErrorMessage(nullProtoError)).toBe('Null prototype error');
  });

  test('should handle edge cases gracefully', () => {
    // Empty object
    const emptyObject = {};
    expect(hasErrorCode(emptyObject)).toBe(false);
    expect(hasRecoverableProperty(emptyObject)).toBe(false);
    expect(isStructuredError(emptyObject)).toBe(false);
    expect(getErrorCode(emptyObject)).toBeNull();
    expect(getErrorRecoverable(emptyObject)).toBeNull();
    expect(getErrorMessage(emptyObject)).toBe('[object Object]');

    // String with error-like properties
    const errorString = 'Error message';
    expect(hasErrorCode(errorString)).toBe(false);
    expect(getErrorMessage(errorString)).toBe('Error message');

    // Number with error-like properties
    const errorNumber = 404;
    expect(hasErrorCode(errorNumber)).toBe(false);
    expect(getErrorMessage(errorNumber)).toBe('404');
  });
});
