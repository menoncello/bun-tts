import { describe, test, expect, beforeEach } from 'bun:test';
import { Epub } from '@smoores/epub';
import type { EpubMetadata } from '../../../../src/core/document-processing/parsers/epub-parser-types.js';
import { validateBasicStructure } from '../../../../src/core/document-processing/parsers/epub-parser-validation-basic.js';

describe('EPUB Parser Validation Integration', () => {
  let mockEpub: Epub;

  beforeEach(() => {
    mockEpub = {
      getMetadata: () => Promise.resolve([]),
      getSpineItems: () => Promise.resolve([]),
      getManifest: () => Promise.resolve({}),
      close: () => Promise.resolve(),
    } as unknown as Epub;
  });

  describe('Integration Tests', () => {
    test('should validate complex EPUB with all components', async () => {
      const metadata: EpubMetadata = [
        { type: 'title', value: 'Complex Book Title', properties: {} },
        { type: 'creator', value: 'Primary Author', properties: {} },
        { type: 'creator', value: 'Secondary Author', properties: {} },
        { type: 'identifier', value: 'isbn:978-0-123456-78-9', properties: {} },
        { type: 'language', value: 'en', properties: {} },
        { type: 'publisher', value: 'Test Publisher', properties: {} },
        {
          type: 'description',
          value: 'A comprehensive test book',
          properties: {},
        },
        { type: 'rights', value: 'Copyright 2023', properties: {} },
      ];
      const spineItems = [
        {
          id: 'cover',
          href: 'cover.xhtml',
          mediaType: 'application/xhtml+xml',
        },
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
        {
          id: 'chapter3',
          href: 'chapter3.xhtml',
          mediaType: 'application/xhtml+xml',
        },
        {
          id: 'appendix',
          href: 'appendix.xhtml',
          mediaType: 'application/xhtml+xml',
        },
      ];
      const manifest = {
        cover: { href: 'cover.xhtml', mediaType: 'application/xhtml+xml' },
        chapter1: {
          href: 'chapter1.xhtml',
          mediaType: 'application/xhtml+xml',
        },
        chapter2: {
          href: 'chapter2.xhtml',
          mediaType: 'application/xhtml+xml',
        },
        chapter3: {
          href: 'chapter3.xhtml',
          mediaType: 'application/xhtml+xml',
        },
        appendix: {
          href: 'appendix.xhtml',
          mediaType: 'application/xhtml+xml',
        },
        'toc.ncx': { href: 'toc.ncx', mediaType: 'application/x-dtbncx+xml' },
        'styles.css': { href: 'styles.css', mediaType: 'text/css' },
      };
      // Set up the mock Epub to return our test data
      mockEpub.getMetadata = () => Promise.resolve(metadata);
      mockEpub.getSpineItems = () => Promise.resolve(spineItems as any);
      mockEpub.getManifest = () => Promise.resolve(manifest as any);

      const result = await validateBasicStructure(mockEpub);

      expect(result.errors).toHaveLength(0);
      expect(result.metadata.spineItemCount).toBe(5);
      expect(result.metadata.manifestItemCount).toBe(7);
      expect(result.metadata.hasMetadata).toBe(true);
      expect(result.metadata.title).toBe('Complex Book Title');
      expect(result.isValid).toBe(true);
    });

    test('should handle partial EPUB with missing components', async () => {
      const metadata: EpubMetadata = [
        { type: 'title', value: 'Partial Book', properties: {} },
      ];
      const spineItems = [
        {
          id: 'chapter1',
          href: 'chapter1.xhtml',
          mediaType: 'application/xhtml+xml',
        },
      ];
      const manifest = {
        chapter1: {
          href: 'chapter1.xhtml',
          mediaType: 'application/xhtml+xml',
        },
      };
      // Set up the mock Epub to return our test data
      mockEpub.getMetadata = () => Promise.resolve(metadata);
      mockEpub.getSpineItems = () => Promise.resolve(spineItems as any);
      mockEpub.getManifest = () => Promise.resolve(manifest as any);

      const result = await validateBasicStructure(mockEpub);

      expect(result.errors).toHaveLength(2);
      expect(result.errors.some((e) => e.code === 'MISSING_IDENTIFIER')).toBe(
        true
      );
      expect(result.errors.some((e) => e.code === 'MISSING_LANGUAGE')).toBe(
        true
      );
      expect(result.metadata.spineItemCount).toBe(1);
      expect(result.metadata.manifestItemCount).toBe(1);
      expect(result.metadata.hasMetadata).toBe(true);
      expect(result.metadata.title).toBe('Partial Book');
      expect(result.isValid).toBe(false);
    });

    test('should handle EPUB with very long title', async () => {
      const veryLongTitle = 'A'.repeat(500); // Create extremely long title
      const metadata: EpubMetadata = [
        { type: 'title', value: veryLongTitle, properties: {} },
        { type: 'creator', value: 'Test Author', properties: {} },
        { type: 'identifier', value: 'test-identifier', properties: {} },
        { type: 'language', value: 'en', properties: {} },
      ];
      const spineItems = [
        {
          id: 'chapter1',
          href: 'chapter1.xhtml',
          mediaType: 'application/xhtml+xml',
        },
      ];
      const manifest = {
        chapter1: {
          href: 'chapter1.xhtml',
          mediaType: 'application/xhtml+xml',
        },
      };
      // Set up the mock Epub to return our test data
      mockEpub.getMetadata = () => Promise.resolve(metadata);
      mockEpub.getSpineItems = () => Promise.resolve(spineItems as any);
      mockEpub.getManifest = () => Promise.resolve(manifest as any);

      const result = await validateBasicStructure(mockEpub);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe('INVALID_TITLE_LENGTH');
      expect(result.metadata.title).toBe(veryLongTitle);
      expect(result.isValid).toBe(false);
    });

    test('should handle EPUB with very short title', async () => {
      const veryShortTitle = ''; // Empty title (less than MIN_TITLE_LENGTH)
      const metadata: EpubMetadata = [
        { type: 'title', value: veryShortTitle, properties: {} },
        { type: 'creator', value: 'Test Author', properties: {} },
        { type: 'identifier', value: 'test-identifier', properties: {} },
        { type: 'language', value: 'en', properties: {} },
      ];
      const spineItems = [
        {
          id: 'chapter1',
          href: 'chapter1.xhtml',
          mediaType: 'application/xhtml+xml',
        },
      ];
      const manifest = {
        chapter1: {
          href: 'chapter1.xhtml',
          mediaType: 'application/xhtml+xml',
        },
      };
      // Set up the mock Epub to return our test data
      mockEpub.getMetadata = () => Promise.resolve(metadata);
      mockEpub.getSpineItems = () => Promise.resolve(spineItems as any);
      mockEpub.getManifest = () => Promise.resolve(manifest as any);

      const result = await validateBasicStructure(mockEpub);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe('MISSING_TITLE');
      expect(result.metadata.title).toBeUndefined();
      expect(result.isValid).toBe(false);
    });
  });
});
