/**
 * Unit tests for PDF parser text extraction encoding handling.
 * Test case 1.3-PDF-020.3: Text extraction encoding validation.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import type { ConfigManager } from '../../../../src/config/config-manager';
import { PDFParser } from '../../../../src/core/document-processing/parsers/pdf-parser';
import type { Logger } from '../../../../src/interfaces/logger';
import {
  MockConfigManagerFactory,
  MockLoggerFactory,
} from '../../../../tests/support/document-processing-factories';
import { validateUnicodeEncoding } from './pdf-parser-text-extraction-helpers';

describe('PDFParser Text Extraction Encoding', () => {
  let mockLogger: Logger;
  let mockConfigManager: ConfigManager;

  beforeEach(() => {
    mockLogger = MockLoggerFactory.create();
    mockConfigManager = MockConfigManagerFactory.createDefault();
  });

  describe('1.3-PDF-020.3: Text extraction encoding validation', () => {
    it('should handle different text encodings during extraction', async () => {
      // Given: A PDF parser instance with encoding support
      const encodingConfig = {
        maxFileSize: 50 * 1024 * 1024,
        confidenceThreshold: 0.7,
        extractImages: true,
        extractTables: true,
      };

      const encodingAwareParser = new PDFParser(
        mockLogger,
        mockConfigManager,
        encodingConfig
      );

      // When: A PDF with various text encodings is parsed
      const result = await encodingAwareParser.parse('test-file.pdf');

      // Then: Text should be extracted with proper encoding handling
      expect(result.success).toBe(true);
      if (!result.success) return;
      const documentStructure = result.data;

      // Validate encoding information in metadata
      expect(documentStructure.metadata).toBeDefined();

      // Validate that text content is properly decoded
      validateUnicodeEncoding(documentStructure.chapters);
    });
  });
});
