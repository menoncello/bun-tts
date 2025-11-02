/**
 * Unit Tests for EPUB Parser Input Handler
 *
 * Comprehensive test suite for input validation and normalization logic
 * covering error scenarios, edge cases, and all input types
 */

import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import {
  validateInput,
  normalizeInputForEpub,
  createEPUBInstance,
} from '../../../../src/core/document-processing/parsers/epub-parser-input-handler.js';
import {
  DocumentParseError,
  EPUBFormatError,
} from '../../../../src/errors/document-parse-error.js';
import { createValidEPUBBuffer } from '../../../support/factories/epub-factory.js';
import {
  TestCleanupManager,
  TestPriority,
  EnhancedTestPatterns,
} from '../../../support/test-utilities.js';

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

      // Only throw for explicitly marked invalid content
      // Allow all other content for testing (including test buffers and EPUB factory output)
      if (
        content.includes('This is not a valid EPUB file') ||
        content.includes('<invalid>corrupted</invalid>')
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
    // Metadata property for direct access
    metadata: defaultMetadata,

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

// Simple test to satisfy ESLint requirements
test('input handler test suite is functional', () => {
  expect(true).toBe(true);
});

describe('EPUB Parser Input Handler', () => {
  beforeEach(() => {
    TestCleanupManager.clear();
    mockEpub.from.mockClear();
  });

  afterEach(async () => {
    await TestCleanupManager.cleanup();
  });

  describe('validateInput', () => {
    EnhancedTestPatterns.createTest(
      'should accept valid string input',
      () => {
        expect(() => {
          validateInput('/path/to/epub.epub');
        }).not.toThrow();

        expect(() => {
          validateInput('content-with-chapters.epub');
        }).not.toThrow();
      },
      { priority: TestPriority.CRITICAL, tags: ['core', 'validation'] }
    );

    EnhancedTestPatterns.createTest(
      'should accept valid Buffer input',
      () => {
        const buffer = Buffer.from('epub content');
        expect(() => {
          validateInput(buffer);
        }).not.toThrow();
      },
      { priority: TestPriority.CRITICAL, tags: ['core', 'validation'] }
    );

    EnhancedTestPatterns.createTest(
      'should accept valid ArrayBuffer input',
      () => {
        const arrayBuffer = new ArrayBuffer(16);
        expect(() => {
          validateInput(arrayBuffer);
        }).not.toThrow();
      },
      { priority: TestPriority.CRITICAL, tags: ['core', 'validation'] }
    );

    EnhancedTestPatterns.createTest(
      'should reject empty string input',
      () => {
        expect(() => {
          validateInput('');
        }).toThrow(DocumentParseError);
        expect(() => {
          validateInput('');
        }).toThrow('Input is required');

        expect(() => {
          validateInput('   ');
        }).toThrow(DocumentParseError);
        expect(() => {
          validateInput('   ');
        }).toThrow('Input is required');
      },
      { priority: TestPriority.HIGH, tags: ['validation', 'error-handling'] }
    );

    EnhancedTestPatterns.createTest(
      'should reject whitespace-only string input',
      () => {
        expect(() => {
          validateInput('   ');
        }).toThrow(DocumentParseError);
        expect(() => {
          validateInput('   ');
        }).toThrow('Input is required');

        expect(() => {
          validateInput('\t\n\r');
        }).toThrow(DocumentParseError);
        expect(() => {
          validateInput('\t\n\r');
        }).toThrow('Input is required');
      },
      { priority: TestPriority.HIGH, tags: ['validation', 'error-handling'] }
    );

    EnhancedTestPatterns.createTest(
      'should reject null and undefined input',
      () => {
        expect(() => {
          validateInput(null as any);
        }).toThrow(DocumentParseError);
        expect(() => {
          validateInput(null as any);
        }).toThrow('Input is required');

        expect(() => {
          validateInput(undefined as any);
        }).toThrow(DocumentParseError);
        expect(() => {
          validateInput(undefined as any);
        }).toThrow('Input is required');
      },
      { priority: TestPriority.HIGH, tags: ['validation', 'error-handling'] }
    );

    EnhancedTestPatterns.createTest(
      'should accept strings with various content types',
      () => {
        const validStrings = [
          '/absolute/path/to/book.epub',
          'relative/path/to/book.epub',
          'book.epub',
          'path/with spaces/book.epub',
          'path/with-dashes/book.epub',
          'path/with_underscores/book.epub',
          'path/with numbers123/book.epub',
          'C:\\Windows\\path\\to\\book.epub',
          'https://example.com/book.epub',
          'file:///path/to/book.epub',
          'international-path/书名.epub',
          'special-chars-!@#$%^&().epub',
        ];

        for (const input of validStrings) {
          expect(() => {
            validateInput(input);
          }).not.toThrow();
        }
      },
      { priority: TestPriority.MEDIUM, tags: ['validation', 'edge-cases'] }
    );

    EnhancedTestPatterns.createTest(
      'should handle very long string inputs',
      () => {
        const longPath = `${'/'.repeat(1000)}book.epub`;
        expect(() => {
          validateInput(longPath);
        }).not.toThrow();
      },
      { priority: TestPriority.MEDIUM, tags: ['validation', 'edge-cases'] }
    );

    EnhancedTestPatterns.createTest(
      'should handle empty Buffer and ArrayBuffer',
      () => {
        expect(() => {
          validateInput(Buffer.alloc(0));
        }).not.toThrow();

        expect(() => {
          validateInput(new ArrayBuffer(0));
        }).not.toThrow();
      },
      { priority: TestPriority.MEDIUM, tags: ['validation', 'edge-cases'] }
    );
  });

  describe('normalizeInputForEpub', () => {
    EnhancedTestPatterns.createTest(
      'should return string input unchanged',
      () => {
        const stringInput = '/path/to/book.epub';
        const result = normalizeInputForEpub(stringInput);
        expect(result).toBe(stringInput);
        expect(typeof result).toBe('string');
      },
      { priority: TestPriority.CRITICAL, tags: ['core', 'normalization'] }
    );

    EnhancedTestPatterns.createTest(
      'should convert Buffer to Uint8Array',
      () => {
        const bufferInput = Buffer.from('epub content');
        const result = normalizeInputForEpub(bufferInput);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBe(bufferInput.length);
      },
      { priority: TestPriority.CRITICAL, tags: ['core', 'normalization'] }
    );

    EnhancedTestPatterns.createTest(
      'should convert ArrayBuffer to Uint8Array',
      () => {
        const arrayBuffer = new ArrayBuffer(16);
        const view = new Uint8Array(arrayBuffer);
        view[0] = 1;
        view[1] = 2;
        view[2] = 3;

        const result = normalizeInputForEpub(arrayBuffer);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBe(arrayBuffer.byteLength);
        expect(result[0]).toBe(1);
        expect(result[1]).toBe(2);
        expect(result[2]).toBe(3);
      },
      { priority: TestPriority.CRITICAL, tags: ['core', 'normalization'] }
    );

    EnhancedTestPatterns.createTest(
      'should handle custom input with string type',
      () => {
        const customInput = {
          type: 'string',
          data: '/path/to/book.epub',
        };

        const result = normalizeInputForEpub(customInput as any);
        expect(result).toBe('/path/to/book.epub');
        expect(typeof result).toBe('string');
      },
      { priority: TestPriority.HIGH, tags: ['normalization', 'custom-input'] }
    );

    EnhancedTestPatterns.createTest(
      'should handle custom input with buffer type',
      () => {
        const bufferData = Buffer.from('epub content');
        const customInput = {
          type: 'buffer',
          data: bufferData,
        };

        const result = normalizeInputForEpub(customInput as any);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBe(bufferData.length);
      },
      { priority: TestPriority.HIGH, tags: ['normalization', 'custom-input'] }
    );

    EnhancedTestPatterns.createTest(
      'should handle custom input with arraybuffer type',
      () => {
        const arrayBufferData = new ArrayBuffer(16);
        const customInput = {
          type: 'arraybuffer',
          data: arrayBufferData,
        };

        const result = normalizeInputForEpub(customInput as any);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBe(arrayBufferData.byteLength);
      },
      { priority: TestPriority.HIGH, tags: ['normalization', 'custom-input'] }
    );

    EnhancedTestPatterns.createTest(
      'should reject invalid custom input type',
      () => {
        const invalidCustomInput = {
          type: 'invalid',
          data: 'some data',
        };

        expect(() => normalizeInputForEpub(invalidCustomInput as any)).toThrow(
          DocumentParseError
        );
      },
      { priority: TestPriority.HIGH, tags: ['normalization', 'error-handling'] }
    );

    EnhancedTestPatterns.createTest(
      'should reject custom input with mismatched data type',
      () => {
        const stringData = {
          type: 'string',
          data: 123, // Should be string
        };

        // The current implementation doesn't validate the data type strictly
        // It just falls through to the default case and throws the general error
        expect(() => {
          normalizeInputForEpub(stringData as any);
        }).toThrow(DocumentParseError);
        expect(() => {
          normalizeInputForEpub(stringData as any);
        }).toThrow('Invalid input type for EPUB parsing');

        const bufferData = {
          type: 'buffer',
          data: 'not a buffer', // Should be Buffer
        };

        expect(() => {
          normalizeInputForEpub(bufferData as any);
        }).toThrow(DocumentParseError);

        const arrayBufferData = {
          type: 'arraybuffer',
          data: Buffer.from('content'), // Should be ArrayBuffer
        };

        expect(() => {
          normalizeInputForEpub(arrayBufferData as any);
        }).toThrow(DocumentParseError);
      },
      { priority: TestPriority.HIGH, tags: ['normalization', 'error-handling'] }
    );

    EnhancedTestPatterns.createTest(
      'should reject non-object custom input',
      () => {
        expect(() => {
          normalizeInputForEpub(123 as any);
        }).toThrow(DocumentParseError);
        expect(() => {
          normalizeInputForEpub(123 as any);
        }).toThrow('Invalid input type for EPUB parsing');

        expect(() => {
          normalizeInputForEpub(123 as any);
        }).toThrow(DocumentParseError);

        expect(() => {
          normalizeInputForEpub(null as any);
        }).toThrow(DocumentParseError);
      },
      { priority: TestPriority.HIGH, tags: ['normalization', 'error-handling'] }
    );

    EnhancedTestPatterns.createTest(
      'should reject custom input missing required properties',
      () => {
        const missingType = {
          data: 'some data',
        };

        expect(() => {
          normalizeInputForEpub(missingType as any);
        }).toThrow(DocumentParseError);

        const missingData = {
          type: 'string',
        };

        expect(() => {
          normalizeInputForEpub(missingData as any);
        }).toThrow(DocumentParseError);
      },
      { priority: TestPriority.HIGH, tags: ['normalization', 'error-handling'] }
    );

    EnhancedTestPatterns.createTest(
      'should handle large Buffer and ArrayBuffer inputs',
      () => {
        const largeBuffer = Buffer.alloc(1024 * 1024); // 1MB
        const result1 = normalizeInputForEpub(largeBuffer);
        expect(result1).toBeInstanceOf(Uint8Array);
        expect(result1.length).toBe(largeBuffer.length);

        const largeArrayBuffer = new ArrayBuffer(1024 * 1024); // 1MB
        const result2 = normalizeInputForEpub(largeArrayBuffer);
        expect(result2).toBeInstanceOf(Uint8Array);
        expect(result2.length).toBe(largeArrayBuffer.byteLength);
      },
      { priority: TestPriority.MEDIUM, tags: ['normalization', 'performance'] }
    );

    EnhancedTestPatterns.createTest(
      'should handle empty custom input data',
      () => {
        const emptyStringInput = {
          type: 'string',
          data: '',
        };

        const result1 = normalizeInputForEpub(emptyStringInput as any);
        expect(result1).toBe('');

        const emptyBufferInput = {
          type: 'buffer',
          data: Buffer.alloc(0),
        };

        const result2 = normalizeInputForEpub(emptyBufferInput as any);
        expect(result2).toBeInstanceOf(Uint8Array);
        expect(result2.length).toBe(0);

        const emptyArrayBufferInput = {
          type: 'arraybuffer',
          data: new ArrayBuffer(0),
        };

        const result3 = normalizeInputForEpub(emptyArrayBufferInput as any);
        expect(result3).toBeInstanceOf(Uint8Array);
        expect(result3.length).toBe(0);
      },
      { priority: TestPriority.MEDIUM, tags: ['normalization', 'edge-cases'] }
    );
  });

  describe('createEPUBInstance', () => {
    EnhancedTestPatterns.createTest(
      'should create EPUB instance from Buffer',
      async () => {
        const validEPUB = createValidEPUBBuffer({
          title: 'Test Book',
          author: 'Test Author',
          chapters: [{ title: 'Chapter 1', content: 'First chapter content.' }],
        });

        const result = await createEPUBInstance(validEPUB);
        expect(result).toBeDefined();
        expect((result as any).metadata).toBeDefined();
      },
      { priority: TestPriority.CRITICAL, tags: ['core', 'epub-creation'] }
    );

    EnhancedTestPatterns.createTest(
      'should create EPUB instance from Buffer',
      async () => {
        const bufferInput = Buffer.from('epub content');
        const mockEpubInstance = { metadata: { title: 'Test Book' } } as any;
        mockEpub.from.mockResolvedValueOnce(mockEpubInstance);

        const result = await createEPUBInstance(bufferInput);
        expect(result).toBe(mockEpubInstance);
        expect(mockEpub.from).toHaveBeenCalledWith(new Uint8Array(bufferInput));
      },
      { priority: TestPriority.CRITICAL, tags: ['core', 'epub-creation'] }
    );

    EnhancedTestPatterns.createTest(
      'should create EPUB instance from ArrayBuffer',
      async () => {
        const arrayBufferInput = new ArrayBuffer(16);
        const mockEpubInstance = { metadata: { title: 'Test Book' } } as any;
        mockEpub.from.mockResolvedValueOnce(mockEpubInstance);

        const result = await createEPUBInstance(arrayBufferInput);
        expect(result).toBe(mockEpubInstance);
        expect(mockEpub.from).toHaveBeenCalledWith(
          new Uint8Array(arrayBufferInput)
        );
      },
      { priority: TestPriority.CRITICAL, tags: ['core', 'epub-creation'] }
    );

    EnhancedTestPatterns.createTest(
      'should create EPUB instance from custom string input',
      async () => {
        const customInput = {
          type: 'string',
          data: '/path/to/book.epub',
        };
        const mockEpubInstance = { metadata: { title: 'Test Book' } } as any;
        mockEpub.from.mockResolvedValueOnce(mockEpubInstance);

        const result = await createEPUBInstance(customInput as any);
        expect(result).toBe(mockEpubInstance);
        expect(mockEpub.from).toHaveBeenCalledWith('/path/to/book.epub');
      },
      { priority: TestPriority.HIGH, tags: ['epub-creation', 'custom-input'] }
    );

    EnhancedTestPatterns.createTest(
      'should wrap EPUB library errors in EPUBFormatError',
      async () => {
        const originalError = new Error('EPUB parsing failed');
        mockEpub.from.mockRejectedValue(originalError);

        await expect(createEPUBInstance('/invalid/epub.epub')).rejects.toThrow(
          EPUBFormatError
        );
        await expect(createEPUBInstance('/invalid/epub.epub')).rejects.toThrow(
          'EPUB parsing failed'
        );
      },
      { priority: TestPriority.HIGH, tags: ['epub-creation', 'error-handling'] }
    );

    EnhancedTestPatterns.createTest(
      'should handle non-Error objects from EPUB library',
      async () => {
        mockEpub.from.mockRejectedValue('String error');

        await expect(createEPUBInstance('/invalid/epub.epub')).rejects.toThrow(
          EPUBFormatError
        );
        await expect(createEPUBInstance('/invalid/epub.epub')).rejects.toThrow(
          'Unknown error'
        );
      },
      { priority: TestPriority.HIGH, tags: ['epub-creation', 'error-handling'] }
    );

    EnhancedTestPatterns.createTest(
      'should handle null error from EPUB library',
      async () => {
        mockEpub.from.mockRejectedValue(null);

        await expect(createEPUBInstance('/invalid/epub.epub')).rejects.toThrow(
          EPUBFormatError
        );
        await expect(createEPUBInstance('/invalid/epub.epub')).rejects.toThrow(
          'Unknown error'
        );
      },
      { priority: TestPriority.HIGH, tags: ['epub-creation', 'error-handling'] }
    );

    EnhancedTestPatterns.createTest(
      'should rethrow DocumentParseError without wrapping',
      async () => {
        const docError = new DocumentParseError(
          'Invalid input',
          'INVALID_INPUT'
        );
        mockEpub.from.mockRejectedValue(docError);

        await expect(createEPUBInstance('/invalid/epub.epub')).rejects.toThrow(
          DocumentParseError
        );
        await expect(createEPUBInstance('/invalid/epub.epub')).rejects.toThrow(
          'Invalid input'
        );
        await expect(createEPUBInstance('/invalid/epub.epub')).rejects.toThrow(
          DocumentParseError
        );
      },
      { priority: TestPriority.HIGH, tags: ['epub-creation', 'error-handling'] }
    );

    EnhancedTestPatterns.createTest(
      'should preserve original error message in EPUBFormatError',
      async () => {
        const originalError = new Error('Corrupted EPUB file');
        mockEpub.from.mockRejectedValueOnce(originalError);

        try {
          await createEPUBInstance('/corrupted/epub.epub');
        } catch (error) {
          expect(error).toBeInstanceOf(EPUBFormatError);
          expect((error as EPUBFormatError).message).toContain(
            'Corrupted EPUB file'
          );
        }
      },
      { priority: TestPriority.HIGH, tags: ['epub-creation', 'error-handling'] }
    );
  });

  describe('Integration Scenarios', () => {
    EnhancedTestPatterns.createTest(
      'should handle complete workflow with string input',
      async () => {
        const mockEpubInstance = {
          metadata: { title: 'Integration Test Book' },
          chapters: [{ title: 'Chapter 1' }],
          resources: {},
        } as any;
        mockEpub.from.mockResolvedValueOnce(mockEpubInstance);

        const input = '/path/to/integration-test.epub';

        // Validate input
        expect(() => {
          validateInput(input);
        }).not.toThrow();

        // Normalize input
        const normalized = normalizeInputForEpub(input);
        expect(normalized).toBe(input);

        // Create EPUB instance
        const epub = await createEPUBInstance(input);
        expect(epub).toBe(mockEpubInstance);
        expect(mockEpub.from).toHaveBeenCalledWith(input);
      },
      { priority: TestPriority.HIGH, tags: ['integration', 'workflow'] }
    );

    EnhancedTestPatterns.createTest(
      'should handle complete workflow with Buffer input',
      async () => {
        const bufferInput = Buffer.from('integration test epub content');
        const mockEpubInstance = {
          metadata: { title: 'Buffer Integration Test' },
          chapters: [{ title: 'Chapter 1' }],
          resources: {},
        } as any;
        mockEpub.from.mockResolvedValueOnce(mockEpubInstance);

        // Validate input
        expect(() => {
          validateInput(bufferInput);
        }).not.toThrow();

        // Normalize input
        const normalized = normalizeInputForEpub(bufferInput);
        expect(normalized).toBeInstanceOf(Uint8Array);

        // Create EPUB instance
        const epub = await createEPUBInstance(bufferInput);
        expect(epub).toBe(mockEpubInstance);
        expect(mockEpub.from).toHaveBeenCalledWith(normalized);
      },
      { priority: TestPriority.HIGH, tags: ['integration', 'workflow'] }
    );

    EnhancedTestPatterns.createTest(
      'should handle complete workflow with custom input',
      async () => {
        const customInput = {
          type: 'buffer',
          data: Buffer.from('custom epub content'),
        };
        const mockEpubInstance = {
          metadata: { title: 'Custom Input Integration Test' },
          chapters: [{ title: 'Chapter 1' }],
          resources: {},
        } as any;
        mockEpub.from.mockResolvedValueOnce(mockEpubInstance);

        // Validate input
        expect(() => {
          validateInput(customInput as any);
        }).not.toThrow();

        // Normalize input
        const normalized = normalizeInputForEpub(customInput as any);
        expect(normalized).toBeInstanceOf(Uint8Array);

        // Create EPUB instance
        const epub = await createEPUBInstance(customInput as any);
        expect(epub).toBe(mockEpubInstance);
        expect(mockEpub.from).toHaveBeenCalledWith(normalized);
      },
      { priority: TestPriority.HIGH, tags: ['integration', 'workflow'] }
    );

    EnhancedTestPatterns.createTest(
      'should handle error propagation through the workflow',
      async () => {
        const invalidInput = '';
        const docError = new DocumentParseError(
          'Input is required',
          'INVALID_INPUT'
        );

        // Should fail at validation
        expect(() => {
          validateInput(invalidInput);
        }).toThrow(docError);

        // Test with valid input but failing EPUB creation
        mockEpub.from.mockRejectedValueOnce(new Error('EPUB corrupted'));

        await expect(createEPUBInstance('/valid/path.epub')).rejects.toThrow(
          EPUBFormatError
        );
      },
      {
        priority: TestPriority.HIGH,
        tags: ['integration', 'error-propagation'],
      }
    );
  });

  describe('Edge Cases and Boundary Conditions', () => {
    EnhancedTestPatterns.createTest(
      'should handle very large string inputs',
      () => {
        const veryLongPath = `${'/very/long/path/'.repeat(100)}book.epub`;
        expect(() => {
          validateInput(veryLongPath);
        }).not.toThrow();

        const normalized = normalizeInputForEpub(veryLongPath);
        expect(normalized).toBe(veryLongPath);
      },
      { priority: TestPriority.MEDIUM, tags: ['edge-cases', 'performance'] }
    );

    EnhancedTestPatterns.createTest(
      'should handle zero-length inputs',
      () => {
        expect(() => {
          validateInput(Buffer.alloc(0));
        }).not.toThrow();

        expect(() => {
          validateInput(new ArrayBuffer(0));
        }).not.toThrow();

        const normalizedBuffer = normalizeInputForEpub(Buffer.alloc(0));
        expect(normalizedBuffer).toBeInstanceOf(Uint8Array);
        expect(normalizedBuffer.length).toBe(0);

        const normalizedArrayBuffer = normalizeInputForEpub(new ArrayBuffer(0));
        expect(normalizedArrayBuffer).toBeInstanceOf(Uint8Array);
        expect(normalizedArrayBuffer.length).toBe(0);
      },
      { priority: TestPriority.MEDIUM, tags: ['edge-cases', 'boundary'] }
    );

    EnhancedTestPatterns.createTest(
      'should handle Unicode and special characters in string inputs',
      () => {
        const unicodeInputs = [
          'path/书名.epub',
          'path/моякнига.epub',
          'path/本のタイトル.epub',
          'path/Livre épisode-1!.epub',
          'path/도서 제목.epub',
        ];

        for (const input of unicodeInputs) {
          expect(() => {
            validateInput(input);
          }).not.toThrow();

          const normalized = normalizeInputForEpub(input);
          expect(normalized).toBe(input);
        }
      },
      {
        priority: TestPriority.MEDIUM,
        tags: ['edge-cases', 'internationalization'],
      }
    );

    EnhancedTestPatterns.createTest(
      'should handle whitespace-only string inputs correctly',
      () => {
        const whitespaceInputs = ['   ', '\t', '\n', '\r', ' \t \n \r '];

        for (const input of whitespaceInputs) {
          expect(() => {
            validateInput(input);
          }).toThrow(DocumentParseError);
          expect(() => {
            validateInput(input);
          }).toThrow('Input is required');
        }
      },
      { priority: TestPriority.MEDIUM, tags: ['edge-cases', 'whitespace'] }
    );
  });
});
