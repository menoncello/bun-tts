import { describe, test, expect } from 'bun:test';
import type {
  ValidationError,
  ValidationWarning,
} from '../../../../src/core/document-processing/parsers/epub-parser-validation-types.js';
import {
  handleValidationError,
  determineValidity,
} from '../../../../src/core/document-processing/parsers/epub-parser-validation.js';
import { DocumentParseError } from '../../../../src/errors/document-parse-error.js';

// Helper function to create metadata
function createTestMetadata() {
  return {
    fileSize: 1000,
    spineItemCount: 5,
    manifestItemCount: 3,
    hasNavigation: false,
    hasMetadata: true,
  };
}

function createTestResult() {
  return {
    isValid: true,
    errors: [],
    warnings: [],
    metadata: createTestMetadata(),
  };
}

// Helper function to create empty validation result
function createEmptyValidationResult() {
  return {
    isValid: true,
    errors: [] as ValidationError[],
    warnings: [] as ValidationWarning[],
    metadata: {
      fileSize: 0,
      spineItemCount: 0,
      manifestItemCount: 0,
      hasNavigation: false,
      hasMetadata: false,
    },
  };
}

// Helper function to create validation result with specific errors
function createValidationResultWithError(
  code: string,
  message: string,
  severity: 'error' | 'critical' | 'warning'
) {
  const result = createEmptyValidationResult();
  result.errors.push({
    code,
    message,
    severity,
  });
  return result;
}

// Helper function to create validation result with warnings
function createValidationResultWithWarnings() {
  const result = createEmptyValidationResult();
  result.warnings.push({
    code: 'WARNING',
    message: 'Warning message',
  });
  return result;
}

describe('EPUB Parser Validation Error Handling - DocumentParseError', () => {
  test('should handle DocumentParseError', () => {
    const error = new DocumentParseError('Test parse error');
    const testResult = createTestResult();

    const result = handleValidationError(error, testResult.metadata);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({
      code: 'PARSE_ERROR',
      message: 'Test parse error',
      severity: 'critical',
      fix: 'Check EPUB file format and integrity',
    });
    expect(result.warnings).toHaveLength(0);
    expect(result.metadata).toEqual(testResult.metadata);
  });
});

describe('EPUB Parser Validation Error Handling - Unknown Errors', () => {
  test('should handle unknown Error objects', () => {
    const error = new Error('Unknown error');
    const testResult = createTestResult();

    const result = handleValidationError(error, testResult.metadata);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      code: 'UNKNOWN_ERROR',
      message: 'Unknown error',
      severity: 'critical',
    });
    expect(result.errors[0]).toHaveProperty('fix');
    expect(result.metadata).toEqual(testResult.metadata);
  });

  test('should handle unknown non-Error objects', () => {
    const error = 'String error';
    const testResult = createTestResult();

    const result = handleValidationError(error, testResult.metadata);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      code: 'UNKNOWN_ERROR',
      message: expect.stringContaining('Unknown error'),
      severity: 'critical',
    });
    expect(result.errors[0]).toHaveProperty('fix');
  });

  test('should handle null error', () => {
    const error = null;
    const testResult = createTestResult();

    const result = handleValidationError(error, testResult.metadata);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      code: 'UNKNOWN_ERROR',
      message: expect.stringContaining('Unknown error'),
      severity: 'critical',
    });
    expect(result.errors[0]).toHaveProperty('fix');
  });
});

describe('EPUB Parser Validation Error Handling - Valid Results', () => {
  test('should mark as valid when no critical or error errors exist', () => {
    const result = createValidationResultWithWarnings();

    determineValidity(result);

    expect(result.isValid).toBe(true);
  });

  test('should mark as valid when only warnings exist', () => {
    const result = createValidationResultWithError(
      'WARNING',
      'Warning message',
      'warning'
    );

    determineValidity(result);

    expect(result.isValid).toBe(true);
  });

  test('should mark as valid with mixed warnings and info', () => {
    const result = createEmptyValidationResult();
    result.errors.push({
      code: 'WARNING',
      message: 'Warning message',
      severity: 'warning',
    });
    result.warnings.push({
      code: 'INFO',
      message: 'Info message',
    });

    determineValidity(result);

    expect(result.isValid).toBe(true);
  });

  test('should handle empty error array', () => {
    const result = createEmptyValidationResult();

    determineValidity(result);

    expect(result.isValid).toBe(true);
  });
});

describe('EPUB Parser Validation Error Handling - Invalid Results', () => {
  test('should mark as invalid when critical errors exist', () => {
    const result = createValidationResultWithError(
      'CRITICAL_ERROR',
      'Critical error',
      'critical'
    );

    determineValidity(result);

    expect(result.isValid).toBe(false);
  });

  test('should mark as invalid when error errors exist', () => {
    const result = createValidationResultWithError(
      'ERROR',
      'Error message',
      'error'
    );

    determineValidity(result);

    expect(result.isValid).toBe(false);
  });
});
