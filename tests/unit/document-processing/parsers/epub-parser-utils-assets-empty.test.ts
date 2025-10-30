import { describe, test, expect } from 'bun:test';
import { createEmptyAssets } from '../../../../src/core/document-processing/parsers/epub-parser-utils.js';

describe('EPUB Parser Utils - Assets - Create Empty Assets', () => {
  describe('createEmptyAssets', () => {
    test('should create empty assets object', () => {
      const result = createEmptyAssets();

      expect(result).toEqual({
        images: [],
        styles: [],
        fonts: [],
        audio: [],
        video: [],
        other: [],
      });
    });

    test('should create independent arrays', () => {
      const assets1 = createEmptyAssets();
      const assets2 = createEmptyAssets();

      // Modify assets1
      assets1.images.push({
        id: 'test',
        href: 'test.jpg',
        mediaType: 'image/jpeg',
        type: 'image',
        size: 0,
        properties: [],
      });

      // assets2 should remain unchanged
      expect(assets2.images).toHaveLength(0);
    });

    test('should create mutable arrays', () => {
      const assets = createEmptyAssets();

      expect(() => {
        assets.images.push({
          id: 'test',
          href: 'test.jpg',
          mediaType: 'image/jpeg',
          type: 'image',
          size: 0,
          properties: [],
        });
      }).not.toThrow();

      expect(assets.images).toHaveLength(1);
    });
  });
});
