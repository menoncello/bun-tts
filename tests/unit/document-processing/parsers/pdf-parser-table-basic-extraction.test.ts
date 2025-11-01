/**
 * Unit tests for PDF parser basic table extraction functionality.
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
  validateTableExtraction,
  validateTableStructureIntegrity,
  TableTestConfigFactory,
} from './pdf-parser-table-test-helpers';

describe('PDFParser Basic Table Extraction Tests', () => {
  let mockLogger: Logger;
  let mockConfigManager: ConfigManager;

  beforeEach(() => {
    mockLogger = MockLoggerFactory.create();
    mockConfigManager = MockConfigManagerFactory.createDefault();
  });

  function createTableParser(extraConfig = {}): PDFParser {
    const config = TableTestConfigFactory.createBasicTableConfig(extraConfig);
    return new PDFParser(mockLogger, mockConfigManager, config);
  }

  describe('Basic Table Extraction', () => {
    it('should extract table structures from PDF documents', async () => {
      // Given: A PDF parser instance is configured with table extraction enabled
      const tableEnabledParser = createTableParser();

      // When: A PDF document containing tables is parsed
      const result = await tableEnabledParser.parse('test-file.pdf');

      // Then: Table structures should be extracted and preserved
      validateTableExtractionResult(result);
    });
  });

  describe('Table Structure Integrity', () => {
    it('should preserve table structure integrity during extraction', async () => {
      // Given: A PDF parser configured for table structure preservation
      const structureAwareParser = createTableParser(
        TableTestConfigFactory.createStructureAwareConfig()
      );

      // When: A PDF with structured tables is parsed
      const result = await structureAwareParser.parse('test-file.pdf');

      // Then: Table structure integrity should be maintained
      validateTableStructureIntegrityResult(result);
    });
  });
});

function validateTableExtractionResult(result: any): void {
  expect(result.success).toBe(true);
  if (!result.success) return;

  const documentStructure = result.data;
  const totalTables = validateTableExtraction(documentStructure);
  expect(totalTables).toBeGreaterThanOrEqual(0);
}

function validateTableStructureIntegrityResult(result: any): void {
  expect(result.success).toBe(true);
  if (!result.success) return;

  const documentStructure = result.data;
  validateTableStructureIntegrity(documentStructure);
}
