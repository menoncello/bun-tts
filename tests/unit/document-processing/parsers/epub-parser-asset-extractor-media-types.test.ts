import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { extractEmbeddedAssets } from '../../../../src/core/document-processing/parsers/epub-parser-asset-extractor.js';
import {
  setupMockLogger,
  restoreMockLogger,
  createMockEpub,
  createParseOptions,
  createManifestEntry,
} from './epub-parser-asset-extractor-test-utils';

describe('EPUB Parser Asset Extractor - Image Media Types', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  test('should handle various image media types', async () => {
    const manifest = {
      jpeg: createManifestEntry('images/cover.jpg', 'image/jpeg'),
      png: createManifestEntry('images/icon.png', 'image/png'),
      gif: createManifestEntry('images/animated.gif', 'image/gif'),
      webp: createManifestEntry('images/modern.webp', 'image/webp'),
      svg: createManifestEntry('images/vector.svg', 'image/svg+xml'),
      bmp: createManifestEntry('images/old.bmp', 'image/bmp'),
    };

    const epub = createMockEpub(manifest);
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result.images).toHaveLength(6);
    expect(result.images.map((img) => img.href)).toEqual([
      'images/cover.jpg',
      'images/icon.png',
      'images/animated.gif',
      'images/modern.webp',
      'images/vector.svg',
      'images/old.bmp',
    ]);
    expect(mockWarn).not.toHaveBeenCalled();
  });
});

describe('EPUB Parser Asset Extractor - Font Media Types', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  test('should handle various font media types', async () => {
    const manifest = {
      ttf: createManifestEntry('fonts/main.ttf', 'font/ttf'),
      otf: createManifestEntry('fonts/display.otf', 'font/otf'),
      woff: createManifestEntry('fonts/web.woff', 'font/woff'),
      woff2: createManifestEntry('fonts/web2.woff2', 'font/woff2'),
      eot: createManifestEntry(
        'fonts/legacy.eot',
        'application/vnd.ms-fontobject'
      ),
    };

    const epub = createMockEpub(manifest);
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result.fonts).toHaveLength(5);
    expect(result.fonts.map((font) => font.href)).toEqual([
      'fonts/main.ttf',
      'fonts/display.otf',
      'fonts/web.woff',
      'fonts/web2.woff2',
      'fonts/legacy.eot',
    ]);
    expect(mockWarn).not.toHaveBeenCalled();
  });
});

describe('EPUB Parser Asset Extractor - Audio Media Types', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  test('should handle various audio media types', async () => {
    const manifest = {
      mp3: createManifestEntry('audio/chapter1.mp3', 'audio/mpeg'),
      mp4: createManifestEntry('audio/chapter2.m4a', 'audio/mp4'),
      ogg: createManifestEntry('audio/sound.ogg', 'audio/ogg'),
      wav: createManifestEntry('audio/podcast.wav', 'audio/wav'),
      webm: createManifestEntry('audio/modern.webm', 'audio/webm'),
    };

    const epub = createMockEpub(manifest);
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result.audio).toHaveLength(5);
    expect(result.audio.map((audio) => audio.href)).toEqual([
      'audio/chapter1.mp3',
      'audio/chapter2.m4a',
      'audio/sound.ogg',
      'audio/podcast.wav',
      'audio/modern.webm',
    ]);
    expect(mockWarn).not.toHaveBeenCalled();
  });
});

describe('EPUB Parser Asset Extractor - Video Media Types', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  test('should handle various video media types', async () => {
    const manifest = {
      mp4: createManifestEntry('video/intro.mp4', 'video/mp4'),
      webm: createManifestEntry('video/modern.webm', 'video/webm'),
      ogg: createManifestEntry('video/legacy.ogg', 'video/ogg'),
      quicktime: createManifestEntry('video/apple.mov', 'video/quicktime'),
    };

    const epub = createMockEpub(manifest);
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result.video).toHaveLength(4);
    expect(result.video.map((video) => video.href)).toEqual([
      'video/intro.mp4',
      'video/modern.webm',
      'video/legacy.ogg',
      'video/apple.mov',
    ]);
    expect(mockWarn).not.toHaveBeenCalled();
  });
});

describe('EPUB Parser Asset Extractor - Style Media Types', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  test('should handle various style media types', async () => {
    const manifest = {
      css: createManifestEntry('styles/main.css', 'text/css'),
      scss: createManifestEntry('styles/main.scss', 'text/x-scss'),
      sass: createManifestEntry('styles/main.sass', 'text/x-sass'),
      less: createManifestEntry('styles/main.less', 'text/x-less'),
    };

    const epub = createMockEpub(manifest);
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result.styles).toHaveLength(4);
    expect(result.styles.map((style) => style.href)).toEqual([
      'styles/main.css',
      'styles/main.scss',
      'styles/main.sass',
      'styles/main.less',
    ]);
    expect(mockWarn).not.toHaveBeenCalled();
  });
});

describe('EPUB Parser Asset Extractor - Unrecognized Media Types', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  test('should categorize unrecognized media types as other', async () => {
    const manifest = {
      js: createManifestEntry('scripts/main.js', 'application/javascript'),
      json: createManifestEntry('data/config.json', 'application/json'),
      xml: createManifestEntry('data/metadata.xml', 'application/xml'),
      pdf: createManifestEntry('docs/manual.pdf', 'application/pdf'),
      zip: createManifestEntry('archive/data.zip', 'application/zip'),
    };

    const epub = createMockEpub(manifest);
    const options = createParseOptions(true);

    const result = await extractEmbeddedAssets(epub, options);

    expect(result.other).toHaveLength(5);
    expect(result.other.map((other) => other.href)).toEqual([
      'scripts/main.js',
      'data/config.json',
      'data/metadata.xml',
      'docs/manual.pdf',
      'archive/data.zip',
    ]);
    expect(mockWarn).not.toHaveBeenCalled();
  });
});
