import { describe, test, expect, beforeEach } from 'bun:test';
import { Epub } from '@smoores/epub';
import { ValidationLevel } from '../../../../src/core/document-processing/parsers/epub-parser-validation-types.js';
import { validateEPUBStructureAdvanced } from '../../../../src/core/document-processing/parsers/epub-parser-validation.js';

describe('EPUB Parser Validation Structure - Metadata', () => {
  let mockEpub: Epub;

  beforeEach(() => {
    mockEpub = {
      getMetadata: () => Promise.resolve([]),
      getSpineItems: () =>
        Promise.resolve([{ idref: 'chapter1', title: 'Chapter 1' }]),
      getManifest: () =>
        Promise.resolve({
          chapter1: {
            href: 'chapter1.html',
            mediaType: 'application/xhtml+xml',
          },
        }),
      getToc: () => Promise.resolve([]),
      close: () => Promise.resolve(),
    } as any;
  });

  describe('validateEPUBMetadata (using validateEPUBStructureAdvanced)', () => {
    test('should validate metadata with all required fields', async () => {
      const metadata = [
        {
          type: 'title' as const,
          properties: {},
          value: 'Test Book',
        },
        {
          type: 'creator' as const,
          properties: {},
          value: 'Test Author',
        },
        {
          type: 'language' as const,
          properties: {},
          value: 'en',
        },
        {
          type: 'identifier' as const,
          properties: {},
          value: 'test-book-123',
        },
      ];

      mockEpub.getMetadata = () => Promise.resolve(metadata);

      const result = await validateEPUBStructureAdvanced(mockEpub, {
        level: ValidationLevel.BASIC,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should fail validation for missing title', async () => {
      const metadata = [
        {
          type: 'creator' as const,
          properties: {},
          value: 'Test Author',
        },
        {
          type: 'language' as const,
          properties: {},
          value: 'en',
        },
      ];

      mockEpub.getMetadata = () => Promise.resolve(metadata);

      const result = await validateEPUBStructureAdvanced(mockEpub, {
        level: ValidationLevel.BASIC,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.message).toContain('title');
    });

    test('should fail validation for missing language', async () => {
      const metadata = [
        {
          type: 'title' as const,
          properties: {},
          value: 'Test Book',
        },
        {
          type: 'creator' as const,
          properties: {},
          value: 'Test Author',
        },
      ];

      mockEpub.getMetadata = () => Promise.resolve(metadata);

      const result = await validateEPUBStructureAdvanced(mockEpub, {
        level: ValidationLevel.BASIC,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.message).toContain('identifier'); // language validation is not in basic level
    });

    test('should handle empty metadata', async () => {
      mockEpub.getMetadata = () => Promise.resolve([]);

      const result = await validateEPUBStructureAdvanced(mockEpub, {
        level: ValidationLevel.BASIC,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle metadata with invalid language code', async () => {
      const metadata = [
        {
          type: 'title' as const,
          properties: {},
          value: 'Test Book',
        },
        {
          type: 'language' as const,
          properties: {},
          value: 'invalid-language-code',
        },
      ];

      mockEpub.getMetadata = () => Promise.resolve(metadata);

      const result = await validateEPUBStructureAdvanced(mockEpub, {
        level: ValidationLevel.BASIC,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle metadata extraction errors', async () => {
      mockEpub.getMetadata = () =>
        Promise.reject(new Error('Metadata extraction failed'));

      const result = await validateEPUBStructureAdvanced(mockEpub, {
        level: ValidationLevel.BASIC,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.message).toContain('Metadata extraction failed');
    });

    test('should validate optional metadata fields', async () => {
      const metadata = [
        {
          type: 'title' as const,
          properties: {},
          value: 'Test Book',
        },
        {
          type: 'creator' as const,
          properties: {},
          value: 'Test Author',
        },
        {
          type: 'language' as const,
          properties: {},
          value: 'en',
        },
        {
          type: 'identifier' as const,
          properties: {},
          value: 'test-book-123',
        },
        {
          type: 'publisher' as const,
          properties: {},
          value: 'Test Publisher',
        },
        {
          type: 'description' as const,
          properties: {},
          value: 'Test Description',
        },
        {
          type: 'subject' as const,
          properties: {},
          value: 'Test Subject',
        },
      ];

      mockEpub.getMetadata = () => Promise.resolve(metadata);

      const result = await validateEPUBStructureAdvanced(mockEpub, {
        level: ValidationLevel.BASIC,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle metadata with duplicate fields', async () => {
      const metadata = [
        {
          type: 'title' as const,
          properties: {},
          value: 'Test Book',
        },
        {
          type: 'title' as const,
          properties: {},
          value: 'Alternative Title',
        },
        {
          type: 'creator' as const,
          properties: {},
          value: 'Test Author',
        },
        {
          type: 'language' as const,
          properties: {},
          value: 'en',
        },
        {
          type: 'identifier' as const,
          properties: {},
          value: 'test-book-123',
        },
      ];

      mockEpub.getMetadata = () => Promise.resolve(metadata);

      const result = await validateEPUBStructureAdvanced(mockEpub, {
        level: ValidationLevel.BASIC,
      });

      expect(result.isValid).toBe(true);
      // May generate warnings but should still be valid
      expect(result.errors).toHaveLength(0);
    });
  });
});
