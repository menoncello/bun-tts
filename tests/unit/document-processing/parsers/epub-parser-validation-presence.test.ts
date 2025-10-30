import { describe, test, expect } from 'bun:test';
import type { EpubMetadata } from '../../../../src/core/document-processing/parsers/epub-parser-types.js';
import {
  createInitialValidationResult,
  validateMetadataPresence,
  validateSpinePresence,
  validateManifestPresence,
} from '../../../../src/core/document-processing/parsers/epub-parser-validation-basic.js';

describe('EPUB Parser Validation Presence', () => {
  describe('validateMetadataPresence', () => {
    test('should validate valid metadata presence', () => {
      const metadata: EpubMetadata = [
        { type: 'title', value: 'Test Book', properties: {} },
        { type: 'creator', value: 'Test Author', properties: {} },
        { type: 'identifier', value: 'test-identifier', properties: {} },
        { type: 'language', value: 'en', properties: {} },
      ];
      const result = createInitialValidationResult();

      validateMetadataPresence(metadata, result);

      expect(result.errors).toHaveLength(0);
      expect(result.metadata.hasMetadata).toBe(true);
    });

    test('should add error for missing metadata', () => {
      const metadata: EpubMetadata = [];
      const result = createInitialValidationResult();

      validateMetadataPresence(metadata, result);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        code: 'MISSING_METADATA',
        message: 'EPUB metadata is missing or empty',
        severity: 'critical',
        fix: 'Ensure EPUB contains proper metadata with title and identifier',
      });
      expect(result.metadata.hasMetadata).toBe(false);
    });

    test('should add error for null metadata', () => {
      const metadata = null as any;
      const result = createInitialValidationResult();

      validateMetadataPresence(metadata, result);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe('MISSING_METADATA');
      expect(result.metadata.hasMetadata).toBe(false);
    });

    test('should add error for undefined metadata', () => {
      const metadata = undefined as any;
      const result = createInitialValidationResult();

      validateMetadataPresence(metadata, result);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe('MISSING_METADATA');
      expect(result.metadata.hasMetadata).toBe(false);
    });

    test('should add title error for metadata without title', () => {
      const metadata: EpubMetadata = [
        { type: 'creator', value: 'Test Author', properties: {} },
        { type: 'identifier', value: 'test-id', properties: {} },
      ];
      const result = createInitialValidationResult();

      validateMetadataPresence(metadata, result);

      expect(result.errors).toHaveLength(2); // missing title and missing language
      expect(result.errors[0]?.code).toBe('MISSING_TITLE');
      expect(result.metadata.hasMetadata).toBe(true);
    });

    test('should add identifier error for metadata without identifier', () => {
      const metadata: EpubMetadata = [
        { type: 'title', value: 'Test Book', properties: {} },
        { type: 'creator', value: 'Test Author', properties: {} },
      ];
      const result = createInitialValidationResult();

      validateMetadataPresence(metadata, result);

      expect(result.errors).toHaveLength(2); // missing identifier and missing language
      expect(result.errors[0]?.code).toBe('MISSING_IDENTIFIER');
      expect(result.metadata.hasMetadata).toBe(true);
    });
  });

  describe('validateSpinePresence', () => {
    test('should validate valid spine presence', () => {
      const spineItems = [
        {
          id: 'chapter1',
          href: 'chapter1.xhtml',
          mediaType: 'application/xhtml+xml',
        },
        {
          id: 'chapter2',
          href: 'chapter2.xhtml',
          mediaType: 'application/xhtml+xml',
        },
      ];
      const result = createInitialValidationResult();

      validateSpinePresence(spineItems, result);

      expect(result.errors).toHaveLength(0);
    });

    test('should add error for missing spine', () => {
      const spineItems: any[] = [];
      const result = createInitialValidationResult();

      validateSpinePresence(spineItems, result);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        code: 'MISSING_SPINE',
        message: 'EPUB spine is missing or empty',
        severity: 'critical',
        fix: 'Ensure EPUB contains a proper reading order',
      });
    });

    test('should add error for null spine', () => {
      const spineItems = null as any;
      const result = createInitialValidationResult();

      validateSpinePresence(spineItems, result);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe('MISSING_SPINE');
    });

    test('should add error for undefined spine', () => {
      const spineItems = undefined as any;
      const result = createInitialValidationResult();

      validateSpinePresence(spineItems, result);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe('MISSING_SPINE');
    });
  });

  describe('validateManifestPresence', () => {
    test('should validate valid manifest presence', () => {
      const manifest = {
        chapter1: {
          href: 'chapter1.xhtml',
          mediaType: 'application/xhtml+xml',
        },
        chapter2: {
          href: 'chapter2.xhtml',
          mediaType: 'application/xhtml+xml',
        },
      };
      const result = createInitialValidationResult();

      validateManifestPresence(manifest, result);

      expect(result.errors).toHaveLength(0);
    });

    test('should add error for missing manifest', () => {
      const manifest = {};
      const result = createInitialValidationResult();

      validateManifestPresence(manifest, result);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        code: 'MISSING_MANIFEST',
        message: 'EPUB manifest is missing or empty',
        severity: 'critical',
        fix: 'Ensure EPUB contains a proper file manifest',
      });
    });

    test('should add error for null manifest', () => {
      const manifest = null as any;
      const result = createInitialValidationResult();

      validateManifestPresence(manifest, result);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe('MISSING_MANIFEST');
    });

    test('should add error for undefined manifest', () => {
      const manifest = undefined as any;
      const result = createInitialValidationResult();

      validateManifestPresence(manifest, result);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe('MISSING_MANIFEST');
    });
  });
});
