/**
 * Basic EPUB Factory for Test Data
 *
 * Provides factory functions for creating basic mock EPUB instances
 * with standard metadata configurations.
 */

import { Epub } from '@smoores/epub';
import { createMetadataBuilder } from '../../../../../src/core/document-processing/parsers/epub-parser-type-adapter.js';

/**
 * Factory for creating basic mock EPUB instances
 */
export class BasicEpubFactory {
  static createStandard(): Epub {
    const mockMetadata = createMetadataBuilder()
      .title('Test Book Title')
      .creator('John Doe')
      .publisher('Test Publisher')
      .identifier('test-id-123')
      .description('Test description')
      .rights('Copyright 2023')
      .format('application/epub+zip')
      .build();

    return {
      getTitle: () => Promise.resolve('Test Book Title'),
      getCreators: () =>
        Promise.resolve([
          { name: 'John Doe', role: 'aut' },
          { name: 'Jane Smith', role: 'aut' },
        ]),
      getLanguage: () => Promise.resolve('en'),
      getPublicationDate: () => Promise.resolve(new Date('2023-01-01')),
      getSubjects: () => Promise.resolve(['Fiction', 'Science Fiction']),
      getType: () => Promise.resolve({ value: 'novel', type: 'text' }),
      getMetadata: () => Promise.resolve(mockMetadata),
      close: () => Promise.resolve(),
    } as unknown as Epub;
  }

  static createMinimal(): Epub {
    const minimalMetadata = createMetadataBuilder()
      .title('Minimal Book')
      .build();

    return {
      getTitle: () => Promise.resolve('Minimal Book'),
      getCreators: () => Promise.resolve([]),
      getLanguage: () => Promise.resolve(),
      getPublicationDate: () => Promise.resolve(),
      getSubjects: () => Promise.resolve([]),
      getType: () => Promise.resolve(),
      getMetadata: () => Promise.resolve(minimalMetadata),
      close: () => Promise.resolve(),
    } as unknown as Epub;
  }

  static createWithError(errorType: 'string' | 'null' | 'error'): Epub {
    let errorValue: string | null | Error;

    if (errorType === 'string') {
      errorValue = 'String error';
    } else if (errorType === 'null') {
      errorValue = null;
    } else {
      errorValue = new Error('EPUB read error');
    }

    return {
      getTitle: () => Promise.reject(errorValue),
      close: () => Promise.resolve(),
    } as unknown as Epub;
  }

  static createWithMultipleCreators(): Epub {
    const mockMetadata = createMetadataBuilder()
      .title('Book with Multiple Creators')
      .creator('John Doe', { role: 'aut' })
      .creator('Jane Smith', { role: 'aut' })
      .creator('Bob Johnson', { role: 'edt' })
      .publisher('Multi Author Press')
      .identifier('multi-creator-id-456')
      .build();

    return {
      getTitle: () => Promise.resolve('Book with Multiple Creators'),
      getCreators: () =>
        Promise.resolve([
          { name: 'John Doe', role: 'aut' },
          { name: 'Jane Smith', role: 'aut' },
          { name: 'Bob Johnson', role: 'edt' },
        ]),
      getLanguage: () => Promise.resolve('en'),
      getPublicationDate: () => Promise.resolve(new Date('2023-02-15')),
      getSubjects: () =>
        Promise.resolve(['Multi-author', 'Fiction', 'Collaboration']),
      getType: () => Promise.resolve({ value: 'novel', type: 'text' }),
      getMetadata: () => Promise.resolve(mockMetadata),
      close: () => Promise.resolve(),
    } as unknown as Epub;
  }

  static createNullTitle(): Epub {
    const nullTitleMetadata = createMetadataBuilder()
      .title(null as any)
      .build();

    return {
      getTitle: () => Promise.resolve(null),
      getCreators: () => Promise.resolve([]),
      getLanguage: () => Promise.resolve(),
      getPublicationDate: () => Promise.resolve(),
      getSubjects: () => Promise.resolve([]),
      getType: () => Promise.resolve(),
      getMetadata: () => Promise.resolve(nullTitleMetadata),
      close: () => Promise.resolve(),
    } as unknown as Epub;
  }
}
