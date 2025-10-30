import { describe, test, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { Epub } from '@smoores/epub';
import { extractMetadata } from '../../../../src/core/document-processing/parsers/epub-parser-metadata-extractor.js';
import { logger } from '../../../../src/utils/logger.js';
import {
  MockEpubFactory,
  MetadataTestDataFactory,
  ExpectedResultFactory,
} from './epub-parser-metadata-test-factory';

describe('EPUB Parser Metadata Extractor - extractMetadata', () => {
  let _mockEpub: Epub;
  let mockLogger: any;

  beforeEach(() => {
    _mockEpub = MockEpubFactory.createStandard();
    mockLogger = spyOn(logger, 'warn');
  });

  afterEach(() => {
    mockLogger?.mockRestore?.();
  });

  test('should extract complete metadata from EPUB', async () => {
    const testData = MetadataTestDataFactory.createComplete();
    const expected = ExpectedResultFactory.createComplete();

    const result = await extractMetadata(testData.epub);

    expect(result).toEqual(expected);
  });

  test('should handle minimal metadata', async () => {
    const testData = MetadataTestDataFactory.createMinimal();
    const expected = ExpectedResultFactory.createMinimal();

    const result = await extractMetadata(testData.epub);

    expect(result).toEqual(expected);
  });

  test('should handle missing metadata gracefully', async () => {
    const testData = MetadataTestDataFactory.createEmpty();
    const expected = ExpectedResultFactory.createEmpty();

    const result = await extractMetadata(testData.epub);

    expect(result).toEqual(expected);
  });

  test('should handle missing required fields gracefully', async () => {
    const testData = MetadataTestDataFactory.createMissingRequired();

    const result = await extractMetadata(testData.epub);

    expect(result).toBeDefined();
    expect(result.title).toBe('Incomplete Book');
    expect(result.author).toBe('Unknown Author');
    expect(mockLogger).not.toHaveBeenCalled();
  });

  test('should handle malformed metadata', async () => {
    const testData = MetadataTestDataFactory.createMalformed();

    const result = await extractMetadata(testData.epub);

    expect(result).toBeDefined();
    expect(typeof result.title).toBe('string');
  });

  test('should extract metadata with custom fields', async () => {
    const testData = MetadataTestDataFactory.createWithCustomFields();
    const expected = ExpectedResultFactory.createWithCustomFields();

    const result = await extractMetadata(testData.epub);

    expect(result).toEqual(expected);
  });

  test('should handle metadata with multiple authors', async () => {
    const testData = MetadataTestDataFactory.createMultipleAuthors();
    const expected = ExpectedResultFactory.createMultipleAuthors();

    const result = await extractMetadata(testData.epub);

    expect(result).toEqual(expected);
  });

  test('should handle metadata with special characters', async () => {
    const testData = MetadataTestDataFactory.createWithSpecialCharacters();
    const expected = ExpectedResultFactory.createWithSpecialCharacters();

    const result = await extractMetadata(testData.epub);

    expect(result).toEqual(expected);
  });
});
