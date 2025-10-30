/**
 * EPUB Factory for EPUB Parser Tests
 *
 * Provides factory functions for creating mock EPUB instances
 * to reduce duplication and improve maintainability in tests.
 */

import { Epub } from '@smoores/epub';

/**
 * Factory for creating mock EPUB instances
 */
export class MockEpubFactory {
  static createBasic(): Epub {
    return {
      close: () => Promise.resolve(),
      getTitle: () => Promise.resolve('Test Book Title'),
      getCreators: () =>
        Promise.resolve([
          { name: 'Test Author', role: 'aut' },
          { name: 'Test Contributor', role: 'ctb' },
        ]),
      getLanguage: () => Promise.resolve('en'),
      getPublicationDate: () => Promise.resolve(new Date('2023-01-01')),
      getSubjects: () => Promise.resolve(['Testing', 'EPUB']),
      getType: () => Promise.resolve({ value: 'application/epub+zip' }),
      getMetadata: () =>
        Promise.resolve([
          { type: 'title', value: 'Test Book Title' },
          { type: 'creator', value: 'Test Author' },
          { type: 'contributor', value: 'Test Contributor' },
          { type: 'publisher', value: 'Test Publisher' },
          { type: 'description', value: 'Test description' },
          { type: 'identifier', value: 'test-identifier' },
          { type: 'language', value: 'en' },
          { type: 'date', value: '2023-01-01' },
          { type: 'subject', value: 'Testing' },
          { type: 'subject', value: 'EPUB' },
          { type: 'format', value: 'application/epub+zip' },
          { type: 'source', value: 'test-source' },
          { type: 'relation', value: 'test-relation' },
          { type: 'coverage', value: 'test-coverage' },
          { type: 'rights', value: 'Test Copyright 2023' },
        ]),
      readXhtmlItemContents: (href: string, _format: string) => {
        if (href === 'chapter1.xhtml' || href === 'chapter1') {
          return Promise.resolve('This is the content of chapter 1.');
        }
        if (href === 'chapter2.xhtml' || href === 'chapter2') {
          return Promise.resolve('This is the content of chapter 2.');
        }
        return Promise.resolve('Default content.');
      },
      getSpineItems: () =>
        Promise.resolve([
          { href: 'chapter1.xhtml', id: 'chapter1', linear: true },
          { href: 'chapter2.xhtml', id: 'chapter2', linear: true },
        ]),
      getManifest: () =>
        Promise.resolve([
          {
            href: 'chapter1.xhtml',
            id: 'chapter1',
            mediaType: 'application/xhtml+xml',
            properties: [],
          },
          {
            href: 'chapter2.xhtml',
            id: 'chapter2',
            mediaType: 'application/xhtml+xml',
            properties: [],
          },
          {
            href: 'style.css',
            id: 'style',
            mediaType: 'text/css',
            properties: [],
          },
          {
            href: 'image.jpg',
            id: 'image',
            mediaType: 'image/jpeg',
            properties: [],
          },
        ]),
      getNavigation: () => Promise.resolve([]),
      getToc: () => Promise.resolve([]),
      getNCX: () => Promise.resolve(null),
    } as unknown as Epub;
  }

  static createInvalid(): Epub {
    return {
      close: () => Promise.resolve(),
      getTitle: () => Promise.reject(new Error('Invalid EPUB')),
      getCreators: () => Promise.reject(new Error('Invalid EPUB')),
      getLanguage: () => Promise.reject(new Error('Invalid EPUB')),
      getPublicationDate: () => Promise.reject(new Error('Invalid EPUB')),
      getSubjects: () => Promise.reject(new Error('Invalid EPUB')),
      getType: () => Promise.reject(new Error('Invalid EPUB')),
      getMetadata: () => Promise.reject(new Error('Invalid EPUB')),
      readXhtmlItemContents: () => Promise.reject(new Error('Invalid EPUB')),
      getSpineItems: () => Promise.reject(new Error('Invalid EPUB')),
      getManifest: () => Promise.reject(new Error('Invalid EPUB')),
      getNavigation: () => Promise.reject(new Error('Invalid EPUB')),
      getToc: () => Promise.reject(new Error('Invalid EPUB')),
      getNCX: () => Promise.reject(new Error('Invalid EPUB')),
    } as unknown as Epub;
  }

  static createMinimal(): Epub {
    return {
      close: () => Promise.resolve(),
      getTitle: () => Promise.resolve('Minimal Book'),
      getCreators: () =>
        Promise.resolve([{ name: 'Minimal Author', role: 'aut' }]),
      getLanguage: () => Promise.resolve('en'),
      getPublicationDate: () => Promise.resolve(new Date()),
      getSubjects: () => Promise.resolve([]),
      getType: () => Promise.resolve({ value: 'application/epub+zip' }),
      getMetadata: () =>
        Promise.resolve([
          { type: 'title', value: 'Minimal Book' },
          { type: 'creator', value: 'Minimal Author' },
          { type: 'language', value: 'en' },
        ]),
      readXhtmlItemContents: () => Promise.resolve('<p>Minimal content.</p>'),
      getSpineItems: () =>
        Promise.resolve([
          { href: 'minimal.xhtml', id: 'minimal', linear: true },
        ]),
      getManifest: () =>
        Promise.resolve([
          {
            href: 'minimal.xhtml',
            id: 'minimal',
            mediaType: 'application/xhtml+xml',
            properties: [],
          },
        ]),
      getNavigation: () => Promise.resolve([]),
      getToc: () => Promise.resolve([]),
      getNCX: () => Promise.resolve(null),
    } as unknown as Epub;
  }
}
