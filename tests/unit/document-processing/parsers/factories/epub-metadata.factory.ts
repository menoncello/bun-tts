/**
 * EPUB Metadata Factory for Test Data
 *
 * Provides factory functions for creating mock EPUB metadata
 * with various configurations and edge cases.
 */

import { Epub } from '@smoores/epub';
import { createMetadataBuilder } from '../../../../../src/core/document-processing/parsers/epub-parser-type-adapter.js';
import type { EpubMetadata } from '../../../../../src/core/document-processing/parsers/epub-parser-types.js';
import { BasicEpubFactory } from './epub-basic.factory.js';
import { ComplexEpubFactory } from './epub-complex.factory.js';
import { EdgeCasesEpubFactory } from './epub-edge-cases.factory.js';

/**
 * Factory for creating metadata test data
 */
export class MetadataTestDataFactory {
  static createStandardMetadata(): EpubMetadata {
    return createMetadataBuilder()
      .description('This is a test book')
      .rights('Copyright 2023 Test Author')
      .format('application/epub+zip')
      .title('Test Title')
      .build();
  }

  static createMinimalMetadata(): EpubMetadata {
    return createMetadataBuilder()
      .title('Test Title')
      .creator('Test Author')
      .build();
  }

  static createEmptyMetadata(): EpubMetadata {
    return [];
  }

  static createMetadataWithUndefinedValues(): EpubMetadata {
    return createMetadataBuilder()
      .custom('description', 'Test description')
      .custom('rights', 'Test rights', null as any)
      .custom('format', '')
      .build();
  }

  static createMultipleEntriesMetadata(): EpubMetadata {
    return [
      ...createMetadataBuilder()
        .description('First description')
        .rights('Copyright notice')
        .build(),
      ...createMetadataBuilder().description('Second description').build(),
    ];
  }

  static createMetadataWithNonStringValues(): EpubMetadata {
    return createMetadataBuilder()
      .custom('description', { text: 'Object description' } as any)
      .custom('rights', 12345 as any)
      .custom('format', true as any)
      .build();
  }

  // Complete test data factories
  static createComplete() {
    return {
      epub: BasicEpubFactory.createStandard(),
    };
  }

  static createMinimal() {
    return {
      epub: BasicEpubFactory.createMinimal(),
    };
  }

  static createEmpty() {
    return {
      epub: BasicEpubFactory.createNullTitle(),
    };
  }

  static createMissingRequired() {
    const incompleteMetadata = createMetadataBuilder().build();
    return {
      epub: {
        getTitle: () => Promise.resolve('Incomplete Book'),
        getCreators: () => Promise.resolve([]),
        getLanguage: () => Promise.resolve(),
        getPublicationDate: () => Promise.resolve(),
        getSubjects: () => Promise.resolve([]),
        getType: () => Promise.resolve(),
        getMetadata: () => Promise.resolve(incompleteMetadata),
        close: () => Promise.resolve(),
      } as unknown as Epub,
    };
  }

  static createMalformed() {
    const malformedMetadata = createMetadataBuilder()
      .title('Malformed Book')
      .creator('')
      .custom('invalid-number', 123 as any)
      .build();
    return {
      epub: {
        getTitle: () => Promise.resolve('Malformed Book'),
        getCreators: () =>
          Promise.resolve([
            { name: '', role: 'aut' },
            { name: null, role: 'aut' },
            { name: undefined, role: 'aut' },
          ]),
        getLanguage: () => Promise.resolve(),
        getPublicationDate: () => Promise.resolve(),
        getSubjects: () => Promise.resolve([]),
        getType: () => Promise.resolve(),
        getMetadata: () => Promise.resolve(malformedMetadata),
        close: () => Promise.resolve(),
      } as unknown as Epub,
    };
  }

  // Additional methods needed by tests
  static createWithCustomFields() {
    return EdgeCasesEpubFactory.createWithCustomFields();
  }

  static createMultipleAuthors() {
    return {
      epub: BasicEpubFactory.createWithMultipleCreators(),
    };
  }

  static createWithSpecialCharacters() {
    return {
      epub: ComplexEpubFactory.createWithUnicode(),
    };
  }

  static createRealWorld() {
    return {
      epub: ComplexEpubFactory.createRealWorld(),
    };
  }

  static createCorrupted() {
    return {
      epub: BasicEpubFactory.createWithError('error'),
    };
  }

  static createLarge() {
    return EdgeCasesEpubFactory.createLarge();
  }

  static createArrayCustomFields() {
    const arrayMetadata = createMetadataBuilder()
      .title('Array Fields Book')
      .creator('Array Author')
      .custom('tags', JSON.stringify(['fiction', 'science', 'adventure']))
      .custom('categories', JSON.stringify(['literature', 'contemporary']))
      .build();
    return {
      epub: {
        getTitle: () => Promise.resolve('Array Fields Book'),
        getCreators: () =>
          Promise.resolve([{ name: 'Array Author', role: 'aut' }]),
        getLanguage: () => Promise.resolve('en'),
        getPublicationDate: () => Promise.resolve(new Date('2023-01-01')),
        getSubjects: () => Promise.resolve([]),
        getType: () => Promise.resolve(),
        getMetadata: () => Promise.resolve(arrayMetadata),
        close: () => Promise.resolve(),
      } as unknown as Epub,
    };
  }

  static createNestedCustomFields() {
    const nestedMetadata = createMetadataBuilder()
      .title('Nested Fields Book')
      .creator('Nested Author')
      .custom(
        'publisher',
        JSON.stringify({
          name: 'Test Publisher',
          location: 'New York',
          established: 2000,
        })
      )
      .custom(
        'series',
        JSON.stringify({
          title: 'Test Series',
          number: 3,
          total: 5,
        })
      )
      .build();
    return {
      epub: {
        getTitle: () => Promise.resolve('Nested Fields Book'),
        getCreators: () =>
          Promise.resolve([{ name: 'Nested Author', role: 'aut' }]),
        getLanguage: () => Promise.resolve('en'),
        getPublicationDate: () => Promise.resolve(new Date('2023-01-01')),
        getSubjects: () => Promise.resolve([]),
        getType: () => Promise.resolve(),
        getMetadata: () => Promise.resolve(nestedMetadata),
        close: () => Promise.resolve(),
      } as unknown as Epub,
    };
  }
}
