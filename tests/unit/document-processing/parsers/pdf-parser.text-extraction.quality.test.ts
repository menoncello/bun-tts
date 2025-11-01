/**
 * Unit tests for PDF parser text extraction quality validation.
 * Test case 1.3-PDF-020.6: Text extraction quality validation.
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
  validateContentQuality,
} from './pdf-parser-text-extraction-helpers';

describe('PDFParser Text Extraction Quality', () => {
  let pdfParser: PDFParser;
  let mockLogger: Logger;
  let mockConfigManager: ConfigManager;

  beforeEach(() => {
    mockLogger = MockLoggerFactory.create();
    mockConfigManager = MockConfigManagerFactory.createDefault();
    pdfParser = new PDFParser(mockLogger, mockConfigManager);
  });

  describe('1.3-PDF-020.6: Text extraction quality validation', () => {
    it('should validate text extraction quality and completeness', async () => {
      // Given: A PDF parser instance is configured
      // When: Text extraction is performed
      const result = await pdfParser.parse('test-file.pdf');

      // Then: Extraction quality should be validated
      expect(result.success).toBe(true);
      if (!result.success) return;
      const documentStructure = result.data;

      // Validate extraction completeness
      validateBasicDocumentStructure(documentStructure);

      // Validate content quality metrics
      validateContentQuality(documentStructure);
    });
  });
});
