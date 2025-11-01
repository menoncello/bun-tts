/**
 * PDFParser Constructor Tests
 * Tests for PDFParser instantiation and configuration
 */

import { describe, test, expect } from 'bun:test';
import { PDFParser } from '../../../../src/core/document-processing/parsers/pdf-parser';
import {
  MockLoggerFactory,
  MockConfigManagerFactory,
} from '../../../../tests/support/document-processing-factories';

describe('PDFParser Constructor', () => {
  describe('P0 - Critical Path', () => {
    test('1.3-PDF-001: should create a PDFParser with default configuration', () => {
      // Given: Default logger and config manager are available
      const mockLogger = MockLoggerFactory.create();
      const mockConfigManager = MockConfigManagerFactory.createDefault();

      // When: A PDFParser is instantiated with default configuration
      const parser = new PDFParser(mockLogger, mockConfigManager);

      // Then: The parser should be created successfully with correct type
      expect(parser).toBeInstanceOf(PDFParser);
    });

    test('1.3-PDF-002: should create a PDFParser with custom configuration', () => {
      // Given: Custom configuration parameters are defined
      const mockLogger = MockLoggerFactory.create();
      const mockConfigManager = MockConfigManagerFactory.createDefault();
      const customConfig = {
        confidenceThreshold: 0.8,
        maxFileSize: 50 * 1024 * 1024, // 50MB
      };

      // When: A PDFParser is instantiated with custom configuration
      const customParser = new PDFParser(
        mockLogger,
        mockConfigManager,
        customConfig
      );

      // Then: The parser should be created successfully with custom settings
      expect(customParser).toBeInstanceOf(PDFParser);
    });
  });
});
