import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { extractEmbeddedAssets } from '../../../../src/core/document-processing/parsers/epub-parser-asset-extractor.js';
import {
  setupMockLogger,
  restoreMockLogger,
  createMockEpub,
  createParseOptions,
  createManifestEntry,
} from './epub-parser-asset-extractor-test-utils';

describe('EPUB Parser Asset Extractor - Multiple Assets', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  test('should handle multiple assets of the same type', async () => {
    const manifest = {
      image1: createManifestEntry('images/cover.jpg', 'image/jpeg'),
      image2: createManifestEntry('images/page1.png', 'image/png'),
      image3: createManifestEntry('images/page2.jpg', 'image/jpeg'),
      image4: createManifestEntry('images/page3.gif', 'image/gif'),
    };

    const epub = createMockEpub(manifest);
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result.images).toHaveLength(4);
    expect(result.images.map((img) => img.href)).toEqual([
      'images/cover.jpg',
      'images/page1.png',
      'images/page2.jpg',
      'images/page3.gif',
    ]);
    expect(mockWarn).not.toHaveBeenCalled();
  });

  test('should handle large number of assets', async () => {
    const manifest: Record<string, any> = {};

    // Create 100 image assets
    for (let i = 1; i <= 100; i++) {
      manifest[`image${i}`] = createManifestEntry(
        `images/page${i}.jpg`,
        'image/jpeg'
      );
    }

    const epub = createMockEpub(manifest);
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result.images).toHaveLength(100);
    expect(result.images[0]?.href).toBe('images/page1.jpg');
    expect(result.images[99]?.href).toBe('images/page100.jpg');
    expect(mockWarn).not.toHaveBeenCalled();
  });
});
