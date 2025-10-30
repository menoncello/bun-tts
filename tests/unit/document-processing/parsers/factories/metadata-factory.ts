/**
 * Metadata Factory for EPUB Parser Tests
 *
 * Provides factory functions for creating mock metadata
 * to reduce duplication and improve maintainability in tests.
 */

import type {
  DocumentMetadata,
  TableOfContentsItem,
  EmbeddedAssets,
} from '../../../../../src/core/document-processing/types.js';

/**
 * Factory for creating mock metadata
 */
export class MetadataFactory {
  static createBasic(): DocumentMetadata {
    return {
      title: 'Test Book',
      author: 'Test Author',
      identifier: 'test-book-123',
      publisher: 'Test Publisher',
      description: 'A test book for unit testing',
      date: '2023-01-01',
      wordCount: 1000,
      language: 'en',
      version: '3.0',
      customMetadata: {
        subject: ['Testing', 'EPUB'],
        rights: 'Test Copyright 2023',
        source: 'test-source',
        relation: 'test-relation',
        coverage: 'test-coverage',
        type: 'test-type',
        format: 'application/epub+zip',
        creator: 'Test Creator',
        contributor: 'Test Contributor',
      },
    };
  }

  static createMinimal(): DocumentMetadata {
    return {
      title: 'Minimal Book',
      author: 'Minimal Author',
      wordCount: 100,
      language: 'en',
      customMetadata: {},
    };
  }

  static createWithCustomTitle(title: string): DocumentMetadata {
    return {
      ...this.createBasic(),
      title,
    };
  }
}

/**
 * Factory for creating table of contents items
 */
export class TableOfContentsFactory {
  static createBasic(): TableOfContentsItem {
    return {
      id: 'chapter1',
      title: 'Chapter 1',
      href: 'chapter1.xhtml',
      level: 1,
      children: [],
    };
  }

  static createMultiple(): TableOfContentsItem[] {
    return [
      {
        id: 'chapter1',
        title: 'Chapter 1',
        href: 'chapter1.xhtml',
        level: 1,
        children: [],
      },
      {
        id: 'chapter2',
        title: 'Chapter 2',
        href: 'chapter2.xhtml',
        level: 1,
        children: [],
      },
      {
        id: 'chapter3',
        title: 'Chapter 3',
        href: 'chapter3.xhtml',
        level: 1,
        children: [],
      },
    ];
  }

  static createWithNestedItems(): TableOfContentsItem[] {
    return [
      {
        id: 'chapter1',
        title: 'Chapter 1',
        href: 'chapter1.xhtml',
        level: 1,
        children: [
          {
            id: 'section1-1',
            title: 'Section 1.1',
            href: 'chapter1.xhtml#section1-1',
            level: 2,
            children: [],
          },
          {
            id: 'section1-2',
            title: 'Section 1.2',
            href: 'chapter1.xhtml#section1-2',
            level: 2,
            children: [],
          },
        ],
      },
      {
        id: 'chapter2',
        title: 'Chapter 2',
        href: 'chapter2.xhtml',
        level: 1,
        children: [],
      },
    ];
  }

  static createSingle(): TableOfContentsItem[] {
    return [
      {
        id: 'chapter1',
        title: 'Chapter 1',
        href: 'chapter1.xhtml',
        level: 1,
        children: [],
      },
    ];
  }

  static createEmpty(): TableOfContentsItem[] {
    return [];
  }
}

/**
 * Factory for creating embedded assets
 */
export class EmbeddedAssetsFactory {
  static createBasic(): EmbeddedAssets {
    return {
      images: [],
      styles: [],
      fonts: [],
      audio: [],
      video: [],
      other: [],
    };
  }

  static createWithImages(): EmbeddedAssets {
    return {
      images: [
        {
          id: 'image1',
          href: 'images/cover.jpg',
          mediaType: 'image/jpeg',
          size: 1024,
        },
        {
          id: 'image2',
          href: 'images/figure1.png',
          mediaType: 'image/png',
          size: 2048,
        },
      ],
      styles: [],
      fonts: [],
      audio: [],
      video: [],
      other: [],
    };
  }

  static createWithMixedAssets(): EmbeddedAssets {
    return {
      images: [
        {
          id: 'image1',
          href: 'images/cover.jpg',
          mediaType: 'image/jpeg',
          size: 1024,
        },
      ],
      styles: [
        {
          id: 'style1',
          href: 'styles/main.css',
          mediaType: 'text/css',
          size: 512,
        },
      ],
      fonts: [
        {
          id: 'font1',
          href: 'fonts/regular.ttf',
          mediaType: 'font/ttf',
          size: 2048,
        },
      ],
      audio: [
        {
          id: 'audio1',
          href: 'audio/narration.mp3',
          mediaType: 'audio/mpeg',
          size: 1024000,
        },
      ],
      video: [],
      other: [
        {
          id: 'other1',
          href: 'misc/data.json',
          mediaType: 'application/json',
          size: 256,
        },
      ],
    };
  }
}
