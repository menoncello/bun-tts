/**
 * Test Data Factory for EPUB Parser Utils Assets Tests
 *
 * Provides factory functions for creating mock manifest items and test data
 * to reduce duplication and improve maintainability in utils assets tests.
 */

import type { EmbeddedAssets } from '../../../../src/core/document-processing/types.js';

/**
 * Factory for creating manifest items
 */
export class ManifestItemFactory {
  static createImage(id?: string, href?: string): any {
    return {
      id: id || 'cover-image',
      href: href || 'images/cover.jpg',
      mediaType: 'image/jpeg',
      properties: [],
    };
  }

  static createCSS(id?: string, href?: string): any {
    return {
      id: id || 'main-style',
      href: href || 'styles/main.css',
      mediaType: 'text/css',
      properties: [],
    };
  }

  static createFont(id?: string, href?: string): any {
    return {
      id: id || 'main-font',
      href: href || 'fonts/arial.ttf',
      mediaType: 'font/ttf',
      properties: [],
    };
  }

  static createAudio(id?: string, href?: string): any {
    return {
      id: id || 'chapter-audio',
      href: href || 'audio/chapter1.mp3',
      mediaType: 'audio/mpeg',
      properties: [],
    };
  }

  static createVideo(id?: string, href?: string): any {
    return {
      id: id || 'intro-video',
      href: href || 'videos/intro.mp4',
      mediaType: 'video/mp4',
      properties: [],
    };
  }

  static createUnknown(id?: string, href?: string): any {
    return {
      id: id || 'unknown-file',
      href: href || 'data/custom.xyz',
      mediaType: 'application/unknown',
      properties: [],
    };
  }

  static createWithProperties(properties?: string[]): any {
    return {
      id: 'nav-item',
      href: 'nav.xhtml',
      mediaType: 'application/xhtml+xml',
      properties: properties || ['nav', 'cover-image'],
    };
  }

  static createIncomplete(field?: 'id' | 'href' | 'mediaType'): any {
    const base = {
      id: 'test',
      href: 'test.jpg',
      mediaType: 'image/jpeg',
    };

    if (field) {
      delete (base as any)[field];
    }

    return base;
  }

  static createNull(): any {
    return null;
  }

  static createUndefined(): any {
    return undefined;
  }
}

/**
 * Factory for creating assets
 */
export class AssetFactory {
  static createImage(id?: string, href?: string): any {
    return {
      id: id || 'cover.jpg',
      href: href || 'images/cover.jpg',
      mediaType: 'image/jpeg',
      size: 1024,
    };
  }

  static createCSS(id?: string, href?: string): any {
    return {
      id: id || 'main.css',
      href: href || 'styles/main.css',
      mediaType: 'text/css',
      size: 2048,
    };
  }

  static createFont(id?: string, href?: string): any {
    return {
      id: id || 'arial.ttf',
      href: href || 'fonts/arial.ttf',
      mediaType: 'font/ttf',
      size: 512,
    };
  }

  static createAudio(id?: string, href?: string): any {
    return {
      id: id || 'chapter1.mp3',
      href: href || 'audio/chapter1.mp3',
      mediaType: 'audio/mpeg',
      size: 1024000,
    };
  }

  static createVideo(id?: string, href?: string): any {
    return {
      id: id || 'intro.mp4',
      href: href || 'videos/intro.mp4',
      mediaType: 'video/mp4',
      size: 2048000,
    };
  }

  static createOther(id?: string, href?: string): any {
    return {
      id: id || 'data.xml',
      href: href || 'data/data.xml',
      mediaType: 'application/xml',
      size: 4096,
    };
  }

  static createWithOrder(order: number): any {
    return {
      id: `image${order}.jpg`,
      href: `images/image${order}.jpg`,
      mediaType: 'image/jpeg',
      size: 1024 * order,
    };
  }

  static createNull(): any {
    return null;
  }

  static createUndefined(): any {
    return undefined;
  }
}

/**
 * Factory for creating empty assets
 */
export class EmptyAssetsFactory {
  static create(): EmbeddedAssets {
    return {
      images: [],
      styles: [],
      fonts: [],
      other: [],
      audio: [],
      video: [],
    };
  }
}

/**
 * Factory for creating image type test cases
 */
export class ImageTypeTestFactory {
  static createAllTypes(): any[] {
    return [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ].map((mediaType, _index) => ({
      id: `image-${mediaType.split('/')[1]}`,
      href: `images/test.${mediaType.split('/')[1]}`,
      mediaType,
      properties: [],
    }));
  }
}

/**
 * Factory for creating font type test cases
 */
export class FontTypeTestFactory {
  static createAllTypes(): any[] {
    return [
      'font/ttf',
      'font/otf',
      'font/woff',
      'font/woff2',
      'application/font-sfnt',
      'application/x-font-ttf',
    ].map((mediaType, _index) => ({
      id: `font-${mediaType.split('/').pop()}`,
      href: `fonts/test.${mediaType.split('/').pop()}`,
      mediaType,
      properties: [],
    }));
  }
}

/**
 * Factory for creating incomplete items test cases
 */
export class IncompleteItemsFactory {
  static createAll(): any[] {
    return [{ id: 'test' }, { href: 'test.jpg' }, { mediaType: 'image/jpeg' }];
  }
}

/**
 * Factory for creating expected results
 */
export class ExpectedResultFactory {
  static createAssetFromManifest(manifestItem: any): any {
    return {
      id: manifestItem.id,
      href: manifestItem.href,
      mediaType: manifestItem.mediaType,
      type: this.getAssetType(manifestItem.mediaType),
      size: 0,
      properties: manifestItem.properties || [],
    };
  }

  private static getAssetType(mediaType: string): string {
    if (mediaType.startsWith('image/')) return 'image';
    if (mediaType.startsWith('text/css')) return 'style';
    if (mediaType.startsWith('font/') || mediaType.includes('font'))
      return 'font';
    if (mediaType.startsWith('audio/')) return 'audio';
    if (mediaType.startsWith('video/')) return 'video';
    return 'other';
  }

  static createEmptyAssets(): EmbeddedAssets {
    return EmptyAssetsFactory.create();
  }

  static createEmptyMutableAssets(): EmbeddedAssets {
    return EmptyAssetsFactory.create();
  }
}

/**
 * Factory for creating parameterized test data
 */
export class ParameterizedTestFactory {
  static createManifestItemsWithDifferentTypes(): Array<{
    input: any;
    expectedType: string;
    description: string;
  }> {
    return [
      {
        input: ManifestItemFactory.createImage(),
        expectedType: 'image',
        description: 'image/jpeg',
      },
      {
        input: ManifestItemFactory.createCSS(),
        expectedType: 'style',
        description: 'text/css',
      },
      {
        input: ManifestItemFactory.createFont(),
        expectedType: 'font',
        description: 'font/ttf',
      },
      {
        input: ManifestItemFactory.createAudio(),
        expectedType: 'audio',
        description: 'audio/mpeg',
      },
      {
        input: ManifestItemFactory.createVideo(),
        expectedType: 'video',
        description: 'video/mp4',
      },
      {
        input: ManifestItemFactory.createUnknown(),
        expectedType: 'other',
        description: 'application/unknown',
      },
    ];
  }

  static createImageTypes(): Array<{
    input: any;
    description: string;
  }> {
    return ImageTypeTestFactory.createAllTypes().map((item) => ({
      input: item,
      description: `image type: ${item.mediaType}`,
    }));
  }

  static createFontTypes(): Array<{
    input: any;
    description: string;
  }> {
    return FontTypeTestFactory.createAllTypes().map((item) => ({
      input: item,
      description: `font type: ${item.mediaType}`,
    }));
  }

  static createInvalidInputs(): Array<{
    input: any;
    description: string;
  }> {
    return [
      { input: ManifestItemFactory.createNull(), description: 'null' },
      {
        input: ManifestItemFactory.createUndefined(),
        description: 'undefined',
      },
      {
        input: ManifestItemFactory.createIncomplete('id'),
        description: 'missing href',
      },
      {
        input: ManifestItemFactory.createIncomplete('href'),
        description: 'missing mediaType',
      },
      {
        input: ManifestItemFactory.createIncomplete('mediaType'),
        description: 'missing id',
      },
    ];
  }
}
