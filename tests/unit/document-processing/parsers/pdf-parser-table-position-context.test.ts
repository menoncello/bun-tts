/**
 * Unit tests for PDF parser table position and context preservation.
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
  validateTablePositionContext,
  TableTestConfigFactory,
} from './pdf-parser-table-test-helpers';

describe('PDFParser Table Position Context Tests', () => {
  let mockLogger: Logger;
  let mockConfigManager: ConfigManager;

  beforeEach(() => {
    mockLogger = MockLoggerFactory.create();
    mockConfigManager = MockConfigManagerFactory.createDefault();
  });

  describe('Table Position and Context Preservation', () => {
    it('should preserve table position and context information', async () => {
      // Given: A PDF parser configured to preserve table context
      const contextConfig = TableTestConfigFactory.createBasicTableConfig();
      const contextAwareParser = new PDFParser(
        mockLogger,
        mockConfigManager,
        contextConfig
      );

      // When: A PDF document with tables in various contexts is parsed
      const result = await contextAwareParser.parse('test-file.pdf');

      // Then: Table position and context should be preserved
      validateTablePositionContextResult(result);
    });
  });
});

function validateTablePositionContextResult(result: any): void {
  expect(result.success).toBe(true);
  if (!result.success) return;

  const documentStructure = result.data;
  validateTablePositionContext(documentStructure);
}
