import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { extractEmbeddedAssets } from '../../../../src/core/document-processing/parsers/epub-parser-asset-extractor.js';
import {
  setupMockLogger,
  restoreMockLogger,
  createMockEpub,
  createEmptyAssets,
  createParseOptions,
  createComprehensiveManifest,
  expectComprehensiveAssetExtraction,
} from './epub-parser-asset-extractor-test-utils';

describe('EPUB Parser Asset Extractor - extractMedia option handling', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  test('should return empty assets when extractMedia option is false', async () => {
    const epub = createMockEpub();
    const options = createParseOptions(false);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result).toEqual(createEmptyAssets());
  });

  test('should return empty assets when extractMedia option is undefined', async () => {
    const epub = createMockEpub();
    const options = createParseOptions(undefined as any);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result).toEqual(createEmptyAssets());
  });

  test('should return empty assets when options object is empty', async () => {
    const epub = createMockEpub();
    const options = {};

    const result = await extractEmbeddedAssets(epub, options);

    expect(result).toEqual(createEmptyAssets());
  });
});

describe('EPUB Parser Asset Extractor - empty manifest handling', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  test('should handle empty manifest gracefully', async () => {
    const epub = createMockEpub({});
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result).toEqual(createEmptyAssets());
    expect(mockWarn).not.toHaveBeenCalled();
  });
});

describe('EPUB Parser Asset Extractor - image asset extraction', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  test('should extract and categorize image assets from EPUB manifest', async () => {
    const manifest = {
      image1: { href: 'images/cover.jpg', mediaType: 'image/jpeg' },
    };

    const epub = createMockEpub(manifest);
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result.images).toHaveLength(1);
    expect(result.images[0]).toMatchObject({
      id: 'images-cover-jpg',
      href: 'images/cover.jpg',
      mediaType: 'image/jpeg',
      size: 0,
      properties: [],
      type: 'image',
    });
    expect(mockWarn).not.toHaveBeenCalled();
  });
});

describe('EPUB Parser Asset Extractor - style asset extraction', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  test('should extract and categorize style assets from EPUB manifest', async () => {
    const manifest = {
      css1: { href: 'styles/main.css', mediaType: 'text/css' },
    };

    const epub = createMockEpub(manifest);
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result.styles).toHaveLength(1);
    expect(result.styles[0]).toMatchObject({
      id: 'styles-main-css',
      href: 'styles/main.css',
      mediaType: 'text/css',
      size: 0,
      properties: [],
      type: 'style',
    });
    expect(mockWarn).not.toHaveBeenCalled();
  });
});

describe('EPUB Parser Asset Extractor - font asset extraction', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  test('should extract and categorize font assets from EPUB manifest', async () => {
    const manifest = {
      font1: { href: 'fonts/arial.ttf', mediaType: 'font/ttf' },
    };

    const epub = createMockEpub(manifest);
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result.fonts).toHaveLength(1);
    expect(result.fonts[0]).toMatchObject({
      id: 'fonts-arial-ttf',
      href: 'fonts/arial.ttf',
      mediaType: 'font/ttf',
      size: 0,
      properties: [],
      type: 'font',
    });
    expect(mockWarn).not.toHaveBeenCalled();
  });
});

describe('EPUB Parser Asset Extractor - audio asset extraction', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  test('should extract and categorize audio assets from EPUB manifest', async () => {
    const manifest = {
      audio1: { href: 'audio/chapter1.mp3', mediaType: 'audio/mpeg' },
    };

    const epub = createMockEpub(manifest);
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result.audio).toHaveLength(1);
    expect(result.audio[0]).toMatchObject({
      id: 'audio-chapter1-mp3',
      href: 'audio/chapter1.mp3',
      mediaType: 'audio/mpeg',
      size: 0,
      properties: [],
      type: 'audio',
    });
    expect(mockWarn).not.toHaveBeenCalled();
  });
});

describe('EPUB Parser Asset Extractor - video asset extraction', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  test('should extract and categorize video assets from EPUB manifest', async () => {
    const manifest = {
      video1: { href: 'video/intro.mp4', mediaType: 'video/mp4' },
    };

    const epub = createMockEpub(manifest);
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result.video).toHaveLength(1);
    expect(result.video[0]).toMatchObject({
      id: 'video-intro-mp4',
      href: 'video/intro.mp4',
      mediaType: 'video/mp4',
      size: 0,
      properties: [],
      type: 'video',
    });
    expect(mockWarn).not.toHaveBeenCalled();
  });
});

describe('EPUB Parser Asset Extractor - other asset extraction', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  test('should extract and categorize other assets from EPUB manifest', async () => {
    const manifest = {
      script1: { href: 'scripts/main.js', mediaType: 'application/javascript' },
    };

    const epub = createMockEpub(manifest);
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result.other).toHaveLength(1);
    expect(result.other[0]).toMatchObject({
      id: 'scripts-main-js',
      href: 'scripts/main.js',
      mediaType: 'application/javascript',
      size: 0,
      properties: [],
      type: 'other',
    });
    expect(mockWarn).not.toHaveBeenCalled();
  });
});

describe('EPUB Parser Asset Extractor - comprehensive asset extraction', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  test('should extract and categorize comprehensive assets from EPUB manifest', async () => {
    const manifest = createComprehensiveManifest();
    const epub = createMockEpub(manifest);
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expectComprehensiveAssetExtraction(result);
    expect(mockWarn).not.toHaveBeenCalled();
  });
});
