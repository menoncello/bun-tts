/**
 * Expected Results Factory for EPUB Parser Tests
 *
 * Provides factory functions for creating expected result objects
 * for validation in EPUB parser tests.
 */

/**
 * Factory for creating expected result objects
 */
export class ExpectedResultFactory {
  /**
   * Creates a standard metadata result with typical book information
   */
  static createStandardMetadataResult() {
    return {
      title: 'Test Book Title',
      author: 'John Doe, Jane Smith',
      language: 'en',
      publisher: 'Test Publisher',
      identifier: 'test-id-123',
      date: '2023-01-01T00:00:00.000Z',
      version: '3.0',
      wordCount: 0,
      customMetadata: {
        description: 'Test description',
        rights: 'Copyright 2023',
        format: 'application/epub+zip',
        subject: 'Fiction, Science Fiction',
        type: 'novel',
      },
    };
  }

  /**
   * Creates a minimal metadata result with basic information only
   */
  static createMinimalMetadataResult() {
    return {
      title: 'Minimal Book',
      author: 'Unknown Author',
      language: 'en',
      publisher: 'Unknown Publisher',
      identifier: '',
      date: undefined,
      version: '3.0',
      wordCount: 0,
      customMetadata: {
        description: '',
        rights: '',
        format: '',
        subject: '',
        type: '',
      },
    };
  }

  /**
   * Creates a fallback metadata result for when parsing fails
   */
  static createFallbackMetadataResult() {
    return {
      title: 'Unknown Title',
      author: 'Unknown Author',
      language: 'en',
      publisher: 'Unknown Publisher',
      identifier: '',
      date: undefined,
      version: '3.0',
      wordCount: 0,
      customMetadata: {},
    };
  }

  /**
   * Creates a result with complex author information including various roles
   */
  static createComplexAuthorsResult() {
    return {
      title: 'Complex Book',
      author: 'Primary Author, Contributor, Editor, Illustrator',
      language: 'en',
      publisher: 'Unknown Publisher',
      identifier: '',
      date: undefined,
      version: '3.0',
      wordCount: 0,
      customMetadata: {
        description: '',
        rights: '',
        format: '',
        subject: '',
        type: '',
      },
    };
  }

  /**
   * Creates a result with malformed language object (edge case testing)
   */
  static createObjectLanguageResult() {
    return {
      title: 'Test Book Title',
      author: 'John Doe, Jane Smith',
      language: '[object Object]',
      publisher: 'Test Publisher',
      identifier: 'test-id-123',
      date: '2023-01-01T00:00:00.000Z',
      version: '3.0',
      wordCount: 0,
      customMetadata: {
        description: 'Test description',
        rights: 'Copyright 2023',
        format: 'application/epub+zip',
        subject: 'Fiction, Science Fiction',
        type: 'novel',
      },
    };
  }

  /**
   * Creates a real-world metadata result with typical published book information
   */
  static createRealWorldResult() {
    return {
      title: 'The Great Adventure',
      author: 'John Smith, Jane Doe, Editor Name',
      language: 'en',
      publisher: 'Adventure Publishing',
      identifier: 'isbn:978-0123456789',
      date: '2023-01-15T00:00:00.000Z',
      version: '3.0',
      wordCount: 0,
      customMetadata: {
        description: 'A thrilling adventure story',
        rights: '© 2023 Adventure Publishing',
        format: 'application/epub+zip',
        subject: 'Adventure, Fiction, Thriller',
        type: 'novel',
      },
    };
  }

  /**
   * Creates a metadata result with Unicode characters and special accented letters
   */
  static createUnicodeResult() {
    return {
      title: 'El Libro Español ñoño',
      author: 'José Martínez González, María García López',
      language: 'es',
      publisher: 'Editorial América Latina',
      identifier: '',
      date: '2023-01-01T00:00:00.000Z',
      version: '3.0',
      wordCount: 0,
      customMetadata: {
        description: 'Un libro con caracteres especiales: ñ, á, é, í, ó, ú, ü',
        rights: '© 2023 José Martínez',
        format: '',
        subject: 'Ficción, Literatura, Novela',
        type: 'novela',
      },
    };
  }

  /**
   * Creates a real-world result - alias for createRealWorldResult
   * @deprecated Use createRealWorldResult instead
   */
  static createRealWorld() {
    return this.createRealWorldResult();
  }

  /**
   * Creates a result with null title - alias for createFallbackMetadataResult
   * @deprecated Use createFallbackMetadataResult instead
   */
  static createNullTitleResult() {
    return this.createFallbackMetadataResult();
  }

  // Additional expected result methods needed by tests
  /**
   * Creates a complete metadata result - alias for createStandardMetadataResult
   * @deprecated Use createStandardMetadataResult instead
   */
  static createComplete() {
    return this.createStandardMetadataResult();
  }

  /**
   * Creates a minimal metadata result - alias for createMinimalMetadataResult
   * @deprecated Use createMinimalMetadataResult instead
   */
  static createMinimal() {
    return this.createMinimalMetadataResult();
  }

  /**
   * Creates an empty result with minimal fallback values
   */
  static createEmpty() {
    return {
      title: 'Unknown Title',
      author: 'Unknown Author',
      language: 'en',
      publisher: 'Unknown Publisher',
      identifier: '',
      date: undefined,
      version: '3.0',
      wordCount: 0,
      customMetadata: {
        description: '',
        format: '',
        rights: '',
        subject: '',
        type: '',
      },
    };
  }

  /**
   * Creates a result with custom fields for testing extensibility
   */
  static createWithCustomFields() {
    return {
      title: 'Book with Custom Fields',
      author: 'Custom Author',
      language: 'en',
      publisher: 'Unknown Publisher',
      identifier: '',
      date: '2023-01-01T00:00:00.000Z',
      version: '3.0',
      wordCount: 0,
      customMetadata: {
        description: '',
        rights: '',
        format: '',
        subject: '',
        type: '',
      },
    };
  }

  /**
   * Creates a result with multiple authors - matches createWithMultipleCreators() factory
   */
  static createMultipleAuthors() {
    return {
      title: 'Book with Multiple Creators',
      author: 'John Doe, Jane Smith, Bob Johnson',
      language: 'en',
      publisher: 'Multi Author Press',
      identifier: 'multi-creator-id-456',
      date: '2023-02-15T00:00:00.000Z',
      version: '3.0',
      wordCount: 0,
      customMetadata: {
        description: '',
        rights: '',
        format: '',
        subject: 'Multi-author, Fiction, Collaboration',
        type: 'novel',
      },
    };
  }

  /**
   * Creates a result with special characters - alias for createUnicodeResult
   * @deprecated Use createUnicodeResult instead
   */
  static createWithSpecialCharacters() {
    return this.createUnicodeResult();
  }

  /**
   * Creates a result with array-based custom fields for testing complex data structures
   */
  static createArrayCustomFields() {
    return {
      title: 'Array Fields Book',
      author: 'Array Author',
      language: 'en',
      publisher: 'Unknown Publisher',
      identifier: '',
      date: '2023-01-01T00:00:00.000Z',
      version: '3.0',
      wordCount: 0,
      customMetadata: {
        description: '',
        rights: '',
        format: '',
        subject: '',
        type: '',
      },
    };
  }

  /**
   * Creates a result with nested custom fields for testing hierarchical data structures
   */
  static createNestedCustomFields() {
    return {
      title: 'Nested Fields Book',
      author: 'Nested Author',
      language: 'en',
      publisher: 'Unknown Publisher',
      identifier: '',
      date: '2023-01-01T00:00:00.000Z',
      version: '3.0',
      wordCount: 0,
      customMetadata: {
        description: '',
        rights: '',
        format: '',
        subject: '',
        type: '',
      },
    };
  }

  // String-based factory methods for author extraction tests

  /**
   * Creates a string with a single author for testing author parsing
   */
  static createSingleAuthorString(): string {
    return 'John Doe';
  }

  /**
   * Creates a string with multiple authors for testing author parsing
   */
  static createMultipleAuthorsString(): string {
    return 'John Doe, Jane Smith';
  }

  /**
   * Creates an empty string for testing missing author scenarios
   */
  static createMissingAuthorsString(): string {
    return '';
  }

  /**
   * Creates a string with authors and roles for testing role parsing
   */
  static createWithRolesString(): string {
    return 'John Doe, Jane Smith';
  }

  /**
   * Creates a string with special characters for testing Unicode handling
   */
  static createWithSpecialCharactersString(): string {
    return 'José Martínez González, María García López';
  }

  /**
   * Creates an empty string for testing edge cases
   */
  static createEmptyString(): string {
    return '';
  }
}
