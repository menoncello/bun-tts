/**
 * Complex EPUB Factory for Test Data
 *
 * Provides factory functions for creating mock EPUB instances
 * with complex metadata configurations.
 */

import { Epub } from '@smoores/epub';
import { createMetadataBuilder } from '../../../../../src/core/document-processing/parsers/epub-parser-type-adapter.js';

/**
 * Factory for creating complex mock EPUB instances
 */
export class ComplexEpubFactory {
  static createWithComplexCreators(): Epub {
    const complexMetadata = createMetadataBuilder()
      .title('Complex Book')
      .build();

    return {
      getTitle: () => Promise.resolve('Complex Book'),
      getCreators: () =>
        Promise.resolve([
          { name: 'Primary Author', role: 'aut' },
          { name: 'Contributor', role: 'ctb' },
          { name: 'Editor', role: 'edt' },
          { name: 'Illustrator', role: 'ill' },
        ]),
      getLanguage: () => Promise.resolve('en'),
      getPublicationDate: () => Promise.resolve(),
      getSubjects: () => Promise.resolve([]),
      getType: () => Promise.resolve(),
      getMetadata: () => Promise.resolve(complexMetadata),
      close: () => Promise.resolve(),
    } as unknown as Epub;
  }

  static createObjectLanguage(): Epub {
    const objectLanguageMetadata = createMetadataBuilder()
      .title('Object Language Book')
      .build();

    return {
      getTitle: () => Promise.resolve('Object Language Book'),
      getCreators: () => Promise.resolve([{ name: 'Author', role: 'aut' }]),
      getLanguage: () =>
        Promise.resolve({ code: 'en', name: 'English' } as any),
      getPublicationDate: () => Promise.resolve(),
      getSubjects: () => Promise.resolve([]),
      getType: () => Promise.resolve(),
      getMetadata: () => Promise.resolve(objectLanguageMetadata),
      close: () => Promise.resolve(),
    } as unknown as Epub;
  }

  static createRealWorld(): Epub {
    const realWorldMetadata = createMetadataBuilder()
      .title('The Great Adventure')
      .creator('John Smith')
      .creator('Jane Doe')
      .publisher('Adventure Publishing')
      .identifier('isbn:978-0123456789')
      .description('A thrilling adventure story')
      .rights('© 2023 Adventure Publishing')
      .language('en')
      .date('2023-01-15')
      .subject('Adventure')
      .subject('Fiction')
      .type('novel')
      .format('application/epub+zip')
      .custom('source', 'https://example.com/source')
      .custom('relation', 'https://example.com/relation')
      .custom('coverage', 'Worldwide')
      .build();

    return {
      getTitle: () => Promise.resolve('The Great Adventure'),
      getCreators: () =>
        Promise.resolve([
          { name: 'John Smith', role: 'aut' },
          { name: 'Jane Doe', role: 'aut' },
          { name: 'Editor Name', role: 'edt' },
        ]),
      getLanguage: () => Promise.resolve('en'),
      getPublicationDate: () => Promise.resolve(new Date('2023-01-15')),
      getSubjects: () => Promise.resolve(['Adventure', 'Fiction', 'Thriller']),
      getType: () => Promise.resolve({ value: 'novel', type: 'text' }),
      getMetadata: () => Promise.resolve(realWorldMetadata),
      close: () => Promise.resolve(),
    } as unknown as Epub;
  }

  static createWithUnicode(): Epub {
    const unicodeMetadata = createMetadataBuilder()
      .title('El Libro Español ñoño')
      .creator('José Martínez González')
      .publisher('Editorial América Latina')
      .description('Un libro con caracteres especiales: ñ, á, é, í, ó, ú, ü')
      .rights('© 2023 José Martínez')
      .language('es')
      .subject('Ficción')
      .subject('Literatura')
      .build();

    return {
      getTitle: () => Promise.resolve('El Libro Español ñoño'),
      getCreators: () =>
        Promise.resolve([
          { name: 'José Martínez González', role: 'aut' },
          { name: 'María García López', role: 'aut' },
        ]),
      getLanguage: () => Promise.resolve('es'),
      getPublicationDate: () => Promise.resolve(new Date('2023-01-01')),
      getSubjects: () => Promise.resolve(['Ficción', 'Literatura', 'Novela']),
      getType: () => Promise.resolve({ value: 'novela', type: 'text' }),
      getMetadata: () => Promise.resolve(unicodeMetadata),
      close: () => Promise.resolve(),
    } as unknown as Epub;
  }
}
