/**
 * Unit tests for PDF parser basic text extraction.
 * Test case 1.3-PDF-020.1: Basic text extraction validation.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import type { ConfigManager } from '../../../../src/config/config-manager';
import { PDFParser } from '../../../../src/core/document-processing/parsers/pdf-parser';
import type { Logger } from '../../../../src/interfaces/logger';
import {
  MockConfigManagerFactory,
  MockLoggerFactory,
} from '../../../../tests/support/document-processing-factories';
import {
  validateBasicDocumentStructure,
  validateChapterStructure,
} from './pdf-parser-text-extraction-helpers';

describe('PDFParser Basic Text Extraction', () => {
  let pdfParser: PDFParser;
  let mockLogger: Logger;
  let mockConfigManager: ConfigManager;

  beforeEach(() => {
    mockLogger = MockLoggerFactory.create();
    mockConfigManager = MockConfigManagerFactory.createDefault();
    pdfParser = new PDFParser(mockLogger, mockConfigManager);
  });

  describe('1.3-PDF-020.1: Basic text extraction validation', () => {
    it('should extract complete text content from PDF documents', async () => {
      // Given: A PDF parser instance is configured
      // When: A PDF document is parsed for text extraction
      const result = await pdfParser.parse('test-file.pdf');

      // Then: Complete text content should be extracted successfully
      expect(result.success).toBe(true);

      if (!result.success) return;
      const documentStructure = result.data;

      // Validate basic document structure
      validateBasicDocumentStructure(documentStructure);

      // Validate chapter structure and content
      validateChapterStructure(documentStructure.chapters);
    });
  });
});
