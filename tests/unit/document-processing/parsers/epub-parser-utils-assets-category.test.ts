import { describe, test, expect } from 'bun:test';
import {
  addAssetToCorrectCategory,
  createEmptyAssets,
} from '../../../../src/core/document-processing/parsers/epub-parser-utils.js';
import type { EmbeddedAssets } from '../../../../src/core/document-processing/types.js';

describe('EPUB Parser Utils - Assets - Add Asset To Category', () => {
  describe('addAssetToCorrectCategory', () => {
    describe('should add assets to correct categories', () => {
      const categoryTestCases = [
        {
          name: 'image',
          asset: {
            id: 'cover.jpg',
            href: 'images/cover.jpg',
            mediaType: 'image/jpeg',
            type: 'image',
            size: 1024,
            properties: [],
          },
          category: 'images',
        },
        {
          name: 'style',
          asset: {
            id: 'main.css',
            href: 'styles/main.css',
            mediaType: 'text/css',
            type: 'style',
            size: 2048,
            properties: [],
          },
          category: 'styles',
        },
        {
          name: 'font',
          asset: {
            id: 'arial.ttf',
            href: 'fonts/arial.ttf',
            mediaType: 'font/ttf',
            type: 'font',
            size: 512,
            properties: [],
          },
          category: 'fonts',
        },
        {
          name: 'audio',
          asset: {
            id: 'chapter1.mp3',
            href: 'audio/chapter1.mp3',
            mediaType: 'audio/mpeg',
            type: 'audio',
            size: 1024000,
            properties: [],
          },
          category: 'audio',
        },
        {
          name: 'video',
          asset: {
            id: 'intro.mp4',
            href: 'videos/intro.mp4',
            mediaType: 'video/mp4',
            type: 'video',
            size: 2048000,
            properties: [],
          },
          category: 'video',
        },
        {
          name: 'other',
          asset: {
            id: 'data.xml',
            href: 'data/data.xml',
            mediaType: 'application/xml',
            type: 'other',
            size: 4096,
            properties: [],
          },
          category: 'other',
        },
      ];

      for (const { name, asset, category } of categoryTestCases) {
        test(`should add ${name} asset to ${category} category`, () => {
          const assets = createEmptyAssets();
          addAssetToCorrectCategory(asset, assets);

          expect(assets[category as keyof EmbeddedAssets]).toHaveLength(1);
          expect(assets[category as keyof EmbeddedAssets][0]).toEqual(asset);
        });
      }
    });

    test('should add multiple assets to same category', () => {
      const assets = createEmptyAssets();
      const asset1 = {
        id: 'image1.jpg',
        href: 'images/image1.jpg',
        mediaType: 'image/jpeg',
        type: 'image',
        size: 1024,
        properties: [],
      };
      const asset2 = {
        id: 'image2.png',
        href: 'images/image2.png',
        mediaType: 'image/png',
        type: 'image',
        size: 2048,
        properties: [],
      };

      addAssetToCorrectCategory(asset1, assets);
      addAssetToCorrectCategory(asset2, assets);

      expect(assets.images).toHaveLength(2);
      expect(assets.images[0]).toEqual(asset1);
      expect(assets.images[1]).toEqual(asset2);
    });
  });
});
