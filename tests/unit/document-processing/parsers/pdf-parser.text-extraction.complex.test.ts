/**
 * Unit tests for PDF parser text extraction from complex structures.
 * Test case 1.3-PDF-020.5: Complex structure text extraction validation.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import type { ConfigManager } from '../../../../src/config/config-manager';
import { PDFParser } from '../../../../src/core/document-processing/parsers/pdf-parser';
import type { Logger } from '../../../../src/interfaces/logger';
import {
  MockConfigManagerFactory,
  MockLoggerFactory,
} from '../../../../tests/support/document-processing-factories';
import { validateComplexStructure } from './pdf-parser-text-extraction-helpers';

describe('PDFParser Text Extraction Complex Structures', () => {
  let mockLogger: Logger;
  let mockConfigManager: ConfigManager;

  beforeEach(() => {
    mockLogger = MockLoggerFactory.create();
    mockConfigManager = MockConfigManagerFactory.createDefault();
  });

  describe('1.3-PDF-020.5: Complex structure text extraction validation', () => {
    it('should handle text extraction from complex PDF structures', async () => {
      // Given: A PDF parser configured for complex structures
      const complexConfig = {
        maxFileSize: 50 * 1024 * 1024,
        confidenceThreshold: 0.6, // Lower threshold for complex docs
        extractImages: true,
        extractTables: true,
      };

      const complexParser = new PDFParser(
        mockLogger,
        mockConfigManager,
        complexConfig
      );

      // When: A complex PDF document is parsed
      const result = await complexParser.parse('test-file.pdf');

      // Then: Text should be extracted maintaining structural integrity
      expect(result.success).toBe(true);
      if (!result.success) return;
      const documentStructure = result.data;

      // Validate that complex structure elements are handled
      validateComplexStructure(documentStructure);
    });
  });
});
