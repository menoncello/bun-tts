import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { extractEmbeddedAssets } from '../../../../src/core/document-processing/parsers/epub-parser-asset-extractor.js';
import {
  setupMockLogger,
  restoreMockLogger,
  createErrorMockEpub,
  createEmptyAssets,
  createParseOptions,
  createManifestWithoutMediaType,
} from './epub-parser-asset-extractor-test-utils';

describe('EPUB Parser Asset Extractor - EPUB getManifest errors', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  test('should handle EPUB getManifest errors gracefully', async () => {
    const error = new Error('Manifest extraction failed');
    const epub = createErrorMockEpub(error);
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result).toEqual(createEmptyAssets());
    expect(mockWarn).toHaveBeenCalledWith('Failed to extract embedded assets', {
      parser: 'EPUBParser',
      error: 'Manifest extraction failed',
    });
  });
});

describe('EPUB Parser Asset Extractor - non-Error objects', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  test('should handle non-Error objects in error handling', async () => {
    const error = 'String error';
    const epub = createErrorMockEpub(error);
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result).toEqual(createEmptyAssets());
    expect(mockWarn).toHaveBeenCalledWith('Failed to extract embedded assets', {
      parser: 'EPUBParser',
      error: 'Unknown error',
    });
  });
});

describe('EPUB Parser Asset Extractor - null error objects', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  test('should handle null error objects', async () => {
    const error = null;
    const epub = createErrorMockEpub(error);
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result).toEqual(createEmptyAssets());
    expect(mockWarn).toHaveBeenCalledWith('Failed to extract embedded assets', {
      parser: 'EPUBParser',
      error: 'Unknown error',
    });
  });
});

describe('EPUB Parser Asset Extractor - undefined error objects', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  test('should handle undefined error objects', async () => {
    const error = undefined;
    const epub = createErrorMockEpub(error);
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result).toEqual(createEmptyAssets());
    expect(mockWarn).toHaveBeenCalledWith('Failed to extract embedded assets', {
      parser: 'EPUBParser',
      error: 'Unknown error',
    });
  });
});

describe('EPUB Parser Asset Extractor - assets without mediaType', () => {
  test('should handle assets without mediaType by using default media type', async () => {
    const manifest = createManifestWithoutMediaType();
    const epub = {
      getManifest: () => Promise.resolve(manifest),
      close: () => Promise.resolve(),
    } as any;
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result.images).toHaveLength(1);
    expect(result.images[0]?.href).toBe('images/valid.jpg');
    expect(result.other).toHaveLength(1);
    expect(result.other[0]?.href).toBe('files/unknown.txt');
    expect(result.other[0]?.mediaType).toBe('application/octet-stream');
  });
});

describe('EPUB Parser Asset Extractor - assets with null href', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  test('should handle assets with null href causing errors', async () => {
    const manifest = {
      nullHref: { href: null, mediaType: 'image/jpeg' },
    };
    const epub = {
      getManifest: () => Promise.resolve(manifest),
      close: () => Promise.resolve(),
    } as any;
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result).toEqual(createEmptyAssets());
    expect(mockWarn).toHaveBeenCalledWith('Failed to extract embedded assets', {
      parser: 'EPUBParser',
      error: 'Manifest item must have a valid href',
    });
  });
});

describe('EPUB Parser Asset Extractor - assets with undefined href', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  test('should handle assets with undefined href causing errors', async () => {
    const manifest = {
      undefinedHref: { href: undefined, mediaType: 'image/jpeg' },
    };
    const epub = {
      getManifest: () => Promise.resolve(manifest),
      close: () => Promise.resolve(),
    } as any;
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result).toEqual(createEmptyAssets());
    expect(mockWarn).toHaveBeenCalledWith('Failed to extract embedded assets', {
      parser: 'EPUBParser',
      error: 'Manifest item must have a valid href',
    });
  });
});

describe('EPUB Parser Asset Extractor - assets with valid href', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  test('should handle assets with valid href only', async () => {
    const manifest = {
      validHref: { href: 'valid.jpg', mediaType: 'image/jpeg' },
    };
    const epub = {
      getManifest: () => Promise.resolve(manifest),
      close: () => Promise.resolve(),
    } as any;
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result.images).toHaveLength(1);
    expect(result.images[0]?.href).toBe('valid.jpg');
    expect(mockWarn).not.toHaveBeenCalled();
  });
});
