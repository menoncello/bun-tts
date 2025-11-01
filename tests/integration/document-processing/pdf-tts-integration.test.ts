/**
 * Integration tests for PDF parser TTS pipeline integration.
 * Test case 1.3-PDF-027: TTS pipeline integration testing.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { PinoLoggerAdapter } from '../../../src/adapters/pino-logger-adapter';
import { ConfigManager } from '../../../src/config/config-manager';
import { PDFParser } from '../../../src/core/document-processing/parsers/pdf-parser';
import type { DocumentStructure } from '../../../src/core/document-processing/types';

// Helper functions for TTS integration validation
function validateTTSRequirements(documentStructure: DocumentStructure): void {
  validateProcessingMetrics(documentStructure);
  validateChapterDurations(documentStructure);
  validateContentCounts(documentStructure);
  validateSentenceDurations(documentStructure);
}

function validateProcessingMetrics(documentStructure: DocumentStructure): void {
  if (documentStructure.processingMetrics) {
    expect(documentStructure.processingMetrics.parseDurationMs).toBeGreaterThan(
      0
    );
  }
}

function validateChapterDurations(documentStructure: DocumentStructure): void {
  const totalChapterDurations = documentStructure.chapters.reduce(
    (sum, chapter) => sum + (chapter?.estimatedDuration || 0),
    0
  );
  expect(totalChapterDurations).toBeGreaterThan(0);
}

function validateContentCounts(documentStructure: DocumentStructure): void {
  expect(documentStructure.totalSentences).toBeGreaterThan(0);

  // Calculate total words from chapters if not directly available
  const totalWords = documentStructure.chapters.reduce(
    (sum, chapter) => sum + (chapter?.wordCount || 0),
    0
  );
  expect(totalWords).toBeGreaterThan(0);
}

function validateSentenceDurations(documentStructure: DocumentStructure): void {
  let totalSentenceDurations = 0;
  for (const chapter of documentStructure.chapters) {
    if (!chapter) continue;
    for (const paragraph of chapter.paragraphs) {
      if (!paragraph) continue;
      for (const sentence of paragraph.sentences) {
        if (!sentence) continue;
        totalSentenceDurations += sentence.estimatedDuration;
      }
    }
  }
  expect(totalSentenceDurations).toBeGreaterThan(0);
}

function validateTTSOutputStructure(
  documentStructure: DocumentStructure
): void {
  for (const chapter of documentStructure.chapters) {
    if (!chapter) continue;
    validateChapterOutputStructure(chapter);
  }
}

function validateChapterOutputStructure(
  chapter: DocumentStructure['chapters'][0]
): void {
  for (const paragraph of chapter.paragraphs) {
    if (!paragraph) continue;
    validateParagraphOutputStructure(paragraph);
  }
}

function validateParagraphOutputStructure(
  paragraph: DocumentStructure['chapters'][0]['paragraphs'][0]
): void {
  expect(typeof paragraph.includeInAudio).toBe('boolean');
  expect(paragraph.rawText).toBeDefined();
  expect(paragraph.rawText.length).toBeGreaterThan(0);

  for (const sentence of paragraph.sentences) {
    if (!sentence) continue;
    expect(sentence.text).toBeDefined();
    expect(sentence.text.trim().length).toBeGreaterThan(0);
    expect(sentence.estimatedDuration).toBeGreaterThan(0);
  }
}

function validateTTSMetadata(documentStructure: DocumentStructure): void {
  validateDocumentMetadata(documentStructure);
  validateDocumentStats(documentStructure);
  validateDocumentConfidence(documentStructure);
  validateChapterConfidence(documentStructure);
}

function validateDocumentMetadata(documentStructure: DocumentStructure): void {
  expect(documentStructure.metadata.title).toBeDefined();
  expect(documentStructure.metadata.author).toBeDefined();
  expect(documentStructure.metadata.language).toBeDefined();
  expect(documentStructure.metadata.wordCount).toBeGreaterThan(0);
}

function validateDocumentStats(documentStructure: DocumentStructure): void {
  if (documentStructure.stats) {
    expect(documentStructure.stats.processingTimeMs).toBeGreaterThan(0);
  }
}

function validateDocumentConfidence(
  documentStructure: DocumentStructure
): void {
  expect(documentStructure.confidence).toBeGreaterThanOrEqual(0);
  expect(documentStructure.confidence).toBeLessThanOrEqual(1);
}

function validateChapterConfidence(documentStructure: DocumentStructure): void {
  for (const chapter of documentStructure.chapters) {
    if (!chapter) continue;
    for (const paragraph of chapter.paragraphs) {
      if (!paragraph) continue;
      expect(paragraph.confidence).toBeGreaterThanOrEqual(0);
      expect(paragraph.confidence).toBeLessThanOrEqual(1);
    }
  }
}

function validateTTSNavigation(documentStructure: DocumentStructure): void {
  if (documentStructure.chapters.length <= 1) return;

  validateChapterNavigation(documentStructure);
}

function validateChapterNavigation(documentStructure: DocumentStructure): void {
  for (let i = 0; i < documentStructure.chapters.length; i++) {
    const chapter = documentStructure.chapters[i];
    if (!chapter) continue;

    expect(chapter.position).toBe(i);
    expect(chapter.id).toBeDefined();
    expect(chapter.title).toBeDefined();

    validateParagraphNavigation(chapter);
  }
}

function validateParagraphNavigation(
  chapter: DocumentStructure['chapters'][0]
): void {
  for (let j = 0; j < chapter.paragraphs.length; j++) {
    const paragraph = chapter.paragraphs[j];
    if (!paragraph) continue;

    expect(paragraph.position).toBe(j);
    expect(paragraph.id).toBeDefined();

    validateSentenceNavigation(paragraph);
  }
}

function validateSentenceNavigation(
  paragraph: DocumentStructure['chapters'][0]['paragraphs'][0]
): void {
  for (let k = 0; k < paragraph.sentences.length; k++) {
    const sentence = paragraph.sentences[k];
    if (!sentence) continue;
    expect(sentence.position).toBe(k);
    expect(sentence.id).toBeDefined();
  }
}

function validateTTSTiming(documentStructure: DocumentStructure): void {
  validateProcessingMetrics(documentStructure);
  validateChapterTiming(documentStructure);
  validateSentenceTiming(documentStructure);
}

function validateChapterTiming(documentStructure: DocumentStructure): void {
  for (const chapter of documentStructure.chapters) {
    if (!chapter) continue;
    expect(chapter.estimatedDuration).toBeGreaterThan(0);
    validateCalculatedChapterDuration(chapter);
  }
}

function validateCalculatedChapterDuration(
  chapter: DocumentStructure['chapters'][0]
): void {
  const calculatedChapterDuration = chapter.paragraphs.reduce(
    (sum, paragraph) =>
      sum +
      (paragraph?.sentences.reduce(
        (sentenceSum, sentence) =>
          sentenceSum + (sentence?.estimatedDuration || 0),
        0
      ) || 0),
    0
  );
  expect(calculatedChapterDuration).toBeGreaterThan(0);
}

function validateSentenceTiming(documentStructure: DocumentStructure): void {
  for (const chapter of documentStructure.chapters) {
    if (!chapter) continue;
    for (const paragraph of chapter.paragraphs) {
      if (!paragraph) continue;
      validateParagraphSentenceTiming(paragraph);
    }
  }
}

function validateParagraphSentenceTiming(
  paragraph: DocumentStructure['chapters'][0]['paragraphs'][0]
): void {
  for (const sentence of paragraph.sentences) {
    if (!sentence) continue;
    expect(sentence.estimatedDuration).toBeGreaterThan(0);
    if (sentence.wordCount > 0) {
      expect(sentence.estimatedDuration / sentence.wordCount).toBeGreaterThan(
        0
      );
    }
  }
}

function validateTTSFormatting(documentStructure: DocumentStructure): void {
  validateParagraphFormatting(documentStructure);
  validateDocumentElements(documentStructure);
}

function validateParagraphFormatting(
  documentStructure: DocumentStructure
): void {
  for (const chapter of documentStructure.chapters) {
    if (!chapter) continue;
    for (const paragraph of chapter.paragraphs) {
      if (!paragraph) continue;
      expect(['text', 'heading', 'code', 'quote', 'list-item']).toContain(
        paragraph.type
      );

      validateSentenceFormatting(paragraph);
    }
  }
}

function validateSentenceFormatting(
  paragraph: DocumentStructure['chapters'][0]['paragraphs'][0]
): void {
  for (const sentence of paragraph.sentences) {
    if (!sentence) continue;
    expect(typeof sentence.hasFormatting).toBe('boolean');
  }
}

function validateDocumentElements(documentStructure: DocumentStructure): void {
  if (documentStructure.elements) {
    expect(documentStructure.elements).toBeInstanceOf(Array);
    for (const element of documentStructure.elements) {
      expect(element.type).toBeDefined();
      expect(element.rawContent).toBeDefined();
      expect(element.position).toBeGreaterThanOrEqual(0);
    }
  }
}

function validateTTSJsonSerialization(
  documentStructure: DocumentStructure
): void {
  validateJsonMetadata(documentStructure);
  validateJsonChapters(documentStructure);
  validateJsonContentCounts(documentStructure);
  validateJsonProcessingMetrics(documentStructure);
  validateJsonStructure(documentStructure);
}

function validateJsonMetadata(documentStructure: DocumentStructure): void {
  expect(documentStructure.metadata).toBeDefined();
}

function validateJsonChapters(documentStructure: DocumentStructure): void {
  expect(documentStructure.chapters).toBeInstanceOf(Array);
}

function validateJsonContentCounts(documentStructure: DocumentStructure): void {
  // Calculate total words from chapters if not directly available
  const totalWords = documentStructure.chapters.reduce(
    (sum, chapter) => sum + (chapter?.wordCount || 0),
    0
  );
  expect(totalWords).toBeGreaterThan(0);
  expect(documentStructure.totalSentences).toBeGreaterThan(0);
}

function validateJsonProcessingMetrics(
  documentStructure: DocumentStructure
): void {
  expect(documentStructure.processingMetrics).toBeDefined();
  if (documentStructure.processingMetrics) {
    expect(documentStructure.processingMetrics.parseDurationMs).toBeGreaterThan(
      0
    );
  }
}

function validateJsonStructure(documentStructure: DocumentStructure): void {
  if (documentStructure.chapters.length > 0) {
    const chapter = documentStructure.chapters[0];
    if (!chapter) return;
    expect(chapter.paragraphs).toBeInstanceOf(Array);
    if (chapter.paragraphs.length > 0) {
      const paragraph = chapter.paragraphs[0];
      if (!paragraph) return;
      expect(paragraph.sentences).toBeInstanceOf(Array);
    }
  }
}

function runTTSIntegrationTest() {
  describe('1.3-PDF-027: TTS Pipeline Integration', () => {
    let configManager: ConfigManager;
    let logger: PinoLoggerAdapter;

    beforeEach(async () => {
      configManager = new ConfigManager();
      await configManager.load();
      logger = new PinoLoggerAdapter();
    });

    it('should integrate with downstream TTS processing pipeline', async () => {
      // Given: A PDF parser instance is configured for TTS integration
      const ttsConfig = {
        maxFileSize: 50 * 1024 * 1024, // 50MB
        confidenceThreshold: 0.7,
        extractImages: true,
        extractTables: true,
      };

      const ttsParser = new PDFParser(logger, configManager, ttsConfig);

      // When: A PDF document is parsed for TTS processing
      const result = await ttsParser.parse('test-file.pdf');

      // Then: The output should be fully compatible with TTS pipeline requirements
      expect(result.success).toBe(true);
      if (!result.success) return;
      const documentStructure = result.data;

      validateTTSRequirements(documentStructure);
    });
  });
}

function runTTSOutputStructureTest() {
  describe('TTS Output Structure Validation', () => {
    let pdfParser: PDFParser;
    let configManager: ConfigManager;
    let logger: PinoLoggerAdapter;

    beforeEach(async () => {
      configManager = new ConfigManager();
      await configManager.load();
      logger = new PinoLoggerAdapter();
      pdfParser = new PDFParser(logger, configManager);
    });

    it('should provide structured output suitable for TTS audio generation', async () => {
      // Given: A PDF parser configured for TTS output
      // When: PDF content is processed
      const result = await pdfParser.parse('test-file.pdf');

      // Then: Output should be optimized for TTS audio generation
      expect(result.success).toBe(true);
      if (!result.success) return;
      const documentStructure = result.data;

      validateTTSOutputStructure(documentStructure);
    });
  });
}

function runTTSMetadataTest() {
  describe('TTS Metadata Requirements', () => {
    let pdfParser: PDFParser;
    let configManager: ConfigManager;
    let logger: PinoLoggerAdapter;

    beforeEach(async () => {
      configManager = new ConfigManager();
      await configManager.load();
      logger = new PinoLoggerAdapter();
      pdfParser = new PDFParser(logger, configManager);
    });

    it('should handle TTS-specific metadata requirements', async () => {
      // Given: A PDF parser for TTS processing
      // When: PDF with complex structure is parsed
      const result = await pdfParser.parse('test-file.pdf');

      // Then: TTS-specific metadata should be available
      expect(result.success).toBe(true);
      if (!result.success) return;
      const documentStructure = result.data;

      validateTTSMetadata(documentStructure);
    });
  });
}

function runTTSNavigationTest() {
  describe('TTS Document Navigation', () => {
    let pdfParser: PDFParser;
    let configManager: ConfigManager;
    let logger: PinoLoggerAdapter;

    beforeEach(async () => {
      configManager = new ConfigManager();
      await configManager.load();
      logger = new PinoLoggerAdapter();
      pdfParser = new PDFParser(logger, configManager);
    });

    it('should maintain document hierarchy for TTS navigation', async () => {
      // Given: A PDF parser for TTS output
      // When: A structured PDF document is parsed
      const result = await pdfParser.parse('test-file.pdf');

      // Then: Document hierarchy should be preserved for TTS navigation
      expect(result.success).toBe(true);
      if (!result.success) return;
      const documentStructure = result.data;

      validateTTSNavigation(documentStructure);
    });
  });
}

function runTTSTimingTest() {
  describe('TTS Timing Information', () => {
    let pdfParser: PDFParser;
    let configManager: ConfigManager;
    let logger: PinoLoggerAdapter;

    beforeEach(async () => {
      configManager = new ConfigManager();
      await configManager.load();
      logger = new PinoLoggerAdapter();
      pdfParser = new PDFParser(logger, configManager);
    });

    it('should provide accurate timing information for TTS scheduling', async () => {
      // Given: A PDF parser optimized for TTS processing
      // When: Document content is analyzed
      const result = await pdfParser.parse('test-file.pdf');

      // Then: Timing information should be accurate for TTS scheduling
      expect(result.success).toBe(true);
      if (!result.success) return;
      const documentStructure = result.data;

      validateTTSTiming(documentStructure);
    });
  });
}

function runTTSFormattingTest() {
  describe('TTS Special Formatting', () => {
    let pdfParser: PDFParser;
    let configManager: ConfigManager;
    let logger: PinoLoggerAdapter;

    beforeEach(async () => {
      configManager = new ConfigManager();
      await configManager.load();
      logger = new PinoLoggerAdapter();
      pdfParser = new PDFParser(logger, configManager);
    });

    it('should handle special formatting for TTS processing', async () => {
      // Given: A PDF parser that preserves formatting for TTS
      // When: PDF with special formatting is parsed
      const result = await pdfParser.parse('test-file.pdf');

      // Then: Special formatting should be handled appropriately for TTS
      expect(result.success).toBe(true);
      if (!result.success) return;
      const documentStructure = result.data;

      validateTTSFormatting(documentStructure);
    });
  });
}

function runTTSJsonSerializationTest() {
  describe('TTS JSON Serialization', () => {
    let pdfParser: PDFParser;
    let configManager: ConfigManager;
    let logger: PinoLoggerAdapter;

    beforeEach(async () => {
      configManager = new ConfigManager();
      await configManager.load();
      logger = new PinoLoggerAdapter();
      pdfParser = new PDFParser(logger, configManager);
    });

    it('should serialize to TTS-compatible JSON format', async () => {
      // Given: A PDF parser configured for TTS integration
      // When: A PDF document is parsed
      const result = await pdfParser.parse('test-file.pdf');
      expect(result.success).toBe(true);

      // When: The output is serialized for TTS pipeline consumption
      if (!result.success) return;
      const jsonOutput = JSON.stringify(result.data, null, 2);

      // Then: The JSON should be valid and contain all TTS-required fields
      expect(() => JSON.parse(jsonOutput)).not.toThrow();

      const parsedOutput = JSON.parse(jsonOutput) as DocumentStructure;
      validateTTSJsonSerialization(parsedOutput);
    });
  });
}

// Execute all test suites
runTTSIntegrationTest();
runTTSOutputStructureTest();
runTTSMetadataTest();
runTTSNavigationTest();
runTTSTimingTest();
runTTSFormattingTest();
runTTSJsonSerializationTest();
