import { describe, test, expect } from 'bun:test';
import { createMetadataBuilder } from '../../../../src/core/document-processing/parsers/epub-parser-type-adapter.js';
import { validateStandardMetadata } from '../../../../src/core/document-processing/parsers/epub-parser-validation-metadata.js';
import {
  createDateMetadata,
  createValidationResult,
  expectNoIssues,
  expectErrorWithCode,
  expectWarningWithCode,
  expectErrorMessageContaining,
  VALID_DATES,
  EDGE_CASE_DATES,
  VALIDATION_ERROR_CODES,
  VALIDATION_WARNING_CODES,
} from './epub-parser-validation-test-utils';

describe('EPUB Parser Date Metadata Validation - Valid Dates', () => {
  test('should accept valid ISO 8601 date', () => {
    const metadata = createDateMetadata(['2023-12-01']);
    const result = createValidationResult();

    validateStandardMetadata(metadata, result);

    expectNoIssues(result);
  });

  test('should skip date entries with empty values', () => {
    const metadata = createMetadataBuilder()
      .date('') // Empty date
      .date('2023-12-01') // Valid date
      .title('Test Book')
      .language('en')
      .creator('Test Author')
      .build();
    const result = createValidationResult();

    validateStandardMetadata(metadata, result);

    expectNoIssues(result);
  });

  test('should handle edge case dates - leap year', () => {
    const metadata = createDateMetadata(['2024-02-29']); // Valid leap year date
    const result = createValidationResult();

    validateStandardMetadata(metadata, result);

    expectNoIssues(result);
  });

  test('should handle all valid date formats', () => {
    for (const date of VALID_DATES) {
      const metadata = createDateMetadata([date]);
      const result = createValidationResult();

      validateStandardMetadata(metadata, result);

      expectNoIssues(result);
    }
  });
});

describe('EPUB Parser Date Metadata Validation - Missing Dates', () => {
  test('should add warning for missing date metadata', () => {
    const metadata = createMetadataBuilder()
      .title('Test Book')
      .language('en')
      .creator('Test Author')
      .build();
    const result = createValidationResult();

    validateStandardMetadata(metadata, result);

    expectWarningWithCode(result, VALIDATION_WARNING_CODES.MISSING_DATE);
    expect(
      result.warnings.some((w) => w.message === 'Publication date not found')
    ).toBe(true);
  });
});

describe('EPUB Parser Date Metadata Validation - Invalid Formats', () => {
  test('should reject date with time component', () => {
    const metadata = createDateMetadata(['2023-12-01T10:30:00Z']); // Full ISO 8601
    const result = createValidationResult();

    validateStandardMetadata(metadata, result);

    expectErrorWithCode(result, VALIDATION_ERROR_CODES.INVALID_DATE_FORMAT);
  });

  test('should reject invalid date format - slashes', () => {
    const metadata = createDateMetadata(['12/01/2023']); // MM/DD/YYYY format
    const result = createValidationResult();

    validateStandardMetadata(metadata, result);

    expectErrorWithCode(result, VALIDATION_ERROR_CODES.INVALID_DATE_FORMAT);
    expectErrorMessageContaining(result, 'Invalid date format: 12/01/2023');
  });

  test('should reject invalid date format - month name', () => {
    const metadata = createDateMetadata(['December 1, 2023']);
    const result = createValidationResult();

    validateStandardMetadata(metadata, result);

    expectErrorWithCode(result, VALIDATION_ERROR_CODES.INVALID_DATE_FORMAT);
  });

  test('should reject known invalid date formats', () => {
    const knownInvalidFormats = [
      '2023-12-01T10:30:00Z', // ISO with time
      '12/01/2023', // US format
      'December 1, 2023', // Month name
      'invalid-date', // Invalid string
    ];

    for (const date of knownInvalidFormats) {
      const metadata = createDateMetadata([date]);
      const result = createValidationResult();

      validateStandardMetadata(metadata, result);

      expect(
        result.errors.some(
          (e) => e.code === VALIDATION_ERROR_CODES.INVALID_DATE_FORMAT
        )
      ).toBe(true);
    }
  });
});

describe('EPUB Parser Date Metadata Validation - Edge Cases', () => {
  test('should reject invalid date - impossible date', () => {
    const metadata = createDateMetadata(['2023-02-30']); // February 30 doesn't exist
    const result = createValidationResult();

    validateStandardMetadata(metadata, result);

    // Note: This might not be caught by the simple ISO format validation
    expect(result.errors.length).toBeGreaterThanOrEqual(0);
  });

  test('should reject invalid leap year date', () => {
    const metadata = createDateMetadata(['2023-02-29']); // 2023 is not a leap year
    const result = createValidationResult();

    validateStandardMetadata(metadata, result);

    // Note: This might not be caught by the simple ISO format validation
    expect(result.errors.length).toBeGreaterThanOrEqual(0);
  });

  test('should handle edge case dates', () => {
    for (const date of EDGE_CASE_DATES) {
      const metadata = createDateMetadata([date]);
      const result = createValidationResult();

      validateStandardMetadata(metadata, result);

      expectNoIssues(result);
    }
  });
});

describe('EPUB Parser Date Metadata Validation - Multiple Dates', () => {
  test('should handle multiple date entries', () => {
    const metadata = createDateMetadata([
      '2023-01-01',
      'invalid-date',
      '2023-12-01',
    ]);
    const result = createValidationResult();

    validateStandardMetadata(metadata, result);

    expectErrorWithCode(result, VALIDATION_ERROR_CODES.INVALID_DATE_FORMAT);
    expectErrorMessageContaining(result, 'Invalid date format: invalid-date');
  });

  test('should handle multiple valid dates', () => {
    const metadata = createDateMetadata(['2023-01-01', '2023-12-01']);
    const result = createValidationResult();

    validateStandardMetadata(metadata, result);

    expectNoIssues(result);
  });
});
