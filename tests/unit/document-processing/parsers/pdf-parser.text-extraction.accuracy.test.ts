/**
 * Unit tests for PDF parser text extraction accuracy.
 * Test case 1.3-PDF-020.2: Text extraction accuracy validation.
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
  validateTextAccuracy,
  validateWordCountConsistency,
  validateSentenceCountConsistency,
} from './pdf-parser-text-extraction-helpers';

describe('PDFParser Text Extraction Accuracy', () => {
  let pdfParser: PDFParser;
  let mockLogger: Logger;
  let mockConfigManager: ConfigManager;

  beforeEach(() => {
    mockLogger = MockLoggerFactory.create();
    mockConfigManager = MockConfigManagerFactory.createDefault();
    pdfParser = new PDFParser(mockLogger, mockConfigManager);
  });

  describe('1.3-PDF-020.2: Text extraction accuracy validation', () => {
    it('should maintain text accuracy during extraction process', async () => {
      // Given: A PDF parser instance is configured
      // When: Text content is extracted from PDF
      const result = await pdfParser.parse('test-file.pdf');

      // Then: Extracted text should maintain accuracy and completeness
      expect(result.success).toBe(true);
      if (!result.success) return;
      const documentStructure = result.data;

      // Validate text accuracy metrics
      validateTextAccuracy(documentStructure);

      // Validate word count consistency
      validateWordCountConsistency(documentStructure);

      // Validate sentence count consistency
      validateSentenceCountConsistency(documentStructure);
    });
  });
});
