import { describe, test, expect } from 'bun:test';
import { validateStandardMetadata } from '../../../../src/core/document-processing/parsers/epub-parser-validation-metadata.js';
import type {
  ValidationResult,
  EpubMetadata,
} from '../../../../src/core/document-processing/parsers/epub-parser-validation-types.js';

// Helper function to create validation result template
function createValidationResultTemplate(
  overrides: Partial<ValidationResult> = {}
): ValidationResult {
  return {
    isValid: true,
    errors: [],
    warnings: [],
    metadata: {
      fileSize: 1000,
      spineItemCount: 5,
      manifestItemCount: 10,
      hasNavigation: true,
      hasMetadata: true,
      ...overrides.metadata,
    },
    ...overrides,
  };
}

describe('EPUB Parser Metadata Integration - Complete Validation', () => {
  test('should validate complete metadata with all required fields', () => {
    const metadata: EpubMetadata = [
      { type: 'title', value: 'Complete Test Book', properties: {} },
      { type: 'creator', value: 'Test Author', properties: {} },
      { type: 'language', value: 'en', properties: {} },
      { type: 'date', value: '2023-12-01', properties: {} },
      { type: 'publisher', value: 'Test Publisher', properties: {} },
    ];

    const result = createValidationResultTemplate();
    validateStandardMetadata(metadata, result);

    expect(result.metadata.language).toBe('en');
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });
});

describe('EPUB Parser Metadata Integration - Multiple Issues', () => {
  test('should accumulate multiple validation issues', () => {
    const metadata: EpubMetadata = [
      { type: 'title', value: 'Problematic Book', properties: {} },
      { type: 'creator', value: 'A'.repeat(300), properties: {} }, // Too long
      { type: 'language', value: 'invalid-lang', properties: {} }, // Invalid format
      { type: 'date', value: 'not-a-date', properties: {} }, // Invalid format
    ];

    const result = createValidationResultTemplate();
    validateStandardMetadata(metadata, result);

    expect(result.metadata.language).toBe('invalid-lang');
    expect(result.errors.length).toBeGreaterThanOrEqual(3); // language format, author too long, date format

    const errorCodes = result.errors.map((e) => e.code);
    expect(errorCodes).toContain('INVALID_LANGUAGE_LENGTH');
    expect(errorCodes).toContain('AUTHOR_NAME_TOO_LONG');
    expect(errorCodes).toContain('INVALID_DATE_FORMAT');
  });
});

describe('EPUB Parser Metadata Integration - Edge Cases', () => {
  test('should handle empty metadata gracefully', () => {
    const metadata: EpubMetadata = [];
    const result = createValidationResultTemplate();

    validateStandardMetadata(metadata, result);

    expect(result.metadata.language).toBeUndefined();
    expect(result.errors).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThanOrEqual(2); // missing author, missing date
    expect(result.warnings.some((w) => w.code === 'MISSING_AUTHOR')).toBe(true);
    expect(result.warnings.some((w) => w.code === 'MISSING_DATE')).toBe(true);
    expect(result.warnings.some((w) => w.code === 'MISSING_LANGUAGE')).toBe(
      true
    );
  });

  test('should handle metadata with only non-standard types', () => {
    const metadata: EpubMetadata = [
      { type: 'publisher', value: 'Test Publisher', properties: {} },
      { type: 'subject', value: 'Test Subject', properties: {} },
      { type: 'description', value: 'Test Description', properties: {} },
    ];

    const result = createValidationResultTemplate();
    validateStandardMetadata(metadata, result);

    expect(result.metadata.language).toBeUndefined();
    expect(result.errors).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThanOrEqual(3); // missing language, missing author, missing date
  });
});

describe('EPUB Parser Metadata Integration - Result Preservation', () => {
  test('should preserve existing validation result structure', () => {
    const metadata: EpubMetadata = [
      { type: 'title', value: 'Test Book', properties: {} },
      { type: 'language', value: 'fr', properties: {} },
      { type: 'creator', value: 'Test Author', properties: {} },
      { type: 'date', value: '2023-12-01', properties: {} },
    ];

    const result: ValidationResult = {
      isValid: false,
      errors: [
        {
          code: 'EXISTING_ERROR',
          message: 'Existing error',
          severity: 'error',
        },
      ],
      warnings: [{ code: 'EXISTING_WARNING', message: 'Existing warning' }],
      metadata: {
        fileSize: 5000,
        spineItemCount: 10,
        manifestItemCount: 20,
        hasNavigation: false,
        hasMetadata: false,
        epubVersion: '3.0',
        title: 'Existing Title',
      },
    };

    validateStandardMetadata(metadata, result);

    // Should preserve existing data and add new validations
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
    expect(result.metadata.language).toBe('fr');
    expect(result.metadata.fileSize).toBe(5000); // Preserved
    expect(result.metadata.title).toBe('Existing Title'); // Preserved
  });
});
