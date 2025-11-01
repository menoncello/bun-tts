/**
 * Unit tests for PDF parser text extraction character positioning.
 * Test case 1.3-PDF-020.4: Text extraction positioning validation.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import type { ConfigManager } from '../../../../src/config/config-manager';
import { PDFParser } from '../../../../src/core/document-processing/parsers/pdf-parser';
import type { Logger } from '../../../../src/interfaces/logger';
import {
  MockConfigManagerFactory,
  MockLoggerFactory,
} from '../../../../tests/support/document-processing-factories';
import { validateCharacterPositions } from './pdf-parser-text-extraction-helpers';

describe('PDFParser Text Extraction Positioning', () => {
  let pdfParser: PDFParser;
  let mockLogger: Logger;
  let mockConfigManager: ConfigManager;

  beforeEach(() => {
    mockLogger = MockLoggerFactory.create();
    mockConfigManager = MockConfigManagerFactory.createDefault();
    pdfParser = new PDFParser(mockLogger, mockConfigManager);
  });

  describe('1.3-PDF-020.4: Text extraction positioning validation', () => {
    it('should extract text with proper character ranges and positions', async () => {
      // Given: A PDF parser instance is configured
      // When: Text content is extracted with position tracking
      const result = await pdfParser.parse('test-file.pdf');

      // Then: Character ranges and positions should be accurate
      expect(result.success).toBe(true);
      if (!result.success) return;
      const documentStructure = result.data;

      // Validate character positions and ranges
      validateCharacterPositions(documentStructure);
    });
  });
});
