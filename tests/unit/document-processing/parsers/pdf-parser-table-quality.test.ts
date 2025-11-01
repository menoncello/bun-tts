/**
 * Unit tests for PDF parser table extraction quality validation.
 * Test case 1.3-PDF-022: Table structure extraction and preservation.
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
  validateTableExtractionQuality,
  TableTestConfigFactory,
} from './pdf-parser-table-test-helpers';

describe('PDFParser Table Quality Tests', () => {
  let mockLogger: Logger;
  let mockConfigManager: ConfigManager;

  beforeEach(() => {
    mockLogger = MockLoggerFactory.create();
    mockConfigManager = MockConfigManagerFactory.createDefault();
  });

  describe('Table Extraction Quality Validation', () => {
    it('should validate table extraction quality and completeness', async () => {
      // Given: A PDF parser configured for high-quality table extraction
      const qualityConfig = TableTestConfigFactory.createHighQualityConfig();
      const qualityTableParser = new PDFParser(
        mockLogger,
        mockConfigManager,
        qualityConfig
      );

      // When: A PDF document with tables is processed
      const result = await qualityTableParser.parse('test-file.pdf');

      // Then: Table extraction quality should be validated
      validateTableExtractionQualityResult(result);
    });
  });
});

function validateTableExtractionQualityResult(result: any): void {
  expect(result.success).toBe(true);
  if (!result.success) return;

  const documentStructure = result.data;
  validateTableExtractionQuality(documentStructure);
}
