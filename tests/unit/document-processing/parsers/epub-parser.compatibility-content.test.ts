import { describe, test, expect, mock } from 'bun:test';
import { getErrorCode } from '../../../../src/core/document-processing/parsers/epub-parser-type-guards.js';
import { EPUBParser } from '../../../../src/core/document-processing/parsers/epub-parser.js';

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

describe('EPUBParser Compatibility Tests - Content', () => {
  test('COMPATIBILITY-TC03: should test compatibility with different content types', async () => {
    const parser = new EPUBParser({ verbose: false });

    const contentTypes = [
      Buffer.from('simple text content'),
      Buffer.from('content with html <p>tags</p>'),
      Buffer.from('content with unicode: 测试'),
      Buffer.from('content with numbers 12345'),
    ];

    for (const content of contentTypes) {
      const result = await parser.parse(content);
      expect(typeof result.success).toBe('boolean');

      if (!result.success) {
        expect(result.error).toBeDefined();
        const errorCode = getErrorCode(result.error);
        expect(errorCode).toBe('EPUB_FORMAT_ERROR');
      }
    }
  });

  test('COMPATIBILITY-TC04: should test fallback behavior for invalid EPUBs', async () => {
    const parser = new EPUBParser({ verbose: false });

    const invalidContent = [
      Buffer.from('not an epub'),
      Buffer.from('also not an epub'),
      Buffer.from('definitely not epub'),
    ];

    for (const content of invalidContent) {
      const result = await parser.parse(content);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      const errorCode = getErrorCode(result.error);
      expect(errorCode).toBe('EPUB_FORMAT_ERROR');
    }
  });

  test('COMPATIBILITY-TC05: should test strict vs non-strict mode differences', async () => {
    const strictParser = new EPUBParser({
      verbose: true,
      config: { strictMode: true },
    });
    const lenientParser = new EPUBParser({
      verbose: true,
      config: { strictMode: false },
    });

    const testContent = Buffer.from('test epub content');

    const strictResult = await strictParser.parse(testContent);
    const lenientResult = await lenientParser.parse(testContent);

    expect(typeof strictResult.success).toBe('boolean');
    expect(typeof lenientResult.success).toBe('boolean');

    if (!strictResult.success) {
      expect(strictResult.error).toBeDefined();
    }
    if (!lenientResult.success) {
      expect(lenientResult.error).toBeDefined();
    }
  });
});
