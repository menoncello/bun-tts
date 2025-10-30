import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { extractEmbeddedAssets } from '../../../../src/core/document-processing/parsers/epub-parser-asset-extractor.js';
import {
  setupMockLogger,
  restoreMockLogger,
  createMockEpub,
  createParseOptions,
  createManifestEntry,
} from './epub-parser-asset-extractor-test-utils';

describe('EPUB Parser Asset Extractor - Edge Case Media Types', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  test('should handle case-sensitive media types', async () => {
    const manifest = {
      uppercase: createManifestEntry('images/cover.JPG', 'IMAGE/JPEG'),
      mixed: createManifestEntry('styles/main.CSS', 'Text/Css'),
      lowercase: createManifestEntry('fonts/main.ttf', 'font/ttf'),
    };

    const epub = createMockEpub(manifest);
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    // Should handle different cases properly
    expect(result.images).toHaveLength(1);
    expect(result.styles).toHaveLength(1);
    expect(result.fonts).toHaveLength(1);
    expect(mockWarn).not.toHaveBeenCalled();
  });

  test('should handle media types with parameters', async () => {
    const manifest = {
      withParams: createManifestEntry(
        'images/cover.jpg',
        'image/jpeg; charset=utf-8'
      ),
      withoutParams: createManifestEntry('images/icon.png', 'image/png'),
    };

    const epub = createMockEpub(manifest);
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result.images).toHaveLength(2);
    expect(mockWarn).not.toHaveBeenCalled();
  });
});
