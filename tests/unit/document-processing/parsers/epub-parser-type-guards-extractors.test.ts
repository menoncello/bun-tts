import { describe, test, expect } from 'bun:test';
import {
  getErrorCode,
  getErrorRecoverable,
  getErrorMessage,
} from '../../../../src/core/document-processing/parsers/epub-parser-type-guards.js';

describe('EPUB Parser Type Guards - Error Extractors', () => {
  describe('getErrorCode', () => {
    test('should return code for object with code property', () => {
      const error = { code: 'ERROR_CODE', message: 'Error message' };
      expect(getErrorCode(error)).toBe('ERROR_CODE');
    });

    test('should return null for object without code property', () => {
      const error = { message: 'Error message' };
      expect(getErrorCode(error)).toBeNull();
    });

    test('should return null for null', () => {
      expect(getErrorCode(null)).toBeNull();
    });

    test('should return null for undefined', () => {
      expect(getErrorCode(null)).toBeNull();
    });

    test('should return null for non-object types', () => {
      expect(getErrorCode('string')).toBeNull();
      expect(getErrorCode(123)).toBeNull();
      expect(getErrorCode(true)).toBeNull();
      expect(getErrorCode([])).toBeNull();
    });

    test('should return code for Error instance with custom code property', () => {
      const error = new Error('Test error');
      (error as any).code = 'CUSTOM_ERROR';
      expect(getErrorCode(error)).toBe('CUSTOM_ERROR');
    });

    test('should return null for Error instance without code property', () => {
      const error = new Error('Test error');
      expect(getErrorCode(error)).toBeNull();
    });

    test('should return null for object with empty string code', () => {
      const error = { code: '', message: 'Error message' };
      expect(getErrorCode(error)).toBeNull();
    });
  });

  describe('getErrorRecoverable', () => {
    test('should return recoverable for object with recoverable property', () => {
      const error = { recoverable: true, message: 'Error message' };
      expect(getErrorRecoverable(error)).toBe(true);
    });

    test('should return recoverable false for object with recoverable false', () => {
      const error = { recoverable: false, message: 'Error message' };
      expect(getErrorRecoverable(error)).toBe(false);
    });

    test('should return null for object without recoverable property', () => {
      const error = { message: 'Error message' };
      expect(getErrorRecoverable(error)).toBeNull();
    });

    test('should return null for null', () => {
      expect(getErrorRecoverable(null)).toBeNull();
    });

    test('should return null for undefined', () => {
      expect(getErrorRecoverable(null)).toBeNull();
    });

    test('should return null for non-object types', () => {
      expect(getErrorRecoverable('string')).toBeNull();
      expect(getErrorRecoverable(123)).toBeNull();
      expect(getErrorRecoverable(true)).toBeNull();
      expect(getErrorRecoverable([])).toBeNull();
    });

    test('should return recoverable for Error instance with custom recoverable property', () => {
      const error = new Error('Test error');
      (error as any).recoverable = false;
      expect(getErrorRecoverable(error)).toBe(false);
    });

    test('should return null for Error instance without recoverable property', () => {
      const error = new Error('Test error');
      expect(getErrorRecoverable(error)).toBeNull();
    });
  });

  describe('getErrorMessage', () => {
    test('should return message for object with message property', () => {
      const error = { message: 'Error message' };
      expect(getErrorMessage(error)).toBe('Error message');
    });

    test('should return message for Error instance', () => {
      const error = new Error('Test error message');
      expect(getErrorMessage(error)).toBe('Test error message');
    });

    test('should return string representation for object without message property', () => {
      const error = { code: 'ERROR_CODE' };
      expect(getErrorMessage(error)).toBe('[object Object]');
    });

    test('should return string representation for string', () => {
      expect(getErrorMessage('string error')).toBe('string error');
    });

    test('should return string representation for number', () => {
      expect(getErrorMessage(123)).toBe('123');
    });

    test('should return string representation for boolean', () => {
      expect(getErrorMessage(true)).toBe('true');
      expect(getErrorMessage(false)).toBe('false');
    });

    test('should return null for null', () => {
      expect(getErrorMessage(null)).toBeNull();
    });

    test('should return null for undefined', () => {
      expect(getErrorMessage(null)).toBeNull();
    });

    test('should return string representation for array', () => {
      const error = ['error1', 'error2'];
      expect(getErrorMessage(error)).toBe('error1,error2');
    });

    test('should handle TypeError message', () => {
      const error = new TypeError('Type error message');
      expect(getErrorMessage(error)).toBe('Type error message');
    });

    test('should handle ReferenceError message', () => {
      const error = new ReferenceError('Reference error message');
      expect(getErrorMessage(error)).toBe('Reference error message');
    });

    test('should handle custom error with message', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }
      const error = new CustomError('Custom error message');
      expect(getErrorMessage(error)).toBe('Custom error message');
    });

    test('should return string representation for object with toString method', () => {
      const error = {
        toString: () => 'Custom string representation',
      };
      expect(getErrorMessage(error)).toBe('Custom string representation');
    });

    test('should handle object with circular reference gracefully', () => {
      const error: any = { message: 'Original message' };
      error.self = error; // Create circular reference
      expect(getErrorMessage(error)).toBe('Original message');
    });
  });
});
