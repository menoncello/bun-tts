import { describe, test, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { Epub, type EpubMetadata } from '@smoores/epub';
import { createCustomMetadata } from '../../../../src/core/document-processing/parsers/epub-parser-metadata-extractor-custom.js';
import { extractCustomFields } from '../../../../src/core/document-processing/parsers/epub-parser-metadata-extractor-fields.js';
import { logger } from '../../../../src/utils/logger.js';
import {
  MockEpubFactory,
  MetadataTestDataFactory,
} from './epub-parser-metadata-test-factory';

describe('EPUB Parser Metadata Extractor - extractCustomFields', () => {
  let _mockEpub: Epub;
  let mockLogger: any;

  beforeEach(() => {
    _mockEpub = MockEpubFactory.createStandard();
    mockLogger = spyOn(logger, 'warn');
  });

  afterEach(() => {
    mockLogger?.mockRestore?.();
  });

  test('should extract standard Dublin Core custom metadata fields', async () => {
    const testData = MetadataTestDataFactory.createComplete();
    const rawMetadata = await testData.epub.getMetadata();

    const result = extractCustomFields(rawMetadata);

    expect(result).toEqual({
      description: 'Test description',
      rights: 'Copyright 2023',
      format: 'application/epub+zip',
    });
  });

  test('should handle missing custom fields gracefully', async () => {
    const testData = MetadataTestDataFactory.createMinimal();
    const rawMetadata = await testData.epub.getMetadata();

    const result = extractCustomFields(rawMetadata);

    expect(result).toEqual({
      description: '',
      rights: '',
      format: '',
    });
  });

  test('should handle empty custom fields', async () => {
    const testData = MetadataTestDataFactory.createEmpty();
    const rawMetadata = await testData.epub.getMetadata();

    const result = extractCustomFields(rawMetadata);

    expect(result).toEqual({
      description: '',
      rights: '',
      format: '',
    });
  });

  test('should handle malformed metadata', async () => {
    const testData = MetadataTestDataFactory.createMalformed();
    const rawMetadata = await testData.epub.getMetadata();

    const result = extractCustomFields(rawMetadata);

    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('description');
    expect(result).toHaveProperty('rights');
    expect(result).toHaveProperty('format');
  });

  test('should extract fields with special characters', async () => {
    const testData = MetadataTestDataFactory.createWithSpecialCharacters();
    const rawMetadata = await testData.epub.getMetadata();

    const result = extractCustomFields(rawMetadata);

    expect(result).toEqual({
      description: 'Un libro con caracteres especiales: ñ, á, é, í, ó, ú, ü',
      rights: '© 2023 José Martínez',
      format: '',
    });
  });

  test('should not log warnings for normal operation', async () => {
    const testData = MetadataTestDataFactory.createComplete();
    const rawMetadata = await testData.epub.getMetadata();

    extractCustomFields(rawMetadata);

    expect(mockLogger).not.toHaveBeenCalled();
  });
});

describe('EPUB Parser Metadata Extractor - createCustomMetadata', () => {
  test('should create custom metadata with all fields', () => {
    const metadata: EpubMetadata = [
      { type: 'description', value: 'Test description', properties: {} },
      { type: 'rights', value: 'Copyright 2023', properties: {} },
      { type: 'format', value: 'application/epub+zip', properties: {} },
      { type: 'subject', value: 'Fiction', properties: {} },
      { type: 'type', value: 'Novel', properties: {} },
    ];

    const result = createCustomMetadata(metadata as any);

    expect(result).toEqual({
      description: 'Test description',
      rights: 'Copyright 2023',
      format: 'application/epub+zip',
      subject: 'Fiction',
      type: 'Novel',
    });
  });

  test('should handle missing metadata entries', () => {
    const metadata: EpubMetadata = [
      { type: 'title', value: 'Test Title', properties: {} },
      { type: 'creator', value: 'Test Author', properties: {} },
    ];

    const result = createCustomMetadata(metadata as any);

    expect(result).toEqual({
      description: '',
      rights: '',
      format: '',
      subject: '',
      type: '',
    });
  });

  test('should handle empty metadata array', () => {
    const metadata: EpubMetadata = [];

    const result = createCustomMetadata(metadata as any);

    expect(result).toEqual({
      description: '',
      rights: '',
      format: '',
      subject: '',
      type: '',
    });
  });

  test('should handle null/undefined values in metadata entries', () => {
    const metadata = [
      { type: 'description', value: null as any, properties: {} },
      { type: 'rights', value: undefined as any, properties: {} },
      { type: 'format', value: '', properties: {} },
      { type: 'subject', value: null as any, properties: {} },
      { type: 'type', value: undefined as any, properties: {} },
    ];

    const result = createCustomMetadata(metadata as any);

    expect(result).toEqual({
      description: '',
      rights: '',
      format: '',
      subject: '',
      type: '',
    });
  });

  test('should handle non-string values in metadata entries', () => {
    const metadata = [
      { type: 'description', value: 123 as any, properties: {} },
      { type: 'rights', value: true as any, properties: {} },
      { type: 'format', value: {} as any, properties: {} },
      { type: 'subject', value: [] as any, properties: {} },
      {
        type: 'type',
        value: { value: 'object', properties: {} } as any,
        properties: {},
      },
    ];

    const result = createCustomMetadata(metadata as any);

    expect(result).toEqual({
      description: '',
      rights: '',
      format: '',
      subject: '',
      type: '',
    });
  });

  test('should handle subject with metaType property', () => {
    const metadata = [
      {
        type: 'subject',
        metaType: 'Science Fiction',
        value: '',
        properties: {},
      },
    ];

    const result = createCustomMetadata(metadata as any);

    expect(result.subject).toBe('');
  });

  test('should handle type with metaType property', () => {
    const metadata = [
      { type: 'type', metaType: 'Novel', value: '', properties: {} },
    ];

    const result = createCustomMetadata(metadata as any);

    expect(result.type).toBe('Novel');
  });

  test('should prefer value over metaType for type field', () => {
    const metadata = [
      {
        type: 'type',
        value: 'Primary Type',
        metaType: 'Secondary Type',
        properties: {},
      },
    ];

    const result = createCustomMetadata(metadata as any);

    expect(result.type).toBe('Primary Type');
  });

  test('should use metaType when value is missing for type field', () => {
    const metadata = [
      { type: 'type', metaType: 'Secondary Type', value: '', properties: {} },
    ];

    const result = createCustomMetadata(metadata as any);

    expect(result.type).toBe('Secondary Type');
  });

  test('should handle metadata with special characters', () => {
    const metadata: EpubMetadata = [
      {
        type: 'description',
        value: 'Un libro con caracteres especiales: ñ, á, é, í, ó, ú, ü',
        properties: {},
      },
      { type: 'rights', value: '© 2023 José Martínez', properties: {} },
      { type: 'format', value: 'application/epub+zip', properties: {} },
      { type: 'subject', value: 'Ciencia Ficción', properties: {} },
      { type: 'type', value: 'Novela', properties: {} },
    ];

    const result = createCustomMetadata(metadata as any);

    expect(result).toEqual({
      description: 'Un libro con caracteres especiales: ñ, á, é, í, ó, ú, ü',
      rights: '© 2023 José Martínez',
      format: 'application/epub+zip',
      subject: 'Ciencia Ficción',
      type: 'Novela',
    });
  });

  test('should handle multiple entries of same type (use first one)', () => {
    const metadata = [
      { type: 'description', value: 'First description', properties: {} },
      { type: 'description', value: 'Second description', properties: {} },
      { type: 'rights', value: 'First rights', properties: {} },
      { type: 'rights', value: 'Second rights', properties: {} },
    ];

    const result = createCustomMetadata(metadata as any);

    expect(result).toEqual({
      description: 'First description',
      rights: 'First rights',
      format: '',
      subject: '',
      type: '',
    });
  });

  test('should handle very long values', () => {
    const longDescription = 'A'.repeat(1000);
    const metadata: EpubMetadata = [
      { type: 'description', value: longDescription, properties: {} },
    ];

    const result = createCustomMetadata(metadata as any);

    expect(result.description).toBe(longDescription);
  });

  test('should handle metadata with HTML tags', () => {
    const metadata: EpubMetadata = [
      {
        type: 'description',
        value: '<p>This is a <strong>description</strong> with HTML tags.</p>',
        properties: {},
      },
    ];

    const result = createCustomMetadata(metadata as any);

    expect(result.description).toBe(
      '<p>This is a <strong>description</strong> with HTML tags.</p>'
    );
  });

  test('should handle metadata with Unicode characters', () => {
    const metadata: EpubMetadata = [
      { type: 'description', value: 'Emoji test: 📚 🎧 📖', properties: {} },
      { type: 'rights', value: '© 2023 👥 Authors', properties: {} },
    ];

    const result = createCustomMetadata(metadata as any);

    expect(result).toEqual({
      description: 'Emoji test: 📚 🎧 📖',
      rights: '© 2023 👥 Authors',
      format: '',
      subject: '',
      type: '',
    });
  });

  test('should handle numeric string values', () => {
    const metadata = [
      { type: 'description', value: '123', properties: {} },
      { type: 'rights', value: '2023', properties: {} },
      { type: 'format', value: '1.0', properties: {} },
    ];

    const result = createCustomMetadata(metadata as any);

    expect(result).toEqual({
      description: '123',
      rights: '2023',
      format: '1.0',
      subject: '',
      type: '',
    });
  });

  test('should handle whitespace-only values', () => {
    const metadata = [
      { type: 'description', value: '   ', properties: {} },
      { type: 'rights', value: '\t\n', properties: {} },
      { type: 'format', value: '  \r\n  ', properties: {} },
    ];

    const result = createCustomMetadata(metadata as any);

    expect(result).toEqual({
      description: '   ',
      rights: '\t\n',
      format: '  \r\n  ',
      subject: '',
      type: '',
    });
  });
});
