/**
 * Unit tests for PDF parser table formatting validation.
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
  validateTableFormatting,
  TableTestConfigFactory,
} from './pdf-parser-table-test-helpers';

describe('PDFParser Table Formatting Tests', () => {
  let mockLogger: Logger;
  let mockConfigManager: ConfigManager;

  beforeEach(() => {
    mockLogger = MockLoggerFactory.create();
    mockConfigManager = MockConfigManagerFactory.createDefault();
  });

  describe('Table Formatting Validation', () => {
    it('should extract table headers and rows with proper formatting', async () => {
      // Given: A PDF parser configured for detailed table extraction
      const tableConfig = TableTestConfigFactory.createBasicTableConfig();
      const detailedTableParser = new PDFParser(
        mockLogger,
        mockConfigManager,
        tableConfig
      );

      // When: A PDF document with formatted tables is parsed
      const result = await detailedTableParser.parse('test-file.pdf');

      // Then: Table headers and rows should maintain proper formatting
      validateTableFormattingResult(result);
    });
  });
});

function validateTableFormattingResult(result: any): void {
  expect(result.success).toBe(true);
  if (!result.success) return;

  const documentStructure = result.data;
  validateTableFormatting(documentStructure);
}
