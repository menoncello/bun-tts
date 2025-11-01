/**
 * Unit tests for PDF parser TTS output validation.
 * Test case 1.3-PDF-026: TTS-compatible structured output generation.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import type { ConfigManager } from '../../../../src/config/config-manager';
import { PDFParser } from '../../../../src/core/document-processing/parsers/pdf-parser';
import type { DocumentStructure } from '../../../../src/core/document-processing/types';
import type { Logger } from '../../../../src/interfaces/logger';
import {
  MockConfigManagerFactory,
  MockLoggerFactory,
} from '../../../../tests/support/document-processing-factories';

// Test setup function
function setupPDFParserTest(): {
  pdfParser: PDFParser;
  mockLogger: Logger;
  mockConfigManager: ConfigManager;
} {
  const mockLogger = MockLoggerFactory.create();
  const mockConfigManager = MockConfigManagerFactory.createDefault();
  const pdfParser = new PDFParser(mockLogger, mockConfigManager);

  return { pdfParser, mockLogger, mockConfigManager };
}

// Helper function to parse document and get structure
async function parseDocumentAndGetStructure(
  pdfParser: PDFParser,
  filename = 'test-file.pdf'
): Promise<DocumentStructure | null> {
  const result = await pdfParser.parse(filename);
  if (!result.success) {
    return null;
  }
  return result.data;
}

// Main test describe blocks - split into smaller groups
describe('PDFParser TTS Output Validation - Document Structure', () => {
  let pdfParser: PDFParser;

  beforeEach(() => {
    const { pdfParser: _parser } = setupPDFParserTest();
    pdfParser = _parser;
  });

  it('should generate DocumentStructure compatible with TTS processing pipeline', async () => {
    const documentStructure = await parseDocumentAndGetStructure(pdfParser);
    expect(documentStructure).not.toBeNull();
    if (documentStructure) {
      expect(documentStructure.metadata).toBeDefined();
      expect(documentStructure.chapters).toBeInstanceOf(Array);
      expect(documentStructure.totalParagraphs).toBeGreaterThanOrEqual(0);
      expect(documentStructure.totalSentences).toBeGreaterThanOrEqual(0);
      expect(documentStructure.totalWordCount).toBeGreaterThanOrEqual(0);
      expect(documentStructure.confidence).toBeGreaterThanOrEqual(0);
      expect(documentStructure.confidence).toBeLessThanOrEqual(1);
      expect(documentStructure.stats).toBeDefined();
      expect(documentStructure.processingMetrics).toBeDefined();
    }
  });
});

describe('PDFParser TTS Output Validation - Sentence Properties', () => {
  let pdfParser: PDFParser;

  beforeEach(() => {
    const { pdfParser: _parser } = setupPDFParserTest();
    pdfParser = _parser;
  });

  it('should generate sentences with TTS-required properties', async () => {
    const documentStructure = await parseDocumentAndGetStructure(pdfParser);
    expect(documentStructure).not.toBeNull();

    if (!documentStructure || documentStructure.chapters.length === 0) {
      return;
    }

    const firstChapter = documentStructure.chapters[0];
    if (!firstChapter || firstChapter.paragraphs.length === 0) {
      return;
    }

    const firstParagraph = firstChapter.paragraphs[0];
    if (!firstParagraph || firstParagraph.sentences.length === 0) {
      return;
    }

    const firstSentence = firstParagraph.sentences[0];
    if (!firstSentence) {
      return;
    }

    // Validate TTS-required properties
    expect(firstSentence.id).toBeDefined();
    expect(firstSentence.text).toBeDefined();
    expect(typeof firstSentence.text).toBe('string');
    expect(firstSentence.text.length).toBeGreaterThan(0);
    expect(firstSentence.position).toBeGreaterThanOrEqual(0);
    expect(firstSentence.documentPosition).toBeDefined();
    if (firstSentence.documentPosition) {
      expect(firstSentence.documentPosition.chapter).toBeGreaterThanOrEqual(0);
      expect(firstSentence.documentPosition.paragraph).toBeGreaterThanOrEqual(
        0
      );
      expect(firstSentence.documentPosition.sentence).toBeGreaterThanOrEqual(0);
      expect(firstSentence.documentPosition.startChar).toBeGreaterThanOrEqual(
        0
      );
      expect(firstSentence.documentPosition.endChar).toBeGreaterThanOrEqual(0);
    }
    expect(firstSentence.charRange).toBeDefined();
    if (firstSentence.charRange) {
      expect(firstSentence.charRange.start).toBeGreaterThanOrEqual(0);
      expect(firstSentence.charRange.end).toBeGreaterThan(
        firstSentence.charRange.start
      );
    }
    expect(firstSentence.wordCount).toBeGreaterThanOrEqual(0);
    expect(firstSentence.estimatedDuration).toBeGreaterThanOrEqual(0);
    expect(typeof firstSentence.hasFormatting).toBe('boolean');
  });
});

describe('PDFParser TTS Output Validation - Paragraph Properties', () => {
  let pdfParser: PDFParser;

  beforeEach(() => {
    const { pdfParser: _parser } = setupPDFParserTest();
    pdfParser = _parser;
  });

  it('should generate paragraphs with TTS-required properties', async () => {
    const documentStructure = await parseDocumentAndGetStructure(pdfParser);
    expect(documentStructure).not.toBeNull();
    if (documentStructure && documentStructure.chapters.length > 0) {
      const firstChapter = documentStructure.chapters[0];
      if (!firstChapter) return;
      if (firstChapter.paragraphs.length > 0) {
        const firstParagraph = firstChapter.paragraphs[0];
        if (!firstParagraph) return;

        expect(firstParagraph.id).toBeDefined();
        expect(firstParagraph.sentences).toBeInstanceOf(Array);
        expect(firstParagraph.position).toBeGreaterThanOrEqual(0);
        expect(firstParagraph.documentPosition).toBeDefined();
        if (firstParagraph.documentPosition) {
          expect(
            firstParagraph.documentPosition.chapter
          ).toBeGreaterThanOrEqual(0);
          expect(
            firstParagraph.documentPosition.paragraph
          ).toBeGreaterThanOrEqual(0);
          expect(
            firstParagraph.documentPosition.startChar
          ).toBeGreaterThanOrEqual(0);
          expect(
            firstParagraph.documentPosition.endChar
          ).toBeGreaterThanOrEqual(0);
        }
        expect(firstParagraph.charRange).toBeDefined();
        expect(firstParagraph.contentType).toBeDefined();
        expect(['text', 'code', 'quote', 'list-item']).toContain(
          firstParagraph.contentType || 'text'
        );
        expect(firstParagraph.type).toBeDefined();
        expect(['text', 'heading', 'code', 'quote', 'list-item']).toContain(
          firstParagraph.type
        );
        expect(firstParagraph.rawText).toBeDefined();
        expect(typeof firstParagraph.includeInAudio).toBe('boolean');
        expect(firstParagraph.confidence).toBeGreaterThanOrEqual(0);
        expect(firstParagraph.confidence).toBeLessThanOrEqual(1);
        expect(firstParagraph.wordCount).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('PDFParser TTS Output Validation - Chapter Properties', () => {
  let pdfParser: PDFParser;

  beforeEach(() => {
    const { pdfParser: _parser } = setupPDFParserTest();
    pdfParser = _parser;
  });

  it('should generate chapters with TTS-required properties', async () => {
    const documentStructure = await parseDocumentAndGetStructure(pdfParser);
    expect(documentStructure).not.toBeNull();
    if (documentStructure && documentStructure.chapters.length > 0) {
      const firstChapter = documentStructure.chapters[0];
      if (!firstChapter) return;

      expect(firstChapter.id).toBeDefined();
      expect(firstChapter.title).toBeDefined();
      expect(typeof firstChapter.title).toBe('string');
      expect(firstChapter.level).toBeGreaterThanOrEqual(1);
      expect(firstChapter.level).toBeLessThanOrEqual(6);
      expect(firstChapter.paragraphs).toBeInstanceOf(Array);
      expect(firstChapter.position).toBeGreaterThanOrEqual(0);
      expect(firstChapter.charRange).toBeDefined();
      expect(firstChapter.depth).toBeGreaterThanOrEqual(0);
      expect(firstChapter.wordCount).toBeGreaterThanOrEqual(0);
      expect(firstChapter.estimatedDuration).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('PDFParser TTS Output Validation - Processing Metrics', () => {
  let pdfParser: PDFParser;

  beforeEach(() => {
    const { pdfParser: _parser } = setupPDFParserTest();
    pdfParser = _parser;
  });

  it('should include processing metrics required for TTS pipeline', async () => {
    const documentStructure = await parseDocumentAndGetStructure(pdfParser);
    expect(documentStructure).not.toBeNull();
    if (documentStructure) {
      expect(documentStructure.processingMetrics).toBeDefined();
      expect(
        documentStructure.processingMetrics?.parseDurationMs ?? 0
      ).toBeGreaterThanOrEqual(0);

      expect(documentStructure.stats).toBeDefined();
      expect(
        documentStructure.stats?.processingTimeMs ?? 0
      ).toBeGreaterThanOrEqual(0);
      expect(documentStructure.stats?.errorCount ?? 0).toBeGreaterThanOrEqual(
        0
      );
      expect(
        documentStructure.stats?.fallbackCount ?? 0
      ).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('PDFParser TTS Output Validation - Metadata', () => {
  let pdfParser: PDFParser;

  beforeEach(() => {
    const { pdfParser: _parser } = setupPDFParserTest();
    pdfParser = _parser;
  });

  it('should provide metadata required for TTS processing', async () => {
    const documentStructure = await parseDocumentAndGetStructure(pdfParser);
    expect(documentStructure).not.toBeNull();
    if (documentStructure) {
      expect(documentStructure.metadata).toBeDefined();
      expect(documentStructure.metadata.format).toBe('pdf');
      expect(documentStructure.metadata.wordCount).toBeGreaterThanOrEqual(0);
      expect(documentStructure.metadata.characterCount).toBeGreaterThanOrEqual(
        0
      );
      expect(documentStructure.metadata.format).toBe('pdf');
    }
  });
});

describe('PDFParser TTS Output Validation - JSON Serialization', () => {
  let pdfParser: PDFParser;

  beforeEach(() => {
    const { pdfParser: _parser } = setupPDFParserTest();
    pdfParser = _parser;
  });

  it('should serialize to JSON format for TTS pipeline consumption', async () => {
    const documentStructure = await parseDocumentAndGetStructure(pdfParser);
    expect(documentStructure).not.toBeNull();
    if (documentStructure) {
      const jsonString = JSON.stringify(documentStructure);
      expect(() => JSON.parse(jsonString)).not.toThrow();

      const parsedStructure = JSON.parse(jsonString) as DocumentStructure;
      expect(parsedStructure.metadata).toBeDefined();
      expect(parsedStructure.chapters).toBeInstanceOf(Array);
      expect(parsedStructure.totalParagraphs).toBeGreaterThanOrEqual(0);
      expect(parsedStructure.totalSentences).toBeGreaterThanOrEqual(0);
      expect(parsedStructure.processingMetrics).toBeDefined();
    }
  });
});
