import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { getErrorCode } from '../../../../src/core/document-processing/parsers/epub-parser-type-guards.js';
import { EPUBParser } from '../../../../src/core/document-processing/parsers/epub-parser.js';
import {
  setupEPUBParserFixture,
  cleanupEPUBParserFixture,
} from '../../../support/fixtures/epub-parser.fixture.js';

// Mock the Epub module before importing the modules that use it
const mockEpub = {
  from: mock(async (input: any) => {
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
  create: mock(async (options: any) => {
    return createMockEpubInstance(options);
  }),
};

// Mock EPUB instance factory
function createMockEpubInstance(options: any = {}) {
  const defaultMetadata = [
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
    getCreators: mock(async () => [
      { name: options.author || 'Test Author', role: 'author' },
    ]),
    getLanguage: mock(async () => ({ textInfo: { direction: 'ltr' } }) as any),
    getPublicationDate: mock(
      async () => new Date(options.date || '2023-01-01')
    ),
    getSubjects: mock(async () => ['Test Subject']),
    getType: mock(async () => ({
      type: 'book',
      properties: {},
      value: 'book',
    })),
    getMetadata: mock(async () => defaultMetadata),

    // Spine and content methods
    getSpineItems: mock(async () => [
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
    ]),
    readXhtmlItemContents: mock(async (id: string, format?: string) => {
      if (format === 'text') {
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
    getManifest: mock(async () => ({
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
    })),
    getCoverImage: mock(async () => new Uint8Array([1, 2, 3, 4, 5])),
    getCoverImageItem: mock(async () => ({
      id: 'cover',
      href: 'cover.jpg',
      mediaType: 'image/jpeg',
    })),

    // Cleanup method
    close: mock(async () => Promise.resolve()),
  };
}

mock.module('@smoores/epub', () => ({
  Epub: mockEpub,
}));

describe('EPUBParser Error Handling Basic Tests', () => {
  let parser: EPUBParser;
  let fixture: any;

  beforeEach(() => {
    fixture = setupEPUBParserFixture();
    parser = fixture.parser;
  });

  afterEach(async () => {
    await cleanupEPUBParserFixture(fixture);
  });

  test('MUTATION-TC02: should test all error code paths', async () => {
    const nullResult = await parser.parse(null as any);
    expect(nullResult.success).toBe(false);
    const nullErrorCode = getErrorCode(nullResult.error);
    expect(nullErrorCode).toBe('INVALID_INPUT_TYPE');

    const undefinedResult = await parser.parse(undefined as any);
    expect(undefinedResult.success).toBe(false);
    const undefinedErrorCode = getErrorCode(undefinedResult.error);
    expect(undefinedErrorCode).toBe('INVALID_INPUT_TYPE');

    const emptyStringResult = await parser.parse('');
    expect(emptyStringResult.success).toBe(false);
    const emptyStringErrorCode = getErrorCode(emptyStringResult.error);
    expect(emptyStringErrorCode).toBe('INVALID_INPUT');

    const emptyBufferResult = await parser.parse(Buffer.alloc(0));
    expect(emptyBufferResult.success).toBe(false);
    const emptyBufferErrorCode = getErrorCode(emptyBufferResult.error);
    expect(emptyBufferErrorCode).toBe('EPUB_FORMAT_ERROR');
  });
});
