import { describe, test, expect } from 'bun:test';
import type { EpubMetadata } from '../../../../src/core/document-processing/parsers/epub-parser-types.js';
import {
  createInitialValidationResult,
  updateValidationMetadata,
} from '../../../../src/core/document-processing/parsers/epub-parser-validation-basic.js';

describe('EPUB Parser Validation Result', () => {
  describe('createInitialValidationResult', () => {
    test('should create initial validation result with default values', () => {
      const result = createInitialValidationResult();

      expect(result).toEqual({
        isValid: true,
        errors: [],
        warnings: [],
        metadata: {
          fileSize: 0,
          spineItemCount: 0,
          manifestItemCount: 0,
          hasNavigation: false,
          hasMetadata: false,
        },
      });
    });

    test('should always return a fresh result object', () => {
      const result1 = createInitialValidationResult();
      const result2 = createInitialValidationResult();

      expect(result1).not.toBe(result2);
      expect(result1).toEqual(result2);
    });
  });

  describe('updateValidationMetadata', () => {
    test('should update validation metadata with EPUB information', () => {
      const result = createInitialValidationResult();
      const metadata: EpubMetadata = [
        { type: 'title', value: 'Test Book', properties: {} },
        { type: 'creator', value: 'Test Author', properties: {} },
      ];
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
      const manifest = {
        chapter1: {
          href: 'chapter1.xhtml',
          mediaType: 'application/xhtml+xml',
        },
        chapter2: {
          href: 'chapter2.xhtml',
          mediaType: 'application/xhtml+xml',
        },
        'cover.jpg': { href: 'cover.jpg', mediaType: 'image/jpeg' },
      };

      updateValidationMetadata(result, metadata, spineItems, manifest);

      expect(result.metadata.spineItemCount).toBe(2);
      expect(result.metadata.manifestItemCount).toBe(3);
      expect(result.metadata.hasMetadata).toBe(true);
    });

    test('should handle empty metadata, spine, and manifest', () => {
      const result = createInitialValidationResult();
      const metadata: EpubMetadata = [];
      const spineItems: any[] = [];
      const manifest = {};

      updateValidationMetadata(result, metadata, spineItems, manifest);

      expect(result.metadata.spineItemCount).toBe(0);
      expect(result.metadata.manifestItemCount).toBe(0);
      expect(result.metadata.hasMetadata).toBe(false);
    });

    test('should handle undefined values', () => {
      const result = createInitialValidationResult();

      expect(() => {
        updateValidationMetadata(
          result,
          undefined as any,
          undefined as any,
          {} as any
        );
      }).toThrow('undefined is not an object');
    });
  });
});
