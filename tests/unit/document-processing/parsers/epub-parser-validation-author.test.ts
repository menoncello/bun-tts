import { describe, test, expect } from 'bun:test';
import { createMetadataBuilder } from '../../../../src/core/document-processing/parsers/epub-parser-type-adapter.js';
import { validateStandardMetadata } from '../../../../src/core/document-processing/parsers/epub-parser-validation-metadata.js';
import {
  createAuthorMetadata,
  createValidationResult,
  expectNoIssues,
  expectErrorWithCode,
  expectWarningWithCode,
  expectErrorMessageContaining,
  generateLongAuthorName,
  generateValidAuthorName,
  VALIDATION_ERROR_CODES,
  VALIDATION_WARNING_CODES,
} from './epub-parser-validation-test-utils';

describe('EPUB Parser Author Metadata Validation', () => {
  describe('Valid Author Metadata', () => {
    test('should accept valid author metadata', () => {
      const metadata = createAuthorMetadata(['John Doe']);
      const result = createValidationResult();

      validateStandardMetadata(metadata, result);

      expectNoIssues(result);
    });

    test('should accept multiple authors', () => {
      const metadata = createAuthorMetadata(['John Doe', 'Jane Smith']);
      const result = createValidationResult();

      validateStandardMetadata(metadata, result);

      expectNoIssues(result);
    });

    test('should skip authors with empty values', () => {
      const metadata = createMetadataBuilder()
        .creator('') // Empty author
        .creator('Valid Author')
        .title('Test Book')
        .language('en')
        .date('2023-12-01')
        .build();
      const result = createValidationResult();

      validateStandardMetadata(metadata, result);

      expectNoIssues(result);
    });

    test('should handle author name exactly at limit', () => {
      const authorAtLimit = generateValidAuthorName(255); // Exactly MAX_AUTHOR_NAME_LENGTH
      const metadata = createAuthorMetadata([authorAtLimit]);
      const result = createValidationResult();

      validateStandardMetadata(metadata, result);

      expectNoIssues(result);
    });
  });
});

describe('EPUB Parser Author Metadata Missing Validation', () => {
  test('should add warning for missing author metadata', () => {
    const metadata = createMetadataBuilder()
      .title('Test Book')
      .language('en')
      .date('2023-12-01')
      .build();
    const result = createValidationResult();

    validateStandardMetadata(metadata, result);

    expectWarningWithCode(result, VALIDATION_WARNING_CODES.MISSING_AUTHOR);
    expect(
      result.warnings.some((w) => w.message === 'Author information not found')
    ).toBe(true);
  });
});

describe('EPUB Parser Author Name Length Validation', () => {
  test('should reject author name too long', () => {
    const longAuthorName = generateLongAuthorName(256); // Exceeds MAX_AUTHOR_NAME_LENGTH (255)
    const metadata = createAuthorMetadata([longAuthorName]);
    const result = createValidationResult();

    validateStandardMetadata(metadata, result);

    expectErrorWithCode(result, VALIDATION_ERROR_CODES.AUTHOR_NAME_TOO_LONG);
    expectErrorMessageContaining(result, 'Author name 1 is too long');
  });

  test('should handle multiple authors with some issues', () => {
    const validAuthor = 'Valid Author';
    const longAuthorName = generateLongAuthorName(260);
    const metadata = createAuthorMetadata([
      validAuthor,
      longAuthorName,
      'Another Valid Author',
    ]);
    const result = createValidationResult();

    validateStandardMetadata(metadata, result);

    expectErrorWithCode(result, VALIDATION_ERROR_CODES.AUTHOR_NAME_TOO_LONG);
    expectErrorMessageContaining(result, 'Author name 2'); // Second author
  });
});
