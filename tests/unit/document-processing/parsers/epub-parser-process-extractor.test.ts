import { describe, test, expect, beforeEach } from 'bun:test';
import { Epub } from '@smoores/epub';
import {
  extractAllComponents,
  analyzeCompatibilityData,
  extractAndFixMetadataTOC,
  extractContentData,
  extractMetadataAndTOC,
  extractContentAndAssets,
} from '../../../../src/core/document-processing/parsers/epub-parser-process-extractor.js';
import type { EPUBParseOptions } from '../../../../src/core/document-processing/parsers/epub-parser-types.js';
import {
  MockEpubFactory,
  ParseOptionsFactory,
  CompatibilityDataFactory,
  TableOfContentsFactory,
  BuildStructureCallbackFactory,
  ExpectationFactory,
} from './epub-parser-process-test-factory';

function setupTestMocks() {
  const mockEpub = MockEpubFactory.createBasic();
  const mockOptions = ParseOptionsFactory.createDefault();
  return { mockEpub, mockOptions };
}

describe('EPUB Parser Process Extractor - Component Extraction', () => {
  let mockEpub: Epub;
  let mockOptions: EPUBParseOptions;

  beforeEach(() => {
    const mocks = setupTestMocks();
    mockEpub = mocks.mockEpub;
    mockOptions = mocks.mockOptions;
  });

  describe('extractAllComponents', () => {
    test('should call buildStructureCallback with extracted data', async () => {
      const buildStructureCallback =
        BuildStructureCallbackFactory.createBasic();
      const result = await extractAllComponents(
        mockEpub,
        mockOptions,
        buildStructureCallback
      );

      expect(result).toEqual(ExpectationFactory.createBasicResult());
      expect(Array.isArray(result.chapters)).toBe(true);
      expect(typeof result.stats).toBe('object');
      expect(typeof result.documentStructure).toBe('object');
    });

    test('should handle empty extraction results', async () => {
      const buildStructureCallback =
        BuildStructureCallbackFactory.createWithEmptyChapters();
      const result = await extractAllComponents(
        mockEpub,
        mockOptions,
        buildStructureCallback
      );

      expect(result).toEqual(ExpectationFactory.createEmptyResult());
    });

    test('should throw error when buildStructureCallback throws', async () => {
      const buildStructureCallback =
        BuildStructureCallbackFactory.createWithError();

      await expect(
        extractAllComponents(mockEpub, mockOptions, buildStructureCallback)
      ).rejects.toThrow('Build structure failed');
    });
  });
});

describe('EPUB Parser Process Extractor - Compatibility Analysis', () => {
  let mockEpub: Epub;
  let mockOptions: EPUBParseOptions;

  beforeEach(() => {
    const mocks = setupTestMocks();
    mockEpub = mocks.mockEpub;
    mockOptions = mocks.mockOptions;
  });

  test('should return compatibility analysis and config', async () => {
    const result = await analyzeCompatibilityData(mockEpub, mockOptions);

    expect(result).toEqual(ExpectationFactory.createCompatibilityResult());
  });

  test('should handle strict mode options', async () => {
    const strictOptions = ParseOptionsFactory.createStrict();
    const result = await analyzeCompatibilityData(mockEpub, strictOptions);

    // Note: The implementation always returns strictMode: false regardless of input options
    expect(result.compatibilityConfig.strictMode).toBe(false);
    expect(result.compatibilityConfig.enableFallbacks).toBe(true);
    expect(result.compatibilityConfig.logCompatibilityWarnings).toBe(true);
  });

  test('should handle compatibility analysis errors gracefully', async () => {
    const invalidEpub = MockEpubFactory.createInvalid();
    const result = await analyzeCompatibilityData(invalidEpub, mockOptions);

    expect(result).toHaveProperty('compatibilityAnalysis');
    expect(result).toHaveProperty('compatibilityConfig');
    expect(typeof result.compatibilityAnalysis.isCompatible).toBe('boolean');
  });
});

describe('EPUB Parser Process Extractor - Metadata and TOC Extraction', () => {
  let mockEpub: Epub;

  beforeEach(() => {
    mockEpub = MockEpubFactory.createBasic();
  });

  test('should extract and fix metadata and TOC', async () => {
    const mockCompatibilityData = CompatibilityDataFactory.createStandard();
    const result = await extractAndFixMetadataTOC(
      mockEpub,
      mockCompatibilityData
    );

    expect(result).toEqual(ExpectationFactory.createMetadataTOCResult());
    expect(typeof result.fixedMetadata).toBe('object');
    expect(Array.isArray(result.fixedTableOfContents)).toBe(true);
  });

  test('should handle compatibility config with strict mode', async () => {
    const mockCompatibilityData = CompatibilityDataFactory.createStrict();
    const result = await extractAndFixMetadataTOC(
      mockEpub,
      mockCompatibilityData
    );

    expect(result.fixedMetadata).toBeDefined();
    expect(result.fixedTableOfContents).toBeDefined();
  });

  test('should handle metadata extraction errors gracefully', async () => {
    const mockCompatibilityData = CompatibilityDataFactory.createMinimal();
    const invalidEpub = MockEpubFactory.createInvalid();
    const result = await extractAndFixMetadataTOC(
      invalidEpub,
      mockCompatibilityData
    );

    expect(result).toEqual(ExpectationFactory.createErrorMetadataTOCResult());
    expect(typeof result.fixedMetadata).toBe('object');
    expect(Array.isArray(result.fixedTableOfContents)).toBe(true);
  });
});

describe('EPUB Parser Process Extractor - Content Data', () => {
  let mockEpub: Epub;
  let mockOptions: EPUBParseOptions;

  beforeEach(() => {
    const mocks = setupTestMocks();
    mockEpub = mocks.mockEpub;
    mockOptions = mocks.mockOptions;
  });

  test('should extract chapters and embedded assets', async () => {
    const mockTableOfContents = TableOfContentsFactory.createSingle();
    const result = await extractContentData(
      mockEpub,
      mockTableOfContents,
      mockOptions
    );

    expect(result).toEqual(ExpectationFactory.createContentDataResult());
    expect(Array.isArray(result.chapters)).toBe(true);
    expect(typeof result.embeddedAssets).toBe('object');
  });

  test('should handle empty TOC', async () => {
    const emptyTOC = TableOfContentsFactory.createEmpty();
    const result = await extractContentData(mockEpub, emptyTOC, mockOptions);

    expect(result.chapters).toBeDefined();
    expect(result.embeddedAssets).toBeDefined();
    expect(Array.isArray(result.chapters)).toBe(true);
  });

  test('should handle content extraction errors gracefully', async () => {
    const mockTableOfContents = TableOfContentsFactory.createSingle();
    const invalidEpub = MockEpubFactory.createInvalid();
    const result = await extractContentData(
      invalidEpub,
      mockTableOfContents,
      mockOptions
    );

    expect(result).toEqual(ExpectationFactory.createErrorContentDataResult());
    expect(Array.isArray(result.chapters)).toBe(true);
    expect(typeof result.embeddedAssets).toBe('object');
  });
});

describe('EPUB Parser Process Extractor - Simple Metadata and TOC', () => {
  let mockEpub: Epub;

  beforeEach(() => {
    mockEpub = MockEpubFactory.createBasic();
  });

  test('should extract metadata and table of contents', async () => {
    const result = await extractMetadataAndTOC(mockEpub);

    expect(result).toEqual(ExpectationFactory.createTupleResult());
    expect(result).toHaveLength(2);
    expect(typeof result[0]).toBe('object'); // metadata
    expect(Array.isArray(result[1])).toBe(true); // table of contents
  });

  test('should handle metadata extraction errors gracefully', async () => {
    const invalidEpub = MockEpubFactory.createInvalid();
    const result = await extractMetadataAndTOC(invalidEpub);

    expect(result).toEqual(ExpectationFactory.createErrorTupleResult());
    expect(result).toHaveLength(2);
    expect(typeof result[0]).toBe('object'); // metadata
    expect(Array.isArray(result[1])).toBe(true); // table of contents
    expect(result[0].title).toBe('Unknown Title');
  });

  test('should return empty arrays for minimal EPUB', async () => {
    const minimalEpub = MockEpubFactory.createMinimal();
    const result = await extractMetadataAndTOC(minimalEpub);

    expect(result).toHaveLength(2);
    expect(typeof result[0]).toBe('object');
    expect(Array.isArray(result[1])).toBe(true);
  });
});

describe('EPUB Parser Process Extractor - Content and Assets - Basic Extraction', () => {
  let mockEpub: Epub;
  let mockOptions: EPUBParseOptions;

  beforeEach(() => {
    const mocks = setupTestMocks();
    mockEpub = mocks.mockEpub;
    mockOptions = mocks.mockOptions;
  });

  test('should extract chapters and embedded assets', async () => {
    const mockTableOfContents = TableOfContentsFactory.createSingle();
    const result = await extractContentAndAssets(
      mockEpub,
      mockTableOfContents,
      mockOptions
    );

    expect(result).toHaveLength(2);
    expect(Array.isArray(result[0])).toBe(true); // chapters
    expect(typeof result[1]).toBe('object'); // embedded assets

    // Check all asset types
    const assetTypes = ['images', 'styles', 'fonts', 'other', 'audio', 'video'];
    for (const type of assetTypes) {
      expect(result[1]).toHaveProperty(type);
    }
  });
});

describe('EPUB Parser Process Extractor - Content and Assets - Error Handling', () => {
  let mockEpub: Epub;
  let mockOptions: EPUBParseOptions;

  beforeEach(() => {
    const mocks = setupTestMocks();
    mockEpub = mocks.mockEpub;
    mockOptions = mocks.mockOptions;
  });

  test('should handle chapter extraction errors gracefully', async () => {
    const mockTableOfContents = TableOfContentsFactory.createSingle();
    const invalidEpub = MockEpubFactory.createInvalid();
    const result = await extractContentAndAssets(
      invalidEpub,
      mockTableOfContents,
      mockOptions
    );

    expect(result).toHaveLength(2);
    expect(Array.isArray(result[0])).toBe(true); // chapters
    expect(typeof result[1]).toBe('object'); // embedded assets
    expect(Array.isArray(result[0])).toBe(true); // chapters
    expect(Array.isArray(result[1].images)).toBe(true); // images
  });

  test('should handle empty extraction results', async () => {
    const emptyTOC = TableOfContentsFactory.createEmpty();
    const result = await extractContentAndAssets(
      mockEpub,
      emptyTOC,
      mockOptions
    );

    expect(result[0]).toBeDefined(); // chapters
    expect(result[1]).toBeDefined(); // embedded assets
    expect(Array.isArray(result[0])).toBe(true);
    expect(typeof result[1]).toBe('object');
  });
});

describe('EPUB Parser Process Extractor - Content and Assets - Options', () => {
  let mockEpub: Epub;

  beforeEach(() => {
    const mocks = setupTestMocks();
    mockEpub = mocks.mockEpub;
  });

  test('should handle extraction with different options', async () => {
    const mockTableOfContents = TableOfContentsFactory.createSingle();
    const optionsWithNoMedia = ParseOptionsFactory.createNoMedia();
    const result = await extractContentAndAssets(
      mockEpub,
      mockTableOfContents,
      optionsWithNoMedia
    );

    expect(result).toHaveLength(2);
    expect(Array.isArray(result[0])).toBe(true);
    expect(typeof result[1]).toBe('object');
    // When extractMedia is false, embedded assets should be empty
    expect(result[1].images).toHaveLength(0);
  });
});

function testCompatibilityFlow(mockEpub: Epub, mockOptions: EPUBParseOptions) {
  return async () => {
    const compatibilityData = await analyzeCompatibilityData(
      mockEpub,
      mockOptions
    );
    expect(compatibilityData.compatibilityAnalysis).toBeDefined();
    expect(compatibilityData.compatibilityConfig).toBeDefined();
    return compatibilityData;
  };
}

function testMetadataTOCFlow(mockEpub: Epub, compatibilityData: any) {
  return async () => {
    const metadataTOC = await extractAndFixMetadataTOC(
      mockEpub,
      compatibilityData
    );
    expect(metadataTOC.fixedMetadata).toBeDefined();
    expect(metadataTOC.fixedTableOfContents).toBeDefined();
    return metadataTOC;
  };
}

function testContentDataFlow(
  mockEpub: Epub,
  metadataTOC: any,
  mockOptions: EPUBParseOptions
) {
  return async () => {
    const contentData = await extractContentData(
      mockEpub,
      metadataTOC.fixedTableOfContents,
      mockOptions
    );
    expect(contentData.chapters).toBeDefined();
    expect(contentData.embeddedAssets).toBeDefined();
    return contentData;
  };
}

function testDirectExtractionMethods(
  mockEpub: Epub,
  metadataTOC: any,
  mockOptions: EPUBParseOptions
) {
  return async () => {
    const extractedMetadataTOC = await extractMetadataAndTOC(mockEpub);
    expect(extractedMetadataTOC).toHaveLength(2);

    const extractedContentAssets = await extractContentAndAssets(
      mockEpub,
      metadataTOC.fixedTableOfContents,
      mockOptions
    );
    expect(extractedContentAssets).toHaveLength(2);
  };
}

function testCompleteFlow(mockEpub: Epub, mockOptions: EPUBParseOptions) {
  return async () => {
    const buildStructureCallback =
      BuildStructureCallbackFactory.createWithDataProcessing();
    const finalResult = await extractAllComponents(
      mockEpub,
      mockOptions,
      buildStructureCallback
    );
    expect(finalResult.chapters).toBeDefined();
    expect(finalResult.stats).toBeDefined();
    expect(finalResult.documentStructure).toBeDefined();
  };
}

describe('EPUB Parser Process Extractor - Integration Tests - Basic Flow', () => {
  let mockEpub: Epub;
  let mockOptions: EPUBParseOptions;

  beforeEach(() => {
    const mocks = setupTestMocks();
    mockEpub = mocks.mockEpub;
    mockOptions = mocks.mockOptions;
  });

  test('should work end-to-end with realistic data flow', async () => {
    const compatibilityData = await testCompatibilityFlow(
      mockEpub,
      mockOptions
    )();
    const metadataTOC = await testMetadataTOCFlow(
      mockEpub,
      compatibilityData
    )();
    await testContentDataFlow(mockEpub, metadataTOC, mockOptions)();
    await testDirectExtractionMethods(mockEpub, metadataTOC, mockOptions)();
    await testCompleteFlow(mockEpub, mockOptions)();
  });
});

describe('EPUB Parser Process Extractor - Integration Tests - Complex Scenarios', () => {
  let mockEpub: Epub;

  beforeEach(() => {
    mockEpub = MockEpubFactory.createBasic();
  });

  test('should handle complex compatibility scenarios', async () => {
    const complexOptions = ParseOptionsFactory.createComplex();
    const compatibilityData = await analyzeCompatibilityData(
      mockEpub,
      complexOptions
    );
    // Note: The implementation always returns strictMode: false regardless of input options
    expect(compatibilityData.compatibilityConfig.strictMode).toBe(false);

    const metadataTOC = await extractAndFixMetadataTOC(
      mockEpub,
      compatibilityData
    );
    expect(metadataTOC.fixedMetadata).toBeDefined();
    expect(metadataTOC.fixedTableOfContents).toBeDefined();
  });
});
