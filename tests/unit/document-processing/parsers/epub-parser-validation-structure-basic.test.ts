import { describe, test, expect, beforeEach } from 'bun:test';
import { Epub } from '@smoores/epub';
import {
  createInitialValidationResult,
  validateBasicEpubStructure,
} from '../../../../src/core/document-processing/parsers/epub-parser-validation-basic.js';

describe('EPUB Parser Validation Structure - Basic', () => {
  let mockEpub: Epub;

  beforeEach(() => {
    mockEpub = {
      getMetadata: () =>
        Promise.resolve([
          { type: 'title', value: 'Test Book' },
          { type: 'creator', value: 'Test Author' },
          { type: 'identifier', value: 'test-book-id' },
          { type: 'language', value: 'en' },
        ]),
      getSpineItems: () =>
        Promise.resolve([
          { idref: 'chapter1', href: 'chapter1.xhtml', linear: 'yes' },
        ]),
      getManifest: () =>
        Promise.resolve({
          chapter1: {
            href: 'chapter1.xhtml',
            mediaType: 'application/xhtml+xml',
          },
          toc: { href: 'toc.ncx', mediaType: 'application/x-dtbncx+xml' },
        }),
      getToc: () => Promise.resolve([]),
      close: () => Promise.resolve(),
    } as any;
  });

  describe('createInitialValidationResult', () => {
    test('should create initial validation result', () => {
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

    test('should create fresh validation result each time', () => {
      const result1 = createInitialValidationResult();
      const result2 = createInitialValidationResult();

      expect(result1).not.toBe(result2);
      expect(result1).toEqual(result2);
    });
  });

  describe('validateBasicStructure', () => {
    test('should pass validation for valid EPUB structure', async () => {
      const metadata = await mockEpub.getMetadata();
      const spineItems = await mockEpub.getSpineItems();
      const manifest = await mockEpub.getManifest();
      const result = createInitialValidationResult();

      await validateBasicEpubStructure({
        epub: mockEpub,
        metadata,
        spineItems,
        manifest,
        result,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should fail validation for null EPUB', async () => {
      const result = createInitialValidationResult();

      await validateBasicEpubStructure({
        epub: null as any,
        metadata: [],
        spineItems: [],
        manifest: {},
        result,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe('INVALID_EPUB_OBJECT');
      expect(result.errors[0]?.message).toBe('Invalid EPUB object provided');
    });

    test('should fail validation for undefined EPUB', async () => {
      const result = createInitialValidationResult();

      await validateBasicEpubStructure({
        epub: undefined as any,
        metadata: [],
        spineItems: [],
        manifest: {},
        result,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe('INVALID_EPUB_OBJECT');
      expect(result.errors[0]?.message).toBe('Invalid EPUB object provided');
    });

    test('should handle EPUB with missing methods', async () => {
      const invalidEpub = {} as Epub;
      const result = createInitialValidationResult();

      await validateBasicEpubStructure({
        epub: invalidEpub,
        metadata: [],
        spineItems: [],
        manifest: {},
        result,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle EPUB with throwing methods', async () => {
      const throwingEpub = {
        getMetadata: () => Promise.reject(new Error('Metadata error')),
        getSpineItems: () => Promise.reject(new Error('Spine error')),
        getManifest: () => Promise.reject(new Error('Manifest error')),
        getToc: () => Promise.reject(new Error('TOC error')),
        close: () => Promise.resolve(),
      } as any;

      const result = createInitialValidationResult();

      await validateBasicEpubStructure({
        epub: throwingEpub,
        metadata: [],
        spineItems: [],
        manifest: {},
        result,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should validate all required EPUB methods exist', async () => {
      const partialEpub = {
        getMetadata: () => Promise.resolve([]),
        // Missing other required methods
      } as any;

      const result = createInitialValidationResult();

      await validateBasicEpubStructure({
        epub: partialEpub,
        metadata: [],
        spineItems: [],
        manifest: {},
        result,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle validation with warnings but no errors', async () => {
      const warningEpub = {
        getMetadata: () =>
          Promise.resolve([
            { type: 'title', value: 'Test Book' },
            { type: 'creator', value: 'Test Author' },
            { type: 'identifier', value: 'test-book-id' },
            { type: 'language', value: 'en' },
          ]),
        getSpineItems: () =>
          Promise.resolve([
            { idref: 'chapter1', href: 'chapter1.xhtml', linear: 'yes' },
          ]),
        getManifest: () =>
          Promise.resolve({
            chapter1: {
              href: 'chapter1.xhtml',
              mediaType: 'application/xhtml+xml',
            },
            toc: { href: 'toc.ncx', mediaType: 'application/x-dtbncx+xml' },
          }),
        getToc: () => Promise.resolve([]),
        close: () => Promise.resolve(),
        // Extra properties that might generate warnings
        extraProperty: 'some value',
      } as any;

      const result = createInitialValidationResult();

      await validateBasicEpubStructure({
        epub: warningEpub,
        metadata: await warningEpub.getMetadata(),
        spineItems: await warningEpub.getSpineItems(),
        manifest: await warningEpub.getManifest(),
        result,
      });

      // Should still be valid even with warnings
      expect(result.isValid).toBe(true);
    });
  });
});
