import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { extractEmbeddedAssets } from '../../../../src/core/document-processing/parsers/epub-parser-asset-extractor.js';
import {
  setupMockLogger,
  restoreMockLogger,
  createMockEpub,
  createParseOptions,
  createManifestEntry,
} from './epub-parser-asset-extractor-test-utils';

describe('EPUB Parser Asset Extractor - Valid Properties', () => {
  let mockWarn: any;

  beforeEach(() => {
    mockWarn = setupMockLogger();
  });

  afterEach(() => {
    restoreMockLogger(mockWarn);
  });

  describe('cover-image property', () => {
    test('should handle cover-image property correctly', async () => {
      const manifest = {
        coverImage: createManifestEntry('images/cover.jpg', 'image/jpeg', [
          'cover-image',
        ]),
      };

      const epub = createMockEpub(manifest);
      const options = createParseOptions(true);

      const result = await extractEmbeddedAssets(epub, options);

      expect(result.images).toHaveLength(1);
      const coverImage = result.images.find(
        (img) => img.href === 'images/cover.jpg'
      );
      expect(coverImage?.id).toBe('images-cover-jpg');
      expect(mockWarn).not.toHaveBeenCalled();
    });
  });

  describe('nav property', () => {
    test('should handle nav property correctly', async () => {
      const manifest = {
        nav: createManifestEntry('toc/nav.xhtml', 'application/xhtml+xml', [
          'nav',
        ]),
      };

      const epub = createMockEpub(manifest);
      const options = createParseOptions(true);

      const result = await extractEmbeddedAssets(epub, options);

      expect(result.other).toHaveLength(1);
      expect(mockWarn).not.toHaveBeenCalled();
    });
  });

  describe('scripted property', () => {
    test('should handle scripted property correctly', async () => {
      const manifest = {
        scripted: createManifestEntry(
          'scripts/main.js',
          'application/javascript',
          ['scripted']
        ),
      };

      const epub = createMockEpub(manifest);
      const options = createParseOptions(true);

      const result = await extractEmbeddedAssets(epub, options);

      expect(result.other).toHaveLength(1);
      expect(mockWarn).not.toHaveBeenCalled();
    });
  });

  describe('remote-resources property', () => {
    test('should handle remote-resources property correctly', async () => {
      const manifest = {
        remote: createManifestEntry('images/remote.jpg', 'image/jpeg', [
          'remote-resources',
        ]),
      };

      const epub = createMockEpub(manifest);
      const options = createParseOptions(true);

      const result = await extractEmbeddedAssets(epub, options);

      expect(result.images).toHaveLength(1);
      const remoteImage = result.images.find(
        (img) => img.href === 'images/remote.jpg'
      );
      expect(remoteImage?.id).toBe('images-remote-jpg');
      expect(mockWarn).not.toHaveBeenCalled();
    });
  });

  describe('multiple assets with different properties', () => {
    test('should handle multiple assets with different properties', async () => {
      const manifest = {
        coverImage: createManifestEntry('images/cover.jpg', 'image/jpeg', [
          'cover-image',
        ]),
        nav: createManifestEntry('toc/nav.xhtml', 'application/xhtml+xml', [
          'nav',
        ]),
        scripted: createManifestEntry(
          'scripts/main.js',
          'application/javascript',
          ['scripted']
        ),
        remote: createManifestEntry('images/remote.jpg', 'image/jpeg', [
          'remote-resources',
        ]),
      };

      const epub = createMockEpub(manifest);
      const options = createParseOptions(true);

      const result = await extractEmbeddedAssets(epub, options);

      expect(result.images).toHaveLength(2);
      expect(result.other).toHaveLength(2);
      expect(mockWarn).not.toHaveBeenCalled();
    });
  });
});
