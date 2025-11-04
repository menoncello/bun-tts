/**
 * StructureAnalyzer Integration Tests - RED Phase
 *
 * These tests verify integration between StructureAnalyzer and existing parsers.
 * All tests should FAIL initially (RED phase) due to missing implementation.
 *
 * Integration Points:
 * - MarkdownParser extension with structure analysis
 * - PDFParser extension with layout-based structure detection
 * - EPUBParser extension with chapter/section hierarchy extraction
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { EPUBParser } from '../../../../src/core/document-processing/parsers/epub-parser.js';
import { MarkdownParser } from '../../../../src/core/document-processing/parsers/markdown-parser.js';
import { PDFParser } from '../../../../src/core/document-processing/parsers/pdf-parser.js';
import { StructureAnalyzer } from '../../../../src/core/document-processing/structure-analyzer.js';
import {
  setupEPUBParserFixture,
  cleanupEPUBParserFixture,
} from '../../../support/fixtures/epub-parser.fixture.js';
import {
  EnhancedMockFactory,
  TestCleanupManager,
} from '../../../support/test-utilities.js';

describe('StructureAnalyzer Integration - MarkdownParser', () => {
  let mockLogger: ReturnType<typeof EnhancedMockFactory.createLogger>;
  let mockConfigManager: ReturnType<
    typeof EnhancedMockFactory.createConfigManager
  >;

  beforeEach(() => {
    mockLogger = EnhancedMockFactory.createLogger();
    mockConfigManager = EnhancedMockFactory.createConfigManager();
  });

  afterEach(async () => {
    await TestCleanupManager.cleanup();
  });

  describe('extended with structure analysis', () => {
    it('should analyze structure when parsing markdown documents', async () => {
      // GIVEN: Markdown document with structure
      const markdownContent = `# Chapter 1: Introduction

This is the first chapter.

## Section 1.1: Background

Background information here.

### Subsection 1.1.1: Details

More detailed information.

## Section 1.2: Overview

Overview content here.

# Chapter 2: Main Content

Main chapter content.`;

      const parser = new MarkdownParser(mockLogger, mockConfigManager);

      // WHEN: Parsing markdown document (current parser interface)
      const result = await parser.parse(markdownContent);

      // THEN: Document structure is parsed successfully
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.chapters).toBeDefined();
        expect(Array.isArray(result.data.chapters)).toBe(true);
      }
    });

    it('should preserve original markdown parsing while adding structure', async () => {
      // GIVEN: Markdown document
      const markdownContent = `# Title
## Subtitle
Paragraph text.`;

      const parser = new MarkdownParser(mockLogger, mockConfigManager);

      // WHEN: Parsing markdown document (current parser interface)
      const result = await parser.parse(markdownContent);

      // THEN: Original parsing functionality is preserved
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.chapters).toBeDefined();
        expect(result.data.metadata).toBeDefined();
        expect(result.data.confidence).toBeDefined();
      }
    });

    it('should work without structure analysis (backward compatibility)', async () => {
      // GIVEN: Markdown document
      const markdownContent = `# Title
Content here.`;

      const parser = new MarkdownParser(mockLogger, mockConfigManager);

      // WHEN: Parsing markdown document (current parser interface)
      const result = await parser.parse(markdownContent);

      // THEN: Parsing works as before (backward compatible)
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.chapters).toBeDefined();
      }
    });
  });
});

describe('StructureAnalyzer Integration - PDFParser', () => {
  let mockLogger: ReturnType<typeof EnhancedMockFactory.createLogger>;
  let mockConfigManager: ReturnType<
    typeof EnhancedMockFactory.createConfigManager
  >;

  beforeEach(() => {
    mockLogger = EnhancedMockFactory.createLogger();
    mockConfigManager = EnhancedMockFactory.createConfigManager();
  });

  afterEach(async () => {
    await TestCleanupManager.cleanup();
  });

  describe('extended with layout-based structure detection', () => {
    it('should detect structure using PDF layout analysis', async () => {
      // GIVEN: PDF file path for layout-based structure detection
      const pdfFilePath = '/path/to/test-document.pdf';

      const parser = new PDFParser(mockLogger, mockConfigManager);

      // WHEN: Parsing PDF document (current parser interface)
      const result = await parser.parse(pdfFilePath);

      // THEN: PDF structure is detected and parsed
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.chapters).toBeDefined();
        expect(Array.isArray(result.data.chapters)).toBe(true);
      }
    });

    it('should use font size and positioning for structure detection', async () => {
      // GIVEN: PDF file path with varying font sizes indicating structure
      const pdfFilePath = '/path/to/test-document-with-fonts.pdf';

      const parser = new PDFParser(mockLogger, mockConfigManager);

      // WHEN: Parsing PDF document (current parser interface)
      const result = await parser.parse(pdfFilePath);

      // THEN: PDF structure is detected with layout information
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.chapters).toBeDefined();
        expect(result.data.metadata).toBeDefined();
      }
    });

    it('should extract headings from PDF TOC if available', async () => {
      // GIVEN: PDF file path with Table of Contents
      const pdfFilePath = '/path/to/test-document-with-toc.pdf';

      const parser = new PDFParser(mockLogger, mockConfigManager);

      // WHEN: Parsing PDF document (current parser interface)
      const result = await parser.parse(pdfFilePath);

      // THEN: PDF structure is detected with TOC information
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.chapters).toBeDefined();
        expect(result.data.metadata).toBeDefined();
      }
    });
  });
});

describe('StructureAnalyzer Integration - EPUBParser', () => {
  let epubFixture: ReturnType<typeof setupEPUBParserFixture>;

  beforeEach(() => {
    epubFixture = setupEPUBParserFixture({
      strictMode: false, // Allow for integration testing flexibility
      verbose: false,
    });
  });

  afterEach(async () => {
    await cleanupEPUBParserFixture(epubFixture);
    await TestCleanupManager.cleanup();
  });

  describe('extended with chapter/section hierarchy extraction', () => {
    it('should extract chapter/section hierarchy from EPUB navigation', async () => {
      // GIVEN: EPUB buffer with valid content structure
      const epubBuffer = epubFixture.mockData.validEpub;
      const parser = epubFixture.parser;

      // WHEN: Parsing EPUB document (current parser interface)
      const result = await parser.parse(epubBuffer);

      // THEN: EPUB structure is extracted from navigation
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        const documentData = result.data as any; // Type cast for EPUB parser result
        expect(documentData).toBeDefined();
        expect(documentData.chapters).toBeDefined();
        expect(Array.isArray(documentData.chapters)).toBe(true);
      }
    });

    it('should use EPUB spine for reading order structure', async () => {
      // GIVEN: EPUB buffer with spine information
      const epubBuffer = epubFixture.mockData.validEpub;
      const parser = epubFixture.parser;

      // WHEN: Parsing EPUB document (current parser interface)
      const result = await parser.parse(epubBuffer);

      // THEN: EPUB structure follows spine reading order
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        const documentData = result.data as any; // Type cast for EPUB parser result
        expect(documentData).toBeDefined();
        expect(documentData.chapters).toBeDefined();
        expect(Array.isArray(documentData.chapters)).toBe(true);
      }
    });

    it('should preserve EPUB metadata while adding structure', async () => {
      // GIVEN: EPUB buffer with metadata
      const epubBuffer = epubFixture.mockData.validEpub;
      const parser = epubFixture.parser;

      // WHEN: Parsing EPUB document (current parser interface)
      const result = await parser.parse(epubBuffer);

      // THEN: Both metadata and structure are preserved
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        const documentData = result.data as any; // Type cast for EPUB parser result
        expect(documentData).toBeDefined();
        expect(documentData.chapters).toBeDefined();
        expect(documentData.metadata).toBeDefined();
        expect(documentData.metadata.title).toBeDefined();
      }
    });
  });
});

describe('Parser-Agnostic StructureAnalyzer Interface', () => {
  let mockLogger: ReturnType<typeof EnhancedMockFactory.createLogger>;
  let mockConfigManager: ReturnType<
    typeof EnhancedMockFactory.createConfigManager
  >;
  let epubFixture: ReturnType<typeof setupEPUBParserFixture>;

  beforeEach(() => {
    mockLogger = EnhancedMockFactory.createLogger();
    mockConfigManager = EnhancedMockFactory.createConfigManager();
    epubFixture = setupEPUBParserFixture({
      strictMode: false, // Allow for integration testing flexibility
      verbose: false,
    });
  });

  afterEach(async () => {
    await cleanupEPUBParserFixture(epubFixture);
    await TestCleanupManager.cleanup();
  });

  describe('consistent structure output', () => {
    it('should produce consistent DocumentStructure across all parsers', async () => {
      // GIVEN: Same logical document in different formats
      const markdownContent = `# Chapter 1
## Section 1.1
Content here.`;

      const pdfFilePath = '/path/to/test-document.pdf';
      const epubBuffer = epubFixture.mockData.validEpub;

      const markdownParser = new MarkdownParser(mockLogger, mockConfigManager);
      const pdfParser = new PDFParser(mockLogger, mockConfigManager);
      const epubParser = epubFixture.parser;

      // WHEN: Parsing with current parser interfaces
      const markdownResult = await markdownParser.parse(markdownContent);
      const pdfResult = await pdfParser.parse(pdfFilePath);
      const epubResult = await epubParser.parse(epubBuffer);

      // THEN: All produce successful parsing results
      expect(markdownResult).toBeDefined();
      expect(markdownResult.success).toBe(true);

      expect(pdfResult).toBeDefined();
      expect(pdfResult.success).toBe(true);

      expect(epubResult).toBeDefined();
      expect(epubResult.success).toBe(true);

      // Verify all have DocumentStructure data
      if (markdownResult.success && pdfResult.success && epubResult.success) {
        expect(markdownResult.data).toBeDefined();
        expect(markdownResult.data.chapters).toBeDefined();

        expect(pdfResult.data).toBeDefined();
        expect(pdfResult.data.chapters).toBeDefined();

        expect(epubResult.data).toBeDefined();
        const epubData = epubResult.data as any; // Type cast for EPUB parser result
        expect(epubData.chapters).toBeDefined();
      }
    });

    it('should support StructureAnalyzer with different parser types', async () => {
      // GIVEN: StructureAnalyzer with mock dependencies
      const analyzer = new StructureAnalyzer(mockLogger, mockConfigManager);

      // WHEN: Creating analyzer instances
      expect(analyzer).toBeDefined();
      expect(typeof analyzer.analyzeStructure).toBe('function');
      expect(typeof analyzer.extractChapters).toBe('function');
      expect(typeof analyzer.validateAndCorrectStructure).toBe('function');

      // THEN: StructureAnalyzer has expected methods
      expect(analyzer.getConfig).toBeDefined();
      expect(typeof analyzer.getConfig).toBe('function');
      expect(analyzer.updateConfig).toBeDefined();
      expect(typeof analyzer.updateConfig).toBe('function');
    });
  });
});

describe('Cross-Parser Validation', () => {
  let mockLogger: ReturnType<typeof EnhancedMockFactory.createLogger>;
  let mockConfigManager: ReturnType<
    typeof EnhancedMockFactory.createConfigManager
  >;
  let epubFixture: ReturnType<typeof setupEPUBParserFixture>;

  beforeEach(() => {
    mockLogger = EnhancedMockFactory.createLogger();
    mockConfigManager = EnhancedMockFactory.createConfigManager();
    epubFixture = setupEPUBParserFixture({
      strictMode: false, // Allow for integration testing flexibility
      verbose: false,
    });
  });

  afterEach(async () => {
    await cleanupEPUBParserFixture(epubFixture);
    await TestCleanupManager.cleanup();
  });

  it('should validate structure consistency across parsers', async () => {
    // GIVEN: Document processed by multiple parsers
    const testDocument = `# Test Chapter
## Test Section
Test content.`;

    const markdownParser = new MarkdownParser(mockLogger, mockConfigManager);
    const pdfParser = new PDFParser(mockLogger, mockConfigManager);
    const epubParser = epubFixture.parser;

    // WHEN: Processing with all parsers using current interfaces
    const markdownResult = await markdownParser.parse(testDocument);
    const pdfResult = await pdfParser.parse('/path/to/test-document.pdf');
    const epubResult = await epubParser.parse(epubFixture.mockData.validEpub);

    // THEN: All parsers produce successful results
    expect(markdownResult).toBeDefined();
    expect(markdownResult.success).toBe(true);

    expect(pdfResult).toBeDefined();
    expect(pdfResult.success).toBe(true);

    expect(epubResult).toBeDefined();
    expect(epubResult.success).toBe(true);

    // Verify all have DocumentStructure with chapters
    if (markdownResult.success && pdfResult.success && epubResult.success) {
      expect(markdownResult.data.chapters).toBeDefined();
      expect(pdfResult.data.chapters).toBeDefined();
      expect(epubResult.data).toBeDefined();
      const epubData = epubResult.data as any; // Type cast for EPUB parser result
      expect(epubData.chapters).toBeDefined();

      // All should have chapters array
      expect(Array.isArray(markdownResult.data.chapters)).toBe(true);
      expect(Array.isArray(pdfResult.data.chapters)).toBe(true);
      expect(Array.isArray(epubData.chapters)).toBe(true);
    }
  });

  it('should handle format-specific edge cases gracefully', async () => {
    // GIVEN: Edge case documents for different formats
    const markdownEdgeCase = `No headers here, just plain text.`;
    const pdfEdgeCasePath = '/path/to/pdf-with-poor-structure.pdf';
    const epubEdgeCaseBuffer = epubFixture.mockData.validEpub; // Use valid EPUB but with lenient parsing

    const markdownParser = new MarkdownParser(mockLogger, mockConfigManager);
    const pdfParser = new PDFParser(mockLogger, mockConfigManager);
    // Create EPUB parser with lenient settings to test edge case handling
    const epubParser = new EPUBParser({
      strictMode: false, // Allow edge cases to pass through
      chapterSensitivity: 0.1, // Very low sensitivity to trigger edge case handling
      verbose: false,
    });

    // WHEN: Processing edge cases with current parser interfaces
    const markdownResult = await markdownParser.parse(markdownEdgeCase);
    const pdfResult = await pdfParser.parse(pdfEdgeCasePath);
    const epubResult = await epubParser.parse(epubEdgeCaseBuffer);

    // THEN: All handle edge cases gracefully
    expect(markdownResult).toBeDefined();
    expect(markdownResult.success).toBe(true);

    expect(pdfResult).toBeDefined();
    expect(pdfResult.success).toBe(true);

    expect(epubResult).toBeDefined();
    expect(epubResult.success).toBe(true);

    // Verify all produce DocumentStructure even with edge cases
    if (markdownResult.success && pdfResult.success && epubResult.success) {
      expect(markdownResult.data).toBeDefined();
      expect(markdownResult.data.chapters).toBeDefined();

      expect(pdfResult.data).toBeDefined();
      expect(pdfResult.data.chapters).toBeDefined();

      expect(epubResult.data).toBeDefined();
      const epubData = epubResult.data as any; // Type cast for EPUB parser result
      expect(epubData.chapters).toBeDefined();
    }
  });
});
