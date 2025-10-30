import { describe, test, expect } from 'bun:test';
import { validateStandardMetadata } from '../../../../src/core/document-processing/parsers/epub-parser-validation-metadata.js';
import type {
  ValidationResult,
  EpubMetadata,
} from '../../../../src/core/document-processing/parsers/epub-parser-validation-types.js';

describe('EPUB Parser Language Metadata Validation - Errors', () => {
  describe('Language Metadata Validation', () => {
    test('should reject language code too short', () => {
      const metadata: EpubMetadata = [
        { type: 'language', value: 'e', properties: {} },
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

      expect(result.metadata.language).toBe('e');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.message).toContain('language');
      expect(result.warnings).toHaveLength(0);
    });

    test('should reject language code too long', () => {
      const metadata: EpubMetadata = [
        { type: 'language', value: 'english', properties: {} },
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

      expect(result.metadata.language).toBe('english');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.message).toContain('language');
      expect(result.warnings).toHaveLength(0);
    });

    test('should reject invalid language format - lowercase country', () => {
      const metadata: EpubMetadata = [
        { type: 'language', value: 'en-us', properties: {} },
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

      expect(result.metadata.language).toBe('en-us');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.message).toContain('language');
      expect(result.warnings).toHaveLength(0);
    });

    test('should reject invalid language format - numbers', () => {
      const metadata: EpubMetadata = [
        { type: 'language', value: '3n', properties: {} },
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

      expect(result.metadata.language).toBe('3n');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.message).toContain('language');
      expect(result.warnings).toHaveLength(0);
    });
  });
});
