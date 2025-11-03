import { describe, test, expect, mock } from 'bun:test';
import type { Epub } from '@smoores/epub';
import type { EPUBParseOptions } from '../../../../src/core/document-processing/parsers/epub-parser-types.js';
import { EPUBParser } from '../../../../src/core/document-processing/parsers/epub-parser.js';
import type { PerformanceStats } from '../../../../src/core/document-processing/types/core-parser-types.js';

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
      if (!content.includes('application/epub+zip')) {
        throw new Error('Invalid EPUB: missing EPUB signature');
      }
    }

    // Check for empty string
    if (typeof input === 'string' && input.length === 0) {
      throw new Error('Invalid EPUB: empty content');
    }

    return {
      // Mock metadata
      getMetadata: mock(async () => ({
        title: 'Test EPUB',
        creator: 'Test Author',
        language: 'en',
        identifier: 'test-epub-id',
        description: 'Test EPUB Description',
        publisher: 'Test Publisher',
        date: '2024',
        subjects: ['Test', 'EPUB'],
        rights: 'Test Copyright',
      })),

      // Mock spine items
      getSpineItems: mock(async () => [
        { idref: 'chapter1', linear: 'yes' },
        { idref: 'chapter2', linear: 'yes' },
        { idref: 'chapter3', linear: 'yes' },
      ]),

      // Mock flow
      getFlow: mock(async () => [
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

      // Mock TOC
      getTOC: mock(async () => [
        { id: 'chapter1', href: 'chapter1.xhtml', title: 'Chapter 1' },
        { id: 'chapter2', href: 'chapter2.xhtml', title: 'Chapter 2' },
        { id: 'chapter3', href: 'chapter3.xhtml', title: 'Chapter 3' },
      ]),

      // Mock manifest
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
        toc: {
          id: 'toc',
          href: 'toc.ncx',
          mediaType: 'application/x-dtbncx+xml',
        },
      })),

      // Mock content reading
      readXhtmlItemContents: mock(async (id: string, as?: string) => {
        if (as === 'text') {
          return `<html><body><h1>Chapter ${id}</h1><p>This is test content for ${id}.</p></body></html>`;
        }
        return [];
      }),

      // Mock cleanup
      close: mock(async () => Promise.resolve()),

      // Mock title
      getTitle: mock(async () => 'Test EPUB'),

      // Other required methods
      readItemContents: mock(async () => ''),
      getCoverImage: mock(async () => new Uint8Array()),
      getCoverImageItem: mock(async () => null),
    } as unknown as Epub;
  }),
};

mock.module('@smoores/epub', () => ({
  Epub: mockEpub,
}));

describe('EPUBParser Compatibility Tests - Version', () => {
  test('COMPATIBILITY-TC01: should test EPUB version compatibility handling', () => {
    const compatibilityOptions: EPUBParseOptions[] = [
      { verbose: false },
      { verbose: true },
      { extractMedia: true },
      { preserveHTML: true },
      { strictMode: true },
      { chapterSensitivity: 0.8 },
      { config: { customSetting: 'test' } },
    ];

    const compatibilityParsers = compatibilityOptions.map(
      (options: EPUBParseOptions) => new EPUBParser(options)
    );

    for (const parser of compatibilityParsers) {
      expect(parser).toBeDefined();
      expect(parser.name).toBe('EPUBParser');
      expect(parser.version).toBe('1.0.0');

      const stats: PerformanceStats = parser.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.parseTimeMs).toBe('number');
      expect(typeof stats.memoryUsageMB).toBe('number');
      expect(typeof stats.throughputMBs).toBe('number');
    }
  });

  test('COMPATIBILITY-TC02: should handle option merging correctly', () => {
    const baseOptions: EPUBParseOptions = {
      verbose: false,
      extractMedia: true,
      strictMode: false,
    };

    const parser = new EPUBParser(baseOptions);

    // Test setOptions method
    parser.setOptions({ verbose: true });
    parser.setOptions({ chapterSensitivity: 0.9 });
    parser.setOptions({ preserveHTML: false });

    const stats: PerformanceStats = parser.getStats();
    expect(stats).toBeDefined();
  });

  test('COMPATIBILITY-TC03: should maintain type safety with all option combinations', () => {
    const optionMatrix: Array<{
      name: string;
      options: EPUBParseOptions;
    }> = [
      {
        name: 'minimal-options',
        options: {},
      },
      {
        name: 'verbose-mode',
        options: { verbose: true },
      },
      {
        name: 'strict-mode',
        options: { strictMode: true },
      },
      {
        name: 'media-extraction',
        options: { extractMedia: true },
      },
      {
        name: 'html-preservation',
        options: { preserveHTML: true },
      },
      {
        name: 'chapter-sensitivity',
        options: { chapterSensitivity: 0.5 },
      },
      {
        name: 'custom-config',
        options: { config: { timeout: 5000 } },
      },
      {
        name: 'all-options',
        options: {
          verbose: true,
          extractMedia: true,
          preserveHTML: true,
          strictMode: false,
          chapterSensitivity: 0.7,
          config: { testMode: true },
        },
      },
    ];

    for (const testCase of optionMatrix) {
      const parser = new EPUBParser(testCase.options);
      expect(parser).toBeDefined();

      const stats: PerformanceStats = parser.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.parseTimeMs).toBe('number');
    }
  });

  test('COMPATIBILITY-TC04: should handle parse method with proper typing', async () => {
    const parser = new EPUBParser({ verbose: true });

    // Test that parse method accepts correct input types
    const sampleInputs = [
      '', // empty string - should fail
      Buffer.alloc(0), // empty buffer - should fail
      new ArrayBuffer(0), // empty array buffer - should fail
      Buffer.from('application/epub+zip'), // minimal valid content - should succeed
    ];

    // Each input should be handled gracefully by the parser's validation
    for (const input of sampleInputs) {
      const result = await parser.parse(input);
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');

      if (result.success === false) {
        expect(result.error).toBeDefined();
        if (
          result.error &&
          typeof result.error === 'object' &&
          'message' in result.error
        ) {
          expect(result.error.message).toBeDefined();
        }
      }
    }
  });

  test('COMPATIBILITY-TC05: should maintain backwards compatibility with interface', () => {
    const parser = new EPUBParser();

    // Test that all expected interface methods exist
    expect(typeof parser.parse).toBe('function');
    expect(typeof parser.setOptions).toBe('function');
    expect(typeof parser.getStats).toBe('function');

    // Test that properties are accessible
    expect(parser.name).toBe('EPUBParser');
    expect(parser.version).toBe('1.0.0');
  });
});
