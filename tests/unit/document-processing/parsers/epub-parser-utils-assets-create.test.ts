import { describe, test, expect } from 'bun:test';
import { createAssetFromManifestItem } from '../../../../src/core/document-processing/parsers/epub-parser-utils.js';

describe('EPUB Parser Utils - Assets - Create Asset From Manifest Item', () => {
  describe('createAssetFromManifestItem', () => {
    describe('should create asset from different media types', () => {
      const manifestItemTestCases = [
        {
          name: 'image/jpeg',
          item: {
            id: 'cover-image',
            href: 'images/cover.jpg',
            mediaType: 'image/jpeg',
            properties: [],
          },
          expectedType: 'image',
        },
        {
          name: 'text/css',
          item: {
            id: 'main-style',
            href: 'styles/main.css',
            mediaType: 'text/css',
            properties: [],
          },
          expectedType: 'style',
        },
        {
          name: 'font/ttf',
          item: {
            id: 'main-font',
            href: 'fonts/arial.ttf',
            mediaType: 'font/ttf',
            properties: [],
          },
          expectedType: 'font',
        },
        {
          name: 'audio/mpeg',
          item: {
            id: 'chapter-audio',
            href: 'audio/chapter1.mp3',
            mediaType: 'audio/mpeg',
            properties: [],
          },
          expectedType: 'audio',
        },
        {
          name: 'video/mp4',
          item: {
            id: 'intro-video',
            href: 'videos/intro.mp4',
            mediaType: 'video/mp4',
            properties: [],
          },
          expectedType: 'video',
        },
        {
          name: 'application/unknown',
          item: {
            id: 'unknown-file',
            href: 'data/custom.xyz',
            mediaType: 'application/unknown',
            properties: [],
          },
          expectedType: 'other',
        },
      ];

      for (const { name, item, expectedType } of manifestItemTestCases) {
        test(`should create asset from ${name} manifest item`, () => {
          const result = createAssetFromManifestItem(item);
          const expectedId = item.href.replace(/[./]/g, '-');
          expect(result).toEqual({
            id: expectedId,
            href: item.href,
            mediaType: item.mediaType,
            type: expectedType,
            size: 0,
            properties: item.properties,
            originalId: item.id,
          });
        });
      }
    });

    test('should handle manifest item with properties', () => {
      const manifestItem = {
        id: 'nav-item',
        href: 'nav.xhtml',
        mediaType: 'application/xhtml+xml',
        properties: ['nav', 'cover-image'],
      };

      const result = createAssetFromManifestItem(manifestItem);
      expect(result.properties).toEqual(['nav', 'cover-image']);
    });

    describe('should handle different image types', () => {
      const imageTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
      ];

      for (const mediaType of imageTypes) {
        test(`should handle ${mediaType}`, () => {
          const manifestItem = {
            id: `image-${mediaType.split('/')[1]}`,
            href: `images/test.${mediaType.split('/')[1]}`,
            mediaType,
            properties: [],
          };

          const result = createAssetFromManifestItem(manifestItem);
          expect(result.type).toBe('image');
        });
      }
    });

    describe('should handle different font types', () => {
      const fontTypes = [
        'font/ttf',
        'font/otf',
        'font/woff',
        'font/woff2',
        'application/font-sfnt',
        'application/x-font-ttf',
      ];

      for (const mediaType of fontTypes) {
        test(`should handle ${mediaType}`, () => {
          const manifestItem = {
            id: `font-${mediaType.split('/').pop()}`,
            href: `fonts/test.${mediaType.split('/').pop()}`,
            mediaType,
            properties: [],
          };

          const result = createAssetFromManifestItem(manifestItem);
          expect(result.type).toBe('font');
        });
      }
    });

    describe('should handle invalid inputs', () => {
      test('should throw error for null manifest item', () => {
        expect(() => createAssetFromManifestItem(null as any)).toThrow();
      });

      test('should throw error for undefined manifest item', () => {
        expect(() => createAssetFromManifestItem(undefined as any)).toThrow();
      });

      const incompleteItems = [{ id: 'test' }, { mediaType: 'image/jpeg' }];

      for (const [index, item] of incompleteItems.entries()) {
        test(`should throw error for incomplete item ${index + 1}`, () => {
          expect(() => createAssetFromManifestItem(item as any)).toThrow();
        });
      }

      test('should work with href only', () => {
        const result = createAssetFromManifestItem({
          href: 'test.jpg',
          id: 'test-jpg',
          mediaType: 'application/octet-stream',
          properties: undefined,
        });
        expect(result).toEqual({
          id: 'test-jpg',
          href: 'test.jpg',
          mediaType: 'application/octet-stream',
          size: 0,
          type: 'other',
          properties: [],
          originalId: 'test-jpg',
        });
      });
    });
  });
});
