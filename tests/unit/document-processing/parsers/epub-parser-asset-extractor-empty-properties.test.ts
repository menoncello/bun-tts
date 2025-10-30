import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { extractEmbeddedAssets } from '../../../../src/core/document-processing/parsers/epub-parser-asset-extractor.js';
import {
  setupMockLogger,
  restoreMockLogger,
  createMockEpub,
  createParseOptions,
  createManifestEntry,
} from './epub-parser-asset-extractor-test-utils';

describe('EPUB Parser Asset Extractor - Empty Properties Array', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  test('should handle empty properties array', async () => {
    const manifest = {
      emptyProps: createManifestEntry('images/cover.jpg', 'image/jpeg', []),
    };

    const epub = createMockEpub(manifest);
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result.images).toHaveLength(1);
    expect(mockWarn).not.toHaveBeenCalled();
  });
});

describe('EPUB Parser Asset Extractor - Null Properties', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  test('should handle null properties', async () => {
    const manifest = {
      nullProps: createManifestEntry(
        'images/icon.png',
        'image/png',
        null as any
      ),
    };

    const epub = createMockEpub(manifest);
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result.images).toHaveLength(1);
    expect(mockWarn).not.toHaveBeenCalled();
  });
});

describe('EPUB Parser Asset Extractor - Missing Properties', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  test('should handle missing properties', async () => {
    const manifest = {
      noProps: createManifestEntry('images/page.jpg', 'image/jpeg'),
    };

    const epub = createMockEpub(manifest);
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result.images).toHaveLength(1);
    expect(mockWarn).not.toHaveBeenCalled();
  });
});

describe('EPUB Parser Asset Extractor - Mixed Empty/Null Properties', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  test('should handle mixed empty/null properties', async () => {
    const manifest = {
      emptyProps: createManifestEntry('images/cover.jpg', 'image/jpeg', []),
      nullProps: createManifestEntry(
        'images/icon.png',
        'image/png',
        null as any
      ),
      noProps: createManifestEntry('images/page.jpg', 'image/jpeg'),
    };

    const epub = createMockEpub(manifest);
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result.images).toHaveLength(3);
    expect(mockWarn).not.toHaveBeenCalled();
  });
});
