/**
 * EPUB Edge Cases Factory for Test Data
 *
 * Provides factory functions for creating mock EPUB instances
 * with edge cases and special scenarios.
 */

import { Epub } from '@smoores/epub';
import { createMetadataBuilder } from '../../../../../src/core/document-processing/parsers/epub-parser-type-adapter.js';
import { BasicEpubFactory } from './epub-basic.factory.js';

/**
 * Factory for creating edge case EPUB instances
 */
export class EdgeCasesEpubFactory {
  static createWithCustomFields() {
    const customMetadata = createMetadataBuilder()
      .title('Book with Custom Fields')
      .creator('Custom Author')
      .custom('genre', 'Science Fiction')
      .custom('series', 'Test Series')
      .custom('rating', '4.5')
      .build();
    return {
      epub: {
        getTitle: () => Promise.resolve('Book with Custom Fields'),
        getCreators: () =>
          Promise.resolve([{ name: 'Custom Author', role: 'aut' }]),
        getLanguage: () => Promise.resolve('en'),
        getPublicationDate: () => Promise.resolve(new Date('2023-01-01')),
        getSubjects: () => Promise.resolve([]),
        getType: () => Promise.resolve(),
        getMetadata: () => Promise.resolve(customMetadata),
        close: () => Promise.resolve(),
      } as unknown as Epub,
    };
  }

  static createLarge() {
    const largeDescription = 'A'.repeat(10000);
    const largeMetadata = createMetadataBuilder()
      .title('Large Book')
      .creator('Large Author')
      .description(largeDescription)
      .build();
    return {
      epub: {
        getTitle: () => Promise.resolve('Large Book'),
        getCreators: () =>
          Promise.resolve([{ name: 'Large Author', role: 'aut' }]),
        getLanguage: () => Promise.resolve('en'),
        getPublicationDate: () => Promise.resolve(new Date('2023-01-01')),
        getSubjects: () => Promise.resolve([]),
        getType: () => Promise.resolve(),
        getMetadata: () => Promise.resolve(largeMetadata),
        close: () => Promise.resolve(),
      } as unknown as Epub,
    };
  }

  static createInvalidCustomFields() {
    const invalidMetadata = createMetadataBuilder()
      .title('Invalid Custom Fields')
      .creator('Invalid Author')
      .custom('invalid-field', null as any)
      .custom('another-invalid', undefined as any)
      .custom('numeric-field', '123')
      .build();
    return {
      epub: {
        getTitle: () => Promise.resolve('Invalid Custom Fields'),
        getCreators: () =>
          Promise.resolve([{ name: 'Invalid Author', role: 'aut' }]),
        getLanguage: () => Promise.resolve('en'),
        getPublicationDate: () => Promise.resolve(new Date('2023-01-01')),
        getSubjects: () => Promise.resolve([]),
        getType: () => Promise.resolve(),
        getMetadata: () => Promise.resolve(invalidMetadata),
        close: () => Promise.resolve(),
      } as unknown as Epub,
    };
  }

  static createCorrupted() {
    return {
      epub: BasicEpubFactory.createWithError('error'),
    };
  }

  static createWithMalformedDates() {
    const malformedDateMetadata = createMetadataBuilder()
      .title('Malformed Date Book')
      .custom('date', 'invalid-date' as any)
      .custom('published', null as any)
      .build();
    return {
      epub: {
        getTitle: () => Promise.resolve('Malformed Date Book'),
        getCreators: () =>
          Promise.resolve([{ name: 'Date Author', role: 'aut' }]),
        getLanguage: () => Promise.resolve('en'),
        getPublicationDate: () => Promise.resolve(new Date('invalid date')),
        getSubjects: () => Promise.resolve([]),
        getType: () => Promise.resolve(),
        getMetadata: () => Promise.resolve(malformedDateMetadata),
        close: () => Promise.resolve(),
      } as unknown as Epub,
    };
  }

  static createWithNullFields() {
    const nullFieldsMetadata = createMetadataBuilder()
      .title(null as any)
      .creator(null as any)
      .description(null as any)
      .build();
    return {
      epub: {
        getTitle: () => Promise.resolve(null),
        getCreators: () => Promise.resolve(null as any),
        getLanguage: () => Promise.resolve(null),
        getPublicationDate: () => Promise.resolve(null),
        getSubjects: () => Promise.resolve(null),
        getType: () => Promise.resolve(null),
        getMetadata: () => Promise.resolve(nullFieldsMetadata),
        close: () => Promise.resolve(),
      } as unknown as Epub,
    };
  }
}
