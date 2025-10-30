import { expect } from 'bun:test';
import type { MetadataEntry } from '@smoores/epub';
import { createMetadataBuilder } from '../../../../src/core/document-processing/parsers/epub-parser-type-adapter.js';
import type {
  ValidationResult,
  EpubMetadata,
} from '../../../../src/core/document-processing/parsers/epub-parser-validation-types.js';

// Factory functions for creating test metadata
export function createBasicMetadata(
  overrides: Partial<MetadataEntry> = {}
): EpubMetadata {
  const defaults = createMetadataBuilder()
    .title('Test Book')
    .creator('Test Author')
    .language('en')
    .date('2023-12-01')
    .identifier('test-book-identifier')
    .build();

  if (Object.keys(overrides).length > 0) {
    // Type assertion to handle the spreading of overrides
    const merged = { ...defaults[0], ...overrides } as MetadataEntry;
    return [merged];
  }

  return defaults;
}

export function createValidationResult(
  overrides: Partial<ValidationResult> = {}
): ValidationResult {
  const defaults: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    metadata: {
      fileSize: 1000,
      spineItemCount: 5,
      manifestItemCount: 10,
      hasNavigation: true,
      hasMetadata: true,
    },
  };

  return { ...defaults, ...overrides };
}

export function createAuthorMetadata(authors: string[]): EpubMetadata {
  const metadata = createMetadataBuilder()
    .title('Test Book')
    .language('en')
    .date('2023-12-01');

  for (const author of authors) {
    metadata.creator(author);
  }

  return metadata.build();
}

export function createDateMetadata(dates: string[]): EpubMetadata {
  const metadata = createMetadataBuilder()
    .title('Test Book')
    .language('en')
    .creator('Test Author');

  for (const date of dates) {
    metadata.date(date);
  }

  return metadata.build();
}

// Helper functions for common validation patterns
export function expectNoIssues(result: ValidationResult): void {
  expect(result.errors).toHaveLength(0);
  expect(result.warnings).toHaveLength(0);
}

export function expectErrorWithCode(
  result: ValidationResult,
  code: string
): void {
  expect(result.errors.some((e) => e.code === code)).toBe(true);
}

export function expectWarningWithCode(
  result: ValidationResult,
  code: string
): void {
  expect(result.warnings.some((w) => w.code === code)).toBe(true);
}

export function expectErrorMessageContaining(
  result: ValidationResult,
  text: string
): void {
  expect(result.errors.some((e) => e.message.includes(text))).toBe(true);
}

export function expectWarningMessageContaining(
  result: ValidationResult,
  text: string
): void {
  expect(result.warnings.some((w) => w.message.includes(text))).toBe(true);
}

// Test data generators
export function generateLongAuthorName(length = 256): string {
  return 'A'.repeat(length);
}

export function generateValidAuthorName(length = 255): string {
  return 'A'.repeat(length);
}

// Date test data
export const VALID_DATES = [
  '2023-12-01',
  '2024-02-29', // Leap year
  '2000-01-01', // Y2K
  '1999-12-31', // Pre-Y2K
];

export const INVALID_DATES = [
  '2023-12-01T10:30:00Z', // ISO with time
  '12/01/2023', // US format
  'December 1, 2023', // Month name
  '2023-02-30', // Impossible date
  '2023-13-01', // Invalid month
  '2023-00-01', // Invalid month
  '2023-12-32', // Invalid day
  '2023-12-00', // Invalid day
  'invalid-date', // Invalid string
  '', // Empty string
];

export const EDGE_CASE_DATES = [
  '0001-01-01', // Minimum date
  '9999-12-31', // Maximum date
  '2023-02-28', // Non-leap year Feb 28
  '2024-02-29', // Leap year Feb 29
];

// Error codes for validation
export const VALIDATION_ERROR_CODES = {
  MISSING_AUTHOR: 'MISSING_AUTHOR',
  AUTHOR_NAME_TOO_LONG: 'AUTHOR_NAME_TOO_LONG',
  MISSING_DATE: 'MISSING_DATE',
  INVALID_DATE_FORMAT: 'INVALID_DATE_FORMAT',
  PARSE_ERROR: 'PARSE_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export const VALIDATION_WARNING_CODES = {
  MISSING_AUTHOR: 'MISSING_AUTHOR',
  MISSING_DATE: 'MISSING_DATE',
} as const;
