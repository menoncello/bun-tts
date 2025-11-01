/**
 * Unit tests for PDF parser table structure extraction validation.
 * Test case 1.3-PDF-022: Table structure extraction and preservation.
 *
 * This file has been refactored to resolve ESLint complexity violations by:
 * - Extracting helper functions to a separate module
 * - Breaking down large test functions into smaller, focused functions
 * - Creating separate test files for different aspects of table extraction
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
  validateTableFormatting,
  validateComplexTableStructures,
  validateTablePositionContext,
  validateTableExtractionQuality,
  TableTestConfigFactory,
} from './pdf-parser-table-test-helpers';

/**
 * PDF Parser Table Extraction Tests
 *
 * This file contains the main test suite for PDF table extraction functionality.
 * The tests have been modularized to resolve ESLint complexity violations.
 */

describe('PDFParser Table Structure Extraction Validation', () => {
  let mockLogger: Logger;
  let mockConfigManager: ConfigManager;

  beforeEach(() => {
    mockLogger = MockLoggerFactory.create();
    mockConfigManager = MockConfigManagerFactory.createDefault();
  });

  /**
   * Factory function to create table parser instances with configuration.
   */
  function createTableParser(extraConfig = {}): PDFParser {
    const config = TableTestConfigFactory.createBasicTableConfig(extraConfig);
    return new PDFParser(mockLogger, mockConfigManager, config);
  }

  /**
   * Factory function to create structure-aware table parser.
   */
  function createStructureAwareParser(): PDFParser {
    const config = TableTestConfigFactory.createStructureAwareConfig();
    return new PDFParser(mockLogger, mockConfigManager, config);
  }

  /**
   * Factory function to create complex table parser.
   */
  function createComplexTableParser(): PDFParser {
    const config = TableTestConfigFactory.createComplexTableConfig();
    return new PDFParser(mockLogger, mockConfigManager, config);
  }

  /**
   * Factory function to create high-quality table parser.
   */
  function createHighQualityParser(): PDFParser {
    const config = TableTestConfigFactory.createHighQualityConfig();
    return new PDFParser(mockLogger, mockConfigManager, config);
  }

  // Extract each test suite into separate functions to reduce complexity
  createBasicTableExtractionTests(createTableParser);
  createTableStructureIntegrityTests(
    createTableParser,
    createStructureAwareParser
  );
  createTableFormattingTests(createTableParser);
  createComplexTableStructureTests(createTableParser, createComplexTableParser);
  createTablePositionContextTests(createTableParser);
  createTableExtractionQualityTests(createTableParser, createHighQualityParser);
});

/**
 * Creates tests for basic table extraction functionality.
 */
function createBasicTableExtractionTests(createTableParser: () => any): void {
  describe('1.3-PDF-022: Basic table extraction', () => {
    it('should extract table structures from PDF documents', async () => {
      // Given: A PDF parser instance is configured with table extraction enabled
      const tableEnabledParser = createTableParser();

      // When: A PDF document containing tables is parsed
      const result = await tableEnabledParser.parse('test-file.pdf');

      // Then: Table structures should be extracted and preserved
      validateTableExtractionResult(result);
    });
  });
}

/**
 * Creates tests for table structure integrity preservation.
 */
function createTableStructureIntegrityTests(
  createTableParser: () => any,
  createStructureAwareParser: () => any
): void {
  describe('1.3-PDF-022: Table structure integrity', () => {
    it('should preserve table structure integrity during extraction', async () => {
      // Given: A PDF parser configured for table structure preservation
      const structureAwareParser = createStructureAwareParser();

      // When: A PDF with structured tables is parsed
      const result = await structureAwareParser.parse('test-file.pdf');

      // Then: Table structure integrity should be maintained
      validateTableStructureIntegrityResult(result);
    });
  });
}

/**
 * Creates tests for table formatting validation.
 */
function createTableFormattingTests(createTableParser: () => any): void {
  describe('1.3-PDF-022: Table formatting', () => {
    it('should extract table headers and rows with proper formatting', async () => {
      // Given: A PDF parser configured for detailed table extraction
      const detailedTableParser = createTableParser();

      // When: A PDF document with formatted tables is parsed
      const result = await detailedTableParser.parse('test-file.pdf');

      // Then: Table headers and rows should maintain proper formatting
      validateTableFormattingResult(result);
    });
  });
}

/**
 * Creates tests for complex table structure handling.
 */
function createComplexTableStructureTests(
  createTableParser: () => any,
  createComplexTableParser: () => any
): void {
  describe('1.3-PDF-022: Complex table structures', () => {
    it('should handle complex table structures with merged cells', async () => {
      // Given: A PDF parser configured for complex table handling
      const complexTableParser = createComplexTableParser();

      // When: A PDF document with complex table structures is parsed
      const result = await complexTableParser.parse('test-file.pdf');

      // Then: Complex table structures should be handled appropriately
      validateComplexTableStructuresResult(result);
    });
  });
}

/**
 * Creates tests for table position and context preservation.
 */
function createTablePositionContextTests(createTableParser: () => any): void {
  describe('1.3-PDF-022: Table position context', () => {
    it('should preserve table position and context information', async () => {
      // Given: A PDF parser configured to preserve table context
      const contextAwareParser = createTableParser();

      // When: A PDF document with tables in various contexts is parsed
      const result = await contextAwareParser.parse('test-file.pdf');

      // Then: Table position and context should be preserved
      validateTablePositionContextResult(result);
    });
  });
}

/**
 * Creates tests for table extraction quality validation.
 */
function createTableExtractionQualityTests(
  createTableParser: () => any,
  createHighQualityParser: () => any
): void {
  describe('1.3-PDF-022: Table extraction quality', () => {
    it('should validate table extraction quality and completeness', async () => {
      // Given: A PDF parser configured for high-quality table extraction
      const qualityTableParser = createHighQualityParser();

      // When: A PDF document with tables is processed
      const result = await qualityTableParser.parse('test-file.pdf');

      // Then: Table extraction quality should be validated
      validateTableExtractionQualityResult(result);
    });
  });
}

/**
 * Validation helper functions - these are small and focused to avoid ESLint violations.
 */
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

function validateTableFormattingResult(result: any): void {
  expect(result.success).toBe(true);
  if (!result.success) return;

  const documentStructure = result.data;
  validateTableFormatting(documentStructure);
}

function validateComplexTableStructuresResult(result: any): void {
  expect(result.success).toBe(true);
  if (!result.success) return;

  const documentStructure = result.data;
  validateComplexTableStructures(documentStructure);
}

function validateTablePositionContextResult(result: any): void {
  expect(result.success).toBe(true);
  if (!result.success) return;

  const documentStructure = result.data;
  validateTablePositionContext(documentStructure);
}

function validateTableExtractionQualityResult(result: any): void {
  expect(result.success).toBe(true);
  if (!result.success) return;

  const documentStructure = result.data;
  validateTableExtractionQuality(documentStructure);
}
