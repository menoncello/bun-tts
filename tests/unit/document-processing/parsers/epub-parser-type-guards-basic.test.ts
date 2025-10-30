import { describe, test, expect } from 'bun:test';
import {
  hasErrorCode,
  hasRecoverableProperty,
  isErrorInstance,
  isStructuredError,
} from '../../../../src/core/document-processing/parsers/epub-parser-type-guards.js';

describe('EPUB Parser Type Guards - hasErrorCode', () => {
  test('should return true for object with string code property', () => {
    const error = { code: 'ERROR_CODE', message: 'Error message' };
    expect(hasErrorCode(error)).toBe(true);
  });

  test('should return false for object with non-string code property', () => {
    const error = { code: 123, message: 'Error message' };
    expect(hasErrorCode(error)).toBe(false);
  });

  test('should return false for object without code property', () => {
    const error = { message: 'Error message' };
    expect(hasErrorCode(error)).toBe(false);
  });

  test('should return false for null', () => {
    expect(hasErrorCode(null)).toBe(false);
  });

  test('should return false for undefined', () => {
    expect(hasErrorCode(null)).toBe(false);
  });

  test('should return false for non-object types', () => {
    expect(hasErrorCode('string')).toBe(false);
    expect(hasErrorCode(123)).toBe(false);
    expect(hasErrorCode(true)).toBe(false);
    expect(hasErrorCode([])).toBe(false);
  });

  test('should return true for object with only code property', () => {
    const error = { code: 'ONLY_CODE' };
    expect(hasErrorCode(error)).toBe(true);
  });

  test('should return true for object with empty string code', () => {
    const error = { code: '' };
    expect(hasErrorCode(error)).toBe(true);
  });

  test('should handle objects with null prototype', () => {
    const error = Object.create(null);
    error.code = 'NULL_PROTOTYPE_ERROR';
    expect(hasErrorCode(error)).toBe(true);
  });
});

describe('EPUB Parser Type Guards - hasRecoverableProperty', () => {
  test('should return true for object with boolean recoverable property', () => {
    const error = { recoverable: true, message: 'Error message' };
    expect(hasRecoverableProperty(error)).toBe(true);
  });

  test('should return true for object with false recoverable property', () => {
    const error = { recoverable: false, message: 'Error message' };
    expect(hasRecoverableProperty(error)).toBe(true);
  });

  test('should return false for object with non-boolean recoverable property', () => {
    const error = { recoverable: 'yes', message: 'Error message' };
    expect(hasRecoverableProperty(error)).toBe(false);
  });

  test('should return false for object without recoverable property', () => {
    const error = { message: 'Error message' };
    expect(hasRecoverableProperty(error)).toBe(false);
  });

  test('should return false for null', () => {
    expect(hasRecoverableProperty(null)).toBe(false);
  });

  test('should return false for undefined', () => {
    expect(hasRecoverableProperty(null)).toBe(false);
  });

  test('should return false for non-object types', () => {
    expect(hasRecoverableProperty('string')).toBe(false);
    expect(hasRecoverableProperty(123)).toBe(false);
    expect(hasRecoverableProperty([])).toBe(false);
  });
});

describe('EPUB Parser Type Guards - isErrorInstance', () => {
  test('should return true for Error instance', () => {
    const error = new Error('Test error');
    expect(isErrorInstance(error)).toBe(true);
  });

  test('should return true for custom error extending Error', () => {
    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'CustomError';
      }
    }
    const error = new CustomError('Custom error');
    expect(isErrorInstance(error)).toBe(true);
  });

  test('should return false for plain object', () => {
    const error = { message: 'Error message' };
    expect(isErrorInstance(error)).toBe(false);
  });

  test('should return false for null', () => {
    expect(isErrorInstance(null)).toBe(false);
  });

  test('should return false for undefined', () => {
    expect(isErrorInstance(null)).toBe(false);
  });

  test('should return false for non-object types', () => {
    expect(isErrorInstance('string')).toBe(false);
    expect(isErrorInstance(123)).toBe(false);
    expect(isErrorInstance(true)).toBe(false);
  });

  test('should return false for array', () => {
    expect(isErrorInstance([])).toBe(false);
  });

  test('should return true for TypeError', () => {
    const error = new TypeError('Type error');
    expect(isErrorInstance(error)).toBe(true);
  });

  test('should return true for ReferenceError', () => {
    const error = new ReferenceError('Reference error');
    expect(isErrorInstance(error)).toBe(true);
  });
});

describe('EPUB Parser Type Guards - isStructuredError - Valid Cases', () => {
  test('should return true for object with code, message, and recoverable properties', () => {
    const error = {
      code: 'STRUCTURED_ERROR',
      message: 'Structured error message',
      recoverable: true,
    };
    expect(isStructuredError(error)).toBe(true);
  });

  test('should return true for object with additional properties', () => {
    const error = {
      code: 'FULL_ERROR',
      message: 'Full error message',
      recoverable: false,
      details: { field: 'value' },
      timestamp: new Date(),
    };
    expect(isStructuredError(error)).toBe(true);
  });
});

describe('EPUB Parser Type Guards - isStructuredError - Missing Properties', () => {
  test('should return false for object missing code property', () => {
    const error = {
      message: 'Error message',
      recoverable: true,
    };
    expect(isStructuredError(error)).toBe(false);
  });

  test('should return false for object missing message property', () => {
    const error = {
      code: 'ERROR_CODE',
      recoverable: true,
    };
    expect(isStructuredError(error)).toBe(false);
  });

  test('should return false for object missing recoverable property', () => {
    const error = {
      code: 'ERROR_CODE',
      message: 'Error message',
    };
    expect(isStructuredError(error)).toBe(false);
  });
});

describe('EPUB Parser Type Guards - isStructuredError - Invalid Types', () => {
  test('should return false for object with wrong types', () => {
    const error = {
      code: 123,
      message: 456,
      recoverable: 'yes',
    };
    expect(isStructuredError(error)).toBe(false);
  });

  test('should return false for null', () => {
    expect(isStructuredError(null)).toBe(false);
  });

  test('should return false for undefined', () => {
    expect(isStructuredError(null)).toBe(false);
  });

  test('should return false for non-object types', () => {
    expect(isStructuredError('string')).toBe(false);
    expect(isStructuredError(123)).toBe(false);
    expect(isStructuredError(true)).toBe(false);
  });
});
