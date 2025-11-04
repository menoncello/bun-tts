import { describe, test, beforeEach, afterEach, mock } from 'bun:test';
import type {
  Epub,
  ManifestItem,
  DcCreator,
  DcSubject,
  MetadataEntry,
} from '@smoores/epub';
import type { EpubMetadata } from '../../../../src/core/document-processing/parsers/epub-parser-types.js';
import { EPUBParser } from '../../../../src/core/document-processing/parsers/epub-parser.js';
import {
  setupEPUBParserFixture,
  cleanupEPUBParserFixture,
} from '../../../support/fixtures/epub-parser.fixture';
import {
  testDefaultConstructor,
  testCustomConstructor,
  testNullInput,
  testUndefinedInput,
  testEmptyStringInput,
  testEmptyBufferInput,
  testInvalidEPUBContent,
  testSetOptions,
  testGetStats,
  testErrorNormalization,
  testUnknownErrorTypes,
  testExtractMediaOption,
  testPreserveHTMLOption,
  testChapterSensitivityOption,
  testWordCounting,
  testHTMLRemoval,
  testHTMLPreservation,
  testPerformanceStatsUpdate,
  testInterfaceImplementation,
  testMethodSignatures,
} from './epub-parser-test-utils';

// Mock the Epub module before importing the modules that use it
const mockEpub = {
  from: mock(async (input: string | Uint8Array): Promise<Epub> => {
    // Check for empty buffer that should fail EPUB parsing
    if (input && input.length === 0) {
      throw new Error('Invalid EPUB: empty file');
    }

    // Check for invalid EPUB content (buffer/Uint8Array that doesn't start with EPUB magic)
    if (Buffer.isBuffer(input) || input instanceof Uint8Array) {
      // Convert to Buffer for consistent string conversion
      const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
      const content = buffer.toString('utf8', 0, 50); // Read first 50 chars
      if (
        content.includes('This is not a valid EPUB file') ||
        !content.includes('PK')
      ) {
        throw new Error('Invalid EPUB: corrupted format');
      }
    }

    // Check for string input that's clearly invalid
    if (
      typeof input === 'string' &&
      input.includes('This is not a valid EPUB file')
    ) {
      throw new Error('Invalid EPUB: corrupted format');
    }

    // Default success case for valid inputs
    return createMockEpubInstance();
  }),
  create: mock(
    async (
      options?: Partial<{
        title: string;
        author: string;
        language: string;
        publisher: string;
        identifier: string;
        date: string;
      }>
    ): Promise<Epub> => {
      return createMockEpubInstance(options);
    }
  ),
};

// Mock EPUB instance factory
function createMockEpubInstance(
  options: Partial<{
    title: string;
    author: string;
    language: string;
    publisher: string;
    identifier: string;
    date: string;
  }> = {}
): Epub {
  const defaultMetadata: EpubMetadata = [
    { type: 'dc:title', properties: {}, value: options.title || 'Test Book' },
    {
      type: 'dc:creator',
      properties: {},
      value: options.author || 'Test Author',
    },
    { type: 'dc:language', properties: {}, value: options.language || 'en' },
    {
      type: 'dc:publisher',
      properties: {},
      value: options.publisher || 'Test Publisher',
    },
    {
      type: 'dc:identifier',
      properties: {},
      value: options.identifier || 'test-id-123',
    },
    { type: 'dc:date', properties: {}, value: options.date || '2023-01-01' },
  ];

  return {
    // Metadata methods
    getTitle: mock(async () => options.title || 'Test Book'),
    getCreators: mock(
      async (): Promise<DcCreator[]> => [
        { name: options.author || 'Test Author', role: 'author' },
      ]
    ),
    getLanguage: mock(async () => {
      return new Intl.Locale(options.language || 'en');
    }),
    getPublicationDate: mock(
      async () => new Date(options.date || '2023-01-01')
    ),
    getSubjects: mock(
      async (): Promise<Array<string | DcSubject>> => ['Test Subject']
    ),
    getType: mock(
      async (): Promise<MetadataEntry> => ({
        type: 'book',
        properties: {},
        value: 'book',
      })
    ),
    getMetadata: mock(async () => defaultMetadata),

    // Spine and content methods
    getSpineItems: mock(
      async (): Promise<ManifestItem[]> => [
        {
          id: 'chapter1',
          href: 'chapter1.xhtml',
          mediaType: 'application/xhtml+xml',
        },
        {
          id: 'chapter2',
          href: 'chapter2.xhtml',
          mediaType: 'application/xhtml+xml',
        },
        {
          id: 'chapter3',
          href: 'chapter3.xhtml',
          mediaType: 'application/xhtml+xml',
        },
      ]
    ),
    readXhtmlItemContents: mock(async (id: string, as?: string) => {
      if (as === 'text') {
        return `<html><body><h1>Chapter ${id}</h1><p>This is test content for ${id}.</p></body></html>`;
      }
      // Return parsed XML structure (simplified)
      return [
        {
          html: {
            head: [],
            body: [
              { h1: `Chapter ${id}` },
              { p: `This is test content for ${id}.` },
            ],
          },
        },
      ];
    }),
    readItemContents: mock(async (id: string, encoding?: string) => {
      const content = `Test content for ${id}`;
      return encoding === 'utf-8' ? content : new TextEncoder().encode(content);
    }),

    // Manifest and other methods
    getManifest: mock(
      async (): Promise<Record<string, ManifestItem>> => ({
        chapter1: {
          id: 'chapter1',
          href: 'chapter1.xhtml',
          mediaType: 'application/xhtml+xml',
        },
        chapter2: {
          id: 'chapter2',
          href: 'chapter2.xhtml',
          mediaType: 'application/xhtml+xml',
        },
        chapter3: {
          id: 'chapter3',
          href: 'chapter3.xhtml',
          mediaType: 'application/xhtml+xml',
        },
      })
    ),
    getCoverImage: mock(async () => new Uint8Array([1, 2, 3, 4, 5])),
    getCoverImageItem: mock(
      async (): Promise<ManifestItem | null> => ({
        id: 'cover',
        href: 'cover.jpg',
        mediaType: 'image/jpeg',
      })
    ),

    // Cleanup method
    close: mock(async () => Promise.resolve()),
  } as unknown as Epub;
}

mock.module('@smoores/epub', () => ({
  Epub: mockEpub,
}));

describe('EPUBParser Constructor', () => {
  let parser: EPUBParser;
  let fixture: ReturnType<typeof setupEPUBParserFixture>;

  beforeEach(() => {
    fixture = setupEPUBParserFixture();
    parser = fixture.parser;
  });

  afterEach(async () => {
    await cleanupEPUBParserFixture(fixture);
  });

  test('AC1-TC01: should create parser with default options', () => {
    testDefaultConstructor(parser);
  });

  test('AC1-TC02: should accept custom options', () => {
    const customOptions = {
      mode: 'tts' as const,
      extractMedia: false,
      preserveHTML: true,
      chapterSensitivity: 0.9,
    };

    testCustomConstructor(customOptions);
  });
});

describe('EPUBParser Parse Method', () => {
  let parser: EPUBParser;
  let fixture: ReturnType<typeof setupEPUBParserFixture>;

  beforeEach(() => {
    fixture = setupEPUBParserFixture();
    parser = fixture.parser;
  });

  afterEach(async () => {
    await cleanupEPUBParserFixture(fixture);
  });

  test('AC1-TC03: should handle null input', async () => {
    await testNullInput(parser);
  });

  test('AC1-TC04: should handle undefined input', async () => {
    await testUndefinedInput(parser);
  });

  test('AC1-TC05: should handle empty string input', async () => {
    await testEmptyStringInput(parser);
  });

  test('AC1-TC06: should handle empty buffer input', async () => {
    await testEmptyBufferInput(parser);
  });

  test('AC1-TC07: should handle invalid EPUB content', async () => {
    await testInvalidEPUBContent(parser, fixture.mockData.corruptedEPUB);
  });
});

describe('EPUBParser Configuration and Stats', () => {
  let parser: EPUBParser;
  let fixture: ReturnType<typeof setupEPUBParserFixture>;

  beforeEach(() => {
    fixture = setupEPUBParserFixture();
    parser = fixture.parser;
  });

  afterEach(async () => {
    await cleanupEPUBParserFixture(fixture);
  });

  test('AC1-TC08: should update parser options', () => {
    testSetOptions(parser);
  });

  test('AC1-TC09: should return performance statistics', () => {
    testGetStats(parser);
  });
});

describe('EPUBParser Error Handling', () => {
  let parser: EPUBParser;
  let fixture: ReturnType<typeof setupEPUBParserFixture>;

  beforeEach(() => {
    fixture = setupEPUBParserFixture();
    parser = fixture.parser;
  });

  afterEach(async () => {
    await cleanupEPUBParserFixture(fixture);
  });

  test('AC1-TC10: should normalize Error objects to DocumentParseError', async () => {
    await testErrorNormalization(parser, fixture.mockData.corruptedEPUB);
  });

  test('AC1-TC11: should handle unknown error types', async () => {
    await testUnknownErrorTypes(parser, fixture.mockData.corruptedEPUB);
  });
});

describe('EPUBParser Content Processing', () => {
  test('AC3-TC01: should respect extractMedia option', () => {
    testExtractMediaOption();
  });

  test('AC3-TC02: should respect preserveHTML option', () => {
    testPreserveHTMLOption();
  });

  test('AC2-TC01: should respect chapterSensitivity option', () => {
    testChapterSensitivityOption();
  });

  test('AC6-TC01: should count words correctly', () => {
    testWordCounting();
  });

  test('AC6-TC02: should process content with HTML removal when preserveHTML is false', () => {
    testHTMLRemoval();
  });

  test('AC6-TC03: should preserve HTML when preserveHTML is true', () => {
    testHTMLPreservation();
  });
});

describe('EPUBParser Statistics and Interface', () => {
  let parser: EPUBParser;
  let fixture: ReturnType<typeof setupEPUBParserFixture>;

  beforeEach(() => {
    fixture = setupEPUBParserFixture();
    parser = fixture.parser;
  });

  afterEach(async () => {
    await cleanupEPUBParserFixture(fixture);
  });

  test('AC1-TC12: should update performance stats after parsing attempt', async () => {
    await testPerformanceStatsUpdate(parser, fixture.mockData.corruptedEPUB);
  });

  test('AC1-TC13: should implement DocumentParser interface', () => {
    testInterfaceImplementation(parser);
  });

  test('AC1-TC14: should have correct method signatures', () => {
    testMethodSignatures(parser);
  });
});
