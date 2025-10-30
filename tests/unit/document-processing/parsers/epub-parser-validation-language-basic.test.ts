import { describe, test, expect } from 'bun:test';
import { validateStandardMetadata } from '../../../../src/core/document-processing/parsers/epub-parser-validation-metadata.js';
import type {
  ValidationResult,
  EpubMetadata,
} from '../../../../src/core/document-processing/parsers/epub-parser-validation-types.js';

describe('EPUB Parser Language Metadata Validation - Basic', () => {
  describe('Language Metadata Validation', () => {
    test('should accept valid two-letter language code', () => {
      const metadata: EpubMetadata = [
        { type: 'language', value: 'en', properties: {} },
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

      expect(result.metadata.language).toBe('en');
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    test('should accept valid language code with country', () => {
      const metadata: EpubMetadata = [
        { type: 'language', value: 'pt-BR', properties: {} },
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

      expect(result.metadata.language).toBe('pt-BR');
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    test('should handle multiple language entries - use first valid one', () => {
      const metadata: EpubMetadata = [
        { type: 'language', value: 'fr', properties: {} },
        { type: 'language', value: 'en', properties: {} },
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

      expect(result.metadata.language).toBe('fr'); // Uses first one found
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });
});
