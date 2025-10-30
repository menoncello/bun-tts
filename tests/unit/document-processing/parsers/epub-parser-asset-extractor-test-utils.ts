import { spyOn, expect } from 'bun:test';
import { Epub } from '@smoores/epub';
import { extractEmbeddedAssets } from '../../../../src/core/document-processing/parsers/epub-parser-asset-extractor.js';
import type { EPUBParseOptions } from '../../../../src/core/document-processing/parsers/epub-parser-types.js';
import type { EmbeddedAssets } from '../../../../src/core/document-processing/types.js';
import { logger } from '../../../../src/utils/logger.js';

/**
 * Setup mock logger for testing
 */
export function setupMockLogger() {
  const mockWarn = spyOn(logger, 'warn');
  // Reset the mock to ensure test isolation
  mockWarn.mockReset();
  return mockWarn;
}

/**
 * Restore mock logger
 */
export function restoreMockLogger(mockLogger: any) {
  if (mockLogger && typeof mockLogger.mockRestore === 'function') {
    mockLogger.mockRestore();
  }
}

/**
 * Create mock EPUB with basic manifest
 */
export function createMockEpub(manifest: Record<string, any> = {}): Epub {
  return {
    getManifest: () => Promise.resolve(manifest),
    close: () => Promise.resolve(),
  } as unknown as Epub;
}

/**
 * Create mock EPUB that throws an error
 */
export function createErrorMockEpub(error: any): Epub {
  return {
    getManifest: () => Promise.reject(error),
    close: () => Promise.resolve(),
  } as unknown as Epub;
}

/**
 * Create empty EmbeddedAssets object
 */
export function createEmptyAssets(): EmbeddedAssets {
  return {
    images: [],
    styles: [],
    fonts: [],
    other: [],
    audio: [],
    video: [],
  };
}

/**
 * Create basic EPUB parse options
 */
export function createParseOptions(extractMedia = false): EPUBParseOptions {
  return { extractMedia };
}

/**
 * Create mock manifest entry
 */
export function createManifestEntry(
  href: string,
  mediaType: string,
  properties?: string[]
): any {
  const entry: any = { href, mediaType };
  if (properties) {
    entry.properties = properties;
  }
  return entry;
}

/**
 * Create a comprehensive manifest with all asset types
 */
export function createComprehensiveManifest(): Record<string, any> {
  return {
    image1: createManifestEntry('images/cover.jpg', 'image/jpeg'),
    css1: createManifestEntry('styles/main.css', 'text/css'),
    font1: createManifestEntry('fonts/arial.ttf', 'font/ttf'),
    audio1: createManifestEntry('audio/chapter1.mp3', 'audio/mpeg'),
    video1: createManifestEntry('video/intro.mp4', 'video/mp4'),
    script1: createManifestEntry('scripts/main.js', 'application/javascript'),
  };
}

/**
 * Asset validation helper - checks basic asset properties
 */
interface AssetExpectationOptions {
  expectedId: string;
  expectedHref: string;
  expectedMediaType: string;
  expectedType?: string;
}

export function expectAssetStructure(
  asset: any,
  options: AssetExpectationOptions
) {
  const expected: any = {
    id: options.expectedId,
    href: options.expectedHref,
    mediaType: options.expectedMediaType,
    size: 0,
    properties: [],
  };

  expected.type = options.expectedType
    ? options.expectedType
    : expect.any(String);

  expect(asset).toMatchObject(expected);
}

/**
 * Validates image assets
 */
export function expectImageAssets(images: any[], expectedCount = 1) {
  expect(images).toHaveLength(expectedCount);
  if (expectedCount > 0) {
    expectAssetStructure(images[0], {
      expectedId: 'images-cover-jpg',
      expectedHref: 'images/cover.jpg',
      expectedMediaType: 'image/jpeg',
      expectedType: 'image',
    });
  }
}

/**
 * Validates style assets
 */
export function expectStyleAssets(styles: any[], expectedCount = 1) {
  expect(styles).toHaveLength(expectedCount);
  if (expectedCount > 0) {
    expectAssetStructure(styles[0], {
      expectedId: 'styles-main-css',
      expectedHref: 'styles/main.css',
      expectedMediaType: 'text/css',
      expectedType: 'style',
    });
  }
}

/**
 * Validates font assets
 */
export function expectFontAssets(fonts: any[], expectedCount = 1) {
  expect(fonts).toHaveLength(expectedCount);
  if (expectedCount > 0) {
    expectAssetStructure(fonts[0], {
      expectedId: 'fonts-arial-ttf',
      expectedHref: 'fonts/arial.ttf',
      expectedMediaType: 'font/ttf',
      expectedType: 'font',
    });
  }
}

/**
 * Validates audio assets
 */
export function expectAudioAssets(audio: any[], expectedCount = 1) {
  expect(audio).toHaveLength(expectedCount);
  if (expectedCount > 0) {
    expectAssetStructure(audio[0], {
      expectedId: 'audio-chapter1-mp3',
      expectedHref: 'audio/chapter1.mp3',
      expectedMediaType: 'audio/mpeg',
      expectedType: 'audio',
    });
  }
}

/**
 * Validates video assets
 */
export function expectVideoAssets(video: any[], expectedCount = 1) {
  expect(video).toHaveLength(expectedCount);
  if (expectedCount > 0) {
    expectAssetStructure(video[0], {
      expectedId: 'video-intro-mp4',
      expectedHref: 'video/intro.mp4',
      expectedMediaType: 'video/mp4',
      expectedType: 'video',
    });
  }
}

/**
 * Validates other assets
 */
interface OtherAssetsExpectationOptions {
  expectedCount?: number;
  expectedId?: string;
  expectedHref?: string;
  expectedMediaType?: string;
}

export function expectOtherAssets(
  other: any[],
  options: OtherAssetsExpectationOptions = {}
) {
  const {
    expectedCount = 1,
    expectedId = 'scripts-main-js',
    expectedHref = 'scripts/main.js',
    expectedMediaType = 'application/javascript',
  } = options;

  expect(other).toHaveLength(expectedCount);
  if (expectedCount > 0) {
    expectAssetStructure(other[0], {
      expectedId,
      expectedHref,
      expectedMediaType,
      expectedType: 'other',
    });
  }
}

/**
 * Validates comprehensive asset extraction
 */
export function expectComprehensiveAssetExtraction(result: EmbeddedAssets) {
  expectImageAssets(result.images);
  expectStyleAssets(result.styles);
  expectFontAssets(result.fonts);
  expectAudioAssets(result.audio);
  expectVideoAssets(result.video);
  expectOtherAssets(result.other);
}

/**
 * Helper function to test error scenarios
 */
export async function testErrorScenario(
  epub: Epub,
  options: EPUBParseOptions,
  expectedErrorMessage: string,
  mockWarn: any
): Promise<void> {
  const result = await extractEmbeddedAssets(epub, options);

  expect(result).toEqual(createEmptyAssets());
  expect(mockWarn).toHaveBeenCalledWith(
    `Failed to extract embedded assets: ${expectedErrorMessage}`
  );
}

/**
 * Helper function to test asset validation scenarios
 */
export function testAssetValidationScenario(
  manifest: Record<string, any>,
  options: EPUBParseOptions,
  _mockWarn: any
): Promise<EmbeddedAssets> {
  const epub = createMockEpub(manifest);
  return extractEmbeddedAssets(epub, options);
}

/**
 * Creates a manifest with assets missing mediaType
 */
export function createManifestWithoutMediaType(): Record<string, any> {
  return {
    invalid1: { href: 'files/unknown.txt' },
    valid1: { href: 'images/valid.jpg', mediaType: 'image/jpeg' },
  };
}
