/**
 * Unit tests for PDF parser complex table structure handling.
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
  validateComplexTableStructures,
  TableTestConfigFactory,
} from './pdf-parser-table-test-helpers';

describe('PDFParser Complex Table Structure Tests', () => {
  let mockLogger: Logger;
  let mockConfigManager: ConfigManager;

  beforeEach(() => {
    mockLogger = MockLoggerFactory.create();
    mockConfigManager = MockConfigManagerFactory.createDefault();
  });

  describe('Complex Table Structure Handling', () => {
    it('should handle complex table structures with merged cells', async () => {
      // Given: A PDF parser configured for complex table handling
      const complexTableConfig =
        TableTestConfigFactory.createComplexTableConfig();
      const complexTableParser = new PDFParser(
        mockLogger,
        mockConfigManager,
        complexTableConfig
      );

      // When: A PDF document with complex table structures is parsed
      const result = await complexTableParser.parse('test-file.pdf');

      // Then: Complex table structures should be handled appropriately
      validateComplexTableStructuresResult(result);
    });
  });
});

function validateComplexTableStructuresResult(result: any): void {
  expect(result.success).toBe(true);
  if (!result.success) return;

  const documentStructure = result.data;
  validateComplexTableStructures(documentStructure);
}
