import { describe, test, expect } from 'bun:test';
import { createBaseStructure } from '../../../../src/core/document-processing/parsers/epub-parser-helper-utils.js';
import {
  createMockMetadata,
  createMockChapter,
  createMockTableOfContentsItem,
  createMockEmbeddedAssets,
  createEmptyMockMetadata,
  createEmptyMockEmbeddedAssets,
} from './helpers/epub-parser-test-data';

describe('EPUB Parser Helper Utilities - Base Structure', () => {
  test('should create base structure with all components', () => {
    const metadata = createMockMetadata();
    const chapters = [createMockChapter()];
    const tableOfContents = [createMockTableOfContentsItem()];
    const embeddedAssets = createMockEmbeddedAssets();

    const result = createBaseStructure(
      metadata,
      chapters,
      tableOfContents,
      embeddedAssets
    );

    expect(result).toEqual({
      metadata,
      chapters,
      tableOfContents,
      embeddedAssets,
    });

    expect(result.metadata.title).toBe('Test Book');
    expect(result.chapters).toHaveLength(1);
    expect(result.tableOfContents).toHaveLength(1);
    expect(result.embeddedAssets.images).toHaveLength(1);
  });

  test('should handle empty components', () => {
    const metadata = createEmptyMockMetadata();
    const chapters: any[] = [];
    const tableOfContents: any[] = [];
    const embeddedAssets = createEmptyMockEmbeddedAssets();

    const result = createBaseStructure(
      metadata,
      chapters,
      tableOfContents,
      embeddedAssets
    );

    expect(result.chapters).toHaveLength(0);
    expect(result.tableOfContents).toHaveLength(0);
    expect(result.embeddedAssets.images).toHaveLength(0);
    expect(result.embeddedAssets.styles).toHaveLength(0);
  });
});
