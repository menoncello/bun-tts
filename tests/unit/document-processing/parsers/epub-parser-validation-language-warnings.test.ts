import { describe, test, expect } from 'bun:test';
import { validateStandardMetadata } from '../../../../src/core/document-processing/parsers/epub-parser-validation-metadata.js';
import type {
  ValidationResult,
  EpubMetadata,
} from '../../../../src/core/document-processing/parsers/epub-parser-validation-types.js';

describe('EPUB Parser Language Metadata Validation - Warnings', () => {
  describe('Language Metadata Validation', () => {
    test('should add warning for missing language metadata', () => {
      const metadata: EpubMetadata = [
        { type: 'title', value: 'Test Book', properties: {} },
        { type: 'creator', value: 'Test Author', properties: {} },
        { type: 'date', value: '2023-12-01', properties: {} },
      ];

      const result: ValidationResult = {
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

      validateStandardMetadata(metadata, result);

      expect(result.metadata.language).toBeUndefined();
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]?.message).toContain('language');
    });

    test('should add warning for empty language value', () => {
      const metadata: EpubMetadata = [
        { type: 'language', value: '', properties: {} },
        { type: 'title', value: 'Test Book', properties: {} },
        { type: 'creator', value: 'Test Author', properties: {} },
        { type: 'date', value: '2023-12-01', properties: {} },
      ];

      const result: ValidationResult = {
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

      validateStandardMetadata(metadata, result);

      expect(result.metadata.language).toBeUndefined();
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]?.message).toContain('language');
    });
  });
});
