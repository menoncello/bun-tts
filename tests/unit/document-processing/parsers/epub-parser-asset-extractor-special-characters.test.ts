import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { extractEmbeddedAssets } from '../../../../src/core/document-processing/parsers/epub-parser-asset-extractor.js';
import {
  setupMockLogger,
  restoreMockLogger,
  createMockEpub,
  createParseOptions,
  createManifestEntry,
} from './epub-parser-asset-extractor-test-utils';

describe('EPUB Parser Asset Extractor - Special Characters', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  test('should handle assets with special characters in hrefs', async () => {
    const manifest = {
      spaces: createManifestEntry('images/cover art.jpg', 'image/jpeg'),
      special: createManifestEntry('styles/main-style.css', 'text/css'),
      unicode: createManifestEntry('fonts/café.ttf', 'font/ttf'),
      encoded: createManifestEntry('images/hello%20world.jpg', 'image/jpeg'),
      symbols: createManifestEntry('audio/song-#1.mp3', 'audio/mpeg'),
      brackets: createManifestEntry('docs/manual[1].pdf', 'application/pdf'),
    };

    const epub = createMockEpub(manifest);
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result.images).toHaveLength(2);
    expect(result.images.map((img) => img.href)).toEqual([
      'images/cover art.jpg',
      'images/hello%20world.jpg',
    ]);
    expect(result.styles).toHaveLength(1);
    expect(result.styles[0]?.href).toBe('styles/main-style.css');
    expect(result.fonts).toHaveLength(1);
    expect(result.fonts[0]?.href).toBe('fonts/café.ttf');
    expect(result.audio).toHaveLength(1);
    expect(result.audio[0]?.href).toBe('audio/song-#1.mp3');
    expect(result.other).toHaveLength(1);
    expect(result.other[0]?.href).toBe('docs/manual[1].pdf');
    expect(mockWarn).not.toHaveBeenCalled();
  });
});
